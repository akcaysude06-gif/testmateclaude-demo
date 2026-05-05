import React, { useState } from 'react';
import { Sparkles, Link2, XCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { apiService } from '../../services/api';

interface JiraSetupStepProps {
    onComplete: () => void;
}

const JiraSetupStep: React.FC<JiraSetupStepProps> = ({ onComplete }) => {
    const [instanceUrl, setInstanceUrl] = useState('');
    const [email,       setEmail]       = useState('');
    const [apiToken,    setApiToken]    = useState('');
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState<string | null>(null);

    const normalizeUrl = (url: string): string => {
        const s = url.trim();
        if (!s) return s;
        try {
            const parsed = new URL(s.startsWith('http') ? s : `https://${s}`);
            return `${parsed.protocol}//${parsed.host}`;
        } catch { return s; }
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!instanceUrl.trim() || !email.trim() || !apiToken.trim()) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiService.connectJira(
                normalizeUrl(instanceUrl),
                email.trim(),
                apiToken.trim(),
                undefined,
            );
            onComplete();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
                : typeof detail === 'string' ? detail : 'Failed to connect. Check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">Connect Jira</h2>
                        <p className="text-purple-200 text-sm">
                            Link your Jira account to detect implementation gaps.
                        </p>
                        <a
                            href="https://id.atlassian.com/manage-profile/security/api-tokens"
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-xs text-purple-300 hover:text-purple-200 mt-2 transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            <span>Generate an Atlassian API token</span>
                        </a>
                    </div>

                    <form onSubmit={handleConnect} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Jira Instance URL</label>
                            <input
                                type="url"
                                value={instanceUrl}
                                onChange={e => setInstanceUrl(e.target.value)}
                                placeholder="https://yourcompany.atlassian.net"
                                autoFocus
                                className="w-full bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Atlassian Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-slate-300 mb-1.5 font-medium">API Token</label>
                            <input
                                type="password"
                                value={apiToken}
                                onChange={e => setApiToken(e.target.value)}
                                placeholder="Your Atlassian API token"
                                className="w-full bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none transition-colors"
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
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Connecting…</span></>
                                : <><Link2 className="w-4 h-4" /><span>Connect Jira Account</span></>
                            }
                        </button>

                        <button
                            type="button"
                            onClick={onComplete}
                            className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-1"
                        >
                            Skip for now — I'll connect Jira later
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JiraSetupStep;
