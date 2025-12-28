"""
TestMate API - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from routes import level0, level1, production, auth
from services.llama_service import llama_service
from services.claude_service import claude_service
from database import init_db

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-Assisted Testing Framework for learning and automation"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)  # Add auth router
app.include_router(level0.router)
app.include_router(level1.router)
app.include_router(production.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"{settings.APP_NAME} API is running",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    """Check health status of all AI services"""
    llama_status = "available" if llama_service.check_availability() else "unavailable"
    claude_status = "available" if claude_service.check_availability() else "not configured"

    overall_status = "healthy" if llama_status == "available" else "partial"

    return {
        "status": overall_status,
        "services": {
            "llama3": llama_status,
            "claude": claude_status
        },
        "endpoints": {
            "auth": "/api/auth/github/login",
            "level0": "/api/level0/content",
            "level1": "/api/level1/generate-automation",
            "production": "/api/production/analyze-code"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)