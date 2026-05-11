"""
Level 1 Jira Integration Routes
Handles creating automation-library Jira tickets from generated Selenium code
and fetching the user's automation library.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, AutomationLibraryEntry, JiraIntegration
from services.auth_service import auth_service
from services.jira_service import jira_service

router = APIRouter(prefix="/api/level1/jira", tags=["Level1 Jira"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _get_user(authorization: str, db: Session):
    token = authorization.removeprefix("Bearer ").strip()
    return auth_service.get_current_user(db, token)


def _get_jira_integration(user_id: int, db: Session) -> Optional[JiraIntegration]:
    return (
        db.query(JiraIntegration)
        .filter(JiraIntegration.user_id == user_id)
        .order_by(JiraIntegration.created_at.desc())
        .first()
    )


# ── Pydantic models ───────────────────────────────────────────────────────────

class CreateTicketRequest(BaseModel):
    title: str
    manual_description: str
    generated_code: str
    project_key: Optional[str] = None  # override the saved project key


class SyncStatusRequest(BaseModel):
    entry_ids: list[int]  # which library entries to sync


# ── GET /config-status ────────────────────────────────────────────────────────

@router.get("/config-status")
async def get_config_status(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Return whether the user has a Jira integration configured and the
    saved project key (if any), so the frontend can decide what to show.
    """
    user = _get_user(authorization, db)
    integration = _get_jira_integration(user.id, db)
    if not integration:
        return {"configured": False, "project_key": None, "email": None}
    return {
        "configured": True,
        "project_key": integration.project_key,
        "email": integration.email,
        "instance_url": integration.instance_url,
    }


# ── POST /create-ticket ───────────────────────────────────────────────────────

@router.post("/create-ticket")
async def create_ticket(
    req: CreateTicketRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Create a Jira Task tagged 'automation-library' containing the manual test
    description and generated Selenium code, then persist to our DB.
    """
    user = _get_user(authorization, db)
    integration = _get_jira_integration(user.id, db)

    if not integration:
        raise HTTPException(
            status_code=400,
            detail="No Jira integration configured. Connect Jira first.",
        )

    project_key = req.project_key or integration.project_key
    if not project_key:
        raise HTTPException(
            status_code=400,
            detail="No project key set. Please update your Jira integration with a project key.",
        )

    # Derive a clean title: truncate to 120 chars
    title = req.title.strip()[:120] or "Automation Test"

    # Create the issue in Jira
    result = jira_service.create_issue(
        instance_url=integration.instance_url,
        email=integration.email,
        api_token=integration.api_token,
        project_key=project_key,
        title=title,
        manual_description=req.manual_description,
        generated_code=req.generated_code,
    )

    # Persist to our DB
    entry = AutomationLibraryEntry(
        user_id=user.id,
        jira_integration_id=integration.id,
        jira_ticket_key=result["key"],
        jira_ticket_url=result["url"],
        title=title,
        manual_description=req.manual_description,
        generated_code=req.generated_code,
        jira_status="To Do",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "id": entry.id,
        "ticket_key": result["key"],
        "ticket_url": result["url"],
        "title": title,
        "status": "To Do",
        "created_at": entry.created_at.isoformat(),
    }


# ── GET /library ──────────────────────────────────────────────────────────────

@router.get("/library")
async def get_library(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """Return all automation library entries for the authenticated user."""
    user = _get_user(authorization, db)

    entries = (
        db.query(AutomationLibraryEntry)
        .filter(AutomationLibraryEntry.user_id == user.id)
        .order_by(AutomationLibraryEntry.created_at.desc())
        .all()
    )

    return {
        "entries": [
            {
                "id": e.id,
                "ticket_key": e.jira_ticket_key,
                "ticket_url": e.jira_ticket_url,
                "title": e.title,
                "jira_status": e.jira_status,
                "created_at": e.created_at.isoformat(),
                "updated_at": e.updated_at.isoformat() if e.updated_at else None,
            }
            for e in entries
        ],
        "total": len(entries),
    }


# ── POST /sync-status ─────────────────────────────────────────────────────────

@router.post("/sync-status")
async def sync_status(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Re-fetch the current Jira status for all of the user's library entries
    and update the local DB. Returns the updated entries.
    """
    user = _get_user(authorization, db)
    integration = _get_jira_integration(user.id, db)
    if not integration:
        raise HTTPException(status_code=400, detail="No Jira integration configured.")

    entries = (
        db.query(AutomationLibraryEntry)
        .filter(AutomationLibraryEntry.user_id == user.id)
        .all()
    )

    updated = []
    for entry in entries:
        try:
            status = jira_service.get_issue_current_status(
                instance_url=integration.instance_url,
                email=integration.email,
                api_token=integration.api_token,
                issue_key=entry.jira_ticket_key,
            )
            entry.jira_status = status
            entry.updated_at  = datetime.utcnow()
            updated.append({"id": entry.id, "ticket_key": entry.jira_ticket_key, "jira_status": status})
        except Exception:
            # Don't fail the whole sync if one ticket errors
            updated.append({"id": entry.id, "ticket_key": entry.jira_ticket_key, "jira_status": entry.jira_status})

    db.commit()
    return {"synced": len(updated), "entries": updated}
