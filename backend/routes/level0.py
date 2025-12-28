"""
Level 0 Routes - Testing Fundamentals
Educational content for complete beginners
"""
from fastapi import APIRouter, HTTPException
from services.llama_service import llama_service
from models.schemas import EducationalContentResponse

router = APIRouter(prefix="/api/level0", tags=["Level 0 - Fundamentals"])

@router.get("/content", response_model=EducationalContentResponse)
async def get_educational_content():
	"""
	Get comprehensive educational content about software testing fundamentals.

	This endpoint uses Llama 3 to generate beginner-friendly content covering:
	- What is Software Testing?
	- Manual vs Automation Testing
	- Why Selenium for web automation?

	Returns:
		Educational content with model information
	"""
	try:
		content = llama_service.generate_educational_content()

		return EducationalContentResponse(
			type="education",
			content=content,
			model="llama3"
		)
	except HTTPException as e:
		raise e
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to generate Level 0 content: {str(e)}"
		)