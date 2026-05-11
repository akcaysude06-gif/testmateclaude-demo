"""
TestMate API - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from routes import level0, level1, production, auth, production_v2, jira, level1_jira
from database import init_db
from services.groq_service import groq_service
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
app.include_router(production_v2.router)
app.include_router(jira.router)
app.include_router(level1_jira.router)

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
    groq_status = "available" if groq_service.check_availability() else "unavailable"
    return {
        "status": "healthy" if groq_status == "available" else "partial",
        "services": {
            "groq": groq_status
        },
        "endpoints": {
            "auth": "/api/auth/github/login",
            "level0": "/api/level0/evaluate-manual-test",
            "level1": "/api/level1/generate-code",
            "production": "/api/production/analyze-code"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)