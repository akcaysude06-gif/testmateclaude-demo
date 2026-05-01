"""
Configuration settings for TestMate
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
	# API Configuration
	ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
	GROQ_API_KEY = os.getenv("GROQ_API_KEY")
	GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
	# Llama Configuration
	LLAMA_API_URL = os.getenv("LLAMA_API_URL", "http://localhost:11434/api/generate")
	LLAMA_MODEL = os.getenv("LLAMA_MODEL", "llama3")

	# GitHub OAuth
	GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
	GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
	# Accept both 3000 and 3001
	GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/callback")

	# Jira OAuth 2.0 (3LO)
	JIRA_CLIENT_ID = os.getenv("JIRA_CLIENT_ID")
	JIRA_CLIENT_SECRET = os.getenv("JIRA_CLIENT_SECRET")
	JIRA_REDIRECT_URI = os.getenv("JIRA_REDIRECT_URI", "http://localhost:8000/api/jira/callback")

	# Frontend base URL — used for post-OAuth redirects
	FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

	# JWT
	JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this")
	JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
	JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "43200"))

	# Database
	DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./testmate.db")

	# CORS Configuration - Accept BOTH ports
	CORS_ORIGINS = [
		"http://localhost:3000",
		"http://localhost:3001",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
	]

	# Application
	APP_NAME = "TestMate"
	VERSION = "1.0.0"

settings = Settings()