import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    CheckCircle2, AlertTriangle, XCircle,
    ChevronDown, Code2, Loader2, Wand2,
    ListTodo, PlayCircle, CheckCheck, X,
    FileCode2, ChevronRight as ChevronRightIcon,
    FlaskConical, Plus, Search, Ban,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface GapItem {
    task_key:             string;
    summary:              string;
    status:               string;
    gap_type:             'not_started' | 'untested' | 'complete' | 'non_code_task';
    keywords:             string[];
    source_files:         string[];
    test_files:           string[];
    acceptance_criteria?: string;
}

interface GapStats {
    total:              number;
    not_started:        number;
    not_started_pct:    number;
    untested:           number;
    untested_pct:       number;
    complete:           number;
    complete_pct:       number;
    non_code_task:      number;
    non_code_task_pct:  number;
}

interface SimulateResult {
    verdict:     string;
    explanation: string;
    test_code:   string;
    task_key:    string;
    task_summary: string;
}

interface GapReportProps {
    repoOwner:        string;
    repoName:         string;
    onSkip:           () => void;
    onSimulateResult: (result: SimulateResult) => void;
}

type SprintTab = 'todo' | 'in_progress' | 'done';

interface FilePreview {
    path:    string;
    content: string | null;
    loading: boolean;
    error:   string | null;
}

const GAP_META = {
    not_started: {
        label: 'Missing',
        color: 'text-red-300',
        bg:    'bg-red-500/10 border-red-500/30',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon:  <XCircle className="w-3.5 h-3.5 text-red-400" />,
    },
    untested: {
        label: 'Partially Done',
        color: 'text-yellow-300',
        bg:    'bg-yellow-500/10 border-yellow-500/30',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        icon:  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
    },
    complete: {
        label: 'Done',
        color: 'text-green-300',
        bg:    'bg-green-500/10 border-green-500/30',
        badge: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon:  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    },
    non_code_task: {
        label: 'Non-Code Task',
        color: 'text-slate-300',
        bg:    'bg-slate-500/10 border-slate-500/30',
        badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        icon:  <Ban className="w-3.5 h-3.5 text-slate-400" />,
    },
} as const;

function classifyJiraStatus(status: string): SprintTab {
    const s = status.toLowerCase();
    const doneWords     = ['done', 'closed', 'resolved', 'fixed', 'verified', 'complete', 'completed', "won't fix", 'duplicate', 'released'];
    const progressWords = ['progress', 'review', 'development', 'testing', 'active', 'started', 'doing'];
    if (doneWords.some(w => s.includes(w)))     return 'done';
    if (progressWords.some(w => s.includes(w))) return 'in_progress';
    return 'todo';
}

const SPRINT_TABS: { id: SprintTab; label: string; icon: React.ReactNode; emptyText: string }[] = [
    { id: 'todo',        label: 'To Do',      icon: <ListTodo className="w-3.5 h-3.5" />,   emptyText: 'No backlog tasks found.' },
    { id: 'in_progress', label: 'In Progress', icon: <PlayCircle className="w-3.5 h-3.5" />, emptyText: 'No tasks currently in progress.' },
    { id: 'done',        label: 'Completed',  icon: <CheckCheck className="w-3.5 h-3.5" />, emptyText: 'No completed tasks found.' },
];

