"""
Production Routes - Work with real GitHub repositories
"""
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db, User
from services.auth_service import auth_service
from services.github_service import github_service
from services.llama_service import llama_service

router = APIRouter(prefix="/api/production", tags=["Production"])

class CustomPromptRequest(BaseModel):
	prompt: str
	repo_context: Optional[str] = ""

class ClassifyRequest(BaseModel):
	repo_context: str

class ImproveTestsRequest(BaseModel):
	code: Optional[str] = ""
	repo_context: Optional[str] = ""

class AnalyzeCodeRequest(BaseModel):
	code: str
	repo_context: Optional[str] = None

class GenerateTestRequest(BaseModel):
	repo_name: str
	file_path: str
	code_snippet: str
	user_request: str

class AnalysisResponse(BaseModel):
	analysis: str
	suggestions: List[str]
	model: str

class TestGenerationResponse(BaseModel):
	code: str
	explanation: str
	language: str
	model: str

@router.get("/repositories")
async def get_user_repositories(token: str, db: Session = Depends(get_db)):
	"""
	Get all GitHub repositories for the authenticated user
	"""
	try:
		# Get current user
		user = auth_service.get_current_user(db, token)

		# Fetch repositories using the stored GitHub access token
		repositories = await github_service.get_user_repositories(user.github_access_token)

		return {
			"repositories": repositories,
			"count": len(repositories)
		}

	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch repositories: {str(e)}"
		)

@router.get("/repository/{owner}/{repo}/structure")
async def get_repository_structure(
		owner: str,
		repo: str,
		path: str = "",
		token: str = None,
		db: Session = Depends(get_db)
):
	"""
	Get the file/folder structure of a repository
	"""
	try:
		user = auth_service.get_current_user(db, token)
		structure = await github_service.get_repository_structure(
			user.github_access_token,
			owner,
			repo,
			path
		)

		return {"structure": structure}

	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch repository structure: {str(e)}"
		)

@router.get("/repository/{owner}/{repo}/file")
async def get_file_content(
		owner: str,
		repo: str,
		path: str,
		token: str = None,
		db: Session = Depends(get_db)
):
	"""
	Get the content of a specific file
	"""
	try:
		user = auth_service.get_current_user(db, token)
		content = await github_service.get_file_content(
			user.github_access_token,
			owner,
			repo,
			path
		)

		return {
			"content": content,
			"path": path
		}

	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch file content: {str(e)}"
		)

@router.post("/custom-prompt")
async def custom_prompt_stream(request: CustomPromptRequest):
	"""
	Stream a custom prompt response via SSE using Claude.
	"""
	full_prompt = (
		f"You are an expert software testing consultant.\n\n"
		f"REPOSITORY CONTEXT:\n{request.repo_context}\n\n"
		f"USER REQUEST:\n{request.prompt}\n\n"
		f"Provide a clear, structured, and actionable response."
	)

	def sse_generator():
		try:
			response = llama_service.generate_text(full_prompt, max_tokens=2000)
			# Simulate streaming by chunking the response
			chunk_size = 50
			for i in range(0, len(response), chunk_size):
				chunk = response[i:i+chunk_size]
				yield f"data: {json.dumps(chunk)}\n\n"
			yield "data: [DONE]\n\n"
		except Exception as e:
			yield f"data: {json.dumps(f'[Error: {str(e)}]')}\n\n"
			yield "data: [DONE]\n\n"

	if not llama_service.model:
		raise HTTPException(status_code=503, detail="Gemini API key not configured")

	return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.post("/classify")
async def classify_project(request: ClassifyRequest):
	"""
	Classify a repository as a 'test' project or 'dev' project.
	"""
	if not llama_service.model:
		return {"type": "dev"}

	prompt = (
		f"Given this repository context, classify it as either a 'test' project "
		f"(primary purpose is testing/QA) or a 'dev' project (primary purpose is "
		f"application development). Reply with ONLY the single word: test or dev.\n\n"
		f"CONTEXT:\n{request.repo_context}"
	)
	try:
		result = llama_service.generate_text(prompt, max_tokens=10)
		project_type = "test" if "test" in result.lower() else "dev"
		return {"type": project_type}
	except Exception:
		return {"type": "dev"}


