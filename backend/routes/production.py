"""
Production Routes — SSE streaming via Llama (Ollama) for all AI actions.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from services.auth_service import auth_service
from services.github_service import github_service
from services.llama_service import llama_service
import asyncio, json

router = APIRouter(prefix="/api/production", tags=["Production"])


# ── Models ────────────────────────────────────────────────────────────────────

class AnalyzeCodeRequest(BaseModel):
	code: str
	repo_context: Optional[str] = None

class GenerateTestRequest(BaseModel):
	repo_name:    str
	file_path:    str
	code_snippet: str
	user_request: str

class CustomPromptRequest(BaseModel):
	prompt:       str
	repo_context: Optional[str] = None

class ClassifyRequest(BaseModel):
	repo_context: str


# ── Llama streaming core ──────────────────────────────────────────────────────

async def _sse_llama(prompt: str, max_tokens: int = 2048):
	"""Stream tokens from Llama via Ollama's streaming API."""
	import requests
	from config.settings import settings

	loop = asyncio.get_event_loop()
	queue: asyncio.Queue = asyncio.Queue()
	_DONE = object()

	def _run():
		try:
			resp = requests.post(
				settings.LLAMA_API_URL,
				json={
					"model":  settings.LLAMA_MODEL,
					"prompt": prompt,
					"stream": True,
					"options": {"temperature": 0.7, "num_predict": max_tokens},
				},
				stream=True,
				timeout=120,
			)
			resp.raise_for_status()
			for line in resp.iter_lines():
				if not line:
					continue
				try:
					chunk = json.loads(line)
					token = chunk.get("response", "")
					if token:
						loop.call_soon_threadsafe(queue.put_nowait, token)
					if chunk.get("done"):
						break
				except json.JSONDecodeError:
					continue
		except Exception as e:
			loop.call_soon_threadsafe(queue.put_nowait, f"\n[Error: {str(e)}]")
		finally:
			loop.call_soon_threadsafe(queue.put_nowait, _DONE)

	import threading
	threading.Thread(target=_run, daemon=True).start()

	while True:
		tok = await queue.get()
		if tok is _DONE:
			break
		yield f"data: {json.dumps(tok)}\n\n"
	yield "data: [DONE]\n\n"


def _resp(prompt: str, max_tokens: int = 2048):
	return StreamingResponse(
		_sse_llama(prompt, max_tokens),
		media_type="text/event-stream",
		headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
	)


# ── Repository endpoints ──────────────────────────────────────────────────────

@router.get("/repositories")
async def get_user_repositories(token: str, db: Session = Depends(get_db)):
	try:
		user  = auth_service.get_current_user(db, token)
		repos = await github_service.get_user_repositories(user.github_access_token)
		return {"repositories": repos, "count": len(repos)}
	except HTTPException: raise
	except Exception as e: raise HTTPException(500, str(e))

@router.get("/repository/{owner}/{repo}/structure")
async def get_repo_structure(owner: str, repo: str, path: str = "",
                             token: str = None, db: Session = Depends(get_db)):
	try:
		user = auth_service.get_current_user(db, token)
		return {"structure": await github_service.get_repository_structure(
			user.github_access_token, owner, repo, path)}
	except HTTPException: raise
	except Exception as e: raise HTTPException(500, str(e))

@router.get("/repository/{owner}/{repo}/file")
async def get_file_content(owner: str, repo: str, path: str,
                           token: str = None, db: Session = Depends(get_db)):
	try:
		user = auth_service.get_current_user(db, token)
		return {"content": await github_service.get_file_content(
			user.github_access_token, owner, repo, path), "path": path}
	except HTTPException: raise
	except Exception as e: raise HTTPException(500, str(e))

@router.get("/repository/{owner}/{repo}/tree")
async def get_repo_tree(owner: str, repo: str,
                        token: str = None, db: Session = Depends(get_db)):
	try:
		user = auth_service.get_current_user(db, token)
		async def build(path=""):
			s = await github_service.get_repository_structure(
				user.github_access_token, owner, repo, path)
			if isinstance(s, dict): s = [s]
			tree = []
			for item in s:
				node = {k: item[k] for k in ("name", "path", "type")}
				node["size"] = item.get("size", 0)
				if item["type"] == "dir":
					try: node["children"] = await build(item["path"])
					except: node["children"] = []
				tree.append(node)
			return tree
		return {"tree": await build()}
	except HTTPException: raise
	except Exception as e: raise HTTPException(500, str(e))