// Syntax-highlight a code line with simple token colouring
function highlightLine(line: string): React.ReactNode {
    // Very lightweight: colour keywords, strings, comments
    const commentMatch = line.match(/^(\s*)(#.*)$/);
    if (commentMatch) {
        return <><span>{commentMatch[1]}</span><span className="text-slate-500 italic">{commentMatch[2]}</span></>;
    }
    return <span>{line}</span>;
}

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 900;
const DEFAULT_PANEL_WIDTH = 520;

const SIDEBAR_COLLAPSED_WIDTH = 48; // matches SettingsSidebar collapsed width

const CodePanel: React.FC<{
    preview: FilePreview;
    onClose: () => void;
}> = ({ preview, onClose }) => {
    const [width, setWidth]         = useState(DEFAULT_PANEL_WIDTH);
    const [sidebarSide, setSidebarSide] = useState<'left' | 'right'>(
        () => (localStorage.getItem('testmate_sidebar_position') as 'left' | 'right') || 'right'
    );
    const dragging                  = useRef(false);
    const startX                    = useRef(0);
    const startWidth                = useRef(0);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'testmate_sidebar_position' && (e.newValue === 'left' || e.newValue === 'right')) {
                setSidebarSide(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current  = true;
        startX.current    = e.clientX;
        startWidth.current = width;

        const onMove = (ev: MouseEvent) => {
            if (!dragging.current) return;
            const delta = startX.current - ev.clientX;
            setWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth.current + delta)));
        };
        const onUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const lines    = preview.content ? preview.content.split('\n') : [];
    const fileName = preview.path.split('/').pop() ?? preview.path;

    const rightOffset = sidebarSide === 'right' ? SIDEBAR_COLLAPSED_WIDTH : 0;

    return (
        <div
            style={{ width, minWidth: MIN_PANEL_WIDTH, maxWidth: MAX_PANEL_WIDTH, right: rightOffset }}
            className="fixed top-24 bottom-4 flex flex-col bg-[#0d1117] border border-white/10 rounded-tl-xl shadow-2xl z-40"
        >
            {/* Drag handle on left edge */}
            <div
                onMouseDown={onMouseDown}
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/40 transition-colors z-10 group rounded-tl-xl"
                title="Drag to resize"
            >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-white/10 group-hover:bg-purple-400/60 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center pl-5 pr-4 py-2.5 border-b border-white/10 bg-white/5 flex-shrink-0 rounded-tl-xl space-x-2">
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-300 border border-white/10 hover:border-red-500/40 transition-all"
                    title="Close preview"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center space-x-2 min-w-0">
                    <FileCode2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-blue-300 truncate" title={preview.path}>{fileName}</span>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="pl-5 pr-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                <p className="text-[10px] font-mono text-slate-600 truncate">{preview.path}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {preview.loading && (
                    <div className="flex items-center justify-center h-32 space-x-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Loading file…</span>
                    </div>
                )}
                {preview.error && (
                    <div className="p-4">
                        <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                            <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300">{preview.error}</p>
                        </div>
                    </div>
                )}
                {!preview.loading && !preview.error && preview.content !== null && (
                    <table className="w-full text-xs font-mono leading-5">
                        <tbody>
                            {lines.map((line, i) => (
                                <tr key={i} className="hover:bg-white/[0.03] group">
                                    <td className="select-none w-10 text-right pr-3 pl-2 text-slate-700 group-hover:text-slate-500 border-r border-white/5 sticky left-0 bg-[#0d1117]">
                                        {i + 1}
                                    </td>
                                    <td className="pl-4 pr-4 text-slate-300 whitespace-pre">
                                        {highlightLine(line)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const GapReport: React.FC<GapReportProps> = ({ repoOwner, repoName, onSkip, onSimulateResult }) => {
    const [loading,           setLoading]           = useState(false);
    const [error,             setError]             = useState<string | null>(null);
    const [gaps,              setGaps]              = useState<GapItem[]>([]);
    const [activeTab,         setActiveTab]         = useState<SprintTab>('in_progress');
    const [gapFilters,        setGapFilters]        = useState<Set<keyof typeof GAP_META>>(new Set());
    const [expanded,          setExpanded]          = useState<Set<string>>(new Set());
    const [simulating,        setSimulating]        = useState<string | null>(null);
    const [filePreview,       setFilePreview]       = useState<FilePreview | null>(null);
    const [editedSources,     setEditedSources]     = useState<Record<string, string[]>>({});
    const [allRepoFiles,      setAllRepoFiles]      = useState<string[]>([]);
    const [addingFileFor,     setAddingFileFor]     = useState<string | null>(null);
    const [fileSearchQuery,   setFileSearchQuery]   = useState<Record<string, string>>({});
    const [changingTypeFor,   setChangingTypeFor]   = useState<string | null>(null);

    // Compute stats live from gaps so manual overrides are reflected immediately
    const stats: GapStats | null = gaps.length === 0 ? null : (() => {
        const total = gaps.length;
        const count = (t: string) => gaps.filter(g => g.gap_type === t).length;
        const pct   = (n: number) => Math.round(n / total * 1000) / 10;
        const ns = count('not_started'), ut = count('untested'),
              cmp = count('complete'),   nct = count('non_code_task');
        return {
            total,
            not_started: ns,  not_started_pct:   pct(ns),
            untested:    ut,  untested_pct:       pct(ut),
            complete:    cmp, complete_pct:       pct(cmp),
            non_code_task: nct, non_code_task_pct: pct(nct),
        };
    })();

    useEffect(() => {
        runAnalysis();
        loadAllRepoFiles();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadAllRepoFiles = async () => {
        try {
            const token = authUtils.getToken();
            const files = await apiService.getRepoFlatFiles(repoOwner, repoName, token!);
            setAllRepoFiles(files);
        } catch {
            // non-critical — add source file search just won't work
        }
    };

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const data  = await apiService.analyzeGaps(repoOwner, repoName);
            setGaps(data.gaps);
            const grouped = { todo: 0, in_progress: 0, done: 0 };
            (data.gaps as GapItem[]).forEach(g => { grouped[classifyJiraStatus(g.status)]++; });
            const dominant = (Object.entries(grouped) as [SprintTab, number][])
                .sort((a, b) => b[1] - a[1])[0][0];
            setActiveTab(dominant);
        } catch (err: any) {
            const detail = err.response?.data?.detail || '';
            setError(detail || 'Gap analysis failed. Make sure Jira is connected and a project key (e.g. SCRUM) is set.');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const effectiveSourceFiles = (gap: GapItem): string[] =>
        editedSources[gap.task_key] ?? gap.source_files;

    const removeSourceFile = (taskKey: string, filePath: string, originalFiles: string[]) => {
        const current = editedSources[taskKey] ?? originalFiles;
        setEditedSources(prev => ({ ...prev, [taskKey]: current.filter(f => f !== filePath) }));
    };

    const addSourceFile = (taskKey: string, filePath: string, originalFiles: string[]) => {
        const current = editedSources[taskKey] ?? originalFiles;
        if (current.includes(filePath)) return;
        setEditedSources(prev => ({ ...prev, [taskKey]: [...current, filePath] }));
        setAddingFileFor(null);
        setFileSearchQuery(prev => ({ ...prev, [taskKey]: '' }));
    };

    const handleChangeGapType = async (taskKey: string, currentType: string, newType: string) => {
        if (currentType === newType) { setChangingTypeFor(null); return; }
        // Optimistic update
        setGaps(prev => prev.map(g =>
            g.task_key === taskKey ? { ...g, gap_type: newType as GapItem['gap_type'] } : g
        ));
        setChangingTypeFor(null);
        try {
            await apiService.updateGapType(taskKey, newType);
        } catch {
            // Revert on error
            setGaps(prev => prev.map(g =>
                g.task_key === taskKey ? { ...g, gap_type: currentType as GapItem['gap_type'] } : g
            ));
        }
    };

    const handleSimulateTests = async (gap: GapItem) => {
        setSimulating(gap.task_key);
        try {
            const res   = await apiService.simulateTests(
                gap.gap_type,
                gap.task_key,
                gap.summary,
                gap.acceptance_criteria || '',
                effectiveSourceFiles(gap),
                repoOwner,
                repoName,
            );
            onSimulateResult({ ...res, task_key: gap.task_key, task_summary: gap.summary });
        } catch (err: any) {
            onSimulateResult({
                verdict:      'ERROR',
                explanation:  err.response?.data?.detail || 'Simulation failed.',
                test_code:    '',
                task_key:     gap.task_key,
                task_summary: gap.summary,
            });
        } finally {
            setSimulating(null);
        }
    };

    const openFilePreview = useCallback(async (filePath: string) => {
        // If clicking the same file, close
        if (filePreview?.path === filePath && !filePreview.loading) {
            setFilePreview(null);
            return;
        }
        setFilePreview({ path: filePath, content: null, loading: true, error: null });
        try {
            const token = authUtils.getToken();
            const res   = await apiService.getFileContent(repoOwner, repoName, filePath, token!);
            setFilePreview({ path: filePath, content: res.content, loading: false, error: null });
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || 'Failed to load file';
            setFilePreview({ path: filePath, content: null, loading: false, error: msg });
        }
    }, [filePreview, repoOwner, repoName]);

    // ── Loading / error before results ───────────────────────────────────────
    if (!stats) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
                {loading && (
                    <>
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <p className="text-slate-400 text-sm">Running gap analysis for <span className="text-purple-300 font-medium">{repoName}</span>…</p>
                    </>
                )}
                {error && !loading && (
                    <>
                        <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 w-full">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-xs">{error}</p>
                        </div>
                        <button
                            onClick={runAnalysis}
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm transition-all"
                        >
                            <Wand2 className="w-4 h-4" /><span>Retry Analysis</span>
                        </button>
                    </>
                )}
            </div>
        );
    }

    const grouped: Record<SprintTab, GapItem[]> = { todo: [], in_progress: [], done: [] };
    gaps.forEach(g => grouped[classifyJiraStatus(g.status)].push(g));
    const tabGaps    = grouped[activeTab];
    const visibleGaps = gapFilters.size > 0 ? tabGaps.filter(g => gapFilters.has(g.gap_type)) : tabGaps;

    // ── Results ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full">
            {/* Gap list — full width, panel floats over it */}
            <div className="flex flex-col w-full pr-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Gap Report — {repoName}</h2>
                        <p className="text-slate-400 text-xs mt-0.5">{stats.total} Jira tasks analysed</p>
                    </div>
                    <button
                        onClick={onSkip}
                        className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                            background: 'linear-gradient(135deg, var(--theme-via), var(--theme-accent))',
                            color: '#fff',
                            boxShadow: '0 0 12px var(--theme-accent)55',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                        Continue to AI Chat →
                    </button>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {(['complete', 'untested', 'not_started', 'non_code_task'] as const).map(type => {
                        const m        = GAP_META[type];
                        const cnt      = stats[type] ?? 0;
                        const pct      = (stats[`${type}_pct` as keyof GapStats] as number) ?? 0;
                        const isActive = gapFilters.has(type);
                        const ALL_TYPES = ['complete', 'untested', 'not_started', 'non_code_task'] as const;
                        const toggleFilter = (t: keyof typeof GAP_META) => {
                            setGapFilters(prev => {
                                const next = new Set(prev);
                                next.has(t) ? next.delete(t) : next.add(t);
                                return next.size === ALL_TYPES.length ? new Set() : next;
                            });
                        };
                        return (
                            <button
                                key={type}
                                onClick={() => toggleFilter(type)}
                                className={`border rounded-xl p-4 text-left transition-all ${m.bg} ${
                                    isActive ? 'ring-2 ring-offset-1 ring-offset-transparent ring-white/30' : 'hover:brightness-125'
                                }`}
                            >
                                <div className="flex items-center space-x-2 mb-1">
                                    {m.icon}
                                    <span className={`text-xs font-semibold ${m.color}`}>{m.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{cnt}</p>
                                <p className="text-xs text-slate-500">{pct}% of tasks</p>
                            </button>
                        );
                    })}
                </div>

                {/* Sprint tabs */}
                <div className="flex space-x-1 bg-white/5 rounded-xl p-1 mb-4">
                    {SPRINT_TABS.map(tab => {
                        const count  = grouped[tab.id].length;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setGapFilters(new Set()); }}
                                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                    active ? 'bg-white/10 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    active ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-slate-600'
                                }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Gap list */}
                {visibleGaps.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                        {gapFilters.size > 0
                            ? `No ${[...gapFilters].map(f => `'${GAP_META[f].label}'`).join(' or ')} tasks in this tab.`
                            : SPRINT_TABS.find(t => t.id === activeTab)?.emptyText}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleGaps.map(gap => {
                            const m            = GAP_META[gap.gap_type];
                            const isExpanded   = expanded.has(gap.task_key);
                            const isSimulating = simulating === gap.task_key;

                            return (
                                <div
                                    key={gap.task_key}
                                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                                >
                                    <div className="flex items-center px-4 py-3">
                                        <button
                                            onClick={() => toggleExpand(gap.task_key)}
                                            className="flex-1 flex items-center space-x-3 hover:bg-white/5 transition-colors text-left min-w-0"
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                                : <ChevronRightIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                            }
                                            <span className="text-xs font-mono text-slate-500 flex-shrink-0">{gap.task_key}</span>
                                            <span className="text-sm text-white flex-1 truncate">{gap.summary}</span>
                                            <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:block">
                                                {gap.status}
                                            </span>
                                            <span className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${m.badge}`}>
                                                {m.icon}
                                                <span>{m.label}</span>
                                            </span>
                                        </button>
                                        {gap.gap_type === 'non_code_task' ? (
                                            <span className="ml-3 flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs font-medium cursor-not-allowed"
                                                title="No source code to simulate tests against">
                                                <Ban className="w-3 h-3" />
                                                <span>Not Applicable</span>
                                            </span>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSimulateTests(gap); }}
                                                disabled={isSimulating}
                                                className="ml-3 flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSimulating
                                                    ? <><Loader2 className="w-3 h-3 animate-spin" /><span>Simulating…</span></>
                                                    : <><FlaskConical className="w-3 h-3" /><span>Simulate Tests</span></>
                                                }
                                            </button>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-white/5">

                                            {/* ── Manual status override ── */}
                                            <div className="mt-3">
                                                <p className="text-xs text-slate-500 mb-2 font-medium">Change status</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(Object.keys(GAP_META) as Array<keyof typeof GAP_META>).map(type => {
                                                        const opt      = GAP_META[type];
                                                        const isCurrent = gap.gap_type === type;
                                                        const saving    = changingTypeFor === gap.task_key;
                                                        return (
                                                            <button
                                                                key={type}
                                                                disabled={saving}
                                                                onClick={() => handleChangeGapType(gap.task_key, gap.gap_type, type)}
                                                                className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                                                                    isCurrent
                                                                        ? `${opt.badge} ring-1 ring-offset-1 ring-offset-transparent font-semibold`
                                                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
                                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                            >
                                                                {opt.icon}
                                                                <span>{opt.label}</span>
                                                                {isCurrent && (
                                                                    <span className="ml-0.5 text-[10px] opacity-60">✓</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Source files */}
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1.5 font-medium mt-3">
                                                    Source files
                                                    <span className="ml-1.5 text-slate-600 font-normal">(click to preview)</span>
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {effectiveSourceFiles(gap).map(f => {
                                                        const isActive = filePreview?.path === f;
                                                        return (
                                                            <div key={f} className={`flex items-center space-x-1 text-xs font-mono px-2 py-1 rounded border transition-all group ${
                                                                isActive
                                                                    ? 'bg-blue-500/25 text-blue-200 border-blue-400/50 ring-1 ring-blue-400/30'
                                                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-400/40'
                                                            }`}>
                                                                <button onClick={() => openFilePreview(f)} className="flex items-center space-x-1.5">
                                                                    <FileCode2 className="w-3 h-3 flex-shrink-0" />
                                                                    <span>{f}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => removeSourceFile(gap.task_key, f, gap.source_files)}
                                                                    className="ml-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                                                                    title="Remove source file"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Add Source File button */}
                                                    {addingFileFor !== gap.task_key && (
                                                        <button
                                                            onClick={() => setAddingFileFor(gap.task_key)}
                                                            className="flex items-center space-x-1 text-xs px-2 py-1 rounded border border-dashed border-blue-500/30 text-blue-500 hover:border-blue-400 hover:text-blue-300 transition-all"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            <span>Add Source File</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* File search dropdown */}
                                                {addingFileFor === gap.task_key && (
                                                    <div className="mt-2 bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
                                                        <div className="flex items-center px-3 py-2 border-b border-white/10 space-x-2">
                                                            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                placeholder="Search files…"
                                                                value={fileSearchQuery[gap.task_key] ?? ''}
                                                                onChange={e => setFileSearchQuery(prev => ({ ...prev, [gap.task_key]: e.target.value }))}
                                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 outline-none"
                                                            />
                                                            <button
                                                                onClick={() => { setAddingFileFor(null); setFileSearchQuery(prev => ({ ...prev, [gap.task_key]: '' })); }}
                                                                className="text-slate-600 hover:text-slate-300 transition-colors"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto">
                                                            {allRepoFiles
                                                                .filter(f => {
                                                                    const q = (fileSearchQuery[gap.task_key] ?? '').toLowerCase();
                                                                    return f.toLowerCase().includes(q) && !effectiveSourceFiles(gap).includes(f);
                                                                })
                                                                .slice(0, 50)
                                                                .map(f => (
                                                                    <button
                                                                        key={f}
                                                                        onClick={() => addSourceFile(gap.task_key, f, gap.source_files)}
                                                                        className="w-full text-left flex items-center space-x-2 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-white/5 hover:text-blue-300 transition-colors"
                                                                    >
                                                                        <FileCode2 className="w-3 h-3 text-slate-600 flex-shrink-0" />
                                                                        <span className="truncate">{f}</span>
                                                                    </button>
                                                                ))
                                                            }
                                                            {allRepoFiles.length === 0 && (
                                                                <p className="text-xs text-slate-600 px-3 py-3">Loading repo files…</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Test files */}
                                            {gap.test_files.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1.5 font-medium">
                                                        Test files
                                                        <span className="ml-1.5 text-slate-600 font-normal">(click to preview)</span>
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {gap.test_files.map(f => {
                                                            const isActive = filePreview?.path === f;
                                                            return (
                                                                <button
                                                                    key={f}
                                                                    onClick={() => openFilePreview(f)}
                                                                    className={`flex items-center space-x-1.5 text-xs font-mono px-2 py-1 rounded border transition-all ${
                                                                        isActive
                                                                            ? 'bg-green-500/25 text-green-200 border-green-400/50 ring-1 ring-green-400/30'
                                                                            : 'bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20 hover:border-green-400/40'
                                                                    }`}
                                                                >
                                                                    <FileCode2 className="w-3 h-3 flex-shrink-0" />
                                                                    <span>{f}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating code preview panel */}
            {filePreview && (
                <CodePanel
                    preview={filePreview}
                    onClose={() => setFilePreview(null)}
                />
            )}
        </div>
    );
};

export default GapReport;
