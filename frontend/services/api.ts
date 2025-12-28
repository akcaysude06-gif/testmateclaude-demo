import axios from 'axios';
import { AIResponse } from '../types';
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
    // ... existing methods ...

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
}

export const apiService = new ApiService();