# ── Classify endpoint (Llama — single word, keep cheap) ──────────────────────

@router.post("/classify")
async def classify_project(request: ClassifyRequest):
	prompt = (
		f"Classify this software project as either 'test' or 'dev'.\n"
		f"A 'test' project is primarily a test suite, QA automation, or testing framework.\n"
		f"A 'dev' project is an application, library, game, API, or tool that needs tests written for it.\n\n"
		f"Project info:\n{request.repo_context}\n\n"
		f"Reply with a single word only: test or dev"
	)
	loop = asyncio.get_event_loop()
	result = await loop.run_in_executor(
		None, llama_service.generate_text, prompt, 0.0, 5
	)
	label = "test" if "test" in result.strip().lower() else "dev"
	return {"type": label}


# ── AI action endpoints (Llama streaming) ─────────────────────────────────────

@router.post("/analyze-code")
async def analyze_code(request: AnalyzeCodeRequest):
	content = (request.code or "").strip()
	context = (request.repo_context or "").strip()
	info    = f"{context}\n{content}".strip() or "no context"
	prompt  = (
		f"You are a software testing consultant. Here is the project context:\n{info}\n\n"
		f"Provide a thorough analysis covering:\n"
		f"1. What type of project this is and what it does\n"
		f"2. Whether tests exist and what kind\n"
		f"3. The most critical areas that need testing and why\n"
		f"4. Recommended testing approach (unit/integration/E2E) with justification\n"
		f"5. Top 5 concrete first steps to improve test coverage\n\n"
		f"Be specific — reference the actual repository name and language. Include code examples where useful."
	)
	return _resp(prompt, max_tokens=2048)


@router.post("/improve-tests")
async def improve_tests(request: AnalyzeCodeRequest):
	content = (request.code or "").strip()
	context = (request.repo_context or "").strip()
	info    = f"{context}\n{content}".strip() or "no context"
	prompt  = (
		f"You are a software testing consultant. Here is the project context:\n{info}\n\n"
		f"Provide detailed, actionable improvement recommendations:\n"
		f"1. If tests exist: give 5 specific improvements with before/after code examples\n"
		f"2. If no tests: recommend exactly what to write first, with a starter example\n"
		f"3. The single biggest risk from the current testing gaps\n"
		f"4. The best testing tool/framework for this stack and why\n"
		f"5. One complete example test to demonstrate best practices\n\n"
		f"Be specific to this project's language and structure."
	)
	return _resp(prompt, max_tokens=2048)


@router.post("/generate-test")
async def generate_test(request: GenerateTestRequest):
	code_block = f"```\n{request.code_snippet}\n```\n" if request.code_snippet.strip() else ""
	prompt = (
		f"You are an expert test engineer.\n"
		f"Repo: {request.repo_name} | File: {request.file_path}\n"
		f"{code_block}"
		f"Task: {request.user_request}\n\n"
		f"Choose the right tool: UI→Selenium, functions→pytest, API→requests+pytest.\n"
		f"Write a complete, runnable test with proper imports, setup, assertions, and teardown.\n"
		f"Do not truncate the code — output the full implementation.\n\n"
		f"```python\n[complete test code here]\n```\n\n"
		f"EXPLANATION: [brief explanation of what the test covers and why]"
	)
	return _resp(prompt, max_tokens=2048)


@router.post("/custom-prompt")
async def custom_prompt(request: CustomPromptRequest):
	ctx     = (request.repo_context or "").strip()
	project = f"Project context:\n{ctx}\n\n" if ctx else ""
	prompt  = (
		f"You are TestMate, an expert software testing assistant.\n"
		f"{project}"
		f"User question: {request.prompt}\n\n"
		f"Give a thorough, specific answer. Include code examples where relevant.\n"
		f"Do not cut off your response — complete every explanation and code block fully."
	)
	return _resp(prompt, max_tokens=2048)