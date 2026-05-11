import React, { useState, useEffect, useCallback } from 'react';
import {
    ExternalLink, RefreshCw, Loader2, BookOpen, AlertCircle,
    ChevronRight, Filter, Ticket,
} from 'lucide-react';
import { apiService, type AutomationLibraryEntry } from '../../services/api';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    'To Do':       'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'In Progress': 'bg-blue-500/20  text-blue-300  border-blue-500/30',
    'In Review':   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Done':        'bg-green-500/20 text-green-300  border-green-500/30',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cls = STATUS_STYLES[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
            {status}
        </span>
    );
};

// ── Ticket card ───────────────────────────────────────────────────────────────

const TicketCard: React.FC<{ entry: AutomationLibraryEntry }> = ({ entry }) => {
    const date = new Date(entry.created_at).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    });

    return (
        <div className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-white/20 transition-all">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    <Ticket className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-purple-300 font-semibold flex-shrink-0">
                            {entry.ticket_key}
                        </span>
                        <StatusBadge status={entry.jira_status} />
                    </div>
                    <p className="text-sm text-white font-medium leading-snug mb-1.5 line-clamp-2">
                        {entry.title}
                    </p>
                    <p className="text-xs text-slate-500">{date}</p>
                </div>
                <a
                    href={entry.ticket_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-purple-300"
                    title="Open in Jira"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
};

// ── Filter bar ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['All', 'To Do', 'In Progress', 'In Review', 'Done'];

// ── Main component ────────────────────────────────────────────────────────────

interface AutomationLibraryProps {
    /** Called when user wants to go back to generate view */
    onBack: () => void;
    /** Incremented externally to trigger a refresh after a new ticket is created */
    refreshTrigger?: number;
}

const AutomationLibrary: React.FC<AutomationLibraryProps> = ({ onBack, refreshTrigger = 0 }) => {
    const [entries, setEntries]       = useState<AutomationLibraryEntry[]>([]);
    const [loading, setLoading]       = useState(true);
    const [syncing, setSyncing]       = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [activeFilter, setFilter]   = useState('All');

    const fetchLibrary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getAutomationLibrary();
            setEntries(data.entries);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to load library.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLibrary(); }, [fetchLibrary, refreshTrigger]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const result = await apiService.syncLibraryStatuses();
            // Merge updated statuses into local state
            setEntries(prev => prev.map(e => {
                const updated = result.entries.find(u => u.id === e.id);
                return updated ? { ...e, jira_status: updated.jira_status } : e;
            }));
        } catch {
            // silent — not critical
        } finally {
            setSyncing(false);
        }
    };

    const filtered = activeFilter === 'All'
        ? entries
        : entries.filter(e => e.jira_status === activeFilter);

    const countByStatus = STATUS_FILTERS.slice(1).reduce<Record<string, number>>((acc, s) => {
        acc[s] = entries.filter(e => e.jira_status === s).length;
        return acc;
    }, {});

    return (
        <div>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
                        Automation Library
                    </p>
                    <h2 className="text-xl font-light text-white">Your Jira test tickets</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {loading ? '…' : `${entries.length} test${entries.length !== 1 ? 's' : ''} converted to automation`}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleSync}
                        disabled={syncing || loading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        Sync status
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-xs text-purple-300 transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        Generate code
                    </button>
                </div>
            </div>

            {/* ── Stats strip ──────────────────────────────────────────────── */}
            {!loading && entries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {Object.entries(countByStatus).map(([status, count]) => (
                        <div
                            key={status}
                            onClick={() => setFilter(activeFilter === status ? 'All' : status)}
                            className={`rounded-xl border p-3 cursor-pointer transition-all ${
                                activeFilter === status
                                    ? 'border-purple-500/40 bg-purple-500/10'
                                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                            }`}
                        >
                            <p className="text-2xl font-light text-white">{count}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{status}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filter tabs ───────────────────────────────────────────────── */}
            {!loading && entries.length > 0 && (
                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                    <Filter className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mr-1" />
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                                activeFilter === f
                                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                                    : 'bg-white/5 text-slate-400 border border-white/8 hover:bg-white/10 hover:text-slate-200'
                            }`}
                        >
                            {f}
                            {f !== 'All' && countByStatus[f] > 0 && (
                                <span className="ml-1.5 text-slate-500">{countByStatus[f]}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Content ───────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex items-center gap-3 py-12 justify-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading your library…</span>
                </div>
            ) : error ? (
                <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-red-300 font-medium">Failed to load library</p>
                        <p className="text-xs text-red-400 mt-0.5">{error}</p>
                        <button
                            onClick={fetchLibrary}
                            className="mt-2 text-xs text-red-300 underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-white font-medium mb-1">No tickets yet</p>
                    <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                        Generate Selenium code and create a Jira ticket to start building your automation library.
                    </p>
                    <button
                        onClick={onBack}
                        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-sm text-purple-300 transition-colors"
                    >
                        Generate your first test
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-slate-500 text-sm">
                        No tickets with status <strong className="text-slate-400">{activeFilter}</strong>.
                    </p>
                    <button onClick={() => setFilter('All')} className="mt-2 text-xs text-purple-400 hover:text-purple-300">
                        Show all
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map(entry => (
                        <TicketCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutomationLibrary;
