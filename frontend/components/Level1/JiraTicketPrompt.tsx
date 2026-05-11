import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, ExternalLink, Loader2, CheckCircle2, AlertCircle,
    XCircle, Ticket,
} from 'lucide-react';
import { apiService } from '../../services/api';

// ── Preference helpers ────────────────────────────────────────────────────────

const PREF_KEY = 'testmate_jira_prompt_disabled';

export function isJiraPromptDisabled(): boolean {
    try { return localStorage.getItem(PREF_KEY) === 'true'; } catch { return false; }
}

function saveDisabledPref() {
    try { localStorage.setItem(PREF_KEY, 'true'); } catch {}
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls = (hasError = false) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
     focus:outline-none focus:ring-2 transition-shadow
     ${hasError
        ? 'border-red-400 focus:ring-red-300/40'
        : 'border-gray-300 focus:ring-purple-400/40 focus:border-purple-400'}`;

// ── Jira configuration step ───────────────────────────────────────────────────

interface SetupStepProps {
    onConfigured: () => void;
    onBack: () => void;
}

const SetupStep: React.FC<SetupStepProps> = ({ onConfigured, onBack }) => {
    const [instanceUrl, setInstanceUrl] = useState('');
    const [email, setEmail]             = useState('');
    const [apiToken, setApiToken]       = useState('');
    const [projectKey, setProjectKey]   = useState('');
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [touched, setTouched]         = useState({ instanceUrl: false, email: false, apiToken: false });

    const urlRef = useRef<HTMLInputElement>(null);
    useEffect(() => { urlRef.current?.focus(); }, []);

    const fieldError = {
        instanceUrl: touched.instanceUrl && !instanceUrl,
        email:       touched.email && !email,
        apiToken:    touched.apiToken && !apiToken,
    };

    const handleSave = async () => {
        setTouched({ instanceUrl: true, email: true, apiToken: true });
        if (!instanceUrl || !email || !apiToken) {
            setError('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await apiService.connectJira(instanceUrl.trim(), email.trim(), apiToken.trim(), projectKey.trim() || undefined);
            onConfigured();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Connection failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div>
                <h3 className="text-base font-semibold text-gray-900">Connect Jira</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Enter your Jira workspace details to start tracking automation tests.
                </p>
            </div>

            {/* ── Fields ── */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Workspace URL <span className="text-red-500">*</span>
                    </label>
                    <input
                        ref={urlRef}
                        type="url"
                        value={instanceUrl}
                        onChange={e => setInstanceUrl(e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, instanceUrl: true }))}
                        placeholder="https://yourcompany.atlassian.net"
                        className={inputCls(fieldError.instanceUrl)}
                    />
                    {fieldError.instanceUrl && (
                        <p className="mt-1 text-xs text-red-500">Workspace URL is required</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(p => ({ ...p, email: true }))}
                            placeholder="you@company.com"
                            className={inputCls(fieldError.email)}
                        />
                        {fieldError.email && (
                            <p className="mt-1 text-xs text-red-500">Email is required</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Project key
                        </label>
                        <input
                            type="text"
                            value={projectKey}
                            onChange={e => setProjectKey(e.target.value.toUpperCase())}
                            placeholder="e.g. PROJ"
                            className={inputCls()}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        API token <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        value={apiToken}
                        onChange={e => setApiToken(e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, apiToken: true }))}
                        placeholder="Paste your Atlassian API token"
                        className={inputCls(fieldError.apiToken)}
                    />
                    {fieldError.apiToken && (
                        <p className="mt-1 text-xs text-red-500">API token is required</p>
                    )}
                    <a
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                    >
                        Generate a token <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                    ) : (
                        'Save & Create Ticket'
                    )}
                </button>
            </div>
        </div>
    );
};

// ── Modal shell ───────────────────────────────────────────────────────────────

interface ModalShellProps {
    visible: boolean;
    onOverlayClick: () => void;
    children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ visible, onOverlayClick, children }) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200
                ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200
                    ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onOverlayClick}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl
                    transition-all duration-200
                    ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            >
                {children}
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

type ModalStep =
    | 'prompt'     // "Create Jira Ticket?" question
    | 'setup'      // Jira not configured → show form
    | 'creating'   // ticket API call in progress
    | 'success'    // ticket created → show link
    | 'error';     // API error

interface JiraTicketPromptProps {
    testDescription: string;
    generatedCode: string;
    onTicketCreated?: (ticketKey: string, ticketUrl: string) => void;
}

const JiraTicketPrompt: React.FC<JiraTicketPromptProps> = ({
    testDescription,
    generatedCode,
    onTicketCreated,
}) => {
    const [open, setOpen]             = useState(false);
    const [visible, setVisible]       = useState(false); // drives animation
    const [step, setStep]             = useState<ModalStep>('prompt');
    const [dontAsk, setDontAsk]       = useState(false);
    const [error, setError]           = useState<string | null>(null);
    const [ticketKey, setTicketKey]   = useState('');
    const [ticketUrl, setTicketUrl]   = useState('');
    const [jiraConfig, setJiraConfig] = useState<{ configured: boolean } | null>(null);
    const [mounted, setMounted]       = useState(false);

    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ticketTitle = (() => {
        const first = testDescription.split(/[.\n]/)[0].trim();
        return first.length > 80 ? first.slice(0, 77) + '…' : first || 'Automation Test';
    })();

    // Mount portal target
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    // Pre-fetch Jira config
    useEffect(() => {
        apiService.getLevel1JiraStatus()
            .then(cfg => setJiraConfig(cfg))
            .catch(() => setJiraConfig({ configured: false }));
    }, []);

    // Open after a brief delay so the code display settles first
    useEffect(() => {
        const t = setTimeout(() => openModal(), 600);
        return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Escape key handler
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) closeModal();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const openModal = () => {
        setOpen(true);
        // Slight delay so browser paints before starting opacity transition
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    };

    const closeModal = useCallback((dismissed = false) => {
        setVisible(false);
        if (dismissed && dontAsk) saveDisabledPref();
        closeTimerRef.current = setTimeout(() => setOpen(false), 200);
    }, [dontAsk]);

    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

    const handleNo = () => closeModal(true);
    const handleOverlayClick = () => {
        // Only close overlay on prompt or success/error steps — not mid-setup or mid-creation
        if (step === 'prompt' || step === 'success' || step === 'error') closeModal(false);
    };

    const handleYes = async () => {
        if (!jiraConfig?.configured) { setStep('setup'); return; }
        await createTicket();
    };

    const createTicket = async () => {
        setStep('creating');
        setError(null);
        try {
            const result = await apiService.createAutomationTicket({
                title: ticketTitle,
                manual_description: testDescription,
                generated_code: generatedCode,
            });
            setTicketKey(result.ticket_key);
            setTicketUrl(result.ticket_url);
            setStep('success');
            onTicketCreated?.(result.ticket_key, result.ticket_url);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to create ticket.');
            setStep('error');
        }
    };

    const handleSetupComplete = () => {
        apiService.getLevel1JiraStatus()
            .then(cfg => { setJiraConfig(cfg); })
            .catch(() => {})
            .finally(() => createTicket());
    };

    if (!mounted || !open) return null;

    const modalContent = (
        <ModalShell visible={visible} onOverlayClick={handleOverlayClick}>

            {/* ── Modal header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                        <Ticket className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">
                        {step === 'setup'    ? 'Connect Jira'         :
                         step === 'success'  ? 'Ticket Created!'      :
                         step === 'creating' ? 'Creating Ticket…'     :
                         step === 'error'    ? 'Something went wrong' :
                                              'Create Jira Ticket?'}
                    </h2>
                </div>

                {/* X is shown on all steps except mid-creation */}
                {step !== 'creating' && (
                    <button
                        onClick={() => closeModal(step === 'prompt')}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* ── Modal body ───────────────────────────────────────────── */}
            <div className="px-6 py-5">

                {/* ── prompt ── */}
                {step === 'prompt' && (
                    <div className="space-y-5">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Would you like to create a Jira ticket to track this automation test in your library?
                        </p>

                        {/* Ticket title preview */}
                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ticket title</p>
                            <p className="text-sm text-gray-800 font-medium leading-snug">{ticketTitle}</p>
                        </div>

                        {/* "Don't ask" checkbox */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                            <input
                                type="checkbox"
                                checked={dontAsk}
                                onChange={e => setDontAsk(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                                Don't ask me again
                            </span>
                        </label>
                    </div>
                )}

                {/* ── setup ── */}
                {step === 'setup' && (
                    <SetupStep
                        onConfigured={handleSetupComplete}
                        onBack={() => setStep('prompt')}
                    />
                )}

                {/* ── creating ── */}
                {step === 'creating' && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">Creating your Jira ticket…</p>
                            <p className="text-xs text-gray-500 mt-1">This usually takes just a moment.</p>
                        </div>
                    </div>
                )}

                {/* ── success ── */}
                {step === 'success' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                                <span className="font-mono text-purple-700">{ticketKey}</span> has been created
                            </p>
                            <p className="text-xs text-gray-500 mt-1 max-w-xs">{ticketTitle}</p>
                        </div>
                        <a
                            href={ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 transition-colors"
                        >
                            View in Jira <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                )}

                {/* ── error ── */}
                {step === 'error' && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3.5">
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Ticket creation failed</p>
                                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={createTicket}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modal footer (prompt + success + error only) ──────────── */}
            {step === 'prompt' && (
                <div className="flex gap-3 px-6 pb-6 pt-1">
                    <button
                        onClick={handleNo}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        No thanks
                    </button>
                    <button
                        onClick={handleYes}
                        disabled={jiraConfig === null}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {jiraConfig === null && <Loader2 className="w-4 h-4 animate-spin" />}
                        Yes, create ticket
                    </button>
                </div>
            )}

            {(step === 'success' || step === 'error') && (
                <div className="px-6 pb-6 pt-1">
                    <button
                        onClick={() => closeModal(false)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}

        </ModalShell>
    );

    return createPortal(modalContent, document.body);
};

export default JiraTicketPrompt;
