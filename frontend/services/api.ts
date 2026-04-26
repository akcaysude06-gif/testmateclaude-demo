import axios from 'axios';
import { authUtils } from '../utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 150000, // 150 s — Llama can be slow
});

apiClient.interceptors.request.use((config) => {
    const token = authUtils.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

class ApiService {

    // ── Health ────────────────────────────────────────────────────────────
    async healthCheck() {
        return (await apiClient.get('/api/health')).data;
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    async getGithubAuthUrl(): Promise<{ auth_url: string }> {
        return (await apiClient.get('/api/auth/github/login')).data;
    }

    async verifyToken(token: string) {
        return (await apiClient.post('/api/auth/verify', null, { params: { token } })).data;
    }

    async getCurrentUser() {
        const token = authUtils.getToken();
        return (await apiClient.get('/api/auth/me', { params: { token } })).data;
    }

    async logout() {
        const data = (await apiClient.post('/api/auth/logout')).data;
        authUtils.removeToken();
        return data;
    }

    // ── Level 0 ───────────────────────────────────────────────────────────
    async getLevel0Content(): Promise<any> {
        return (await apiClient.get('/api/level0/content')).data;
    }

    // ── Level 1 ───────────────────────────────────────────────────────────
    async generateAutomationCode(testDescription: string): Promise<any> {
        try {
            return (await apiClient.post('/api/level1/generate-code',
                { test_description: testDescription },
                { timeout: 150000 }
            )).data;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                throw new Error('Request timed out. Try a shorter description or check Ollama is running.');
            }
            throw error;
        }
    }

    async getTestExamples(): Promise<{ examples: any[] }> {
        return (await apiClient.get('/api/level1/examples')).data;
    }

    async checkLlamaHealth(): Promise<any> {
        return (await apiClient.get('/api/level1/health')).data;
    }

    // ── Production — repositories ─────────────────────────────────────────
    async getUserRepositories(token: string): Promise<any> {
        return (await apiClient.get('/api/production/repositories', { params: { token } })).data;
    }

    async getRepositoryTree(owner: string, repo: string, token: string): Promise<any> {
        return (await apiClient.get(`/api/production/repository/${owner}/${repo}/tree`, { params: { token } })).data;
    }

    // ── Production — AI actions ───────────────────────────────────────────

    /** Analyze Test Structure / Improve Test Structure */
    async analyzeCode(code: string, repoContext?: string): Promise<any> {
        return (await apiClient.post('/api/production/analyze-code', {
            code,
            repo_context: repoContext,
        })).data;
    }

    /** Generate New Tests */
    async generateTest(request: {
        repo_name: string;
        file_path: string;
        code_snippet: string;
        user_request: string;
    }): Promise<any> {
        return (await apiClient.post('/api/production/generate-test', request)).data;
    }

    /**
     * Free-form custom prompt — routes to /api/production/custom-prompt.
     * Used by the bottom text input in ActionPanel.
     */
    async customPrompt(prompt: string, repoContext?: string): Promise<{ answer: string; model: string }> {
        return (await apiClient.post('/api/production/custom-prompt', {
            prompt,
            repo_context: repoContext,
        })).data;
    }
}

export const apiService = new ApiService();