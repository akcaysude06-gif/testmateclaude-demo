import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, MessageSquare, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import RepoStep from './steps/RepoStep';
import CodeTypeStep from './steps/CodeTypeStep';
import ScopeStep from './steps/ScopeStep';
import AIChatStep from './steps/AIChatStep';
import JiraConnect from './JiraConnect';
import ConnectedProjectsPanel, {
    SavedProject,
    loadSavedProjects,
    upsertSavedProject,
} from './ConnectedProjectsPanel';
import ProjectDashboard from './ProjectDashboard';

interface ProductionProps {
    onBack: () => void;
}

export interface Repository {
    id:          number;
    name:        string;
    full_name:   string;
    description: string;
    private:     boolean;
    html_url:    string;
    language:    string;
    updated_at:  string;
}

export type CodeType  = 'application-code' | 'test-code';
export type ScopeType = 'whole-project'    | 'specific-files';

export interface SessionConfig {
    repo:          Repository;
    codeType:      CodeType;
    scope:         ScopeType;
    selectedFiles: string[];
}

type Step = 'repo' | 'code-type' | 'scope' | 'jira';

const STEPS: { id: Step; label: string }[] = [
    { id: 'repo',      label: 'Repository' },
    { id: 'code-type', label: 'Code Type'  },
    { id: 'scope',     label: 'Scope'      },
    { id: 'jira',      label: 'Jira'       },
];

// ── sessionStorage helpers ────────────────────────────────────────────────────
const SS_KEY = 'testmate_production_state';

