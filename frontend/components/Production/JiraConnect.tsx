import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, XCircle, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
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
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState<string | null>(null);
    const [connected,     setConnected]     = useState(false);
    const [connectedUser, setConnectedUser] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const status = await apiService.getJiraStatus();
                if (status.connected) {
                    setConnected(true);
                    setInstanceUrl(status.instance_url || '');
                    setEmail(status.email || '');
                    setConnectedUser(status.email || '');
                    setProjectKey(status.project_key || '');
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

    const handleConnectAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!instanceUrl.trim() || !email.trim() || !apiToken.trim()) {
            setError('Instance URL, email, and API token are required.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiService.connectJira(
                normalizeUrl(instanceUrl),
                email.trim(),
                apiToken.trim(),
                undefined,
            );
            setConnected(true);
            setConnectedUser(res.jira_user || email);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to connect to Jira. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectKey.trim()) {
            setError('Project key is required (e.g. SCRUM).');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await apiService.connectJira(
                normalizeUrl(instanceUrl),
                email.trim(),
                apiToken.trim(),
                projectKey.trim(),
            );
            onConnected(res.project_key || projectKey);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save project key.');
        } finally {
            setLoading(false);
        }
    };

    // ── Connected: show account status + select Jira space ───────────────────
    if (connected) {
        return (
            <div className="max-w-lg">
                {/* Account connected status */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 mb-6 flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                        <p className="text-white font-semibold text-sm">Jira Account Connected</p>
                        <p className="text-slate-400 text-xs mt-0.5">{connectedUser || email}</p>
                    </div>
                </div>

                {/* Select Jira space */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Select Jira Space</h2>
                    <p className="text-slate-400 text-sm">
                        Enter the project key for this repository.
                    </p>
                </div>

                <form onSubmit={handleSelectSpace} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                            Project Key <span className="text-red-400">*</span>{' '}
                            <span className="text-slate-600">(e.g. SCRUM — found in your Jira project URL)</span>
                        </label>
                        <input
                            type="text"
                            value={projectKey}
                            onChange={e => setProjectKey(e.target.value.toUpperCase())}
                            placeholder="PROJ"
                            autoFocus
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
                        disabled={loading || !projectKey.trim()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                        ) : (
                            <><span>Continue</span><ChevronRight className="w-4 h-4" /></>
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

                    <button
                        type="button"
                        onClick={() => { setConnected(false); setInstanceUrl(''); setEmail(''); setApiToken(''); setConnectedUser(''); setProjectKey(''); }}
                        className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
                    >
                        Connect a different Jira account
                    </button>
                </form>
            </div>
        );
    }

    // ── Not connected: connect Jira account ──────────────────────────────────
    return (
        <div className="max-w-lg">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">Connect Jira Account</h2>
                <p className="text-slate-400 text-sm">
                    Link your Jira Cloud account to detect implementation gaps in your repository.
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

            <form onSubmit={handleConnectAccount} className="space-y-4">
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
                        <><Link2 className="w-4 h-4" /><span>Connect Jira Account</span></>
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
