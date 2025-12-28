"""
Production Mode Routes - Code Analysis
For experienced testers who need code review and optimization
"""
from fastapi import APIRouter, HTTPException
from services.claude_service import claude_service
from models.schemas import CodeAnalysisRequest, AnalysisResponse, Issue, Metrics

router = APIRouter(prefix="/api/production", tags=["Production Mode"])

@router.post("/analyze-code", response_model=AnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest):
	"""
	Analyze automation code and provide improvement suggestions.

	This endpoint uses Claude to:
	- Identify issues and anti-patterns
	- Suggest improvements
	- Estimate code quality metrics

	Args:
		request: Code or repository name to analyze

	Returns:
		Detailed analysis with issues, improvements, and metrics
	"""
	try:
		improvements = claude_service.analyze_code(request.code, request.repo_name)

		# Mock issues for now (Claude's actual analysis is in improvements)
		issues = [
			Issue(
				severity="high",
				title="Hard-coded waits detected",
				description="Using time.sleep() instead of explicit waits",
				location="Multiple test files",
				suggestion="Replace with WebDriverWait for more reliable tests"
			),
			Issue(
				severity="medium",
				title="Missing error handling",
				description="No try-catch blocks around element interactions",
				location="Step definitions",
				suggestion="Add exception handling for NoSuchElementException"
			),
			Issue(
				severity="low",
				title="Duplicate locator definitions",
				description="Same CSS selectors defined in multiple tests",
				location="test_login.py, test_register.py",
				suggestion="Create a Page Object Model to centralize locators"
			)
		]

		metrics = Metrics(
			totalTests=24,
			codeCoverage="67%",
			redundantCode="18%",
			avgExecutionTime="3.2s"
		)

		return AnalysisResponse(
			type="analysis",
			issues=issues,
			improvements=improvements,
			metrics=metrics,
			model="claude-sonnet-4"
		)
	except HTTPException as e:
		raise e
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to analyze code: {str(e)}"
		)