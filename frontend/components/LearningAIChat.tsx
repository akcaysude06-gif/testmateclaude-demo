import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, X, Bot, User, Sparkles, Plus, Trash2, MessageSquare, Clock } from 'lucide-react';
import { authUtils } from '../utils/auth';

const API       = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORE_KEY = 'testmate_learning_chat_sessions';

const TESTMATE_SYSTEM_CONTEXT = `You are an AI assistant built into TestMate, a software testing learning and productivity platform.

## NAVIGATION — how the app works

The app is a single page. The user always sees this AI chat panel on the right side.

### Top-level structure
- **Home / Mode Selection screen**: Two cards — "Guided Learning" and "Production Mode". Click either card to enter that mode. The TestMate logo in the top-left navbar always navigates back to this screen from anywhere.

### Guided Learning mode
Entered by clicking "Guided Learning" on the Home screen.
- First lands on the **Level Selection screen**: two cards — "Level 0" and "Level 1". A "Back to modes" button (top-left) returns to the Home screen.
- Clicking a level card enters that level. Inside any level, a back arrow button (top-left, labelled "Back") returns to the Level Selection screen.

#### Level 0 — Manual Testing & Automation Fundamentals
- Shows a list of scenarios (Login Form, Dropdowns, Checkboxes, etc.).
- Each scenario is unlocked in order — complete the previous one to unlock the next.
- Clicking a scenario opens a 3-step flow: (1) Manual Test, (2) Why Automate?, (3) First Automation.
- Inside a scenario, a "Back to scenarios" button returns to the scenario list.

#### Level 1 — Introduction to Test Automation
- A 5-phase linear flow with a progress stepper at the top: Why Automation → The Tools → What Not to Automate → See It Live → Review & Practice.
- A back button (top-left) steps back through phases; on the first phase it returns to the Level Selection screen.

### Production Mode
Entered by clicking "Production Mode" on the Home screen.
- A 3-step wizard: (1) Connect Repository, (2) Select Scope, (3) Jira & Dashboard.
- A back arrow (top-left) steps back through wizard steps; on the first step it returns to the Home screen.
- Once a repo is connected the dashboard shows gap analysis and AI chat about the codebase.

## ANSWERING NAVIGATION QUESTIONS

Always give the exact button/action the user needs right now based on the page they are currently on (described in the "Current context" below). Never say the user must complete steps or unlock things to reach a different mode — modes are freely accessible from the Home screen at any time.

Examples:
- "How do I get to Production Mode?" from Level Selection → "Click the 'Back to modes' button (top-left), then click the 'Production Mode' card."
- "How do I get to Production Mode?" from Level 0 → "Click the 'Back' button (top-left) to return to Level Selection, then click 'Back to modes', then click 'Production Mode'."
- "How do I go back?" from inside a Level 0 scenario → "Click 'Back to scenarios' (top-left) to return to the scenario list."

## CONTENT KNOWLEDGE

- **Level 0** covers: manual testing, bug reporting, why automate, Selenium Python code reading.
- **Level 1** covers: automation motivation & ROI, tool landscape (Selenium, Playwright, Cypress, pytest, Appium), what not to automate, AI-generated Selenium code from plain English (Llama 3), code review quiz.
- **Production Mode** covers: GitHub repo connection, Jira integration, test coverage gap analysis, AI-simulated test execution, AI chat about the codebase.

Help the user with how to use TestMate, testing concepts, hints for exercises (without spoiling answers), and general software quality best practices.`.trim();

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface Message {
    id:      string;
    role:    'user' | 'assistant';
    content: string;
}

interface ChatSession {
    id:        string;
    title:     string;
    pageKey:   string;
    createdAt: number;
    messages:  Message[];
}

interface LearningAIChatProps {
    isOpen:              boolean;
    onToggle:            (open: boolean) => void;
    context:             string;
    pageKey:             string;
    injectedMessage?:    string | null;
    onInjectedHandled?:  () => void;
}

/* ── localStorage helpers ─────────────────────────────────────────────────── */

function loadPageSessions(pageKey: string): ChatSession[] {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        const all: ChatSession[] = raw ? JSON.parse(raw) : [];
        return all.filter(s => s.pageKey === pageKey);
    } catch { return []; }
}

function savePageSessions(pageKey: string, sessions: ChatSession[]) {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        const all: ChatSession[] = raw ? JSON.parse(raw) : [];
        const others = all.filter(s => s.pageKey !== pageKey);
        localStorage.setItem(STORE_KEY, JSON.stringify([...others, ...sessions]));
    } catch { /* quota */ }
}

function makeId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeTitle(text: string) {
    return text.length > 44 ? text.slice(0, 44) + '…' : text;
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

/* ── SSE streaming ────────────────────────────────────────────────────────── */

async function streamSSE(
    endpoint: string,
    body: object,
    onToken: (tok: string) => void,
    signal?: AbortSignal,
): Promise<void> {
    const token = authUtils.getToken();
    const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
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

/* ── Content renderer ─────────────────────────────────────────────────────── */

const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
        if (part.startsWith('```')) {
            const lines = part.split('\n');
            const lang  = lines[0].replace('```', '').trim();
            const code  = lines.slice(1, -1).join('\n');
            return (
                <div key={i} className="my-2">
                    {lang && <span className="text-xs text-slate-500 font-mono mb-1 block">{lang}</span>}
                    <pre className="bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed">
                        <code>{code}</code>
                    </pre>
                </div>
            );
        }
        return <span key={i} className="whitespace-pre-wrap text-sm leading-relaxed">{part}</span>;
    });
};

