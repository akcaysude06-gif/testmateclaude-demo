import axios from 'axios';
import { authUtils } from '../utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with longer timeout for AI requests
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 150000, // 150 seconds (2.5 minutes) for AI generation
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = authUtils.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

class ApiService {
    // Health check
    async healthCheck() {
        const response = await apiClient.get('/api/health');
        return response.data;
    }

    // GitHub OAuth login
    async getGithubAuthUrl(): Promise<{ auth_url: string }> {
        const response = await apiClient.get('/api/auth/github/login');
        return response.data;
    }

    // Verify token and get user info
    async verifyToken(token: string) {
        const response = await apiClient.post('/api/auth/verify', null, {
            params: { token }
        });
        return response.data;
    }

    // Get current user
    async getCurrentUser() {
        const token = authUtils.getToken();
        const response = await apiClient.get('/api/auth/me', {
            params: { token }
        });
        return response.data;
    }

    // Logout
    async logout() {
        const response = await apiClient.post('/api/auth/logout');
        authUtils.removeToken();
        return response.data;
    }

    // Level 0 - Get educational content
    async getLevel0Content(): Promise<any> {
        const response = await apiClient.get('/api/level0/content');
        return response.data;
    }

    // Level 1 - Generate automation code with extended timeout
    async generateAutomationCode(testDescription: string): Promise<any> {
        try {
            const response = await apiClient.post('/api/level1/generate-code', {
                test_description: testDescription
            }, {
                timeout: 150000 // 150 seconds specifically for this request
            });
            return response.data;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Request timed out. Please try with a shorter description or check if Ollama is running.');
            }
            throw error;
        }
    }

    // Level 1 - Get test examples
    async getTestExamples(): Promise<{ examples: any[] }> {
        const response = await apiClient.get('/api/level1/examples');
        return response.data;
    }

    // Check Llama 3 health
    async checkLlamaHealth(): Promise<any> {
        const response = await apiClient.get('/api/level1/health');
        return response.data;
    }

    // Production - Analyze code
    async analyzeCode(code?: string, repoName?: string): Promise<any> {
        const response = await apiClient.post('/api/production/analyze-code', {
            code,
            repo_name: repoName
        });
        return response.data;
    }
}

export const apiService = new ApiService();