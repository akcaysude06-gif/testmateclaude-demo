import React, { useState } from 'react';
import {
    CheckCircle2, AlertTriangle, XCircle,
    ChevronDown, ChevronRight, Code2, Loader2, Wand2,
    ListTodo, PlayCircle, CheckCheck,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface GapItem {
    task_key:             string;
    summary:              string;
    status:               string;
    gap_type:             'not_started' | 'untested' | 'complete';
    keywords:             string[];
    source_files:         string[];
    test_files:           string[];
    acceptance_criteria?: string;
}

interface GapStats {
    total:           number;
    not_started:     number;
    not_started_pct: number;
    untested:        number;
    untested_pct:    number;
    complete:        number;
    complete_pct:    number;
}

interface GapReportProps {
    repoOwner: string;
    repoName:  string;
    onSkip:    () => void;
}

type SprintTab = 'todo' | 'in_progress' | 'done';

// Map gap_type to display labels
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
} as const;

// Classify a Jira status string into one of three sprint buckets
function classifyJiraStatus(status: string): SprintTab {
    const s = status.toLowerCase();
    const doneWords     = ['done', 'closed', 'resolved', 'fixed', 'verified', 'complete', 'completed', "won't fix", 'duplicate', 'released'];
    const progressWords = ['progress', 'review', 'development', 'testing', 'active', 'started', 'doing'];
    if (doneWords.some(w => s.includes(w)))     return 'done';
    if (progressWords.some(w => s.includes(w))) return 'in_progress';
    return 'todo';
}

const SPRINT_TABS: { id: SprintTab; label: string; icon: React.ReactNode; emptyText: string }[] = [
    { id: 'todo',        label: 'To Do',      icon: <ListTodo className="w-3.5 h-3.5" />,    emptyText: 'No backlog tasks found.' },
    { id: 'in_progress', label: 'In Progress', icon: <PlayCircle className="w-3.5 h-3.5" />,  emptyText: 'No tasks currently in progress.' },
    { id: 'done',        label: 'Completed',  icon: <CheckCheck className="w-3.5 h-3.5" />,  emptyText: 'No completed tasks found.' },
];

