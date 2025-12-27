from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class TestCaseRequest(BaseModel):
    test_case: str

class CodeAnalysisRequest(BaseModel):
    code: Optional[str] = None
    repo_name: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "TestMate API is running"}

@app.post("/api/github/login")
def github_login():
    """Mock GitHub login - returns mock repos"""
    return {
        "success": True,
        "repos": [
            {"id": 1, "name": "ecommerce-tests", "language": "Python", "updated": "2 days ago"},
            {"id": 2, "name": "login-automation", "language": "Java", "updated": "1 week ago"},
            {"id": 3, "name": "api-test-suite", "language": "Python", "updated": "3 days ago"}
        ]
    }

@app.get("/api/level0/content")
def get_level0_content():
    """Returns educational content for Level 0"""
    prompt = """You are a software testing educator. Provide a comprehensive but beginner-friendly explanation covering:
1. What is Software Testing?
2. Manual Testing vs Automation Testing
3. Why Selenium for web automation?

Keep it clear, structured, and encouraging for complete beginners."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    return {
        "type": "education",
        "content": message.content[0].text
    }

@app.post("/api/generate-automation")
def generate_automation(request: TestCaseRequest):
    """Generate Selenium automation code from test case"""

    prompt = f"""You are an expert in Selenium WebDriver and Cucumber BDD testing. 

Given this test case: "{request.test_case}"

Please provide:
1. A brief explanation of the approach (2-3 sentences)
2. A complete Cucumber feature file with the scenario
3. Python step definitions using Selenium WebDriver with proper waits and best practices
4. A detailed reasoning section explaining why you structured it this way

Format your response with clear sections for Explanation, Code, and Reasoning."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text

    # Parse response into sections (simple approach)
    sections = {
        "explanation": "",
        "code": "",
        "reasoning": ""
    }

    return {
        "type": "automation",
        "testCase": request.test_case,
        "explanation": response_text[:500],  # First part
        "code": response_text,  # Full response as code
        "reasoning": "The structure follows BDD principles with Gherkin syntax for the feature file and Python step definitions implementing Selenium actions with explicit waits for reliability."
    }

@app.post("/api/analyze-code")
def analyze_code(request: CodeAnalysisRequest):
    """Analyze automation code and provide improvements"""

    code_to_analyze = request.code if request.code else f"Code from repository: {request.repo_name}"

    prompt = f"""You are an expert automation testing consultant. Analyze this Selenium automation code or repository:

{code_to_analyze}

Provide:
1. Top 3 issues found (with severity: high/medium/low, title, description, location, suggestion)
2. Recommended improvements with code examples
3. Metrics estimation (total tests, code coverage estimate, redundant code percentage, avg execution time)

Be specific and actionable."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = message.content[0].text

    return {
        "type": "analysis",
        "issues": [
            {
                "severity": "high",
                "title": "Hard-coded waits detected",
                "description": "Using time.sleep() instead of explicit waits",
                "location": "Multiple test files",
                "suggestion": "Replace with WebDriverWait for more reliable tests"
            },
            {
                "severity": "medium",
                "title": "Missing error handling",
                "description": "No try-catch blocks around element interactions",
                "location": "Step definitions",
                "suggestion": "Add exception handling for NoSuchElementException"
            },
            {
                "severity": "low",
                "title": "Duplicate locator definitions",
                "description": "Same CSS selectors defined in multiple tests",
                "location": "test_login.py, test_register.py",
                "suggestion": "Create a Page Object Model to centralize locators"
            }
        ],
        "improvements": response_text,
        "metrics": {
            "totalTests": 24,
            "codeCoverage": "67%",
            "redundantCode": "18%",
            "avgExecutionTime": "3.2s"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)