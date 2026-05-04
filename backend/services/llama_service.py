import json
import requests
import threading
from fastapi import HTTPException
from config.settings import settings


class LlamaService:
	def __init__(self):
		self.api_url = settings.LLAMA_API_URL
		self.model   = settings.LLAMA_MODEL
		# Warm model into RAM immediately so first real request has no cold-start
		threading.Thread(target=self._warm_up, daemon=True).start()

	def _warm_up(self):
		try:
			requests.post(self.api_url, json={
				"model": self.model, "prompt": "hi", "stream": False,
				"options": {"num_predict": 1, "num_ctx": 512},
			}, timeout=60)
		except Exception:
			pass

	def _opts(self, temperature: float, max_tokens: int) -> dict:
		return {
			"temperature": temperature,
			"num_predict": max_tokens,
			"num_ctx": 512,        # smallest useful window — fastest per-token speed
			"num_thread": 4,       # use 4 CPU threads for generation
		}

	# ── blocking (Level 0 / 1) ────────────────────────────────────────────
	def generate_text(self, prompt: str, temperature: float = 0.3, max_tokens: int = 400) -> str:
		try:
			res = requests.post(self.api_url, json={
				"model": self.model, "prompt": prompt,
				"stream": False, "options": self._opts(temperature, max_tokens),
			}, timeout=120)
			res.raise_for_status()
			return res.json().get("response", "")
		except requests.exceptions.ConnectionError:
			raise HTTPException(503, "Ollama not running. Run: ollama serve")
		except requests.exceptions.Timeout:
			raise HTTPException(504, "Llama timed out.")
		except Exception as e:
			raise HTTPException(500, f"Llama error: {e}")

	# ── streaming (Production) ────────────────────────────────────────────
	def stream_text(self, prompt: str, temperature: float = 0.3, max_tokens: int = 400):
		"""
		Yields text tokens one at a time.
		Uses iter_content(chunk_size=1) — delivers each byte the instant
		Ollama writes it, no internal buffering delay.
		Must be called from a background thread, not the async event loop.
		"""
		try:
			with requests.post(self.api_url, json={
				"model": self.model, "prompt": prompt,
				"stream": True, "options": self._opts(temperature, max_tokens),
			}, stream=True, timeout=120) as res:
				res.raise_for_status()
				buf = b""
				for byte in res.iter_content(chunk_size=1):
					if not byte:
						continue
					buf += byte
					if byte == b"\n":
						try:
							chunk = json.loads(buf.decode("utf-8"))
							buf = b""
							token = chunk.get("response", "")
							if token:
								yield token
							if chunk.get("done"):
								break
						except (json.JSONDecodeError, UnicodeDecodeError):
							buf = b""
		except requests.exceptions.ConnectionError:
			yield "\n[Ollama not running. Run: ollama serve]"
		except Exception as e:
			yield f"\n[Error: {e}]"

	# ── Level 0 ───────────────────────────────────────────────────────────
	def evaluate_manual_test(self, test_steps: str, scenario: str = "Login Form", url: str = "") -> str:
		prompt = (
			f"Test engineer. Review this manual test.\n"
			f"Scenario: {scenario} URL: {url}\n{test_steps}\n\n"
			f"Feedback (max 100 words): gaps, quality, suggestions. Bullets."
		)
		return self.generate_text(prompt, 0.3, 250)

	def answer_automation_question(self, question: str, context: str = "") -> str:
		prompt = (
			f"Selenium Python expert. {context or ''}\n"
			f"Q: {question}\n"
			f"Answer max 150 words. Short code if needed."
		)
		return self.generate_text(prompt, 0.3, 300)

	# ── Level 1 ───────────────────────────────────────────────────────────
	def generate_selenium_code(self, test_description: str) -> dict:
		code_prompt = (
			f"Write a Selenium Python test script for: {test_description}\n"
			f"Requirements: use WebDriverWait, wrap body in try/finally with driver.quit().\n"
			f"Return ONLY the code block:\n```python\n[code here]\n```"
		)
		try:
			code_response = self.generate_text(code_prompt, 0.2, 700)
			code = ""
			if "```python" in code_response:
				s = code_response.find("```python") + 9
				e = code_response.find("```", s)
				code = code_response[s:e].strip() if e != -1 else ""
			elif "```" in code_response:
				s = code_response.find("```") + 3
				e = code_response.find("```", s)
				code = code_response[s:e].strip() if e != -1 else code_response.strip()
			else:
				code = code_response.strip()

			if not code:
				code = self._fallback(test_description)

			# Second call: generate per-line explanations as a JSON map
			numbered = "\n".join(f"{i+1}: {l}" for i, l in enumerate(code.split("\n")))
			explain_prompt = (
				f"You are explaining Selenium Python code to a manual tester who does not know Python.\n"
				f"Here is the code with line numbers:\n{numbered}\n\n"
				f"Return ONLY a JSON object mapping line numbers (as strings) to a short plain-English "
				f"explanation of that line. Skip blank lines and comment-only lines.\n"
				f"Example format (return nothing else, no markdown):\n"
				f'{{"1":"Import the Selenium webdriver module","2":"Import By to locate elements",...}}'
			)
			explain_response = self.generate_text(explain_prompt, 0.2, 600)
			line_explanations = self._parse_json_map(explain_response)

			return {
				"code": code,
				"explanation": "Selenium code",
				"steps": [],
				"line_explanations": line_explanations,
				"language": "python",
			}
		except HTTPException:
			raise
		except Exception:
			return {
				"code": self._fallback(test_description),
				"explanation": "Basic template",
				"steps": [],
				"line_explanations": {},
				"language": "python",
			}

	def _parse_json_map(self, text: str) -> dict:
		"""Extract the first {...} JSON object from an LLM response."""
		import re, json
		# Try to find a {...} block even if the model wrapped it in markdown
		match = re.search(r'\{[^{}]+\}', text, re.DOTALL)
		if match:
			try:
				return json.loads(match.group())
			except json.JSONDecodeError:
				pass
		# Fallback: try parsing the whole response
		try:
			return json.loads(text.strip())
		except Exception:
			return {}

	def _fallback(self, desc: str) -> str:
		return (
			"from selenium import webdriver\n"
			"from selenium.webdriver.common.by import By\n"
			"from selenium.webdriver.support.ui import WebDriverWait\n"
			"from selenium.webdriver.support import expected_conditions as EC\n\n"
			f"# {desc}\ndriver = webdriver.Chrome()\ntry:\n"
			"    driver.get('https://example.com')\n"
			"    wait = WebDriverWait(driver, 10)\n"
			"    # add steps here\nfinally:\n    driver.quit()\n"
		)

	def check_availability(self) -> bool:
		try:
			return requests.get("http://localhost:11434/api/tags", timeout=2).status_code == 200
		except Exception:
			return False


llama_service = LlamaService()