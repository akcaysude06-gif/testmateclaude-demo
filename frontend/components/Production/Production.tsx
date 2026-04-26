import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import RepoStep from './steps/RepoStep';
import CodeTypeStep from './steps/CodeTypeStep';
import ScopeStep from './steps/ScopeStep';
import AIChatStep from './steps/AIChatStep';

interface ProductionProps {
    onBack: () => void;
}

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string;
    private: boolean;
    html_url: string;
    language: string;
    updated_at: string;
}

export type CodeType  = 'application-code' | 'test-code';
export type ScopeType = 'whole-project'    | 'specific-files';

export interface SessionConfig {
    repo:          Repository;
    codeType:      CodeType;
    scope:         ScopeType;
    selectedFiles: string[];
}

type Step = 'repo' | 'code-type' | 'scope' | 'chat';

const STEPS: { id: Step; label: string }[] = [
    { id: 'repo',      label: 'Repository' },
    { id: 'code-type', label: 'Code Type'  },
    { id: 'scope',     label: 'Scope'      },
    { id: 'chat',      label: 'AI Chat'    },
];

// ── sessionStorage helpers ────────────────────────────────────────────────────
const SS_KEY = 'testmate_production_state';

function loadPersistedState(): { step: Step; repo: Repository | null; codeType: CodeType | null; scope: ScopeType | null; selectedFiles: string[] } | null {
    try {
        const raw = sessionStorage.getItem(SS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function persistState(state: { step: Step; repo: Repository | null; codeType: CodeType | null; scope: ScopeType | null; selectedFiles: string[] }) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function clearPersistedState() {
    try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
}
// ─────────────────────────────────────────────────────────────────────────────

const Production: React.FC<ProductionProps> = ({ onBack }) => {
    // Restore from sessionStorage on first render
    const persisted = loadPersistedState();

    const [step,           setStep]          = useState<Step>(persisted?.step ?? 'repo');
    const [repositories,   setRepos]         = useState<Repository[]>([]);
    const [isLoadingRepos, setLoading]       = useState(true);
    const [repoError,      setRepoError]     = useState<string | null>(null);
    const [repo,           setRepo]          = useState<Repository | null>(persisted?.repo ?? null);
    const [codeType,       setCodeType]      = useState<CodeType | null>(persisted?.codeType ?? null);
    const [scope,          setScope]         = useState<ScopeType | null>(persisted?.scope ?? null);
    const [selectedFiles,  setSelectedFiles] = useState<string[]>(persisted?.selectedFiles ?? []);

    // Persist whenever any navigation state changes
    useEffect(() => {
        persistState({ step, repo, codeType, scope, selectedFiles });
    }, [step, repo, codeType, scope, selectedFiles]);

    useEffect(() => { loadRepos(); }, []);

    const loadRepos = async () => {
        setLoading(true);
        setRepoError(null);
        try {
            const token = authUtils.getToken();
            const data  = await apiService.getUserRepositories(token!);
            setRepos(data.repositories);
        } catch (err: any) {
            setRepoError(err.response?.data?.detail || 'Failed to load repositories');
        } finally {
            setLoading(false);
        }
    };

    const handleRepoSelected = (r: Repository) => {
        setRepo(r);
        setCodeType(null);
        setScope(null);
        setSelectedFiles([]);
        setStep('code-type');
    };

    const handleCodeTypeSelected = (ct: CodeType) => {
        setCodeType(ct);
        setScope(null);
        setSelectedFiles([]);
        setStep('scope');
    };

    const handleScopeConfirmed = (sc: ScopeType, files: string[]) => {
        setScope(sc);
        setSelectedFiles(files);
        setStep('chat');
    };

    const handleBack = () => {
        if (step === 'code-type') setStep('repo');
        else if (step === 'scope') setStep('code-type');
        else if (step === 'chat')  setStep('scope');
        else { clearPersistedState(); onBack(); }
    };

    const stepIndex = STEPS.findIndex(s => s.id === step);

    const sessionConfig: SessionConfig | null =
        repo && codeType && scope
            ? { repo, codeType, scope, selectedFiles }
            : null;

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Back button */}
            <button
                onClick={handleBack}
                className="text-purple-300 hover:text-white mb-3 flex items-center space-x-2 transition-colors text-sm"
            >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>{step === 'repo' ? 'Back to modes' : 'Back'}</span>
            </button>

            {/* Page header — hidden in chat step to maximise vertical space */}
            {step !== 'chat' && (
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl px-5 py-3 mb-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">Production Mode</h1>
                            <p className="text-purple-100 text-xs mt-0.5">
                                Work with your GitHub repositories and get AI-powered testing assistance
                            </p>
                        </div>
                        <Sparkles className="w-6 h-6 text-white/30" />
                    </div>
                </div>
            )}

            {/* Progress stepper */}
            {step !== 'chat' && (
                <div className="flex items-center mb-5 max-w-md">
                    {STEPS.map((s, i) => {
                        const done   = i < stepIndex;
                        const active = i === stepIndex;
                        return (
                            <React.Fragment key={s.id}>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        done   ? 'bg-purple-500 text-white'
                                            : active ? 'bg-white text-slate-900'
                                                : 'bg-white/10 text-slate-500'
                                    }`}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-xs font-medium transition-all ${
                                        active ? 'text-white' : done ? 'text-purple-400' : 'text-slate-600'
                                    }`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mx-3 transition-all ${
                                        i < stepIndex ? 'bg-purple-500' : 'bg-white/10'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Step content */}
            {step === 'repo' && (
                <RepoStep
                    repositories={repositories}
                    isLoading={isLoadingRepos}
                    error={repoError}
                    selectedRepo={repo}
                    onSelect={handleRepoSelected}
                    onRetry={loadRepos}
                />
            )}

            {step === 'code-type' && repo && (
                <CodeTypeStep
                    repo={repo}
                    selected={codeType}
                    onSelect={handleCodeTypeSelected}
                />
            )}

            {step === 'scope' && repo && codeType && (
                <ScopeStep
                    repo={repo}
                    codeType={codeType}
                    onConfirm={handleScopeConfirmed}
                />
            )}

            {step === 'chat' && sessionConfig && (
                <AIChatStep
                    config={sessionConfig}
                    onReset={() => {
                        clearPersistedState();
                        setStep('repo');
                        setRepo(null);
                        setCodeType(null);
                        setScope(null);
                        setSelectedFiles([]);
                    }}
                />
            )}
        </div>
    );
};

export default Production;