import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw, Settings2, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface JiraConnectProps {
    onConnected: (projectKey: string) => void;
    onSkip?:     () => void;
}

const JiraConnect: React.FC<JiraConnectProps> = ({ onConnected, onSkip }) => {
    const [instanceUrl,   setInstanceUrl]   = useState('');
    const [email,         setEmail]         = useState('');
    const [apiToken,      setApiToken]      = useState('');
    const [projectKey,    setProjectKey]    = useState('');
    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState<string | null>(null);
    const [connected,        setConnected]        = useState(false);
    const [connectedUser,    setConnectedUser]    = useState('');
    const [missingProjectKey, setMissingProjectKey] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = authUtils.getToken();
                if (!token) return;
                const status = await apiService.getJiraStatus(token);
                if (status.connected) {
                    setConnected(true);
                    setInstanceUrl(status.instance_url || '');
                    setEmail(status.email || '');
                    setProjectKey(status.project_key || '');
                    if (!status.project_key) setMissingProjectKey(true);
                }
            } catch { /* not connected yet */ }
        })();
    }, []);

    const normalizeUrl = (url: string): string => {
        const s = url.trim();
        if (!s) return s;
        try {
            const parsed = new URL(s.startsWith('http') ? s : `https://${s}`);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            return s;
        }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!instanceUrl.trim() || !email.trim() || !apiToken.trim()) {
            setError('Instance URL, email, and API token are required.');
            return;
        }
        if (!projectKey.trim()) {
            setError('Project key is required (e.g. SCRUM). Find it in your Jira project URL: yourcompany.atlassian.net/jira/software/projects/SCRUM/boards');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const token = authUtils.getToken();
            const res = await apiService.connectJira(
                normalizeUrl(instanceUrl),
                email.trim(),
                apiToken.trim(),
                projectKey.trim() || undefined,
                token!,
            );
            setConnected(true);
            setConnectedUser(res.jira_user || email);
            onConnected(res.project_key || projectKey);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to connect to Jira. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    if (connected && projectKey) {
        return (
            <div className="max-w-lg">
                {/* Connected status card */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-white font-semibold text-sm">Jira Connected</p>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    {connectedUser || email}
                                </p>
                            </div>
                        </div>
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg flex-shrink-0">
                            {projectKey}
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 mb-3">
                    <button
                        onClick={() => onConnected(projectKey)}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm transition-all"
                    >
                        Analyse Gaps →
                    </button>
                </div>

                {/* Change account / project options */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                    <p className="text-xs text-slate-500 px-4 py-2.5 border-b border-white/10 font-medium uppercase tracking-wide">
                        Change connection
                    </p>
                    <button
                        onClick={() => {
                            // Keep URL + email, just clear the project key so user can switch project
                            setProjectKey('');
                            setApiToken('');
                            setConnected(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/10"
                    >
                        <Settings2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-white">Switch project</p>
                            <p className="text-xs text-slate-500">Same account, different project key</p>
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            // Clear everything for a full re-auth
                            setInstanceUrl('');
                            setEmail('');
                            setApiToken('');
                            setProjectKey('');
                            setConnectedUser('');
                            setConnected(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                        <RefreshCw className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-white">Connect different account</p>
                            <p className="text-xs text-slate-500">Use a different Jira instance or email</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">
                    {connectedUser ? 'Change Jira Connection' : 'Connect Jira'}
                </h2>
                <p className="text-slate-400 text-sm">
                    {connectedUser
                        ? 'Enter new credentials or a different project key below.'
                        : 'Link your Jira Cloud project to detect implementation gaps in your repository.'}
                </p>
                <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    <span>Generate an Atlassian API token</span>
                </a>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
                {missingProjectKey && (
                    <div className="flex items-start space-x-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-300 text-xs">
                            Your previous connection is missing a project key. Re-enter your credentials and add your project key to continue.
                        </p>
                    </div>
                )}
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        Jira Instance URL
                    </label>
                    <input
                        type="url"
                        value={instanceUrl}
                        onChange={e => setInstanceUrl(e.target.value)}
                        placeholder="https://yourcompany.atlassian.net"
                        className="w-full bg-white/5 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        Atlassian Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-white/5 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        API Token
                    </label>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={e => setApiToken(e.target.value)}
                        placeholder="Your Atlassian API token"
                        className="w-full bg-white/5 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                        Project Key <span className="text-red-400">*</span> <span className="text-slate-600">(e.g. SCRUM — found in your Jira project URL)</span>
                    </label>
                    <input
                        type="text"
                        value={projectKey}
                        onChange={e => setProjectKey(e.target.value.toUpperCase())}
                        placeholder="PROJ"
                        className="w-full bg-white/5 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
                    />
                </div>

                {error && (
                    <div className="flex items-start space-x-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Connecting…</span></>
                    ) : (
                        <><Link2 className="w-4 h-4" /><span>Connect to Jira</span></>
                    )}
                </button>

                {onSkip && (
                    <button
                        type="button"
                        onClick={onSkip}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                    >
                        Skip for now — I'll add Jira later
                    </button>
                )}
            </form>
        </div>
    );
};

export default JiraConnect;
