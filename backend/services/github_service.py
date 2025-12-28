"""
GitHub Service - Fetch user repositories and repository data
"""
import httpx
from typing import List, Dict
from fastapi import HTTPException, status
from database import User

class GitHubService:
	def __init__(self):
		self.github_api_base = "https://api.github.com"

	async def get_user_repositories(self, access_token: str) -> List[Dict]:
		"""
		Fetch all repositories for the authenticated user

		Args:
			access_token: GitHub access token from database

		Returns:
			List of repository dictionaries
		"""
		try:
			async with httpx.AsyncClient() as client:
				response = await client.get(
					f"{self.github_api_base}/user/repos",
					headers={
						"Authorization": f"Bearer {access_token}",
						"Accept": "application/vnd.github+json",
						"X-GitHub-Api-Version": "2022-11-28"
					},
					params={
						"sort": "updated",
						"per_page": 100,
						"type": "all"  # owner, public, private, member
					}
				)

				if response.status_code != 200:
					raise HTTPException(
						status_code=status.HTTP_400_BAD_REQUEST,
						detail="Failed to fetch repositories from GitHub"
					)

				repos = response.json()

				# Format the repository data
				formatted_repos = []
				for repo in repos:
					formatted_repos.append({
						"id": repo["id"],
						"name": repo["name"],
						"full_name": repo["full_name"],
						"description": repo.get("description", "No description"),
						"private": repo["private"],
						"html_url": repo["html_url"],
						"language": repo.get("language", "Unknown"),
						"updated_at": repo["updated_at"],
						"size": repo["size"],
						"default_branch": repo["default_branch"],
						"topics": repo.get("topics", [])
					})

				return formatted_repos

		except httpx.HTTPError as e:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Error communicating with GitHub API: {str(e)}"
			)

	async def get_repository_structure(self, access_token: str, owner: str, repo: str, path: str = "") -> Dict:
		"""
		Get the file/folder structure of a repository

		Args:
			access_token: GitHub access token
			owner: Repository owner
			repo: Repository name
			path: Path within the repository (optional)

		Returns:
			Repository structure
		"""
		try:
			async with httpx.AsyncClient() as client:
				url = f"{self.github_api_base}/repos/{owner}/{repo}/contents/{path}"
				response = await client.get(
					url,
					headers={
						"Authorization": f"Bearer {access_token}",
						"Accept": "application/vnd.github+json",
						"X-GitHub-Api-Version": "2022-11-28"
					}
				)

				if response.status_code != 200:
					raise HTTPException(
						status_code=status.HTTP_400_BAD_REQUEST,
						detail=f"Failed to fetch repository structure: {response.text}"
					)

				return response.json()

		except httpx.HTTPError as e:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Error fetching repository structure: {str(e)}"
			)

	async def get_file_content(self, access_token: str, owner: str, repo: str, path: str) -> str:
		"""
		Get the content of a specific file

		Args:
			access_token: GitHub access token
			owner: Repository owner
			repo: Repository name
			path: File path

		Returns:
			File content as string
		"""
		try:
			import base64

			async with httpx.AsyncClient() as client:
				url = f"{self.github_api_base}/repos/{owner}/{repo}/contents/{path}"
				response = await client.get(
					url,
					headers={
						"Authorization": f"Bearer {access_token}",
						"Accept": "application/vnd.github+json",
						"X-GitHub-Api-Version": "2022-11-28"
					}
				)

				if response.status_code != 200:
					raise HTTPException(
						status_code=status.HTTP_400_BAD_REQUEST,
						detail=f"Failed to fetch file content: {response.text}"
					)

				data = response.json()

				# Decode base64 content
				content = base64.b64decode(data["content"]).decode('utf-8')
				return content

		except httpx.HTTPError as e:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Error fetching file content: {str(e)}"
			)

# Singleton instance
github_service = GitHubService()