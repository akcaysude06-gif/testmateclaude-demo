import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Sparkles, MessageSquare, X, FlaskConical, CheckCircle2, XCircle, AlertTriangle, Code2, Download } from 'lucide-react';
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
    const [chatWidth,     setChatWidth]     = useState(420);
    const [activePanel,   setActivePanel]   = useState<'chat' | 'results'>('chat');
    const [lastSimResult, setLastSimResult] = useState<{ verdict: string; explanation: string; test_code: string; task_key: string; task_summary: string } | null>(null);
    const [showTestCode,  setShowTestCode]  = useState(false);
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

    const handleSimulateResult = useCallback((result: any) => {
        setLastSimResult(result);
        setShowTestCode(false);
        setActivePanel('results');
        setShowAIChat(true);
    }, []);

    const downloadTestCode = (taskKey: string, code: string) => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `test_${taskKey.replace('-', '_').toLowerCase()}.py`;
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

    const ConditionCard = ({ condition, satisfied, unknown, reason }: { condition: string; satisfied: boolean; unknown: boolean; reason: string }) => (
        <div className={`rounded-lg border px-3 py-2.5 space-y-1 ${
            unknown    ? 'bg-yellow-500/8 border-yellow-500/20'
            : satisfied ? 'bg-green-500/8 border-green-500/20'
            : 'bg-red-500/8 border-red-500/20'
        }`}>
            <div className="flex items-start space-x-2">
                {unknown
                    ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    : satisfied
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                }
                <p className="text-xs font-medium text-white leading-snug">{condition}</p>
            </div>
            <p className={`text-[11px] ml-5 font-semibold ${unknown ? 'text-yellow-400' : satisfied ? 'text-green-400' : 'text-red-400'}`}>
                {unknown ? 'Unknown' : satisfied ? 'Satisfied' : 'Not Satisfied'}
            </p>
            {reason && <p className="text-[11px] ml-5 text-slate-400 leading-snug">{reason}</p>}
        </div>
    );

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
                                onSimulateResult={handleSimulateResult}
                                onOpenAIChat={() => setShowAIChat(true)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right panel (AI Chat + Test Results tabs) ────────────────── */}
            {showAIChat && aiSessionConfig && (
                <div className="relative flex flex-col border-l border-white/10 bg-slate-900/50 overflow-hidden min-h-0">
                    {/* Drag handle */}
                    <div
                        onMouseDown={onResizeMouseDown}
                        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize hover:bg-purple-500/50 active:bg-purple-500/70 transition-colors"
                    />

                    {/* Tab bar */}
                    <div className="flex items-center justify-between px-3 pt-2 pb-0 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setActivePanel('chat')}
                                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                                    activePanel === 'chat'
                                        ? 'border-purple-400 text-white bg-white/5'
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>AI Chat</span>
                            </button>
                            <button
                                onClick={() => setActivePanel('results')}
                                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all ${
                                    activePanel === 'results'
                                        ? 'border-indigo-400 text-white bg-white/5'
                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <FlaskConical className="w-3.5 h-3.5" />
                                <span>Test Results</span>
                                {lastSimResult && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        lastSimResult.verdict === 'PASS' ? 'bg-green-500/30 text-green-300'
                                        : lastSimResult.verdict === 'FAIL' ? 'bg-red-500/30 text-red-300'
                                        : 'bg-yellow-500/30 text-yellow-300'
                                    }`}>{lastSimResult.verdict}</span>
                                )}
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAIChat(false)}
                            className="mb-1 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Panel content */}
                    <div className="flex-1 overflow-hidden">
                        {activePanel === 'chat' ? (
                            <AIChatStep
                                config={aiSessionConfig}
                                onReset={() => setShowAIChat(false)}
                                compact
                            />
                        ) : (
                            <div className="h-full overflow-y-auto p-4 space-y-4">
                                {!lastSimResult ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                                        <FlaskConical className="w-8 h-8 text-slate-600" />
                                        <p className="text-slate-500 text-xs">No simulation run yet.</p>
                                        <p className="text-slate-600 text-xs">Click "Simulate Tests" on any task in the gap report.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Task info */}
                                        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                            <p className="text-xs text-slate-500 font-mono">{lastSimResult.task_key}</p>
                                            <p className="text-sm text-white mt-0.5 leading-snug">{lastSimResult.task_summary}</p>
                                        </div>

                                        {/* Verdict header */}
                                        <div className={`rounded-xl border px-4 py-3 flex items-center space-x-2 ${
                                            lastSimResult.verdict === 'PASS' ? 'bg-green-500/10 border-green-500/30'
                                            : lastSimResult.verdict === 'FAIL' ? 'bg-red-500/10 border-red-500/30'
                                            : 'bg-yellow-500/10 border-yellow-500/30'
                                        }`}>
                                            {lastSimResult.verdict === 'PASS'
                                                ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                : lastSimResult.verdict === 'FAIL'
                                                ? <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                                : <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                            }
                                            <span className={`text-sm font-bold ${
                                                lastSimResult.verdict === 'PASS' ? 'text-green-300'
                                                : lastSimResult.verdict === 'FAIL' ? 'text-red-300'
                                                : 'text-yellow-300'
                                            }`}>
                                                AI Analysis — {lastSimResult.verdict}
                                            </span>
                                        </div>

                                        {/* Condition-by-condition breakdown */}
                                        <div className="space-y-2">
                                            {(() => {
                                                const text = lastSimResult.explanation;

                                                // Try structured Condition: blocks first.
                                                // slice(1) drops the preamble before the first "- Condition:" marker.
                                                const structuredBlocks = text.split(/\n\s*-\s+Condition:/i).slice(1).filter(Boolean);
                                                if (structuredBlocks.length > 0) {
                                                    return structuredBlocks.map((block, i) => {
                                                        const condMatch   = block.match(/^([^\n]+)/);
                                                        const statusMatch = block.match(/Status:\s*(SATISFIED|NOT SATISFIED|INCONCLUSIVE)/i);
                                                        const reasonMatch = block.match(/Reason:\s*([^\n]+)/i);
                                                        const condition   = condMatch?.[1]?.trim() ?? `Condition ${i + 1}`;
                                                        // Only mark as satisfied when the model explicitly says so.
                                                        // INCONCLUSIVE / unparseable status shows as neutral (unknown=true).
                                                        const statusRaw   = statusMatch?.[1]?.toUpperCase() ?? 'UNKNOWN';
                                                        const satisfied   = statusRaw === 'SATISFIED';
                                                        const unknown     = statusRaw !== 'SATISFIED' && statusRaw !== 'NOT SATISFIED';
                                                        const reason      = reasonMatch?.[1]?.trim() ?? '';
                                                        return (
                                                            <ConditionCard key={i} condition={condition} satisfied={satisfied} unknown={unknown} reason={reason} />
                                                        );
                                                    });
                                                }

                                                // Fallback: split by bullet points / numbered lines — always item-by-item
                                                const lines = text
                                                    .split('\n')
                                                    .map(l => l.replace(/^[\s\-•*\d.]+/, '').trim())
                                                    .filter(Boolean);
                                                return lines.map((line, i) => {
                                                    const satisfied = /(pass|satisf|found|exist|implemented|present|correct)/i.test(line)
                                                        && !/(not|miss|fail|absent|no |never|lack|empty|undefined|incorrect)/i.test(line);
                                                    return <ConditionCard key={i} condition={line} satisfied={satisfied} unknown={false} reason="" />;
                                                });
                                            })()}
                                        </div>

                                        {/* View Code + Download */}
                                        {lastSimResult.test_code && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setShowTestCode(v => !v)}
                                                    className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10 transition-all"
                                                >
                                                    <Code2 className="w-3.5 h-3.5" />
                                                    <span>{showTestCode ? 'Hide Code' : 'View Code'}</span>
                                                </button>
                                                <button
                                                    onClick={() => downloadTestCode(lastSimResult.task_key, lastSimResult.test_code)}
                                                    className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10 transition-all"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    <span>Download .py</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Expandable test code */}
                                        {showTestCode && lastSimResult.test_code && (
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1.5">
                                                    <Code2 className="w-3.5 h-3.5 text-purple-400" />
                                                    <span className="text-xs text-purple-300 font-medium">Simulated Test Code</span>
                                                </div>
                                                <pre className="bg-black/50 border border-white/10 rounded-xl p-3 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed">
                                                    <code>{lastSimResult.test_code}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </>
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