@router.post("/improve-tests")
async def improve_tests_stream(request: ImproveTestsRequest):
	"""
	Stream suggestions to improve existing test structure via SSE using Claude.
	"""
	full_prompt = (
		f"You are an expert software testing consultant. Analyze the following "
		f"repository and provide concrete, actionable suggestions to improve the "
		f"test structure, quality, and maintainability.\n\n"
		f"REPOSITORY CONTEXT:\n{request.repo_context}\n\n"
		f"CODE:\n{request.code or '(no specific code provided)'}\n\n"
		f"Provide structured recommendations with clear headings."
	)

	def sse_generator():
		try:
			with llama_service.client.messages.stream(
					model="claude-sonnet-4-20250514",
					max_tokens=2000,
					messages=[{"role": "user", "content": full_prompt}],
			) as stream:
				for text in stream.text_stream:
					yield f"data: {json.dumps(text)}\n\n"
			yield "data: [DONE]\n\n"
		except Exception as e:
			yield f"data: {json.dumps(f'[Error: {str(e)}]')}\n\n"
			yield "data: [DONE]\n\n"

	if not llama_service.client:
		raise HTTPException(status_code=503, detail="Claude API key not configured")

	return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.post("/analyze-code", response_model=AnalysisResponse)
async def analyze_code(request: AnalyzeCodeRequest):
	"""
	Analyze code and get AI suggestions for testing
	"""
	try:
		# Use repo_context as the main content if code is empty
		content_to_analyze = request.code if request.code else request.repo_context or ""
		context = request.repo_context if request.repo_context else ""

		result = llama_service.analyze_code_for_testing(
			content_to_analyze,
			context
		)

		return AnalysisResponse(
			analysis=result["analysis"],
			suggestions=result["suggestions"],
			model=result["model"]
		)

	except HTTPException:
		raise
	except Exception as e:
		print(f"Analysis error: {e}")  # Debug log
		import traceback
		traceback.print_exc()  # Print full error
		raise HTTPException(
			status_code=500,
			detail=f"Failed to analyze code: {str(e)}"
		)

@router.post("/generate-test", response_model=TestGenerationResponse)
async def generate_test(request: GenerateTestRequest):
	"""
	Generate test code based on repository context and user request
	"""
	try:
		result = llama_service.generate_test_from_context(
			request.repo_name,
			request.file_path,
			request.code_snippet,
			request.user_request
		)

		return TestGenerationResponse(
			code=result["code"],
			explanation=result["explanation"],
			language=result["language"],
			model=result["model"]
		)

	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to generate test: {str(e)}"
		)

@router.get("/repository/{owner}/{repo}/tree")
async def get_repository_tree(
		owner: str,
		repo: str,
		token: str = None,
		db: Session = Depends(get_db)
):
	"""
	Get the complete file tree of a repository
	"""
	try:
		user = auth_service.get_current_user(db, token)

		async def build_tree(path: str = ""):
			structure = await github_service.get_repository_structure(
				user.github_access_token,
				owner,
				repo,
				path
			)

			tree = []

			# Handle if structure is a single file (not a list)
			if isinstance(structure, dict):
				structure = [structure]

			for item in structure:
				node = {
					"name": item["name"],
					"path": item["path"],
					"type": item["type"],
					"size": item.get("size", 0)
				}

				# If it's a directory, recursively get its contents
				if item["type"] == "dir":
					try:
						node["children"] = await build_tree(item["path"])
					except:
						node["children"] = []

				tree.append(node)

			return tree

		tree = await build_tree()

		return {"tree": tree}

	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch repository tree: {str(e)}"
		)