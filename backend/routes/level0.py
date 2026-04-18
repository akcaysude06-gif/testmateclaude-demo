from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llama_service import llama_service
from services.llama_service import llama_service

router = APIRouter(prefix="/api/level0", tags=["Level 0"])

class ManualTestRequest(BaseModel):
	test_steps: str
	scenario: Optional[str] = "Login Form"
	url: Optional[str] = "the-internet.herokuapp.com"

class AskRequest(BaseModel):
	question: str
	context: str = ""

@router.post("/evaluate-manual-test")
async def evaluate_manual_test(req: ManualTestRequest):
	try:
		return {"feedback": llama_service.evaluate_manual_test(req.test_steps, req.scenario, req.url)}
	except HTTPException as e:
		raise e
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
async def ask_question(req: AskRequest):
	try:
		return {"answer": llama_service.answer_automation_question(req.question, req.context)}
	except HTTPException as e:
		raise e
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))