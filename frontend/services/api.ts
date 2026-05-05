import axios from 'axios';
import { authUtils } from '../utils/auth';

export interface JiraProject {
    id:         string;
    key:        string;
    name:       string;
    style:      string | null;
    avatar_url: string | null;
}

export interface JiraIssue {
    key:        string;
    summary:    string;
    status:     string;
    issue_type: string;
    priority:   string | null;
    assignee:   string | null;
}

export interface JiraIssuesGrouped {
    todo:        JiraIssue[];
    in_progress: JiraIssue[];
    in_review:   JiraIssue[];
    done:        JiraIssue[];
}

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
    async getGithubAuthUrl(newAccount = false, loginHint?: string): Promise<{ auth_url: string }> {
        const params: Record<string, string | boolean> = { new_account: newAccount };
        if (loginHint) params.login_hint = loginHint;
        return (await apiClient.get('/api/auth/github/login', { params })).data;
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

    async getFileContent(owner: string, repo: string, path: string, token: string): Promise<{ content: string; path: string }> {
        return (await apiClient.get(`/api/production/repository/${owner}/${repo}/file`, { params: { path, token } })).data;
    }

    async getRepoFlatFiles(owner: string, repo: string, token: string): Promise<string[]> {
        const tree = (await apiClient.get(`/api/production/repository/${owner}/${repo}/tree`, { params: { token } })).data;
        const flat: string[] = [];
        const collect = (items: any[]) => {
            if (!Array.isArray(items)) return;
            for (const item of items) {
                if (item.type === 'file' && item.path) flat.push(item.path);
                else if (item.children) collect(item.children);
                else if (item.type === 'dir' && Array.isArray(item.items)) collect(item.items);
            }
        };
        collect(Array.isArray(tree) ? tree : tree?.tree ?? tree?.items ?? []);
        return flat;
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

    // ── Production V2 — Jira & Gap Detection ─────────────────────────────────

    async connectJira(
        instanceUrl: string,
        email:       string,
        apiToken:    string,
        projectKey:  string | undefined,
    ): Promise<any> {
        return (await apiClient.post(
            '/api/production/v2/jira/connect',
            { instance_url: instanceUrl, email, api_token: apiToken, project_key: projectKey },
        )).data;
    }

    async getJiraStatus(): Promise<any> {
        return (await apiClient.get('/api/production/v2/jira/status')).data;
    }

    async disconnectJira(): Promise<any> {
        return (await apiClient.delete('/api/production/v2/jira/disconnect')).data;
    }

    async getJiraSites(): Promise<any> {
        return (await apiClient.get('/api/production/v2/jira/sites')).data;
    }

    async updateJiraProjectKey(projectKey: string, spaceUrl?: string, cloudId?: string): Promise<any> {
        return (await apiClient.patch('/api/production/v2/jira/project-key', {
            project_key: projectKey,
            ...(spaceUrl  ? { space_url: spaceUrl }  : {}),
            ...(cloudId   ? { cloud_id:  cloudId  }  : {}),
        })).data;
    }

    async analyzeGaps(repoOwner: string, repoName: string): Promise<any> {
        return (await apiClient.post(
            '/api/production/v2/gaps/analyze',
            { repo_owner: repoOwner, repo_name: repoName },
            { timeout: 120000 },
        )).data;
    }

    async generateTestsForGap(
        gapType:            string,
        taskKey:            string,
        taskSummary:        string,
        acceptanceCriteria: string,
        existingCode:       string,
    ): Promise<any> {
        return (await apiClient.post(
            '/api/production/v2/gaps/generate-tests',
            {
                gap_type:            gapType,
                task_key:            taskKey,
                task_summary:        taskSummary,
                acceptance_criteria: acceptanceCriteria,
                existing_code:       existingCode,
            },
            { timeout: 60000 },
        )).data;
    }

    async simulateTests(
        gapType:            string,
        taskKey:            string,
        taskSummary:        string,
        acceptanceCriteria: string,
        sourceFiles:        string[],
        repoOwner:          string,
        repoName:           string,
    ): Promise<{ verdict: string; explanation: string; test_code: string; gap_type: string; model: string }> {
        return (await apiClient.post(
            '/api/production/v2/gaps/simulate-tests',
            {
                gap_type:            gapType,
                task_key:            taskKey,
                task_summary:        taskSummary,
                acceptance_criteria: acceptanceCriteria,
                source_files:        sourceFiles,
                repo_owner:          repoOwner,
                repo_name:           repoName,
            },
            { timeout: 90000 },
        )).data;
    }

    async updateGapType(taskKey: string, gapType: string): Promise<{ task_key: string; gap_type: string }> {
        return (await apiClient.put(
            `/api/production/v2/gaps/${taskKey}/type`,
            { gap_type: gapType },
        )).data;
    }

    // ── Jira OAuth ────────────────────────────────────────────────────────────

    async getJiraOAuthProjects(token: string): Promise<{ projects: JiraProject[] }> {
        return (await apiClient.get('/api/jira/projects', { params: { token } })).data;
    }

    async getJiraProjectIssues(projectKey: string, token: string): Promise<JiraIssuesGrouped> {
        return (await apiClient.get(`/api/jira/project/${projectKey}/issues`, { params: { token } })).data;
    }
}

export const apiService = new ApiService();