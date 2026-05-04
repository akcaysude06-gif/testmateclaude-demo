import React, { useState } from 'react';
import { Sparkles, Link2, CheckCircle, XCircle, Loader2, ExternalLink, AlertTriangle, Settings, ArrowRight } from 'lucide-react';
import { apiService } from '../../services/api';

type Phase = 'connect' | 'permissions' | 'skipped';

interface JiraSetupStepProps {
    onComplete: () => void;
}

const JiraSetupStep: React.FC<JiraSetupStepProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<Phase>('connect');

    const [instanceUrl, setInstanceUrl] = useState('');
    const [email, setEmail] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [projectKey, setProjectKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedUser, setConnectedUser] = useState('');
    const [connectedProjectKey, setConnectedProjectKey] = useState('');

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
            setConnectedUser(res.jira_user || email);
            setConnectedProjectKey(res.project_key || projectKey);
            setPhase('permissions');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to connect to Jira. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        {phase === 'connect' && (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-1">Connect Jira Account</h2>
                                <p className="text-purple-200 text-sm">
                                    Link your Jira project to detect implementation gaps in your repository.
                                </p>
                            </>
                        )}
                        {phase === 'permissions' && (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-1">Jira Access</h2>
                                <p className="text-purple-200 text-sm">
                                    Choose how TestMate can access your Jira spaces and tasks.
                                </p>
                            </>
                        )}
                        {phase === 'skipped' && (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-1">No problem!</h2>
                                <p className="text-purple-200 text-sm">
                                    You can connect Jira anytime from Settings.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Connect phase */}
                    {phase === 'connect' && (
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-300 mb-1.5 font-medium">Jira Instance URL</label>
                                <input
                                    type="url"
                                    value={instanceUrl}
                                    onChange={e => setInstanceUrl(e.target.value)}
                                    placeholder="https://yourcompany.atlassian.net"
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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs text-slate-300 font-medium">API Token</label>
                                    <a
                                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center space-x-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>Generate token</span>
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    value={apiToken}
                                    onChange={e => setApiToken(e.target.value)}
                                    placeholder="Your Atlassian API token"
                                    className="w-full bg-white/10 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-300 mb-1.5 font-medium">
                                    Project Key <span className="text-red-400">*</span>{' '}
                                    <span className="text-white/30">(e.g. SCRUM)</span>
                                </label>
                                <input
                                    type="text"
                                    value={projectKey}
                                    onChange={e => setProjectKey(e.target.value.toUpperCase())}
                                    placeholder="PROJ"
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
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Connecting…</span></>
                                ) : (
                                    <><Link2 className="w-4 h-4" /><span>Connect to Jira</span></>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={onComplete}
                                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-1"
                            >
                                Skip for now — I'll connect Jira later
                            </button>
                        </form>
                    )}

                    {/* Permissions phase */}
                    {phase === 'permissions' && (
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Jira Connected</p>
                                    <p className="text-white/50 text-xs mt-0.5">
                                        {connectedUser} · {connectedProjectKey}
                                    </p>
                                </div>
                            </div>

                            <p className="text-white/70 text-sm text-center">
                                Allow TestMate to access your Jira spaces and tasks?
                            </p>

                            <button
                                onClick={onComplete}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>Allow access to all spaces and tasks</span>
                            </button>

                            <button
                                onClick={() => setPhase('skipped')}
                                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white/80 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Allow later in Settings</span>
                            </button>
                        </div>
                    )}

                    {/* Skipped phase */}
                    {phase === 'skipped' && (
                        <div className="space-y-5">
                            <div className="bg-white/5 border border-white/20 rounded-2xl p-4 flex items-start space-x-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <p className="text-white/70 text-sm">
                                    Jira access permissions were not granted. You can enable access to spaces and tasks anytime from <span className="text-purple-300 font-medium">Settings → Jira</span>.
                                </p>
                            </div>

                            <button
                                onClick={onComplete}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                <span>Continue to Dashboard</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JiraSetupStep;
