"""
Production V2 Routes — Jira integration and gap detection.
"""
import json
import asyncio
import logging
from datetime import datetime
from typing import List, Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, JiraIntegration, JiraTask, ImplementationGap, GapTypeEnum
from services.auth_service import auth_service
from services.github_service import github_service
from services.jira_service import jira_service
from services.gap_detection_service import gap_detection_service
from services.groq_service import groq_service

router = APIRouter(prefix="/api/production/v2", tags=["ProductionV2"])


# ── Pydantic models ───────────────────────────────────────────────────────────

class JiraConnectRequest(BaseModel):
    instance_url: str
    email:        str
    api_token:    str
    project_key:  Optional[str] = None


class AnalyzeGapsRequest(BaseModel):
    repo_owner: str
    repo_name:  str


class SimulateTestsRequest(BaseModel):
    gap_type:            str
    task_key:            str
    task_summary:        str
    acceptance_criteria: str
    source_files:        List[str] = []
    repo_owner:          str
    repo_name:           str


class UpdateGapTypeRequest(BaseModel):
    gap_type: str


class UpdateProjectKeyRequest(BaseModel):
    project_key: str
    space_url:   Optional[str] = None
    cloud_id:    Optional[str] = None


# ── /jira/connect ─────────────────────────────────────────────────────────────

@router.post("/jira/connect")
async def connect_jira(
    request: JiraConnectRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    loop = asyncio.get_running_loop()
    myself = await loop.run_in_executor(
        None,
        jira_service.verify_connection,
        request.instance_url,
        request.email,
        request.api_token,
    )

    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()

    if integration:
        integration.instance_url = request.instance_url
        integration.email        = request.email
        integration.api_token    = request.api_token
        if request.project_key:
            integration.project_key = request.project_key
    else:
        integration = JiraIntegration(
            user_id      = user.id,
            instance_url = request.instance_url,
            email        = request.email,
            api_token    = request.api_token,
            project_key  = request.project_key,
        )
        db.add(integration)

    db.commit()
    db.refresh(integration)

    return {
        "status":       "connected",
        "jira_user":    myself.get("displayName", ""),
        "instance_url": request.instance_url,
        "project_key":  request.project_key,
    }


# ── /jira/status ──────────────────────────────────────────────────────────────

@router.get("/jira/status")
async def jira_status(db: Session = Depends(get_db), authorization: str = Header(...)):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    oauth_connected = bool(user.jira_access_token and user.jira_cloud_id)
    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()

    if not integration and not oauth_connected:
        return {"connected": False}

    return {
        "connected":   True,
        "oauth":       oauth_connected,
        "email":       integration.email if integration else "",
        "space_url":   integration.instance_url if integration else "",
        "cloud_id":    integration.space_cloud_id if integration else None,
        "project_key": integration.project_key if integration else None,
    }


# ── /jira/disconnect ──────────────────────────────────────────────────────────

@router.delete("/jira/disconnect")
async def disconnect_jira(db: Session = Depends(get_db), authorization: str = Header(...)):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)
    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()
    if integration:
        db.delete(integration)
    user.jira_access_token  = None
    user.jira_refresh_token = None
    user.jira_cloud_id      = None
    db.commit()
    return {"disconnected": True}


# ── /jira/project-key ─────────────────────────────────────────────────────────

@router.patch("/jira/project-key")
async def update_project_key(
    request: UpdateProjectKeyRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    if not request.project_key or not request.project_key.strip():
        raise HTTPException(status_code=400, detail="project_key is required (e.g. SCRUM).")

    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="No Jira account connected.")

    integration.project_key = request.project_key.strip()
    if request.space_url:
        integration.instance_url = request.space_url.strip().rstrip("/")
    if request.cloud_id:
        integration.space_cloud_id = request.cloud_id.strip()
    db.commit()

    return {"status": "updated", "project_key": integration.project_key}


# ── /gaps/analyze ─────────────────────────────────────────────────────────────

