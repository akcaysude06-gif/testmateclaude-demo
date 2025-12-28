"""
Production Routes - Work with real GitHub repositories
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db, User
from services.auth_service import auth_service
from services.github_service import github_service
from services.claude_service import claude_service

router = APIRouter(prefix="/api/production", tags=["Production"])

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

@router.post("/analyze-code", response_model=AnalysisResponse)
async def analyze_code(request: AnalyzeCodeRequest):
	"""
	Analyze code and get AI suggestions for testing
	"""
	try:
		# Use repo_context as the main content if code is empty
		content_to_analyze = request.code if request.code else request.repo_context or ""
		context = request.repo_context if request.repo_context else ""

		result = claude_service.analyze_code_for_testing(
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
		result = claude_service.generate_test_from_context(
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
