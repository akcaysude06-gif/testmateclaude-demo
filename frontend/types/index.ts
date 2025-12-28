// TypeScript types for the application

export interface Repo {
    id: number;
    name: string;
    language: string;
    updated: string;
}

export interface Issue {
    severity: string;
    title: string;
    description: string;
    location: string;
    suggestion: string;
}

export interface AIResponse {
    type: string;
    content?: string;
    testCase?: string;
    explanation?: string;
    code?: string;
    reasoning?: string;
    issues?: Issue[];
    improvements?: string;
    metrics?: {
        totalTests: number;
        codeCoverage: string;
        redundantCode: string;
        avgExecutionTime: string;
    };
    model?: string;
}

export type ModeType = 'guided' | 'production' | null;
export type LevelType = 0 | 1 | null;