"""
Authentication Routes - GitHub OAuth and JWT
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db, User
from services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class TokenResponse(BaseModel):
	access_token: str
	token_type: str
	user: dict

class UserResponse(BaseModel):
	id: int
	username: str
	email: Optional[str]
	avatar_url: Optional[str]
	level0_completed: bool
	level1_completed: bool

def get_frontend_url(request: Request) -> str:
	"""
	Determine frontend URL from request origin
	Returns the appropriate frontend URL (port 3000 or 3001)
	"""
	origin = request.headers.get("origin", "http://localhost:3000")
	referer = request.headers.get("referer", "http://localhost:3000")

	# Try to get from origin header first, then referer
	frontend_url = origin if origin != "null" else referer

	# Ensure it's one of our allowed origins
	allowed_origins = [
		"http://localhost:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
	]

	# Extract base URL
	for allowed in allowed_origins:
		if frontend_url.startswith(allowed):
			return allowed

	# Default to 3000
	return "http://localhost:3000"

@router.get("/github/login")
async def github_login():
	"""
	Redirect to GitHub OAuth authorization page
	"""
	auth_url = auth_service.get_github_oauth_url()
	return {"auth_url": auth_url}

@router.get("/github/callback")
async def github_callback(code: str, request: Request, db: Session = Depends(get_db)):
	"""
	GitHub OAuth callback - exchange code for token and create/update user
	"""
	try:
		# Exchange code for access token
		access_token = await auth_service.exchange_code_for_token(code)

		# Get GitHub user info
		github_user = await auth_service.get_github_user(access_token)

		# Create or update user in database
		user = auth_service.create_or_update_user(db, github_user, access_token)

		# Create JWT token
		jwt_token = auth_service.create_jwt_token(user.id)

		# Get the frontend URL dynamically
		frontend_url = get_frontend_url(request)

		# Redirect to frontend with token
		return RedirectResponse(
			url=f"{frontend_url}/auth/success?token={jwt_token}",
			status_code=status.HTTP_302_FOUND
		)

	except Exception as e:
		print(f"Auth error: {e}")

		# Get the frontend URL dynamically
		frontend_url = "http://localhost:3000"  # Default for errors
		try:
			frontend_url = get_frontend_url(request)
		except:
			pass

		# Redirect to error page
		return RedirectResponse(
			url=f"{frontend_url}/auth/error?message={str(e)}",
			status_code=status.HTTP_302_FOUND
		)

@router.post("/verify")
async def verify_token(token: str, db: Session = Depends(get_db)):
	"""
	Verify JWT token and return user info
	"""
	user = auth_service.get_current_user(db, token)

	return UserResponse(
		id=user.id,
		username=user.username,
		email=user.email,
		avatar_url=user.avatar_url,
		level0_completed=user.level0_completed,
		level1_completed=user.level1_completed
	)

@router.get("/me")
async def get_current_user_info(token: str, db: Session = Depends(get_db)):
	"""
	Get current authenticated user info
	"""
	user = auth_service.get_current_user(db, token)

	return UserResponse(
		id=user.id,
		username=user.username,
		email=user.email,
		avatar_url=user.avatar_url,
		level0_completed=user.level0_completed,
		level1_completed=user.level1_completed
	)

@router.post("/logout")
async def logout():
	"""
	Logout user (client should delete token)
	"""
	return {"message": "Logged out successfully"}