@router.post("/gaps/analyze")
async def analyze_gaps(
    request: AnalyzeGapsRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()
    if not integration:
        logger.error("gaps/analyze 400: no JiraIntegration row for user_id=%s", user.id)
        raise HTTPException(status_code=400, detail="No Jira integration configured. Connect first.")
    if not integration.project_key:
        raise HTTPException(
            status_code=400,
            detail="No Jira project key set. Go to Production → your project → Connect Jira and enter a project key (e.g. SCRUM).",
        )
    logger.info("gaps/analyze: project=%s instance=%s", integration.project_key, integration.instance_url)

    # 1. Fetch Jira issues (all pages concurrently)
    logger.info("Fetching issues for project %s", integration.project_key)
    try:
        raw_issues = await jira_service.get_project_issues_async(
            integration.instance_url,
            integration.email,
            integration.api_token,
            integration.project_key,
        )
    except HTTPException as exc:
        logger.error("Jira API error fetching issues: %s", exc.detail)
        raise
    except Exception as exc:
        logger.error("Unexpected error fetching Jira issues: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch Jira issues: {exc}")

    # 2. Process issues — extract AC, upsert JiraTask rows
    # Preload all existing tasks in one query to avoid N+1
    existing_tasks: dict = {
        t.task_key: t
        for t in db.query(JiraTask).filter(
            JiraTask.jira_integration_id == integration.id
        ).all()
    }

    tasks_for_detection: List[dict] = []
    for issue in raw_issues:
        issue_key = issue["key"]
        fields    = issue.get("fields", {})
        summary   = fields.get("summary", "")
        status_obj      = fields.get("status", {})
        status          = status_obj.get("name", "")
        status_category = status_obj.get("statusCategory", {}).get("key", "new")
        ac_text         = jira_service._extract_acceptance_criteria(fields.get("description"))

        db_task = existing_tasks.get(issue_key)
        if db_task:
            db_task.summary             = summary
            db_task.status              = status
            db_task.acceptance_criteria = ac_text
            db_task.updated_at          = datetime.utcnow()
        else:
            db_task = JiraTask(
                jira_integration_id = integration.id,
                task_key            = issue_key,
                summary             = summary,
                status              = status,
                acceptance_criteria = ac_text,
            )
            db.add(db_task)
            db.flush()  # get db_task.id within the transaction

        tasks_for_detection.append({
            "task_key":            issue_key,
            "summary":             summary,
            "status":              status,
            "status_category":     status_category,
            "acceptance_criteria": ac_text,
            "_db_id":              db_task.id,
        })

    # NOTE: do NOT commit here — we defer to a single commit after all steps
    # succeed so that a GitHub failure doesn't leave orphaned JiraTask rows.

    # 3. Fetch full repo file list via Git Trees API (single call, no recursion)
    try:
        repo_files = await github_service.get_flat_file_list(
            user.github_access_token, request.repo_owner, request.repo_name
        )
    except Exception as exc:
        logger.error("Failed to fetch repo files for %s/%s: %s", request.repo_owner, request.repo_name, exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch repository files: {exc}")

    # 3b. Fetch content of test files for content-based matching (cap at 40 to limit API calls)
    test_file_paths = [f for f in repo_files if gap_detection_service._is_test_file(f)]
    test_file_contents: dict = {}

    if test_file_paths:
        semaphore = asyncio.Semaphore(8)  # max 8 concurrent GitHub requests

        async def _fetch_test_content(client: "httpx.AsyncClient", fpath: str):
            async with semaphore:
                try:
                    content = await github_service.get_file_content(
                        user.github_access_token, request.repo_owner, request.repo_name, fpath,
                        client=client,
                    )
                    return fpath, content or ""
                except Exception:
                    return fpath, ""

        import httpx as _httpx
        async with _httpx.AsyncClient() as _shared_client:
            fetch_results = await asyncio.gather(
                *[_fetch_test_content(_shared_client, p) for p in test_file_paths[:40]]
            )
        test_file_contents = {k: v for k, v in fetch_results if v}
        logger.info(
            "Fetched content for %d/%d test files",
            len(test_file_contents), len(test_file_paths[:40]),
        )

    # 4. Run gap detection (filename + content-based for test files)
    result = gap_detection_service.analyze_gaps(
        jira_tasks    = tasks_for_detection,
        repo_files    = repo_files,
        repo_name     = request.repo_name,
        file_contents = test_file_contents,
    )

    # 4b. Groq verification — confirm "complete" tasks actually have tests covering the AC
    if groq_service.check_availability() and test_file_contents:
        loop = asyncio.get_running_loop()
        gaps_to_verify = [
            gap for gap in result["gaps"]
            if gap["gap_type"] == "complete"
            and gap["test_files"]
            and any(test_file_contents.get(p, "") for p in gap["test_files"][:3])
        ]

        async def _verify_gap(gap: dict):
            test_data = [
                {"path": p, "content": test_file_contents.get(p, "")}
                for p in gap["test_files"][:3]
            ]
            try:
                return gap, await loop.run_in_executor(
                    None,
                    groq_service.verify_test_coverage,
                    gap["summary"],
                    gap["acceptance_criteria"],
                    test_data,
                )
            except Exception as exc:
                logger.warning("verify_test_coverage failed for %s: %s", gap["task_key"], exc)
                return gap, None

        verification_results = await asyncio.gather(*[_verify_gap(g) for g in gaps_to_verify])

        downgraded = 0
        for gap, verification in verification_results:
            if verification and not verification["covered"]:
                gap["gap_type"] = "untested"
                downgraded += 1
                logger.info(
                    "Task %s downgraded complete→untested: %s",
                    gap["task_key"], verification["reason"],
                )

        # Recalculate stats if any gaps were downgraded
        if downgraded:
            gaps = result["gaps"]
            total = len(gaps)

            def _count(t: str) -> int:
                return sum(1 for g in gaps if g["gap_type"] == t)

            def _pct(n: int) -> float:
                return round(n / total * 100, 1) if total else 0.0

            ns  = _count("not_started")
            ut  = _count("untested")
            cmp = _count("complete")
            nct = _count("non_code_task")
            result["stats"] = {
                "total":           total,
                "not_started":     ns,  "not_started_pct":   _pct(ns),
                "untested":        ut,  "untested_pct":      _pct(ut),
                "complete":        cmp, "complete_pct":      _pct(cmp),
                "non_code_task":   nct, "non_code_task_pct": _pct(nct),
            }

    # 5. Persist ImplementationGap rows
    task_key_to_row = {t["task_key"]: t for t in tasks_for_detection}
    task_db_ids     = [t["_db_id"] for t in tasks_for_detection if t.get("_db_id")]
    existing_gaps   = {
        g.jira_task_id: g
        for g in db.query(ImplementationGap).filter(
            ImplementationGap.jira_task_id.in_(task_db_ids)
        ).all()
    }

    for gap_item in result["gaps"]:
        task_row = task_key_to_row.get(gap_item["task_key"])
        if not task_row or not task_row.get("_db_id"):
            continue

        gap_enum = GapTypeEnum(gap_item["gap_type"])
        affected = json.dumps({
            "source": gap_item["source_files"],
            "tests":  gap_item["test_files"],
        })

        existing_gap = existing_gaps.get(task_row["_db_id"])
        if existing_gap:
            existing_gap.gap_type       = gap_enum
            existing_gap.affected_files = affected
        else:
            db.add(ImplementationGap(
                jira_task_id   = task_row["_db_id"],
                gap_type       = gap_enum,
                affected_files = affected,
            ))

    db.commit()
    return result


# ── /gaps/simulate-tests ──────────────────────────────────────────────────────

@router.post("/gaps/simulate-tests")
async def simulate_tests_for_gap(
    request: SimulateTestsRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    # Fetch content of each source file from GitHub (cap at 5)
    files_with_content: List[dict] = []
    for file_path in request.source_files[:5]:
        try:
            raw = await github_service.get_file_content(
                user.github_access_token,
                request.repo_owner,
                request.repo_name,
                file_path,
            )
            content = raw if isinstance(raw, str) else raw.get("content", "")
            files_with_content.append({"path": file_path, "content": content})
        except Exception as e:
            logger.warning("Could not fetch source file %s: %s", file_path, e)
            files_with_content.append({
                "path":    file_path,
                "content": "# [File could not be fetched — treat as unavailable]",
            })

    loop   = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        groq_service.simulate_tests,
        request.task_summary,
        request.acceptance_criteria,
        request.gap_type,
        files_with_content,
    )

    return result


@router.post("/gaps/generate-tests")
async def generate_tests_for_gap(
    request: SimulateTestsRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user = auth_service.get_current_user(db, token)

    files_with_content: List[dict] = []
    for file_path in request.source_files[:5]:
        try:
            raw = await github_service.get_file_content(
                user.github_access_token,
                request.repo_owner,
                request.repo_name,
                file_path,
            )
            content = raw if isinstance(raw, str) else raw.get("content", "")
            files_with_content.append({"path": file_path, "content": content})
        except Exception as e:
            logger.warning("Could not fetch source file %s: %s", file_path, e)
            files_with_content.append({
                "path":    file_path,
                "content": "# [File could not be fetched]",
            })

    loop   = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        groq_service.generate_test_for_gap,
        request.task_summary,
        request.acceptance_criteria,
        request.gap_type,
        files_with_content,
    )

    return result


# ── /gaps/{task_key}/type ─────────────────────────────────────────────────────

@router.put("/gaps/{task_key}/type")
async def update_gap_type(
    task_key: str,
    body: UpdateGapTypeRequest,
    db: Session = Depends(get_db),
    authorization: str = Header(...),
):
    token = authorization.removeprefix("Bearer ").strip()
    user  = auth_service.get_current_user(db, token)

    integration = db.query(JiraIntegration).filter(
        JiraIntegration.user_id == user.id
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="No Jira integration found.")

    task = db.query(JiraTask).filter(
        JiraTask.jira_integration_id == integration.id,
        JiraTask.task_key            == task_key,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_key} not found.")

    gap = db.query(ImplementationGap).filter(
        ImplementationGap.jira_task_id == task.id
    ).first()
    if not gap:
        raise HTTPException(status_code=404, detail=f"No gap record for task {task_key}.")

    try:
        gap.gap_type = GapTypeEnum(body.gap_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid gap type '{body.gap_type}'. "
                   f"Valid values: not_started, untested, complete, non_code_task.",
        )

    db.commit()
    return {"task_key": task_key, "gap_type": body.gap_type}
