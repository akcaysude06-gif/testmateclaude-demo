import requests
from fastapi import HTTPException
from config.settings import settings

class LlamaService:
	def __init__(self):
		self.api_url = settings.LLAMA_API_URL
		self.model   = settings.LLAMA_MODEL

	def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2000) -> str:
		try:
			res = requests.post(self.api_url, json={
				"model": self.model, "prompt": prompt, "stream": False,
				"options": {"temperature": temperature, "num_predict": max_tokens},
			}, timeout=120)
			res.raise_for_status()
			return res.json().get("response", "")
		except requests.exceptions.ConnectionError:
			raise HTTPException(status_code=503, detail="Llama service is not running. Start Ollama: ollama serve")
		except requests.exceptions.Timeout:
			raise HTTPException(status_code=504, detail="Request timed out.")
		except Exception as e:
			raise HTTPException(status_code=500, detail=f"Llama error: {str(e)}")

	def evaluate_manual_test(self, test_steps: str, scenario: str = "Login Form", url: str = "") -> str:
		prompt = f"""You are an experienced software test engineer reviewing a student's manual test report.

Scenario: {scenario}
Page tested: {url}

Student's test steps:
{test_steps}

Evaluate:
1. Are the steps detailed enough?
2. Are expected results documented?
3. Which test scenarios are missing? (negative tests, edge cases, etc.)
4. Overall quality and suggestions for improvement.

Write in English. Be constructive and educational. No emojis. Use bullet points. Max 200 words."""
		return self.generate_text(prompt, temperature=0.3, max_tokens=600)

	def answer_automation_question(self, question: str, context: str = "") -> str:
		prompt = f"""You are an experienced test automation engineer answering a beginner's question.

Context: {context or "Selenium Python test automation"}

Question: {question}

Rules:
- Write in English
- Use simple, clear language
- Explain technical terms
- Include a short code example if relevant
- No emojis, professional tone
- Max 250 words"""
		return self.generate_text(prompt, temperature=0.4, max_tokens=700)

	def generate_selenium_code(self, test_description: str) -> dict:
		prompt = f"""Write Selenium Python code for the following test:

{test_description}

Format:
```python
[code here]
```

STEPS:
1. [step]
2. [step]

Keep it concise and professional."""
		try:
			response = self.generate_text(prompt, temperature=0.2, max_tokens=1500)
			code, steps = "", []
			if "```python" in response:
				s = response.find("```python") + 9
				e = response.find("```", s)
				code = response[s:e].strip() if e != -1 else ""
			elif "```" in response:
				s = response.find("```") + 3
				e = response.find("```", s)
				code = response[s:e].strip() if e != -1 else response.strip()
			else:
				code = response.strip()
			if "STEPS:" in response:
				for line in response[response.find("STEPS:")+6:].split('\n'):
					line = line.strip()
					if line and (line[0].isdigit() or line.startswith('-')):
						steps.append(line)
			if not steps:
				steps = ["Import Selenium","Launch Chrome WebDriver","Navigate to target URL","Locate elements and perform actions","Assert expected results","Close the browser"]
			if not code:
				code = self._fallback_code(test_description)
			return {"code": code, "explanation": "Selenium automation code", "steps": steps, "language": "python"}
		except HTTPException:
			raise
		except Exception:
			return {"code": self._fallback_code(test_description), "explanation": "Basic Selenium template",
					"steps": ["Import Selenium","Launch WebDriver","Open URL","Test steps","Close browser"], "language": "python"}

	def _fallback_code(self, desc: str) -> str:
		return f"""from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Test: {desc}

driver = webdriver.Chrome()
driver.maximize_window()

try:
    driver.get("https://example.com")
    wait = WebDriverWait(driver, 10)
    # Add your test steps here
    print("Test completed")
except Exception as e:
    print(f"Test failed: {{str(e)}}")
finally:
    driver.quit()
"""

	def check_availability(self) -> bool:
		try:
			return requests.get("http://localhost:11434/api/tags", timeout=2).status_code == 200
		except:
			return False

llama_service = LlamaService()