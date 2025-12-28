"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List

class TestCaseRequest(BaseModel):
	test_case: str

class CodeAnalysisRequest(BaseModel):
	code: Optional[str] = None
	repo_name: Optional[str] = None

class EducationalContentResponse(BaseModel):
	type: str
	content: str
	model: str

class AutomationResponse(BaseModel):
	type: str
	testCase: str
	explanation: str
	code: str
	reasoning: str
	model: str

class Issue(BaseModel):
	severity: str
	title: str
	description: str
	location: str
	suggestion: str

class Metrics(BaseModel):
	totalTests: int
	codeCoverage: str
	redundantCode: str
	avgExecutionTime: str

class AnalysisResponse(BaseModel):
	type: str
	issues: List[Issue]
	improvements: str
	metrics: Metrics
	model: str