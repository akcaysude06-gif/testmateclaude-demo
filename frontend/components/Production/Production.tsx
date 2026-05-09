import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Sparkles, MessageSquare, X, ClipboardList, FlaskConical, Code2, Download } from 'lucide-react';
import {
    EvaluateResult, GenerateResult,
    verdictLabel, conditionPill,
    EvaluateCondition,
} from './GapReport';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import RepoStep from './steps/RepoStep';
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
    onBack:           () => void;
    jiraConnected?:   boolean;
    onConnectJira?:   () => void;
    onJiraConnected?: () => void;
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

type Step = 'repo' | 'scope' | 'jira';

const STEPS: { id: Step; label: string }[] = [
    { id: 'repo',  label: 'Repository' },
    { id: 'scope', label: 'Scope'      },
    { id: 'jira',  label: 'Jira'       },
];

// ── sessionStorage helpers ────────────────────────────────────────────────────
const SS_KEY        = 'testmate_production_state';
const WIZARD_SS_KEY = 'testmate_wizard_state';

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

function loadAndClearWizardState() {
    try {
        const raw = sessionStorage.getItem(WIZARD_SS_KEY);
        sessionStorage.removeItem(WIZARD_SS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
// ─────────────────────────────────────────────────────────────────────────────

const Production: React.FC<ProductionProps> = ({ onBack, jiraConnected = true, onConnectJira, onJiraConnected }) => {
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
    const [showAIChat,    setShowAIChat]    = useState(false);
    const [panelTab,      setPanelTab]      = useState<'ai_chat' | 'evaluate' | 'generate'>('ai_chat');
    const [evaluatePanelData, setEvaluatePanelData] = useState<{ taskKey: string; summary: string; result: EvaluateResult } | null>(null);
    const [generatePanelData, setGeneratePanelData] = useState<{ taskKey: string; summary: string; result: GenerateResult } | null>(null);
    const [chatWidth,     setChatWidth]     = useState(420);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isResizing       = useRef(false);

    const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor    = 'ew-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current || !chatContainerRef.current) return;
            const containerRight = chatContainerRef.current.getBoundingClientRect().right;
            const newWidth = Math.max(300, Math.min(containerRight - ev.clientX, containerRight - 40));
            setChatWidth(newWidth);
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor    = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup',   onMouseUp);
    }, []);

    const handleEvaluateResult = useCallback((taskKey: string, summary: string, result: EvaluateResult) => {
        setEvaluatePanelData({ taskKey, summary, result });
        setPanelTab('evaluate');
        setShowAIChat(true);
    }, []);

    const handleGenerateResult = useCallback((taskKey: string, summary: string, result: GenerateResult) => {
        setGeneratePanelData({ taskKey, summary, result });
        setPanelTab('generate');
        setShowAIChat(true);
    }, []);

    const downloadPy = (taskKey: string, code: string) => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `test_${taskKey.replace(/-/g, '_').toLowerCase()}.py`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeProject = savedProjects.find(p => p.id === activeProjectId) ?? null;

    useEffect(() => {
        persistState({ activeProjectId });
    }, [activeProjectId]);

    // Re-sync savedProjects when returning from another page (e.g. account settings)
    useEffect(() => {
        const sync = () => {
            const fresh = loadSavedProjects();
            setSavedProjects(fresh);
            setActiveProjectId(prev => fresh.some(p => p.id === prev) ? prev : null);
        };
        const syncOnPageShow = (e: PageTransitionEvent) => { if (e.persisted) sync(); };
        document.addEventListener('visibilitychange', sync);
        window.addEventListener('storage', sync);
        window.addEventListener('connected-projects-changed', sync);
        window.addEventListener('pageshow', syncOnPageShow);
        return () => {
            document.removeEventListener('visibilitychange', sync);
            window.removeEventListener('storage', sync);
            window.removeEventListener('connected-projects-changed', sync);
            window.removeEventListener('pageshow', syncOnPageShow);
        };
    }, []);

    const handleRemoveProject = useCallback((projectId: string) => {
        const updated = savedProjects.filter(p => p.id !== projectId);
        localStorage.setItem('testmate_connected_projects', JSON.stringify(updated));
        setSavedProjects(updated);
        if (activeProjectId === projectId) setActiveProjectId(null);
    }, [savedProjects, activeProjectId]);

    // Restore wizard state after Jira OAuth redirect
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.includes('jira_connected=true')) return;
        const saved = loadAndClearWizardState();
        if (saved?.showWizard) {
            setShowWizard(true);
            setStep(saved.step ?? 'jira');
            if (saved.repo)           setRepo(saved.repo);
            if (saved.codeType)       setCodeType(saved.codeType);
            if (saved.scope)          setScope(saved.scope);
            if (saved.selectedFiles)  setSelectedFiles(saved.selectedFiles);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        setCodeType('application-code');
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
        onJiraConnected?.();
        if (!repo) {
            // Came from "Connect Project" with no repo — Jira just got connected, now pick repo
            setStep('repo');
            loadRepos();
            return;
        }
        saveProject({ key: pk, name: pk, avatar_url: null });
        setShowWizard(false);
        clearPersistedState();
    };

    const handleJiraSkipInWizard = () => {
        if (!repo) {
            // Skipped Jira connect — proceed to repo selection
            setStep('repo');
            loadRepos();
            return;
        }
        saveProject();
        setShowWizard(false);
        clearPersistedState();
    };

    const handleWizardBack = () => {
        if (step === 'scope') setStep('repo');
        else if (step === 'jira' && repo) setStep('scope');
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
        loadRepos();
        setShowWizard(true);
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
        setCodeType('application-code');
        setScope(null);
        setSelectedFiles([]);
        setStep('scope');
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
            ref={chatContainerRef}
            className="w-full min-w-0"
            style={{
                height: 'calc(100vh - 5rem)',
                display: 'grid',
                gridTemplateColumns: showAIChat && aiSessionConfig
                    ? `240px minmax(0, 1fr) ${chatWidth}px`
                    : '240px minmax(0, 1fr)',
                gap: '1rem',
                overflow: 'hidden',
            }}
        >
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className="min-h-0">
                <ConnectedProjectsPanel
                    projects={savedProjects}
                    activeProjectId={activeProjectId}
                    onProjectSelect={handlePanelProjectSelect}
                    onConnectProject={handleConnectProject}
                    onConnectJira={handleConnectJiraForProject}
                    onRemoveProject={handleRemoveProject}
                    jiraConnected={jiraConnected}
                    onSetupJira={onConnectJira}
                />
            </div>

            {/* ── Main + AI chat wrapper ───────────────────────────────────── */}
            <div className="min-w-0 min-h-0 flex flex-col overflow-hidden">

                {/* Main content area */}
                <div className="scroll-subtle flex-1 min-w-0 overflow-y-auto">
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

                            {step === 'scope' && repo && codeType && (
                                <ScopeStep
                                    repo={repo}
                                    codeType={codeType}
                                    onConfirm={handleScopeConfirmed}
                                />
                            )}

                            {step === 'jira' && !repo && (
                                /* No repo yet — user opened wizard without Jira connected */
                                <JiraConnect
                                    onConnected={handleJiraConnectedInWizard}
                                    onSkip={handleJiraSkipInWizard}
                                    wizardState={{ showWizard: true, step: 'jira', repo: null, codeType: null, scope: null, selectedFiles: [] }}
                                />
                            )}
                            {step === 'jira' && repo && (
                                /* Has repo — picking the Jira space for this project */
                                <JiraConnect
                                    onConnected={handleJiraConnectedInWizard}
                                    onSkip={handleJiraSkipInWizard}
                                    wizardState={{ showWizard: true, step: 'jira', repo, codeType, scope, selectedFiles }}
                                />
                            )}
                        </div>

                    ) : (

                        /* ── Dashboard ───────────────────────────────────── */
                        <div className="h-full w-full min-w-0 py-4 pr-2">
                            <ProjectDashboard
                                activeProject={activeProject}
                                onSelectRepo={handleDashboardSelectRepo}
                                onJiraConnected={handleDashboardJiraConnected}
                                onOpenAIChat={() => { setShowAIChat(true); setPanelTab('ai_chat'); }}
                                onEvaluateResult={handleEvaluateResult}
                                onGenerateResult={handleGenerateResult}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right panel (AI Chat + Evaluate + Generate tabs) ─────────── */}
            {showAIChat && aiSessionConfig && (
                <div className="relative flex flex-col border-l border-white/10 bg-slate-900/50 overflow-hidden min-h-0">
                    {/* Drag handle */}
                    <div
                        onMouseDown={onResizeMouseDown}
                        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize hover:bg-purple-500/50 active:bg-purple-500/70 transition-colors"
                    />

                    {/* Tab bar */}
                    <div className="flex items-center justify-between px-3 pt-2 pb-0 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center space-x-1 overflow-x-auto">
                            {/* AI Chat tab */}
                            <button
                                onClick={() => setPanelTab('ai_chat')}
                                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-all ${
                                    panelTab === 'ai_chat'
                                        ? 'text-white border-b-2 border-purple-400 bg-white/5'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>AI Chat</span>
                            </button>

                            {/* Evaluate tab */}
                            {evaluatePanelData && (
                                <button
                                    onClick={() => setPanelTab('evaluate')}
                                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-all ${
                                        panelTab === 'evaluate'
                                            ? 'text-white border-b-2 border-purple-400 bg-white/5'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>Evaluate</span>
                                </button>
                            )}

                            {/* Generate Tests tab */}
                            {generatePanelData && (
                                <button
                                    onClick={() => setPanelTab('generate')}
                                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-all ${
                                        panelTab === 'generate'
                                            ? 'text-white border-b-2 border-indigo-400 bg-white/5'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    <FlaskConical className="w-3.5 h-3.5" />
                                    <span>Generated Tests</span>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowAIChat(false)}
                            className="mb-1 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Panel content */}
                    <div className="flex-1 overflow-hidden">
                        {panelTab === 'ai_chat' && (
                            <AIChatStep
                                config={aiSessionConfig}
                                onReset={() => setShowAIChat(false)}
                                compact
                                productionMode
                            />
                        )}

                        {panelTab === 'evaluate' && evaluatePanelData && (
                            <div className="h-full overflow-y-auto p-4 space-y-4">
                                <div>
                                    <p className="text-[10px] font-mono text-slate-600 mb-1">{evaluatePanelData.taskKey}</p>
                                    <p className="text-sm font-semibold text-white leading-snug">{evaluatePanelData.summary}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-300">Evaluation result</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${verdictLabel(evaluatePanelData.result.verdict).cls}`}>
                                        {verdictLabel(evaluatePanelData.result.verdict).text}
                                    </span>
                                </div>
                                {evaluatePanelData.result.conditions.length > 0 ? (
                                    <div className="space-y-2">
                                        {evaluatePanelData.result.conditions.map((cond: EvaluateCondition, i: number) => {
                                            const pill = conditionPill(cond.status);
                                            return (
                                                <div key={i} className="flex items-start space-x-2 bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2">
                                                    <span className={`flex-shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${pill.cls}`}>
                                                        {pill.text}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-200 leading-snug">{cond.condition}</p>
                                                        {cond.reason && (
                                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{cond.reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500">No conditions parsed from the evaluation result.</p>
                                )}
                            </div>
                        )}

                        {panelTab === 'generate' && generatePanelData && (
                            <div className="h-full overflow-y-auto p-4 space-y-4">
                                <div>
                                    <p className="text-[10px] font-mono text-slate-600 mb-1">{generatePanelData.taskKey}</p>
                                    <p className="text-sm font-semibold text-white leading-snug">{generatePanelData.summary}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="text-xs font-medium text-indigo-300">Generated Tests</span>
                                    </div>
                                    {generatePanelData.result.test_code && (
                                        <button
                                            onClick={() => downloadPy(generatePanelData.taskKey, generatePanelData.result.test_code)}
                                            className="flex items-center space-x-1 text-xs px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400 text-indigo-300 transition-all"
                                        >
                                            <Download className="w-3 h-3" />
                                            <span>Download</span>
                                        </button>
                                    )}
                                </div>
                                {generatePanelData.result.summary && (
                                    <p className="text-xs text-slate-300 leading-snug">{generatePanelData.result.summary}</p>
                                )}
                                {generatePanelData.result.test_code && (
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        <div className="flex items-center px-3 py-1.5 bg-white/5 border-b border-white/10 space-x-2">
                                            <Code2 className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[10px] font-mono text-slate-500">
                                                test_{generatePanelData.taskKey.replace(/-/g, '_').toLowerCase()}.py
                                            </span>
                                        </div>
                                        <div className="overflow-auto bg-black/50">
                                            <table className="w-full text-xs font-mono leading-5">
                                                <tbody>
                                                    {generatePanelData.result.test_code.split('\n').map((line: string, i: number) => (
                                                        <tr key={i} className="hover:bg-white/[0.03] group">
                                                            <td className="select-none w-10 text-right pr-3 pl-2 text-slate-700 group-hover:text-slate-500 border-r border-white/5 sticky left-0 bg-black/50">
                                                                {i + 1}
                                                            </td>
                                                            <td className="pl-4 pr-4 text-green-300 whitespace-pre">{line}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;
