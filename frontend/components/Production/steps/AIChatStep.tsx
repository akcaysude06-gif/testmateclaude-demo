import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send, RotateCcw, Code2, FlaskConical, FolderTree, FileCode,
    TestTube, Wand2, Sparkles, Shield, Bug, GitMerge, ChevronRight,
    Bot, User, Square, Pencil, Check, X, Plus, Trash2, MessageSquare,
} from 'lucide-react';
import { SessionConfig } from '../Production';
import { authUtils } from '../../../utils/auth';

const API               = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const HISTORY_STORE_KEY = 'testmate_chat_sessions';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
    id:      string;
    role:    'user' | 'assistant';
    content: string;
}

interface ChatSession {
    id:        string;
    title:     string;
    repoName:  string;
    createdAt: number;
    messages:  Message[];
}

interface QuickAction {
    id:     string;
    label:  string;
    prompt: string;
    icon:   React.ReactNode;
    color:  string;
}

interface AIChatStepProps {
    config:   SessionConfig;
    onReset:  () => void;
    compact?: boolean;
}

/* ── Quick actions ───────────────────────────────────────────────────────── */

const APP_CODE_ACTIONS: QuickAction[] = [
    {
        id:     'stack',
        label:  'Detect Stack & Recommend Framework',
        prompt: 'Analyse the repository structure, dependencies, and language to detect the exact tech stack. Based on what you find, recommend the most suitable testing framework(s) — do not default to Selenium unless it genuinely fits. Explain why each recommendation fits this specific stack, and show a minimal working example using the recommended tool.',
        icon:   <TestTube className="w-4 h-4" />,
        color:  'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400',
    },
    {
        id:     'riskiest',
        label:  'Generate Tests for Riskiest Code',
        prompt: 'Identify the highest-complexity, highest-risk functions or modules in this repository — look for deep call chains, complex conditionals, async operations, external API calls, and database interactions. For the top 3 riskiest areas, write complete, runnable tests with proper mocking of external dependencies, meaningful assertions, and edge case coverage. Explain why each area is high risk.',
        icon:   <Sparkles className="w-4 h-4" />,
        color:  'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-400',
    },
    {
        id:     'untestable',
        label:  'Find Untestable Code',
        prompt: 'Scan the codebase for code that would be difficult or impossible to test as-is. Look for: tight coupling between components, hidden global state, hardcoded dependencies, missing dependency injection, functions that do too many things, and code that cannot be run in isolation. For each problem area, explain why it is hard to test and show a concrete refactoring that would make it testable — with before and after code examples.',
        icon:   <Shield className="w-4 h-4" />,
        color:  'from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-400',
    },
];

const TEST_CODE_ACTIONS: QuickAction[] = [
    {
        id:     'isolation',
        label:  'Audit Test Isolation',
        prompt: 'Audit the test suite for isolation problems. Look for: tests that share mutable state, tests that must run in a specific order to pass, tests that write to the filesystem or database without cleanup, tests that depend on previously run tests leaving data behind, and overly broad setup/teardown that couples unrelated tests. For each problem found, show the problematic code and a corrected version that is fully isolated.',
        icon:   <Bug className="w-4 h-4" />,
        color:  'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-400',
    },
    {
        id:     'selectors',
        label:  'Harden Selectors',
        prompt: 'Review every element locator in this test suite and identify brittle ones — selectors based on auto-generated class names, positional XPath like [1] or [2], index-based lookups, text that is likely to change, or implementation details like internal component class names. For each brittle locator found, explain why it will break and provide a robust replacement using data-testid attributes, ARIA roles, or stable semantic attributes. Show before and after for each fix.',
        icon:   <Wand2 className="w-4 h-4" />,
        color:  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-400',
    },
    {
        id:     'flaky',
        label:  'Identify Flaky Tests',
        prompt: 'Scan the test suite for patterns that cause flaky, intermittently failing tests. Look for: hardcoded time.sleep() or fixed waits, race conditions between async operations, tests that depend on network timing, animations or transitions not waited for, missing explicit waits before assertions, tests sensitive to system clock or timezone, and non-deterministic ordering in collections. For each flaky pattern found, show the exact code, explain when and why it fails, and provide a reliable fix.',
        icon:   <GitMerge className="w-4 h-4" />,
        color:  'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:border-pink-400',
    },
];

/* ── localStorage helpers ────────────────────────────────────────────────── */

function loadSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(HISTORY_STORE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveSessions(sessions: ChatSession[]) {
    try { localStorage.setItem(HISTORY_STORE_KEY, JSON.stringify(sessions)); } catch { /* quota */ }
}

function makeId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeTitle(text: string) {
    return text.length > 42 ? text.slice(0, 42) + '…' : text;
}

function formatDate(ts: number) {
    const d    = new Date(ts);
    const now  = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60_000)    return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (d.toDateString() === now.toDateString())
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ── SSE streaming helper ────────────────────────────────────────────────── */

async function streamSSE(
    endpoint: string,
    body: object,
    onToken: (tok: string) => void,
    signal?: AbortSignal,
): Promise<void> {
    const token = authUtils.getToken();
    const res = await fetch(`${API}${endpoint}`, {
        method:  'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body:   JSON.stringify(body),
        signal,
    });

    if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        onToken(`\n[Error: ${err.detail || 'Unknown error'}]`);
        return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buf     = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') return;
            try { onToken(JSON.parse(payload)); } catch { /* skip */ }
        }
    }
}

/* ── Context builder ─────────────────────────────────────────────────────── */

const buildContext = (config: SessionConfig): string => {
    const codeLabel  = config.codeType === 'application-code' ? 'application source code' : 'existing test code';
    const scopeLabel = config.scope === 'whole-project'
        ? 'the entire repository'
        : `${config.selectedFiles.length} specific file(s): ${config.selectedFiles.join(', ')}`;
    return [
        `Repository: ${config.repo.full_name}`,
        `Language: ${config.repo.language || 'unknown'}`,
        `Code type in session: ${codeLabel}`,
        `Scope: ${scopeLabel}`,
    ].join('\n');
};

/* ── Content renderer ────────────────────────────────────────────────────── */

const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
        if (part.startsWith('```')) {
            const lines = part.split('\n');
            const lang  = lines[0].replace('```', '').trim();
            const code  = lines.slice(1, -1).join('\n');
            return (
                <div key={i} className="my-3">
                    {lang && <span className="text-xs text-slate-500 font-mono mb-1 block">{lang}</span>}
                    <pre className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed">
                        <code>{code}</code>
                    </pre>
                </div>
            );
        }
        return (
            <span key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                {part}
            </span>
        );
    });
};

/* ── Component ───────────────────────────────────────────────────────────── */