/* ── Component ────────────────────────────────────────────────────────────── */

const LearningAIChat: React.FC<LearningAIChatProps> = ({
    isOpen,
    onToggle,
    context,
    pageKey,
    injectedMessage,
    onInjectedHandled,
}) => {
    const [sessions,        setSessions]        = useState<ChatSession[]>(() => loadPageSessions(pageKey));
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [showHistory,     setShowHistory]     = useState(() => loadPageSessions(pageKey).length > 0);
    const [input,           setInput]           = useState('');
    const [streaming,       setStreaming]       = useState(false);
    const [width,           setWidth]           = useState(400);
    const prevSessionsLen   = useRef(sessions.length);

    const bottomRef   = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortRef    = useRef<AbortController | null>(null);
    const panelRef    = useRef<HTMLDivElement>(null);
    const isResizing  = useRef(false);

    // Reload sessions when pageKey changes (user navigates to a different page)
    useEffect(() => {
        const loaded = loadPageSessions(pageKey);
        setSessions(loaded);
        setActiveSessionId(null);
        setShowHistory(loaded.length > 0);
        setInput('');
        prevSessionsLen.current = loaded.length;
    }, [pageKey]);

    // Auto-open history sidebar when the very first session is created
    useEffect(() => {
        if (prevSessionsLen.current === 0 && sessions.length > 0) {
            setShowHistory(true);
        }
        prevSessionsLen.current = sessions.length;
    }, [sessions.length]);

    // Persist sessions whenever they change
    useEffect(() => {
        savePageSessions(pageKey, sessions);
    }, [sessions, pageKey]);

    // Derive active messages
    const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;
    const messages      = activeSession?.messages ?? [];

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Inject AI feedback (e.g. from Level 0 ManualStep evaluation)
    useEffect(() => {
        if (!injectedMessage) return;
        const msg: Message = { id: makeId(), role: 'assistant', content: injectedMessage };
        if (activeSessionId) {
            setSessions(prev => prev.map(s =>
                s.id === activeSessionId
                    ? { ...s, messages: [...s.messages, msg] }
                    : s,
            ));
        } else {
            const sid = makeId();
            setSessions(prev => [{
                id: sid, title: 'AI Feedback', pageKey,
                createdAt: Date.now(), messages: [msg],
            }, ...prev]);
            setActiveSessionId(sid);
        }
        onInjectedHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [injectedMessage]);

    // Drag-to-resize on the left edge
    const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor     = 'ew-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current || !panelRef.current) return;
            const right    = panelRef.current.getBoundingClientRect().right;
            const newWidth = Math.max(280, Math.min(right - ev.clientX, 720));
            setWidth(newWidth);
        };
        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor     = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup',   onMouseUp);
    }, []);

    /* ── Session management ────────────────────────────────────────────── */

    const startNewChat = () => {
        setActiveSessionId(null);
        setInput('');
    };

    const openSession = (session: ChatSession) => {
        setActiveSessionId(session.id);
    };

    const deleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) setActiveSessionId(null);
    };

    /* ── Send ──────────────────────────────────────────────────────────── */

    const sendMessage = async (prompt: string) => {
        if (!prompt.trim() || streaming) return;

        const userMsg: Message = { id: makeId(), role: 'user',      content: prompt.trim() };
        const aiId             = makeId();
        const aiMsg:  Message  = { id: aiId,     role: 'assistant', content: '' };

        let sid = activeSessionId;

        if (!sid) {
            sid = makeId();
            const newSession: ChatSession = {
                id: sid, title: makeTitle(prompt.trim()), pageKey,
                createdAt: Date.now(), messages: [userMsg, aiMsg],
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(sid);
        } else {
            setSessions(prev => prev.map(s =>
                s.id === sid ? { ...s, messages: [...s.messages, userMsg, aiMsg] } : s,
            ));
        }

        setInput('');
        setStreaming(true);

        const repoContext = `${TESTMATE_SYSTEM_CONTEXT}\n\nCurrent context:\n${context}`;
        abortRef.current  = new AbortController();

        try {
            await streamSSE(
                '/api/production/custom-prompt',
                { prompt: prompt.trim(), repo_context: repoContext },
                (tok) => {
                    setSessions(prev => prev.map(s =>
                        s.id === sid
                            ? { ...s, messages: s.messages.map(m =>
                                m.id === aiId ? { ...m, content: m.content + tok } : m) }
                            : s,
                    ));
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                },
                abortRef.current.signal,
            );
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                setSessions(prev => prev.map(s =>
                    s.id === sid
                        ? { ...s, messages: s.messages.map(m =>
                            m.id === aiId
                                ? { ...m, content: m.content || 'Something went wrong. Is the backend running?' }
                                : m) }
                        : s,
                ));
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };

    const stopGeneration = () => abortRef.current?.abort();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    };

    /* ── Collapsed tab ─────────────────────────────────────────────────── */

    if (!isOpen) {
        return (
            <div
                onClick={() => onToggle(true)}
                className="flex-shrink-0 cursor-pointer select-none"
                style={{ alignSelf: 'flex-start', paddingTop: '2.5rem', paddingRight: '1.5rem' }}
                title="Open AI Chat"
            >
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-purple-500/20 border border-purple-400/30 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all shadow-lg shadow-purple-900/30" style={{ width: 56, height: 56 }}>
                    <Sparkles className="w-5 h-5 text-purple-300" />
                    <span className="text-xs font-semibold text-purple-300/80 tracking-wide leading-none">AI</span>
                </div>
            </div>
        );
    }

    /* ── Expanded panel ────────────────────────────────────────────────── */

    return (
        <div
            ref={panelRef}
            className="flex-shrink-0 flex flex-col border-l border-white/10 bg-slate-900/60 overflow-hidden relative"
            style={{ width, height: '100%' }}
        >
            {/* Drag handle */}
            <div
                onMouseDown={onResizeMouseDown}
                className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize hover:bg-purple-500/50 active:bg-purple-500/70 transition-colors"
            />

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-semibold text-white">AI Chat</span>
                    {streaming && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
                </div>
                <div className="flex items-center space-x-1">
                    {/* History toggle — only shown when there are sessions */}
                    {sessions.length > 0 && (
                        <button
                            onClick={() => setShowHistory(h => !h)}
                            title={showHistory ? 'Hide history' : 'Show history'}
                            className={`p-1.5 rounded-lg transition-all ${
                                showHistory
                                    ? 'text-purple-300 bg-purple-500/20'
                                    : 'text-slate-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {/* New chat */}
                    <button
                        onClick={startNewChat}
                        title="New chat"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    {/* Close panel */}
                    <button
                        onClick={() => onToggle(false)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Body — history sidebar + chat side by side */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── History sidebar (left) ── */}
                {showHistory && (
                    <div className="flex flex-col border-r border-white/10 bg-slate-900/40 flex-shrink-0" style={{ width: 168 }}>
                        <div className="flex items-center justify-between px-2.5 py-2 border-b border-white/5 flex-shrink-0">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">History</span>
                            <button
                                onClick={() => setShowHistory(false)}
                                title="Close history"
                                className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/10 transition-all"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="scroll-subtle flex-1 overflow-y-auto py-1">
                            {sessions.map(session => {
                                const isActive = session.id === activeSessionId;
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => openSession(session)}
                                        className={`group relative mx-1 my-0.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                                            isActive
                                                ? 'bg-purple-500/20 border border-purple-500/30'
                                                : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <p className={`text-xs leading-snug truncate pr-5 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                            {session.title}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">{formatDate(session.createdAt)}</p>
                                        <button
                                            onClick={e => deleteSession(session.id, e)}
                                            className="absolute top-1.5 right-1.5 p-0.5 rounded text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-white/10 p-2 flex-shrink-0">
                            <button
                                onClick={startNewChat}
                                className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-all"
                            >
                                <Plus className="w-3 h-3" />
                                <span>New chat</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Chat area (right) ── */}
                <div className="flex flex-col flex-1 min-w-0">

                    {/* Messages */}
                    <div className="scroll-subtle flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 px-4">
                                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium mb-1">Ask me anything</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        I can help you use TestMate, explain testing concepts, or answer questions about the current exercise.
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            const isLastAI = msg.role === 'assistant' && idx === messages.length - 1;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        msg.role === 'user' ? 'bg-purple-500/30' : 'bg-slate-700'
                                    }`}>
                                        {msg.role === 'user'
                                            ? <User className="w-3 h-3 text-purple-300" />
                                            : <Bot  className="w-3 h-3 text-slate-300" />}
                                    </div>
                                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-purple-600/30 border border-purple-500/30 text-white'
                                            : 'bg-slate-800/60 border border-white/10 text-slate-200'
                                    }`}>
                                        {msg.content
                                            ? renderContent(msg.content)
                                            : <span className="text-slate-500 italic">Thinking…</span>}
                                        {streaming && isLastAI && (
                                            <span className="inline-block w-1.5 h-3.5 bg-purple-400 animate-pulse ml-0.5 rounded-sm align-middle" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-white/10 p-2.5 flex-shrink-0">
                        <div className="flex items-end space-x-2">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={streaming}
                                placeholder="Ask about TestMate or testing… (Enter to send)"
                                rows={2}
                                className="flex-1 bg-white/5 border border-white/20 focus:border-purple-400 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none resize-none disabled:opacity-50 transition-colors"
                            />
                            {streaming ? (
                                <button
                                    onClick={stopGeneration}
                                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 p-2 rounded-lg transition-all flex-shrink-0"
                                >
                                    <Square className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim()}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all flex-shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningAIChat;
