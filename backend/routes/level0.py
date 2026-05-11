from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from services.groq_service import groq_service as llama_service
from database import get_db, User
from services.auth_service import auth_service

router = APIRouter(prefix="/api/level0", tags=["Level 0"])

class ManualTestRequest(BaseModel):
	test_steps: str
	scenario: Optional[str] = "Login Form"
	url: Optional[str] = "the-internet.herokuapp.com"

class AskRequest(BaseModel):
	question: str
	context: str = ""

class ScenarioCompleteRequest(BaseModel):
	scenario_id: str
	mark_level0_complete: bool = False

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

@router.post("/complete-scenario")
async def complete_scenario(
	req: ScenarioCompleteRequest,
	token: Optional[str] = Query(None),
	db: Session = Depends(get_db),
):
	"""Mark a manual test scenario as complete and optionally mark Level 0 done."""
	try:
		if not token:
			return {"scenario_id": req.scenario_id, "level0_completed": False}

		user = auth_service.get_current_user(db, token)
		if not user:
			return {"scenario_id": req.scenario_id, "level0_completed": False}

		if req.mark_level0_complete:
			user.level0_completed = True
			db.commit()

		return {
			"scenario_id": req.scenario_id,
			"level0_completed": user.level0_completed,
		}
	except Exception as e:
		# Non-critical — don't fail if progress save fails
		return {"scenario_id": req.scenario_id, "level0_completed": False, "error": str(e)}