import React, { useState, useEffect } from 'react';
import {
    GitBranch, Link2, Globe, Lock,
    RefreshCw, AlertCircle, FolderOpen, Zap, BarChart3,
} from 'lucide-react';
import { Repository } from './Production';
import { SavedProject, upsertSavedProject } from './ConnectedProjectsPanel';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';
import GapReport from './GapReport';
import JiraConnect from './JiraConnect';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectDashboardProps {
    activeProject:    SavedProject | null;
    onSelectRepo:     (repo: Repository) => void;
    onJiraConnected:  (projectId: string, key: string, name: string) => void;
    onSimulateResult: (result: any) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
    JavaScript: 'bg-yellow-400', TypeScript: 'bg-blue-400',
    Python:     'bg-green-400',  Java:       'bg-red-400',
    'C++':      'bg-pink-400',   Go:         'bg-cyan-400',
    Rust:       'bg-orange-400', Ruby:       'bg-red-500',
    PHP:        'bg-purple-400',
};
function langColor(lang: string | null) { return lang ? (LANGUAGE_COLORS[lang] ?? 'bg-slate-400') : 'bg-slate-600'; }
function formatDate(d: string) {
    const diff = Math.ceil((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
}

// ── Repo picker (shown when no project) ──────────────────────────────────────

const RepoPickerView: React.FC<{ onSelect: (repo: Repository) => void }> = ({ onSelect }) => {
    const [repos,   setRepos]   = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState<string | null>(null);

    const fetchRepos = async () => {
        setLoading(true); setError(null);
        try {
            const token = authUtils.getToken();
            const data  = await apiService.getUserRepositories(token!);
            setRepos(data.repositories);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load repositories.');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchRepos(); }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                        <FolderOpen className="w-6 h-6 text-purple-400" />
                        <span>Connect a Project</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Choose a GitHub repository to get started</p>
                </div>
                <button onClick={fetchRepos} disabled={loading} className="flex items-center space-x-2 text-purple-300 hover:text-white text-sm transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-purple-300">Loading repositories…</p>
                </div>
            )}
            {error && !loading && (
                <div className="flex flex-col items-center justify-center flex-1">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <p className="text-red-300 mb-4 text-center">{error}</p>
                    <button onClick={fetchRepos} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-xl transition-colors text-sm">Try Again</button>
                </div>
            )}
            {!loading && !error && repos.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1">
                    <GitBranch className="w-12 h-12 text-purple-400 mb-4 opacity-50" />
                    <p className="text-purple-300">No repositories found</p>
                    <p className="text-slate-500 text-sm mt-1">Create a repository on GitHub to get started</p>
                </div>
            )}
            {!loading && !error && repos.length > 0 && (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {repos.map(repo => (
                        <button
                            key={repo.id}
                            onClick={() => onSelect(repo)}
                            className="text-left p-5 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <GitBranch className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <h3 className="font-semibold text-white truncate text-sm">{repo.name}</h3>
                                </div>
                                {repo.private
                                    ? <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-2" />
                                    : <Globe className="w-3.5 h-3.5 text-green-400 flex-shrink-0 ml-2" />}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{repo.description || 'No description'}</p>
                            <div className="flex items-center justify-between">
                                {repo.language ? (
                                    <div className="flex items-center space-x-1.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${langColor(repo.language)}`} />
                                        <span className="text-xs text-slate-400">{repo.language}</span>
                                    </div>
                                ) : <span />}
                                <span className="text-xs text-slate-500">{formatDate(repo.updated_at)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Project header ────────────────────────────────────────────────────────────

const ProjectHeader: React.FC<{
    project:       SavedProject;
    jiraConnected: boolean;
    onConnectJira: () => void;
}> = ({ project, jiraConnected, onConnectJira }) => (
    <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-purple-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white leading-tight">{project.repo.name}</h2>
                <p className="text-xs text-slate-500">{project.repo.full_name}</p>
            </div>
            {project.repo.language && (
                <div className="flex items-center space-x-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${langColor(project.repo.language)}`} />
                    <span className="text-xs text-slate-400">{project.repo.language}</span>
                </div>
            )}
            {jiraConnected && project.jira && (
                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300">
                    {project.jira.key}
                </span>
            )}
        </div>
        {!jiraConnected && (
            <button
                onClick={onConnectJira}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-400/60 text-purple-300 hover:text-white text-sm font-medium transition-all"
            >
                <Link2 className="w-4 h-4" />
                <span>Connect Jira</span>
            </button>
        )}
    </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
    activeProject,
    onSelectRepo,
    onJiraConnected,
    onSimulateResult,
}) => {
    const [showJiraConnect,    setShowJiraConnect]    = useState(false);
    const [jiraVerified,       setJiraVerified]       = useState<boolean | null>(null);
    const [jiraVerifyError,    setJiraVerifyError]    = useState<string | null>(null);

    useEffect(() => {
        setShowJiraConnect(false);
        setJiraVerified(null);
        setJiraVerifyError(null);
    }, [activeProject?.id]);

    // When local state says Jira is connected, verify with the backend
    useEffect(() => {
        if (!activeProject?.jira) return;
        setJiraVerified(null);
        setJiraVerifyError(null);
        (async () => {
            try {
                const token = authUtils.getToken();
                const status = await apiService.getJiraStatus(token!);
                if (status.connected && status.project_key) {
                    setJiraVerified(true);
                } else {
                    setJiraVerified(false);
                    setJiraVerifyError(
                        status.connected && !status.project_key
                            ? 'Jira is connected but missing a project key. Please reconnect.'
                            : 'Jira connection not found on server. Please reconnect.'
                    );
                }
            } catch {
                setJiraVerified(false);
                setJiraVerifyError('Could not verify Jira connection. Please reconnect.');
            }
        })();
    }, [activeProject?.id, activeProject?.jira]);

    // No project → repo picker
    if (!activeProject) {
        return <RepoPickerView onSelect={onSelectRepo} />;
    }

    const jiraConnected       = !!activeProject.jira;
    const [owner, repoName]   = activeProject.repo.full_name.split('/');

    // Jira connect inline flow
    if (showJiraConnect) {
        return (
            <div>
                <ProjectHeader project={activeProject} jiraConnected={false} onConnectJira={() => {}} />
                <JiraConnect
                    onConnected={(key) => {
                        upsertSavedProject({ ...activeProject, jira: { key, name: key, avatar_url: null } });
                        onJiraConnected(activeProject.id, key, key);
                        setShowJiraConnect(false);
                        setJiraVerified(true);
                        setJiraVerifyError(null);
                    }}
                    onSkip={() => setShowJiraConnect(false)}
                />
            </div>
        );
    }

    // Jira connected locally but failed backend verification → show reconnect prompt
    if (jiraConnected && jiraVerified === false) {
        return (
            <div>
                <ProjectHeader project={activeProject} jiraConnected={false} onConnectJira={() => setShowJiraConnect(true)} />
                <div className="mt-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 flex flex-col items-start space-y-3">
                    <p className="text-yellow-300 text-sm font-medium">{jiraVerifyError}</p>
                    <button
                        onClick={() => setShowJiraConnect(true)}
                        className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-white text-sm font-medium transition-all"
                    >
                        Reconnect Jira
                    </button>
                </div>
            </div>
        );
    }

    // Jira connected → full gap report (show while verifying or after verified)
    if (jiraConnected && (jiraVerified === true || jiraVerified === null)) {
        return (
            <div>
                <ProjectHeader project={activeProject} jiraConnected onConnectJira={() => {}} />
                <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-white">Gap Analysis</span>
                    <span className="text-xs text-slate-500">— {repoName} × {activeProject.jira!.key}</span>
                </div>
                <GapReport repoOwner={owner} repoName={repoName} onSkip={() => {}} onSimulateResult={onSimulateResult} />
            </div>
        );
    }

    // No Jira → CTA card
    return (
        <div>
            <ProjectHeader project={activeProject} jiraConnected={false} onConnectJira={() => setShowJiraConnect(true)} />

            {/* Connect Jira CTA */}
            <div className="mt-4 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                    <BarChart3 className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Connect Jira for Gap Analysis</h3>
                <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                    Link a Jira project to automatically detect which tasks have missing or incomplete test coverage in <span className="text-purple-300 font-medium">{repoName}</span>.
                </p>
                <button
                    onClick={() => setShowJiraConnect(true)}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm transition-all"
                >
                    <Link2 className="w-4 h-4" />
                    <span>Connect Jira</span>
                </button>
                <p className="text-slate-600 text-xs mt-4">
                    You can still use AI Chat without Jira — click the button in the top bar.
                </p>
            </div>
        </div>
    );
};

export default ProjectDashboard;
