"""
Level 1 Routes - Guided Practice with AI-Generated Code
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llama_service import llama_service
import asyncio

router = APIRouter(prefix="/api/level1", tags=["Level 1"])

class GenerateCodeRequest(BaseModel):
	test_description: str

class GenerateCodeResponse(BaseModel):
	type: str
	code: str
	explanation: str
	steps: list[str]
	language: str
	model: str

@router.post("/generate-code", response_model=GenerateCodeResponse)
async def generate_automation_code(request: GenerateCodeRequest):
	"""
	Generate Selenium automation code based on test description
	"""
	if not request.test_description or len(request.test_description.strip()) < 10:
		raise HTTPException(
			status_code=400,
			detail="Please provide a detailed test description (at least 10 characters)"
		)

	# Limit description length to prevent very long processing times
	if len(request.test_description) > 2000:
		raise HTTPException(
			status_code=400,
			detail="Test description is too long. Please keep it under 2000 characters."
		)

	try:
		# Run in thread pool to avoid blocking
		loop = asyncio.get_event_loop()
		result = await loop.run_in_executor(
			None,
			llama_service.generate_selenium_code,
			request.test_description
		)

		return GenerateCodeResponse(
			type="code_generation",
			code=result["code"],
			explanation=result["explanation"],
			steps=result["steps"],
			language=result["language"],
			model="llama3"
		)

	except HTTPException:
		raise
	except Exception as e:
		print(f"Code generation error: {e}")
		raise HTTPException(
			status_code=500,
			detail=f"Failed to generate code: {str(e)}"
		)

@router.get("/examples")
async def get_test_examples():
	"""
	Get example test descriptions to help users get started
	"""
	return {
		"examples": [
			{
				"title": "Login Test",
				"description": "Navigate to https://example.com/login, enter username 'testuser' and password 'password123', click login button, verify dashboard loads.",
				"category": "Authentication"
			},
			{
				"title": "Search Test",
				"description": "Go to https://amazon.com, type 'laptop' in search box, click search, verify results page shows laptops.",
				"category": "Search"
			},
			{
				"title": "Form Submission",
				"description": "Open https://example.com/contact, fill name 'John Doe', email 'john@example.com', message 'Test message', click submit, verify success message.",
				"category": "Forms"
			},
			{
				"title": "Add to Cart",
				"description": "Navigate to product page, click 'Add to Cart', go to cart, verify item is present with quantity 1.",
				"category": "E-commerce"
			},
			{
				"title": "Navigation Test",
				"description": "Go to homepage, click 'About' menu item, verify About page loads with correct title.",
				"category": "Navigation"
			}
		]
	}

@router.get("/health")
async def check_llama_health():
	"""
	Check if Llama 3 is available and ready
	"""
	is_available = llama_service.check_availability()

	return {
		"llama3_available": is_available,
		"status": "ready" if is_available else "unavailable",
		"message": "Llama 3 is ready" if is_available else "Please start Ollama with: ollama serve"
	}