function loadPersistedState() {
    try {
        const raw = sessionStorage.getItem(SS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function persistState(state: object) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function clearPersistedState() {
    try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
}
// ─────────────────────────────────────────────────────────────────────────────

const Production: React.FC<ProductionProps> = ({ onBack }) => {
    const persisted = loadPersistedState();

    // Wizard state
    const [showWizard, setShowWizard] = useState(false);
    const [step,       setStep]       = useState<Step>('repo');
    const [repo,       setRepo]       = useState<Repository | null>(null);
    const [codeType,   setCodeType]   = useState<CodeType | null>(null);
    const [scope,      setScope]      = useState<ScopeType | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    // Repo loading (used by wizard repo step)
    const [repositories,   setRepos]     = useState<Repository[]>([]);
    const [isLoadingRepos, setLoading]   = useState(false);
    const [repoError,      setRepoError] = useState<string | null>(null);

    // Panel / project state
    const [savedProjects,   setSavedProjects]  = useState<SavedProject[]>(() => loadSavedProjects());
    const [activeProjectId, setActiveProjectId] = useState<string | null>(persisted?.activeProjectId ?? null);
    const [showAIChat,      setShowAIChat]      = useState(false);

    const activeProject = savedProjects.find(p => p.id === activeProjectId) ?? null;

    useEffect(() => {
        persistState({ activeProjectId });
    }, [activeProjectId]);

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

    // ── Save helper ───────────────────────────────────────────────────────────

    function saveProject(withJira?: { key: string; name: string; avatar_url: string | null }) {
        if (!repo || !codeType || !scope) return;
        const project: SavedProject = {
            id: repo.full_name,
            repo,
            codeType,
            scope,
            selectedFiles,
            jira: withJira,
        };
        upsertSavedProject(project);
        const updated = loadSavedProjects();
        setSavedProjects(updated);
        setActiveProjectId(repo.full_name);
    }

    // ── Wizard step handlers ──────────────────────────────────────────────────

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
        setStep('jira');
    };

    const handleJiraConnectedInWizard = (pk: string) => {
        saveProject({ key: pk, name: pk, avatar_url: null });
        setShowWizard(false);
        clearPersistedState();
    };

    const handleJiraSkipInWizard = () => {
        saveProject();
        setShowWizard(false);
        clearPersistedState();
    };

    const handleWizardBack = () => {
        if (step === 'code-type') setStep('repo');
        else if (step === 'scope') setStep('code-type');
        else if (step === 'jira')  setStep('scope');
        else { setShowWizard(false); }
    };

    const exitWizardToModes = () => {
        setShowWizard(false);
        clearPersistedState();
        onBack();
    };

    // ── Sidebar callbacks ─────────────────────────────────────────────────────

    const handleConnectProject = () => {
        setRepo(null);
        setCodeType(null);
        setScope(null);
        setSelectedFiles([]);
        setStep('repo');
        setShowWizard(true);
        loadRepos();
    };

    const handlePanelProjectSelect = (project: SavedProject) => {
        setActiveProjectId(project.id);
        setShowWizard(false);
    };

    const handleConnectJiraForProject = (projectId: string) => {
        const project = savedProjects.find(p => p.id === projectId);
        if (!project) return;
        setRepo(project.repo);
        setActiveProjectId(project.id);
        setCodeType(project.codeType ?? 'application-code');
        setScope(project.scope ?? 'whole-project');
        setSelectedFiles(project.selectedFiles ?? []);
        setStep('jira');
        setShowWizard(true);
    };

    // ── Dashboard callbacks ───────────────────────────────────────────────────

    const handleDashboardSelectRepo = (r: Repository) => {
        setRepo(r);
        setCodeType(null);
        setScope(null);
        setSelectedFiles([]);
        setStep('code-type');
        setShowWizard(true);
        loadRepos();
    };

    const handleDashboardJiraConnected = (projectId: string, key: string) => {
        const updated = loadSavedProjects();
        setSavedProjects(updated);
        setActiveProjectId(projectId);
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const stepIndex = STEPS.findIndex(s => s.id === step);

    const aiSessionConfig: SessionConfig | null = activeProject
        ? {
            repo:          activeProject.repo,
            codeType:      activeProject.codeType ?? 'application-code',
            scope:         activeProject.scope ?? 'whole-project',
            selectedFiles: activeProject.selectedFiles ?? [],
          }
        : null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            className="max-w-[1400px] mx-auto flex gap-4"
            style={{ height: 'calc(100vh - 5rem)' }}
        >
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="flex-shrink-0" style={{ height: '100%' }}>
                <ConnectedProjectsPanel
                    projects={savedProjects}
                    activeProjectId={activeProjectId}
                    onProjectSelect={handlePanelProjectSelect}
                    onConnectProject={handleConnectProject}
                    onConnectJira={handleConnectJiraForProject}
                />
            </div>

            {/* ── Main + AI chat ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex overflow-hidden" style={{ height: '100%' }}>

                {/* Main content area */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    {showWizard ? (

                        /* ── Wizard ──────────────────────────────────────── */
                        <div className="py-4 pr-2">
                            {/* Back */}
                            <button
                                onClick={step === 'repo' ? exitWizardToModes : handleWizardBack}
                                className="text-purple-300 hover:text-white mb-4 flex items-center space-x-2 transition-colors text-sm"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                <span>{step === 'repo' ? 'Back to modes' : 'Back'}</span>
                            </button>

                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl px-5 py-3 mb-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <h1 className="text-lg font-bold text-white leading-tight">Connect Project</h1>
                                        <p className="text-purple-100 text-xs mt-0.5">
                                            Link a GitHub repository and optionally connect Jira for gap analysis
                                        </p>
                                    </div>
                                    <Sparkles className="w-6 h-6 text-white/30" />
                                </div>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center mb-6 max-w-md">
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

                            {step === 'jira' && (
                                <JiraConnect
                                    onConnected={handleJiraConnectedInWizard}
                                    onSkip={handleJiraSkipInWizard}
                                />
                            )}
                        </div>

                    ) : (

                        /* ── Dashboard ───────────────────────────────────── */
                        <div className="h-full py-4 pr-2">
                            {/* Top bar with AI Chat toggle */}
                            {activeProject && (
                                <div className="flex items-center justify-end mb-3">
                                    <button
                                        onClick={() => setShowAIChat(v => !v)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                            showAIChat
                                                ? 'bg-purple-500/30 border-purple-400/60 text-white'
                                                : 'bg-white/5 border-white/15 text-slate-300 hover:border-purple-400/50 hover:text-white'
                                        }`}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>AI Chat</span>
                                    </button>
                                </div>
                            )}

                            <ProjectDashboard
                                activeProject={activeProject}
                                onSelectRepo={handleDashboardSelectRepo}
                                onJiraConnected={handleDashboardJiraConnected}
                            />
                        </div>
                    )}
                </div>

                {/* ── AI Chat slide-in panel (25%) ─────────────────────────── */}
                {showAIChat && aiSessionConfig && (
                    <div
                        className="flex-shrink-0 flex flex-col border-l border-white/10 bg-slate-900/50 overflow-hidden"
                        style={{ width: '25%', minWidth: 300 }}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-semibold text-white">AI Chat</span>
                            </div>
                            <button
                                onClick={() => setShowAIChat(false)}
                                className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <AIChatStep
                                config={aiSessionConfig}
                                onReset={() => setShowAIChat(false)}
                                compact
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Production;
