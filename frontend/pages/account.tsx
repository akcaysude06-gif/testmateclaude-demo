import React, { useEffect, useState } from 'react';
import { User, Github, Trash2, Unlink, ExternalLink, FolderOpen, Database, Clock, Shield, ChevronDown, Plus, X, Link2, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';
import { loadSavedProjects, SavedProject } from '../components/Production/ConnectedProjectsPanel';
import Navbar from '../components/Layout/Navbar';

interface GithubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
}

const LS = {
    AUTO_DELETE_DAYS: 'testmate_privacy_auto_delete_days',
    SESSION_TIMEOUT:  'testmate_privacy_session_timeout',
    REMEMBER_ME:      'testmate_privacy_remember_me',
};

function Select({ value, onChange, options }: {
    value: string;
    onChange: (v: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg
                           px-3 py-2.5 text-sm text-white/80 pr-8
                           focus:outline-none focus:border-purple-400/50"
            >
                {options.map(o => (
                    <option key={o.value} value={o.value} className="bg-slate-900">{o.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${checked ? 'bg-purple-500' : 'bg-white/20'}`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
                            ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
}

export default function AccountPage() {
    const [user, setUser]             = useState<any>(null);
    const [projects, setProjects]     = useState<SavedProject[]>([]);
    const [repos, setRepos]           = useState<GithubRepo[]>([]);
    const [allRepos, setAllRepos]     = useState<GithubRepo[]>([]);
    const [showAddRepo, setShowAddRepo] = useState(false);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState<string | null>(null);
    const [confirming, setConfirming] = useState<'disconnect' | 'delete' | 'clear-data' | 'revoke-github' | 'disconnect-jira' | null>(null);
    const [jiraStatus, setJiraStatus] = useState<{ connected: boolean; email?: string; instance_url?: string; project_key?: string } | null>(null);
    const [jiraScopeToRemove, setJiraScopeToRemove] = useState<string | null>(null);
    const [confirmRemoveProject, setConfirmRemoveProject] = useState<string | null>(null);
    const [confirmRemoveRepo, setConfirmRemoveRepo] = useState<number | null>(null);

    // Privacy settings state (persisted in localStorage)
    const [autoDeleteDays, setAutoDeleteDays] = useState('never');
    const [sessionTimeoutValue, setSessionTimeoutValue] = useState('30');
    const [sessionTimeoutUnit, setSessionTimeoutUnit]   = useState<'minute' | 'hour' | 'day' | 'month' | 'year' | 'never'>('minute');
    const [sessionTimeoutManual, setSessionTimeoutManual] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        setAutoDeleteDays(localStorage.getItem(LS.AUTO_DELETE_DAYS) || 'never');
        const raw = localStorage.getItem(LS.SESSION_TIMEOUT) || '30:minute';
        const [val, unit] = raw.split(':');
        setSessionTimeoutValue(val || '30');
        setSessionTimeoutUnit((unit as any) || 'minute');
        setSessionTimeoutManual(localStorage.getItem('testmate_privacy_session_manual') === 'true');
        setRememberMe(localStorage.getItem(LS.REMEMBER_ME) === 'true');

        // Apply saved color theme so CSS variables are set on this standalone page
        const THEMES = [
            { id: 'lavender',   from: '#2e2440', via: '#4a3060', accent: '#c4b5fd' },
            { id: 'butter',     from: '#4a4520', via: '#7a6e30', accent: '#fde68a' },
            { id: 'pink',       from: '#2e1a28', via: '#5c3050', accent: '#fbc8e0' },
            { id: 'periwinkle', from: '#1a2235', via: '#1e3050', accent: '#a5b4fc' },
        ];
        const saved = localStorage.getItem('testmate_color_theme') || 'lavender';
        const theme = THEMES.find(t => t.id === saved) || THEMES[0];
        document.documentElement.style.setProperty('--theme-from',   theme.from);
        document.documentElement.style.setProperty('--theme-via',    theme.via);
        document.documentElement.style.setProperty('--theme-accent', theme.accent);
        document.body.setAttribute('data-theme', saved);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const userData = await apiService.getCurrentUser();
                setUser(userData);
                setProjects(loadSavedProjects());
                try {
                    const jira = await apiService.getJiraStatus();
                    setJiraStatus(jira);
                } catch { setJiraStatus({ connected: false }); }

                try {
                    const token = authUtils.getToken();
                    const data = await apiService.getUserRepositories(token!);
                    const all = Array.isArray(data.repositories) ? data.repositories : [];
                    setAllRepos(all);
                    // Start with all repos accessible by default
                    const saved = localStorage.getItem('testmate_accessible_repos');
                    if (saved) {
                        const savedIds: number[] = JSON.parse(saved);
                        setRepos(all.filter((r: GithubRepo) => savedIds.includes(r.id)));
                    } else {
                        setRepos(all);
                    }
                } catch {
                    setRepos([]);
                    setAllRepos([]);
                }
            } catch {
                setError('Could not load account information. Please log in again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const saveAutoDelete = (v: string) => {
        setAutoDeleteDays(v);
        localStorage.setItem(LS.AUTO_DELETE_DAYS, v);
    };
    const saveSessionTimeout = (val: string, unit: string) => {
        setSessionTimeoutValue(val);
        setSessionTimeoutUnit(unit as any);
        localStorage.setItem(LS.SESSION_TIMEOUT, `${val}:${unit}`);
    };
    const saveRememberMe = (v: boolean) => {
        setRememberMe(v);
        localStorage.setItem(LS.REMEMBER_ME, String(v));
    };

    const handleLogout = async () => {
        try { await apiService.logout(); } catch { /* ignore */ }
        authUtils.removeToken();
        window.location.href = '/';
    };

    const handleDisconnectGitHub = async () => {
        try { await apiService.logout(); } catch { /* ignore */ }
        authUtils.removeToken();
        window.location.href = '/';
    };

    const handleDeleteAccount = async () => {
        try { await (apiService as any).deleteAccount?.(); } catch { /* ignore */ }
        authUtils.removeToken();
        window.location.href = '/';
    };

    const handleClearTestData = () => {
        // Clear test-related localStorage keys
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('testmate_tests') || key.startsWith('testmate_log')) {
                localStorage.removeItem(key);
            }
        });
        setConfirming(null);
    };

    const handleRevokeGitHub = () => {
        handleDisconnectGitHub();
    };

    const handleDisconnectJira = async () => {
        try { await apiService.disconnectJira(); } catch { /* ignore */ }
        setJiraStatus({ connected: false });
        setConfirming(null);
    };

    const handleRemoveRepo = (id: number) => {
        setRepos(prev => {
            const updated = prev.filter(r => r.id !== id);
            localStorage.setItem('testmate_accessible_repos', JSON.stringify(updated.map(r => r.id)));
            return updated;
        });
    };

    const handleAddRepo = (repo: GithubRepo) => {
        setRepos(prev => {
            const updated = [...prev, repo];
            localStorage.setItem('testmate_accessible_repos', JSON.stringify(updated.map(r => r.id)));
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen"
                 style={{ background: 'linear-gradient(135deg, var(--theme-from), var(--theme-via), var(--theme-from))' }}>
                <Navbar onLogout={handleLogout} onLogoClick={() => { window.location.href = '/'; }} privacyMode />
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
                    <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent
                                    rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen"
                 style={{ background: 'linear-gradient(135deg, var(--theme-from), var(--theme-via), var(--theme-from))' }}>
                <Navbar onLogout={handleLogout} onLogoClick={() => { window.location.href = '/'; }} privacyMode />
                <div className="flex items-center justify-center text-white/60 text-sm" style={{ minHeight: 'calc(100vh - 64px)' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white"
             style={{ background: 'linear-gradient(135deg, var(--theme-from), var(--theme-via), var(--theme-from))' }}>
            <Navbar
                onLogout={handleLogout}
                user={user}
                onLogoClick={() => { window.location.href = '/'; }}
                onSettings={() => { window.location.href = '/account'; }}
                jiraStatus={jiraStatus}
                onConnectJira={() => { window.location.href = '/?connect_jira=1'; }}
                privacyMode
            />
        <div className="px-4 py-12">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-purple-500/30 border border-purple-400/30
                                    flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Account & Privacy</h1>
                        <p className="text-white/40 text-sm">Manage your data and connections</p>
                    </div>
                </div>

                {/* General info */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                        General Info
                    </h2>
                    <div className="flex items-center gap-3">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username}
                                 className="w-12 h-12 rounded-full border-2 border-purple-400/50" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-300" />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold">{user?.username || user?.name || '—'}</p>
                            <p className="text-white/40 text-sm">{user?.email || 'No email on record'}</p>
                        </div>
                        <a
                            href={`https://github.com/${user?.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white
                                       text-sm transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Connected projects */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                        Connected Projects
                    </h2>
                    {projects.length === 0 ? (
                        <p className="text-white/30 text-sm">No projects connected.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projects.map(p => (
                                <li key={p.id} className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="flex items-center gap-3 px-3 py-2.5">
                                        <FolderOpen className="w-4 h-4 text-white/40 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{p.repo.name}</p>
                                            <p className="text-xs text-white/30 truncate">{p.repo.full_name}</p>
                                        </div>
                                        {p.jira?.key && (
                                            <span className="text-xs text-white/30 font-mono">{p.jira.key}</span>
                                        )}
                                        {confirmRemoveProject === p.id ? (
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => {
                                                        const updated = projects.filter(x => x.id !== p.id);
                                                        setProjects(updated);
                                                        localStorage.setItem('testmate_connected_projects', JSON.stringify(updated));
                                                        window.dispatchEvent(new Event('connected-projects-changed'));
                                                        setConfirmRemoveProject(null);
                                                    }}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/20 border border-red-500/40
                                                               text-red-300 hover:bg-red-500/30 transition-all"
                                                >
                                                    Remove
                                                </button>
                                                <button
                                                    onClick={() => setConfirmRemoveProject(null)}
                                                    className="text-white/40 hover:text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmRemoveProject(p.id)}
                                                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                                                title="Disconnect project"
                                            >
                                                <Unlink className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── SECTION 1: Data & Storage ─────────────────────────────── */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-white/50" />
                        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                            Data &amp; Storage
                        </h2>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm text-white/70">Auto-delete test logs after</label>
                        <Select
                            value={autoDeleteDays}
                            onChange={saveAutoDelete}
                            options={[
                                { label: '7 days',  value: '7'     },
                                { label: '14 days', value: '14'    },
                                { label: '30 days', value: '30'    },
                                { label: '60 days', value: '60'    },
                                { label: 'Never',   value: 'never' },
                            ]}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/70">Clear all test data</label>
                        {confirming === 'clear-data' ? (
                            <div className="space-y-2">
                                <p className="text-white/50 text-xs">
                                    This will remove all locally stored test logs. This cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClearTestData}
                                        className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                                   border border-red-500/40 text-red-300 text-sm transition-all"
                                    >
                                        Clear data
                                    </button>
                                    <button
                                        onClick={() => setConfirming(null)}
                                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                                   border border-white/10 text-white/50 text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirming('clear-data')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                                           bg-white/5 border border-white/10 hover:bg-white/10
                                           hover:border-white/20 transition-all text-white/60
                                           hover:text-white text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear all test data
                            </button>
                        )}
                    </div>
                </div>

                {/* ── SECTION 2: Account & Session ──────────────────────────── */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/50" />
                        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                            Account &amp; Session
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-white/70">Session timeout duration</label>

                        {/* Preset dropdown */}
                        <Select
                            value={sessionTimeoutManual ? '__manual__' : `${sessionTimeoutValue}:${sessionTimeoutUnit}`}
                            onChange={v => {
                                if (sessionTimeoutManual) return;
                                const [val, unit] = v.split(':');
                                saveSessionTimeout(val, unit);
                            }}
                            options={[
                                { label: '15 minutes', value: '15:minute' },
                                { label: '30 minutes', value: '30:minute' },
                                { label: '1 hour',     value: '1:hour'    },
                                { label: '4 hours',    value: '4:hour'    },
                                { label: '1 day',      value: '1:day'     },
                                { label: '1 week',     value: '7:day'     },
                                { label: '1 month',    value: '1:month'   },
                                { label: 'Never',      value: 'never:never' },
                            ]}
                        />

                        {/* Type manually checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                            <input
                                type="checkbox"
                                checked={sessionTimeoutManual}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setSessionTimeoutManual(checked);
                                    localStorage.setItem('testmate_privacy_session_manual', String(checked));
                                    if (checked) {
                                        saveSessionTimeout('15', 'day');
                                    }
                                }}
                                className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 accent-purple-500 cursor-pointer"
                            />
                            <span className="text-xs text-white/40">Type manually</span>
                        </label>

                        {/* Manual entry — only visible when checkbox is checked */}
                        {sessionTimeoutManual && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={sessionTimeoutValue}
                                    onChange={e => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        saveSessionTimeout(v || '1', sessionTimeoutUnit);
                                    }}
                                    placeholder="30"
                                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5
                                               text-sm text-white/80 focus:outline-none focus:border-purple-400/50
                                               disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                                <div className="relative flex-1">
                                    <select
                                        value={sessionTimeoutUnit}
                                        onChange={e => saveSessionTimeout(sessionTimeoutValue, e.target.value)}
                                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg
                                                   px-3 py-2.5 text-sm text-white/80 pr-8
                                                   focus:outline-none focus:border-purple-400/50"
                                    >
                                        <option value="minute" className="bg-slate-900">Minute(s)</option>
                                        <option value="hour"   className="bg-slate-900">Hour(s)</option>
                                        <option value="day"    className="bg-slate-900">Day(s)</option>
                                        <option value="month"  className="bg-slate-900">Month(s)</option>
                                        <option value="year"   className="bg-slate-900">Year(s)</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4
                                                            text-white/40 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <div>
                            <p className="text-sm text-white/70">Remember me / auto-login</p>
                            <p className="text-xs text-white/30 mt-0.5">
                                Keep you logged in across browser sessions
                            </p>
                        </div>
                        <Toggle checked={rememberMe} onChange={saveRememberMe} />
                    </div>
                </div>

                {/* ── SECTION 3: GitHub Integration ─────────────────────────── */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-white/50" />
                        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                            GitHub Integration
                        </h2>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-white/70">Accessible repositories</p>
                            <button
                                onClick={() => setShowAddRepo(v => !v)}
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                                           bg-white/5 border border-white/10 hover:bg-white/10
                                           hover:border-white/20 text-white/50 hover:text-white transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Grant access to another repository
                            </button>
                        </div>

                        {repos.length === 0 ? (
                            <p className="text-white/30 text-sm">No repositories are currently accessible.</p>
                        ) : (
                            <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {repos.map(r => (
                                    <li key={r.id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg
                                                   bg-white/5 border border-white/10">
                                        <Github className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                        <span className="flex-1 text-sm text-white/80 truncate">{r.full_name}</span>
                                        {r.private && (
                                            <span className="text-xs text-white/30 border border-white/10
                                                             rounded px-1.5 py-0.5">private</span>
                                        )}
                                        {confirmRemoveRepo === r.id ? (
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => { handleRemoveRepo(r.id); setConfirmRemoveRepo(null); }}
                                                    className="text-xs px-2 py-1 rounded bg-red-500/20 border border-red-500/40
                                                               text-red-300 hover:bg-red-500/30 transition-all"
                                                >
                                                    Remove access
                                                </button>
                                                <button
                                                    onClick={() => setConfirmRemoveRepo(null)}
                                                    className="text-white/40 hover:text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmRemoveRepo(r.id)}
                                                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                                                           bg-white/5 border border-white/10 hover:bg-red-500/10
                                                           hover:border-red-500/30 text-white/40 hover:text-red-300
                                                           transition-all flex-shrink-0"
                                            >
                                                <Unlink className="w-3 h-3" />
                                                Remove access
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {showAddRepo && (() => {
                            const accessibleIds = new Set(repos.map(r => r.id));
                            const available = allRepos.filter(r => !accessibleIds.has(r.id));
                            return (
                                <div className="mt-2 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                                        <span className="text-xs text-white/50 font-semibold uppercase tracking-widest">
                                            Add repository access
                                        </span>
                                        <button onClick={() => setShowAddRepo(false)}
                                            className="text-white/30 hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {available.length === 0 ? (
                                        <p className="px-3 py-3 text-sm text-white/30">
                                            No other repositories found — all your repositories are already accessible.
                                        </p>
                                    ) : (
                                        <ul className="max-h-44 overflow-y-auto divide-y divide-white/5">
                                            {available.map(r => (
                                                <li key={r.id}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5
                                                               transition-colors">
                                                    <Github className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                                    <span className="flex-1 text-sm text-white/70 truncate">{r.full_name}</span>
                                                    {r.private && (
                                                        <span className="text-xs text-white/30 border border-white/10
                                                                         rounded px-1.5 py-0.5">private</span>
                                                    )}
                                                    <button
                                                        onClick={() => handleAddRepo(r)}
                                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded
                                                                   bg-purple-500/20 border border-purple-500/30
                                                                   text-purple-300 hover:bg-purple-500/30 transition-all
                                                                   flex-shrink-0"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="space-y-2 pt-1">
                        {confirming === 'revoke-github' ? (
                            <div className="space-y-2">
                                <p className="text-white/50 text-xs">
                                    This will revoke GitHub access and log you out.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRevokeGitHub}
                                        className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                                   border border-red-500/40 text-red-300 text-sm transition-all"
                                    >
                                        Revoke access
                                    </button>
                                    <button
                                        onClick={() => setConfirming(null)}
                                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                                   border border-white/10 text-white/50 text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirming('revoke-github')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                                           bg-white/5 border border-white/10 hover:bg-white/10
                                           hover:border-white/20 transition-all text-white/60
                                           hover:text-white text-sm"
                            >
                                <Shield className="w-4 h-4" />
                                Revoke GitHub access
                            </button>
                        )}
                    </div>
                </div>

                {/* ── SECTION 4: Jira Integration ───────────────────────────── */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-white/50" />
                        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                            Jira Integration
                        </h2>
                    </div>

                    {jiraStatus?.connected ? (
                        <>
                            {/* Connected account */}
                            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/80 font-medium truncate">{jiraStatus.email}</p>
                                </div>
                            </div>

                            {/* Connected Jira Spaces */}
                            {(() => {
                                const uniqueKeys = Array.from(
                                    new Map(
                                        projects.filter(p => p.jira?.key).map(p => [p.jira!.key, p])
                                    ).values()
                                );
                                return (
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                                        <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Connected Jira Spaces</p>
                                        {uniqueKeys.length === 0 ? (
                                            <p className="text-white/30 text-xs">No spaces connected.</p>
                                        ) : (
                                            <ul className="space-y-1.5">
                                                {uniqueKeys.map(p => {
                                                    const spaceUrl = jiraStatus.instance_url
                                                        ? `${jiraStatus.instance_url}/jira/software/projects/${p.jira!.key}/boards`
                                                        : null;
                                                    return (
                                                        <li key={p.jira!.key}
                                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                                            {spaceUrl ? (
                                                                <a
                                                                    href={spaceUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-1.5 text-sm font-mono text-purple-300 hover:text-purple-200 transition-colors"
                                                                >
                                                                    {p.jira!.key}
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-sm font-mono text-purple-300">{p.jira!.key}</span>
                                                            )}
                                                            {p.jira!.name && (
                                                                <span className="text-xs text-white/40 truncate">{p.jira!.name}</span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Connected Projects */}
                            {(() => {
                                const jiraProjects = projects.filter(p => p.jira?.key);
                                return (
                                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                                        <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Connected Projects</p>
                                        {jiraProjects.length === 0 ? (
                                            <p className="text-white/30 text-xs">No projects connected.</p>
                                        ) : (
                                            <ul className="space-y-1.5">
                                                {jiraProjects.map(p => (
                                                    <li key={p.id}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                                        <span className="text-xs font-mono text-purple-300/60 flex-shrink-0">{p.jira!.key}</span>
                                                        <span className="flex-1 text-sm text-white/70 truncate">{p.repo.name}</span>
                                                        {jiraScopeToRemove === p.id ? (
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = projects.map(x =>
                                                                            x.id === p.id ? { ...x, jira: undefined } : x
                                                                        );
                                                                        setProjects(updated);
                                                                        localStorage.setItem('testmate_connected_projects', JSON.stringify(updated));
                                                                        window.dispatchEvent(new Event('connected-projects-changed'));
                                                                        setJiraScopeToRemove(null);
                                                                    }}
                                                                    className="text-xs px-2 py-1 rounded bg-red-500/20 border border-red-500/40
                                                                               text-red-300 hover:bg-red-500/30 transition-all"
                                                                >
                                                                    Remove
                                                                </button>
                                                                <button
                                                                    onClick={() => setJiraScopeToRemove(null)}
                                                                    className="text-white/40 hover:text-white transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setJiraScopeToRemove(p.id)}
                                                                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                                                                title="Remove project"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Disconnect button */}
                            {confirming === 'disconnect-jira' ? (
                                <div className="space-y-2">
                                    <p className="text-white/50 text-xs">
                                        This will remove your Jira credentials from TestMate.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDisconnectJira}
                                            className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                                       border border-red-500/40 text-red-300 text-sm transition-all"
                                        >
                                            Disconnect
                                        </button>
                                        <button
                                            onClick={() => setConfirming(null)}
                                            className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                                       border border-white/10 text-white/50 text-sm transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirming('disconnect-jira')}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                                               bg-white/5 border border-white/10 hover:bg-white/10
                                               hover:border-white/20 transition-all text-white/60
                                               hover:text-white text-sm"
                                >
                                    <Unlink className="w-4 h-4" />
                                    Disconnect Jira account
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-white/30 text-sm">No Jira account connected.</p>
                            <button
                                onClick={() => window.location.href = '/?connect_jira=1'}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                                           bg-purple-500/10 border border-purple-500/30
                                           hover:bg-purple-500/20 hover:border-purple-500/50
                                           transition-all text-purple-300 hover:text-purple-200 text-sm"
                            >
                                <Link2 className="w-4 h-4" />
                                Connect Jira account
                            </button>
                        </div>
                    )}
                </div>

                {/* Danger zone */}
                <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5 space-y-3">
                    <h2 className="text-sm font-semibold text-red-400/80 uppercase tracking-widest">
                        Danger Zone
                    </h2>

                    {confirming === null && (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setConfirming('disconnect')}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg
                                           bg-white/5 border border-white/10 hover:bg-white/10
                                           hover:border-white/20 transition-all text-white/70
                                           hover:text-white text-sm"
                            >
                                <Github className="w-4 h-4" />
                                Disconnect GitHub
                            </button>
                            <button
                                onClick={() => setConfirming('delete')}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg
                                           bg-red-500/10 border border-red-500/20 hover:bg-red-500/20
                                           hover:border-red-500/40 transition-all text-red-400
                                           hover:text-red-300 text-sm"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    )}

                    {confirming === 'disconnect' && (
                        <div className="space-y-2">
                            <p className="text-white/60 text-sm">
                                This will log you out and revoke the GitHub connection.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDisconnectGitHub}
                                    className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20
                                               border border-white/20 text-sm transition-all"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setConfirming(null)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                               border border-white/10 text-white/50 text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {confirming === 'delete' && (
                        <div className="space-y-2">
                            <p className="text-red-300/80 text-sm">
                                This permanently deletes your account and all associated data.
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                                               border border-red-500/40 text-red-300 text-sm transition-all"
                                >
                                    Delete permanently
                                </button>
                                <button
                                    onClick={() => setConfirming(null)}
                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10
                                               border border-white/10 text-white/50 text-sm transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
        </div>
    );
}