const GapReport: React.FC<GapReportProps> = ({ repoOwner, repoName, onSkip }) => {
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [stats,          setStats]          = useState<GapStats | null>(null);
    const [gaps,           setGaps]           = useState<GapItem[]>([]);
    const [activeTab,      setActiveTab]      = useState<SprintTab>('in_progress');
    const [expanded,       setExpanded]       = useState<Set<string>>(new Set());
    const [generating,     setGenerating]     = useState<string | null>(null);
    const [generatedTests, setGeneratedTests] = useState<Record<string, string>>({});

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = authUtils.getToken();
            const data  = await apiService.analyzeGaps(repoOwner, repoName, token!);
            setStats(data.stats);
            setGaps(data.gaps);
            // Default to whichever tab has the most tasks
            const grouped = { todo: 0, in_progress: 0, done: 0 };
            (data.gaps as GapItem[]).forEach(g => { grouped[classifyJiraStatus(g.status)]++; });
            const dominant = (Object.entries(grouped) as [SprintTab, number][])
                .sort((a, b) => b[1] - a[1])[0][0];
            setActiveTab(dominant);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Gap analysis failed. Make sure Jira is connected with a project key.');
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

    const handleGenerateTests = async (gap: GapItem) => {
        setGenerating(gap.task_key);
        try {
            const token = authUtils.getToken();
            const res   = await apiService.generateTestsForGap(
                gap.gap_type,
                gap.task_key,
                gap.summary,
                gap.acceptance_criteria || '',
                '',
                token!,
            );
            setGeneratedTests(prev => ({ ...prev, [gap.task_key]: res.code }));
        } catch (err: any) {
            setGeneratedTests(prev => ({
                ...prev,
                [gap.task_key]: `# Error: ${err.response?.data?.detail || 'Generation failed'}`,
            }));
        } finally {
            setGenerating(null);
        }
    };

    // ── Before analysis ───────────────────────────────────────────────────────
    if (!stats) {
        return (
            <div className="max-w-2xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-1">Gap Detection</h2>
                    <p className="text-slate-400 text-sm">
                        Compare your Jira tasks against{' '}
                        <span className="text-purple-300 font-medium">{repoName}</span>{' '}
                        to find implementation gaps.
                    </p>
                </div>

                {error && (
                    <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs">{error}</p>
                    </div>
                )}

                <div className="flex space-x-3">
                    <button
                        onClick={runAnalysis}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Analysing…</span></>
                            : <><Wand2 className="w-4 h-4" /><span>Analyse Gaps</span></>
                        }
                    </button>
                    <button
                        onClick={onSkip}
                        className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
                    >
                        Skip → AI Chat
                    </button>
                </div>
            </div>
        );
    }

    // Partition gaps by sprint status
    const grouped: Record<SprintTab, GapItem[]> = { todo: [], in_progress: [], done: [] };
    gaps.forEach(g => grouped[classifyJiraStatus(g.status)].push(g));

    const visibleGaps = grouped[activeTab];

    // ── Results ───────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-xl font-bold text-white">Gap Report — {repoName}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">{stats.total} Jira tasks analysed</p>
                </div>
                <button
                    onClick={onSkip}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold transition-all"
                >
                    Continue to AI Chat →
                </button>
            </div>

            {/* Implementation status cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {(['complete', 'untested', 'not_started'] as const).map(type => {
                    const m   = GAP_META[type];
                    const cnt = stats[type];
                    const pct = stats[`${type}_pct` as keyof GapStats] as number;
                    return (
                        <div key={type} className={`border rounded-xl p-4 ${m.bg}`}>
                            <div className="flex items-center space-x-2 mb-1">
                                {m.icon}
                                <span className={`text-xs font-semibold ${m.color}`}>{m.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{cnt}</p>
                            <p className="text-xs text-slate-500">{pct}% of tasks</p>
                        </div>
                    );
                })}
            </div>

            {/* Sprint status tabs */}
            <div className="flex space-x-1 bg-white/5 rounded-xl p-1 mb-4">
                {SPRINT_TABS.map(tab => {
                    const count = grouped[tab.id].length;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                active
                                    ? 'bg-white/10 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                active ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-slate-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Gap list for active tab */}
            {visibleGaps.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                    {SPRINT_TABS.find(t => t.id === activeTab)?.emptyText}
                </div>
            ) : (
                <div className="space-y-2">
                    {visibleGaps.map(gap => {
                        const m            = GAP_META[gap.gap_type];
                        const isExpanded   = expanded.has(gap.task_key);
                        const isGenerating = generating === gap.task_key;
                        const genCode      = generatedTests[gap.task_key];

                        return (
                            <div
                                key={gap.task_key}
                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleExpand(gap.task_key)}
                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                        : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    }
                                    <span className="text-xs font-mono text-slate-500 flex-shrink-0">{gap.task_key}</span>
                                    <span className="text-sm text-white flex-1 truncate">{gap.summary}</span>
                                    {/* Jira status pill */}
                                    <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:block">
                                        {gap.status}
                                    </span>
                                    {/* Implementation badge */}
                                    <span className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${m.badge}`}>
                                        {m.icon}
                                        <span>{m.label}</span>
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                                        {gap.source_files.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 font-medium mt-3">Source files</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {gap.source_files.map(f => (
                                                        <span key={f} className="text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {gap.test_files.length > 0 && (
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1 font-medium">Test files</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {gap.test_files.map(f => (
                                                        <span key={f} className="text-xs font-mono bg-green-500/10 text-green-300 border border-green-500/20 px-2 py-0.5 rounded">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {gap.gap_type !== 'complete' && (
                                            <button
                                                onClick={() => handleGenerateTests(gap)}
                                                disabled={isGenerating}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400 text-purple-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating
                                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating…</span></>
                                                    : <><Wand2 className="w-3.5 h-3.5" /><span>Generate Tests</span></>
                                                }
                                            </button>
                                        )}

                                        {genCode && (
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1.5">
                                                    <Code2 className="w-3.5 h-3.5 text-green-400" />
                                                    <span className="text-xs text-green-300 font-medium">Generated Tests</span>
                                                </div>
                                                <pre className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed max-h-80">
                                                    <code>{genCode}</code>
                                                </pre>
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
    );
};

export default GapReport;