const AIChatStep: React.FC<AIChatStepProps> = ({ config, onReset, compact = false }) => {
    // History (persisted to localStorage)
    const [sessions,        setSessions]        = useState<ChatSession[]>(() => loadSessions());
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    // Active chat
    const [messages,  setMessages]  = useState<Message[]>([]);
    const [input,     setInput]     = useState('');
    const [streaming, setStreaming] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState('');

    const bottomRef   = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editRef     = useRef<HTMLTextAreaElement>(null);
    const abortRef    = useRef<AbortController | null>(null);

    const actions = config.codeType === 'application-code' ? APP_CODE_ACTIONS : TEST_CODE_ACTIONS;

    // Persist whenever sessions change
    useEffect(() => { saveSessions(sessions); }, [sessions]);

    // Auto-scroll
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Focus edit box
    useEffect(() => { if (editingId) editRef.current?.focus(); }, [editingId]);

    /* ── Session helpers ─────────────────────────────────────────────── */

    const flushCurrentSession = useCallback((msgs: Message[]) => {
        if (activeSessionId && msgs.length > 0) {
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId ? { ...s, messages: msgs } : s,
            ));
        }
    }, [activeSessionId]);

    const createNewSession = () => {
        flushCurrentSession(messages);
        setActiveSessionId(null);
        setMessages([]);
        setInput('');
        setEditingId(null);
    };

    const loadSession = (session: ChatSession) => {
        flushCurrentSession(messages);
        setActiveSessionId(session.id);
        setMessages(session.messages);
        setEditingId(null);
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            setActiveSessionId(null);
            setMessages([]);
        }
    };

    /* ── Core send ───────────────────────────────────────────────────── */

    const sendMessage = async (prompt: string, priorMsgs?: Message[]) => {
        if (!prompt.trim() || streaming) return;

        const base     = priorMsgs ?? messages;
        const userMsg: Message = { id: makeId(), role: 'user',      content: prompt.trim() };
        const aiId             = makeId();
        const aiMsg: Message   = { id: aiId,     role: 'assistant', content: '' };
        const nextMsgs         = [...base, userMsg, aiMsg];

        setMessages(nextMsgs);
        setInput('');
        setStreaming(true);

        // Create a new history entry on first message of this session
        let sessionId = activeSessionId;
        if (!sessionId) {
            sessionId = makeId();
            const newSession: ChatSession = {
                id:        sessionId,
                title:     makeTitle(prompt.trim()),
                repoName:  config.repo.name,
                createdAt: Date.now(),
                messages:  nextMsgs,
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(sessionId);
        }

        abortRef.current = new AbortController();
        let finalMsgs    = nextMsgs;

        try {
            await streamSSE(
                '/api/production/custom-prompt',
                { prompt: prompt.trim(), repo_context: buildContext(config) },
                (tok) => {
                    setMessages(prev => {
                        const updated = prev.map(m =>
                            m.id === aiId ? { ...m, content: m.content + tok } : m,
                        );
                        finalMsgs = updated;
                        return updated;
                    });
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                },
                abortRef.current.signal,
            );
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setMessages(prev => {
                    const updated = prev.map(m =>
                        m.id === aiId
                            ? { ...m, content: m.content || 'Something went wrong. Is the backend running?' }
                            : m,
                    );
                    finalMsgs = updated;
                    return updated;
                });
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
            // Persist completed messages into the session
            if (sessionId) {
                setSessions(prev => prev.map(s =>
                    s.id === sessionId ? { ...s, messages: finalMsgs } : s,
                ));
            }
        }
    };

    /* ── Stop / edit ─────────────────────────────────────────────────── */

    const stopGeneration = () => abortRef.current?.abort();

    const startEdit = (msg: Message) => {
        if (streaming) stopGeneration();
        setEditingId(msg.id);
        setEditDraft(msg.content);
    };

    const cancelEdit = () => { setEditingId(null); setEditDraft(''); };

    const confirmEdit = async () => {
        if (!editingId || !editDraft.trim()) return;
        const idx = messages.findIndex(m => m.id === editingId);
        if (idx === -1) return;
        const historyBefore = messages.slice(0, idx);
        setEditingId(null);
        setEditDraft('');
        await sendMessage(editDraft.trim(), historyBefore);
    };

    /* ── Keyboard ────────────────────────────────────────────────────── */

    const handleMainKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit(); }
        if (e.key === 'Escape') cancelEdit();
    };

    const isEmpty = messages.length === 0;

    /* ── Render ──────────────────────────────────────────────────────── */

    return (
        <div className="flex gap-3" style={{ height: compact ? '100%' : 'calc(100vh - 155px)', minHeight: compact ? 0 : 500 }}>

            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            {!compact && <div className="w-56 flex-shrink-0 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History</span>
                    <button
                        onClick={createNewSession}
                        title="New chat"
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Session list */}
                <div className="scroll-subtle flex-1 overflow-y-auto py-1">
                    {sessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-3 py-8">
                            <MessageSquare className="w-6 h-6 text-slate-700 mb-2" />
                            <p className="text-xs text-slate-600">No history yet</p>
                        </div>
                    )}

                    {sessions.map(session => {
                        const isActive = session.id === activeSessionId;
                        return (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session)}
                                className={`group relative mx-1 my-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                    isActive
                                        ? 'bg-purple-500/20 border border-purple-500/30'
                                        : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <p className="text-xs text-purple-400 font-medium truncate mb-0.5">
                                    {session.repoName}
                                </p>
                                <p className={`text-xs leading-snug truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                    {session.title}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                    {formatDate(session.createdAt)}
                                </p>
                                <button
                                    onClick={(e) => deleteSession(session.id, e)}
                                    className="absolute top-2 right-2 p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-400/15 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>}

            {/* ── MAIN CHAT ────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Session info bar */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                            <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-300 font-medium">{config.repo.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <div className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 border text-xs font-medium ${
                            config.codeType === 'application-code'
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}>
                            {config.codeType === 'application-code'
                                ? <Code2       className="w-3.5 h-3.5" />
                                : <FlaskConical className="w-3.5 h-3.5" />}
                            <span>{config.codeType === 'application-code' ? 'App Code' : 'Test Code'}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <div className="flex items-center space-x-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                            <FileCode className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-300">
                                {config.scope === 'whole-project'
                                    ? 'Whole project'
                                    : `${config.selectedFiles.length} file${config.selectedFiles.length !== 1 ? 's' : ''}`}
                            </span>
                        </div>
                        {streaming && (
                            <div className="flex items-center space-x-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                <span className="text-xs text-purple-300">Generating…</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onReset}
                        className="flex items-center space-x-1.5 text-slate-500 hover:text-white text-xs transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>New session</span>
                    </button>
                </div>

                {/* Chat panel */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden min-h-0">

                    {/* Message list */}
                    <div className="scroll-subtle flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Empty state */}
                        {isEmpty && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <Bot className="w-7 h-7 text-purple-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-1">Ready to help</h3>
                                <p className="text-slate-400 text-sm mb-8 max-w-xs">
                                    Ask anything about your {config.codeType === 'application-code' ? 'application code' : 'tests'}, or pick a quick action below
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                                    {actions.map(action => (
                                        <button
                                            key={action.id}
                                            onClick={() => sendMessage(action.prompt)}
                                            className={`flex items-center space-x-2 p-3.5 rounded-xl border bg-gradient-to-br text-left transition-all ${action.color}`}
                                        >
                                            <span className="text-slate-300 flex-shrink-0">{action.icon}</span>
                                            <span className="text-xs font-medium text-white leading-snug">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg, idx) => {
                            const isLastAI      = msg.role === 'assistant' && idx === messages.length - 1;
                            const isBeingEdited = editingId === msg.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start space-x-3 group ${
                                        msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        msg.role === 'user' ? 'bg-purple-500/30' : 'bg-slate-700'
                                    }`}>
                                        {msg.role === 'user'
                                            ? <User className="w-4 h-4 text-purple-300" />
                                            : <Bot  className="w-4 h-4 text-slate-300" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'flex flex-col items-end gap-1' : ''}`}>

                                        {/* User — normal */}
                                        {msg.role === 'user' && !isBeingEdited && (
                                            <>
                                                <div className="rounded-2xl px-4 py-3 bg-purple-600/30 border border-purple-500/30 text-white text-sm whitespace-pre-wrap">
                                                    {msg.content}
                                                </div>
                                                <button
                                                    onClick={() => startEdit(msg)}
                                                    className="flex items-center space-x-1 text-xs text-slate-600 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Pencil className="w-3 h-3" /><span>Edit</span>
                                                </button>
                                            </>
                                        )}

                                        {/* User — edit mode */}
                                        {msg.role === 'user' && isBeingEdited && (
                                            <div className="w-full min-w-[260px]">
                                                <textarea
                                                    ref={editRef}
                                                    value={editDraft}
                                                    onChange={e => setEditDraft(e.target.value)}
                                                    onKeyDown={handleEditKeyDown}
                                                    rows={3}
                                                    className="w-full bg-slate-800 border border-purple-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none"
                                                />
                                                <div className="flex items-center justify-end space-x-2 mt-1.5">
                                                    <button onClick={cancelEdit} className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                        <X className="w-3 h-3" /><span>Cancel</span>
                                                    </button>
                                                    <button onClick={confirmEdit} disabled={!editDraft.trim()} className="flex items-center space-x-1 text-xs text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors">
                                                        <Check className="w-3 h-3" /><span>Send</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Assistant */}
                                        {msg.role === 'assistant' && (
                                            <div className="rounded-2xl px-4 py-3 bg-slate-800/60 border border-white/10 text-slate-200">
                                                {msg.content
                                                    ? renderContent(msg.content)
                                                    : <span className="text-slate-500 text-xs italic">Thinking…</span>}
                                                {streaming && isLastAI && (
                                                    <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-0.5 rounded-sm align-middle" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={bottomRef} />
                    </div>

                    {/* Quick-action strip */}
                    {!isEmpty && (
                        <div className="border-t border-white/5 px-4 py-2 flex items-center space-x-2 overflow-x-auto flex-shrink-0">
                            {actions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => sendMessage(action.prompt)}
                                    disabled={streaming}
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {action.icon}<span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-white/10 p-4 flex-shrink-0">
                        <div className="flex items-end space-x-3">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleMainKeyDown}
                                disabled={streaming}
                                placeholder="Ask about your code, request specific tests… (Enter to send, Shift+Enter for new line)"
                                rows={2}
                                className="flex-1 bg-white/5 border border-white/20 focus:border-purple-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none resize-none disabled:opacity-50 transition-colors"
                            />
                            {streaming ? (
                                <button onClick={stopGeneration} title="Stop generation" className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 p-3 rounded-xl transition-all flex-shrink-0">
                                    <Square className="w-5 h-5" />
                                </button>
                            ) : (
                                <button onClick={() => sendMessage(input)} disabled={!input.trim()} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all flex-shrink-0">
                                    <Send className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">
                            Context: <span className="text-slate-500">{config.repo.full_name} · {config.codeType === 'application-code' ? 'App code' : 'Test code'} · {config.scope === 'whole-project' ? 'Whole project' : `${config.selectedFiles.length} files`}</span>
                            {' '}· <span className="text-slate-600">Hover a message to edit it</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatStep;