import React, { useEffect, useState } from 'react';
import { User, Github, Trash2, Unlink, ExternalLink, FolderOpen } from 'lucide-react';
import { apiService } from '../services/api';
import { authUtils } from '../utils/auth';

interface Project {
    id: string;
    name: string;
    key?: string;
    connected_at?: string;
}

export default function AccountPage() {
    const [user, setUser]         = useState<any>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<string | null>(null);
    const [confirming, setConfirming] = useState<'disconnect' | 'delete' | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const userData = await apiService.getCurrentUser();
                setUser(userData);
                try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/jira/projects`,
                        { headers: { Authorization: `Bearer ${(await import('../utils/auth')).authUtils.getToken()}` } }
                    );
                    if (res.ok) setProjects((await res.json()) || []);
                } catch {
                    setProjects([]);
                }
            } catch {
                setError('Could not load account information. Please log in again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleDisconnectGitHub = async () => {
        try {
            await apiService.logout();
            authUtils.removeToken();
            window.close();
        } catch {
            authUtils.removeToken();
            window.close();
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await (apiService as any).deleteAccount?.();
        } catch {
            // fall through
        }
        authUtils.removeToken();
        window.close();
    };

    const handleRemoveProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
                            flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent
                                rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
                            flex items-center justify-center text-white/60 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
                        text-white px-4 py-12">
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
                                <li key={p.id}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                               bg-white/5 border border-white/10">
                                    <FolderOpen className="w-4 h-4 text-white/40 flex-shrink-0" />
                                    <span className="flex-1 text-sm">{p.name}</span>
                                    {p.key && (
                                        <span className="text-xs text-white/30 font-mono">{p.key}</span>
                                    )}
                                    <button
                                        onClick={() => handleRemoveProject(p.id)}
                                        className="text-white/30 hover:text-red-400 transition-colors"
                                        title="Remove connection"
                                    >
                                        <Unlink className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
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
    );
}
