"""
Authentication Service - Handles GitHub OAuth and JWT
"""
import httpx
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from config.settings import settings
from database import User


class AuthService:
	def __init__(self):
		self.github_client_id = settings.GITHUB_CLIENT_ID
		self.github_client_secret = settings.GITHUB_CLIENT_SECRET
		self.github_redirect_uri = settings.GITHUB_REDIRECT_URI
		self.jwt_secret = settings.JWT_SECRET_KEY
		self.jwt_algorithm = settings.JWT_ALGORITHM

	def get_github_oauth_url(self) -> str:
		"""
		Generate GitHub OAuth authorization URL
		"""
		return (
			f"https://github.com/login/oauth/authorize"
			f"?client_id={self.github_client_id}"
			f"&redirect_uri={self.github_redirect_uri}"
			f"&scope=user:email"
		)

	async def exchange_code_for_token(self, code: str) -> str:
		"""
		Exchange GitHub authorization code for access token
		"""
		async with httpx.AsyncClient() as client:
			response = await client.post(
				"https://github.com/login/oauth/access_token",
				data={
					"client_id": self.github_client_id,
					"client_secret": self.github_client_secret,
					"code": code,
					"redirect_uri": self.github_redirect_uri
				},
				headers={"Accept": "application/json"}
			)

			if response.status_code != 200:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="Failed to get access token from GitHub"
				)

			data = response.json()
			if "error" in data:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail=f"GitHub OAuth error: {data.get('error_description', 'Unknown error')}"
				)

			return data["access_token"]

	async def get_github_user(self, access_token: str) -> dict:
		"""
		Get GitHub user information using access token
		"""
		async with httpx.AsyncClient() as client:
			response = await client.get(
				"https://api.github.com/user",
				headers={
					"Authorization": f"Bearer {access_token}",
					"Accept": "application/json"
				}
			)

			if response.status_code != 200:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="Failed to get user info from GitHub"
				)

			return response.json()

	def create_or_update_user(self, db: Session, github_user: dict, access_token: str) -> User:
		"""
		Create new user or update existing user in database
		"""
		# Check if user exists
		user = db.query(User).filter(User.github_id == str(github_user["id"])).first()

		if user:
			# Update existing user
			user.username = github_user["login"]
			user.email = github_user.get("email")
			user.avatar_url = github_user.get("avatar_url")
			user.github_access_token = access_token
			user.last_login = datetime.utcnow()
		else:
			# Create new user
			user = User(
				github_id=str(github_user["id"]),
				username=github_user["login"],
				email=github_user.get("email"),
				avatar_url=github_user.get("avatar_url"),
				github_access_token=access_token,
				created_at=datetime.utcnow(),
				last_login=datetime.utcnow()
			)
			db.add(user)

		db.commit()
		db.refresh(user)
		return user

	def create_jwt_token(self, user_id: int) -> str:
		"""
		Create JWT token for user
		"""
		expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
		to_encode = {
			"sub": str(user_id),
			"exp": expire
		}
		encoded_jwt = jwt.encode(to_encode, self.jwt_secret, algorithm=self.jwt_algorithm)
		return encoded_jwt

	def verify_jwt_token(self, token: str) -> int:
		"""
		Verify JWT token and return user_id
		"""
		try:
			payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
			user_id: int = int(payload.get("sub"))
			if user_id is None:
				raise HTTPException(
					status_code=status.HTTP_401_UNAUTHORIZED,
					detail="Invalid authentication credentials"
				)
			return user_id
		except JWTError:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid authentication credentials"
			)

	def get_current_user(self, db: Session, token: str) -> User:
		"""
		Get current user from JWT token
		"""
		user_id = self.verify_jwt_token(token)
		user = db.query(User).filter(User.id == user_id).first()

		if not user:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="User not found"
			)

		return user

# Singleton
auth_service = AuthService()