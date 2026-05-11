import React, { useState, useCallback } from 'react';
import { CheckCircle, Circle, ChevronLeft, Trophy, AlertCircle, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestStep {
    id: string;
    instruction: string;
    input?: string;
    expected: string;
    hint?: string;
}

interface LabScenario {
    id: string;
    title: string;
    description: string;
    steps: TestStep[];
    renderEnv: (props: EnvProps) => React.ReactNode;
}

interface EnvProps {
    completedSteps: Set<string>;
    onStepComplete: (stepId: string) => void;
}

// ─── Interactive Environments ─────────────────────────────────────────────────

// --- Login Form Validation ---
const LoginFormEnv: React.FC<EnvProps> = ({ completedSteps, onStepComplete }) => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
    const [success, setSuccess]   = useState(false);

    const validate = useCallback(() => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email && !password) {
            newErrors.email    = 'Email is required';
            newErrors.password = 'Password is required';
            onStepComplete('step-empty');
        } else if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
            onStepComplete('step-bad-email');
        } else if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
            onStepComplete('step-short-pw');
        } else if (email === 'test@example.com' && password === 'Password123') {
            setSuccess(true);
            setErrors({});
            onStepComplete('step-success');
            return;
        } else {
            newErrors.password = 'Invalid email or password';
        }

        setErrors(newErrors);
        setSuccess(false);
    }, [email, password, onStepComplete]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        validate();
    };

    const handleReset = () => {
        setEmail('');
        setPassword('');
        setErrors({});
        setSuccess(false);
        setSubmitted(false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl mb-3">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Sign In</h2>
                    <p className="text-slate-400 text-sm mt-1">Test the validation rules</p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 font-semibold text-lg">Login Successful!</p>
                        <p className="text-slate-400 text-sm mt-2">Welcome back, test@example.com</p>
                        <button onClick={handleReset} className="mt-4 text-sm text-slate-400 hover:text-white transition-colors underline">
                            Reset form
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors text-sm ${
                                    errors.email ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors text-sm ${
                                    errors.password ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'
                                }`}
                            />
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 font-medium text-sm transition-colors mt-2"
                        >
                            Sign In
                        </button>

                        {submitted && !success && !errors.email && !errors.password && (
                            <p className="text-center text-xs text-slate-500">Fill in the form above to test validation.</p>
                        )}
                    </form>
                )}

                <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Valid credentials</p>
                    <p className="text-xs text-slate-400 font-mono">Email: test@example.com</p>
                    <p className="text-xs text-slate-400 font-mono">Password: Password123</p>
                </div>
            </div>
        </div>
    );
};

// --- Input Types Variety ---
const InputTypesEnv: React.FC<EnvProps> = ({ completedSteps, onStepComplete }) => {
    const [textVal, setTextVal]         = useState('');
    const [dropdown, setDropdown]       = useState('');
    const [checkA, setCheckA]           = useState(false);
    const [checkB, setCheckB]           = useState(false);
    const [radio, setRadio]             = useState('');
    const [submitted, setSubmitted]     = useState(false);
    const [textTouched, setTextTouched] = useState(false);

    const handleTextChange = (v: string) => {
        setTextVal(v);
        if (v.length > 0 && !completedSteps.has('step-text')) onStepComplete('step-text');
    };
    const handleDropdown = (v: string) => {
        setDropdown(v);
        if (v && !completedSteps.has('step-dropdown')) onStepComplete('step-dropdown');
    };
    const handleCheckA = (v: boolean) => {
        setCheckA(v);
        if (!completedSteps.has('step-checkbox')) onStepComplete('step-checkbox');
    };
    const handleRadio = (v: string) => {
        setRadio(v);
        if (!completedSteps.has('step-radio')) onStepComplete('step-radio');
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!completedSteps.has('step-submit')) onStepComplete('step-submit');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl mb-3">
                        <span className="text-2xl">📋</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Feedback Form</h2>
                    <p className="text-slate-400 text-sm mt-1">Explore different input types</p>
                </div>

                {submitted ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 font-semibold">Form Submitted!</p>
                        <div className="mt-3 text-left text-xs text-slate-400 space-y-1 bg-slate-800/50 rounded-lg p-3">
                            <p>Name: <span className="text-white">{textVal || '(empty)'}</span></p>
                            <p>Category: <span className="text-white">{dropdown || '(none)'}</span></p>
                            <p>Subscribed: <span className="text-white">{checkA ? 'Yes' : 'No'}</span></p>
                            <p>Priority: <span className="text-white">{radio || '(none)'}</span></p>
                        </div>
                        <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-slate-400 hover:text-white transition-colors underline">
                            Reset
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Your name <span className="text-slate-500">(text)</span></label>
                            <input
                                type="text"
                                value={textVal}
                                onChange={e => handleTextChange(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Category <span className="text-slate-500">(dropdown)</span></label>
                            <select
                                value={dropdown}
                                onChange={e => handleDropdown(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm transition-colors"
                            >
                                <option value="">— Select a category —</option>
                                <option value="bug">Bug Report</option>
                                <option value="feature">Feature Request</option>
                                <option value="question">Question</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-medium">Options <span className="text-slate-500">(checkboxes)</span></label>
                            <div className="space-y-2">
                                {[
                                    { id: 'chk-a', label: 'Subscribe to updates', val: checkA, setter: handleCheckA },
                                    { id: 'chk-b', label: 'Agree to terms', val: checkB, setter: (v: boolean) => setCheckB(v) },
                                ].map(c => (
                                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={c.val}
                                            onChange={e => c.setter(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-medium">Priority <span className="text-slate-500">(radio)</span></label>
                            <div className="flex gap-4">
                                {['Low', 'Medium', 'High'].map(p => (
                                    <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={p}
                                            checked={radio === p}
                                            onChange={() => handleRadio(p)}
                                            className="w-4 h-4 border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2.5 font-medium text-sm transition-colors">
                            Submit Feedback
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- Bug Finder Form ---
const BugFinderEnv: React.FC<EnvProps> = ({ completedSteps, onStepComplete }) => {
    const [name, setName]           = useState('');
    const [email, setEmail]         = useState('');
    const [qty, setQty]             = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [found, setFound]         = useState<Set<string>>(new Set());

    const markBug = (id: string) => {
        if (found.has(id)) return;
        const next = new Set(found).add(id);
        setFound(next);
        onStepComplete(id);
    };

    // Bug 1: Required field with no indication
    const handleName = (v: string) => {
        setName(v);
        // Bug discovered when user notices submit accepts empty name
    };

    // Bug 2: Email accepts clearly invalid input without error
    const handleEmail = (v: string) => {
        setEmail(v);
        if (v === 'notanemail' || (v.length > 3 && !v.includes('@'))) {
            markBug('bug-email');
        }
    };

    // Bug 3: Quantity accepts negative numbers
    const handleQty = (v: string) => {
        setQty(v);
        if (parseInt(v) < 0) markBug('bug-negative');
        if (parseInt(v) > 999) markBug('bug-overflow');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!name) markBug('bug-required');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-xl mb-3">
                        <span className="text-2xl">🐛</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Order Form</h2>
                    <p className="text-slate-400 text-sm mt-1">Find the bugs hiding in this form</p>
                </div>

                {submitted && !name && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-xs font-medium">Form submitted with empty name — Bug #1 found!</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5 font-medium">
                            Full name {/* Bug: no required indicator */}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => handleName(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 text-sm transition-colors"
                        />
                        {/* Bug: no validation error shown even when empty */}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5 font-medium">Email</label>
                        <input
                            type="text" /* Bug: should be type="email" */
                            value={email}
                            onChange={e => handleEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm transition-colors ${
                                found.has('bug-email') ? 'border-red-500' : 'border-slate-600 focus:border-red-400'
                            }`}
                        />
                        {found.has('bug-email') && (
                            <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Bug found: field accepts non-email text without error!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300 mb-1.5 font-medium">Quantity</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={e => handleQty(e.target.value)}
                            placeholder="1"
                            className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none text-sm transition-colors ${
                                (found.has('bug-negative') || found.has('bug-overflow')) ? 'border-red-500' : 'border-slate-600 focus:border-red-400'
                            }`}
                        />
                        {found.has('bug-negative') && (
                            <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Bug found: negative quantities accepted!
                            </p>
                        )}
                        {found.has('bug-overflow') && (
                            <p className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Bug found: quantity exceeds maximum limit!
                            </p>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 font-medium text-sm transition-colors">
                        Place Order
                    </button>
                </form>

                <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Bugs found: {found.size} / 3</p>
                    <div className="flex gap-2">
                        {['bug-required','bug-email','bug-negative'].map(b => (
                            <div key={b} className={`w-2 h-2 rounded-full transition-colors ${found.has(b) ? 'bg-red-400' : 'bg-slate-700'}`} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Multi-step Flow ---
const MultiStepEnv: React.FC<EnvProps> = ({ completedSteps, onStepComplete }) => {
    const [step, setStep]       = useState(1);
    const [name, setName]       = useState('');
    const [email, setEmail]     = useState('');
    const [plan, setPlan]       = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const goStep2 = () => {
        if (!name) return;
        setStep(2);
        onStepComplete('step-1');
    };
    const goStep3 = () => {
        if (!email || !plan) return;
        setStep(3);
        onStepComplete('step-2');
    };
    const goBack = (to: number) => {
        setStep(to);
        onStepComplete('step-back');
    };
    const confirm = () => {
        setConfirmed(true);
        onStepComplete('step-confirm');
    };

    const stepLabels = ['Account', 'Preferences', 'Review'];

    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-full max-w-md">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        {stepLabels.map((label, i) => (
                            <React.Fragment key={i}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        step > i + 1 ? 'bg-green-500 text-white' :
                                        step === i + 1 ? 'bg-blue-500 text-white' :
                                        'bg-slate-700 text-slate-500'
                                    }`}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1">{label}</span>
                                </div>
                                {i < 2 && <div className={`flex-1 h-px mx-2 transition-colors ${step > i + 1 ? 'bg-green-500' : 'bg-slate-700'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {confirmed ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                        <p className="text-green-300 font-semibold text-lg">All done!</p>
                        <div className="mt-3 text-xs text-slate-400 space-y-1 bg-slate-800/50 rounded-lg p-3 text-left">
                            <p>Name: <span className="text-white">{name}</span></p>
                            <p>Email: <span className="text-white">{email}</span></p>
                            <p>Plan: <span className="text-white">{plan}</span></p>
                        </div>
                        <button onClick={() => { setStep(1); setName(''); setEmail(''); setPlan(''); setConfirmed(false); }}
                                className="mt-4 text-sm text-slate-400 hover:text-white transition-colors underline">
                            Start over
                        </button>
                    </div>
                ) : step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Full name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Jane Doe"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            {!name && <p className="text-xs text-slate-500 mt-1">Required to proceed</p>}
                        </div>
                        <button onClick={goStep2} disabled={!name}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-medium text-sm transition-colors">
                            Next: Preferences →
                        </button>
                    </div>
                ) : step === 2 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Email <span className="text-red-400">*</span></label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="jane@example.com"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5 font-medium">Plan <span className="text-red-400">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Starter', 'Pro', 'Enterprise'].map(p => (
                                    <button key={p} type="button" onClick={() => setPlan(p)}
                                            className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                                                plan === p ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                                            }`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => goBack(1)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                                ← Back
                            </button>
                            <button onClick={goStep3} disabled={!email || !plan}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors">
                                Next: Review →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Review your details</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Name</span>
                                <span className="text-white font-medium">{name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Email</span>
                                <span className="text-white font-medium">{email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Plan</span>
                                <span className="text-white font-medium">{plan}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => goBack(2)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                                ← Back
                            </button>
                            <button onClick={confirm} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
                                Confirm ✓
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Scenario Registry ────────────────────────────────────────────────────────

const LAB_SCENARIOS: Record<string, LabScenario> = {
    login: {
        id: 'login',
        title: 'Login Form Validation',
        description: 'Test a real login form by following each step. The form has actual validation logic — watch how it responds to different inputs.',
        steps: [
            {
                id: 'step-empty',
                instruction: 'Submit the form with both fields empty',
                input: 'Leave email and password blank, then click Sign In',
                expected: 'Both fields show a "required" error message in red',
            },
            {
                id: 'step-bad-email',
                instruction: 'Try an invalid email format',
                input: 'Type "notanemail" in the email field, then submit',
                expected: 'Email field shows "Please enter a valid email address"',
                hint: 'The form checks for @ symbol and proper domain format',
            },
            {
                id: 'step-short-pw',
                instruction: 'Test the password length rule',
                input: 'Enter a valid email, then type "abc" (3 chars) as password',
                expected: 'Password field shows "Password must be at least 8 characters"',
            },
            {
                id: 'step-success',
                instruction: 'Log in with valid credentials',
                input: 'Email: test@example.com · Password: Password123',
                expected: 'A green success message appears with a welcome message',
            },
        ],
        renderEnv: (props) => <LoginFormEnv {...props} />,
    },

    inputs: {
        id: 'inputs',
        title: 'Input Types Exploration',
        description: 'Interact with different form input types — text fields, dropdowns, checkboxes, and radio buttons — and observe how each behaves.',
        steps: [
            {
                id: 'step-text',
                instruction: 'Use the text input field',
                input: 'Click the "Your name" field and type your name',
                expected: 'Text appears as you type; field border highlights blue',
            },
            {
                id: 'step-dropdown',
                instruction: 'Select from the dropdown',
                input: 'Click the "Category" dropdown and pick any option',
                expected: 'The selected option replaces the placeholder text',
            },
            {
                id: 'step-checkbox',
                instruction: 'Toggle a checkbox',
                input: 'Click the "Subscribe to updates" checkbox',
                expected: 'The checkbox shows a checkmark; click again to uncheck',
            },
            {
                id: 'step-radio',
                instruction: 'Select a radio button',
                input: 'Click any Priority option (Low, Medium, High)',
                expected: 'Only one option can be selected at a time',
            },
            {
                id: 'step-submit',
                instruction: 'Submit the form',
                input: 'Click the Submit Feedback button',
                expected: 'A success screen shows a summary of all your inputs',
            },
        ],
        renderEnv: (props) => <InputTypesEnv {...props} />,
    },

    navigation: {
        id: 'navigation',
        title: 'Multi-Step Navigation Flow',
        description: 'Navigate through a 3-step wizard. Test that each step validates correctly, back navigation preserves data, and the final confirmation works.',
        steps: [
            {
                id: 'step-1',
                instruction: 'Complete Step 1 — Account',
                input: 'Enter your full name and click "Next: Preferences →"',
                expected: 'Step 2 appears; progress indicator updates to show Step 1 complete',
                hint: 'The Next button stays disabled until you enter a name',
            },
            {
                id: 'step-2',
                instruction: 'Complete Step 2 — Preferences',
                input: 'Enter an email, select a plan, then click "Next: Review →"',
                expected: 'Step 3 appears; progress bar shows Steps 1 and 2 complete',
            },
            {
                id: 'step-back',
                instruction: 'Navigate back and verify data is preserved',
                input: 'On any step, click the "← Back" button',
                expected: 'Previous step shows with your data still filled in',
            },
            {
                id: 'step-confirm',
                instruction: 'Complete the flow',
                input: 'Review your details on Step 3 and click "Confirm ✓"',
                expected: 'Success screen shows a summary of all entered information',
            },
        ],
        renderEnv: (props) => <MultiStepEnv {...props} />,
    },

    dropdown: {
        id: 'dropdown',
        title: 'Input Types Exploration',
        description: 'Interact with different form input types — text fields, dropdowns, checkboxes, and radio buttons — and observe how each behaves.',
        steps: [
            {
                id: 'step-text',
                instruction: 'Use the text input field',
                input: 'Click the "Your name" field and type your name',
                expected: 'Text appears as you type; field border highlights blue',
            },
            {
                id: 'step-dropdown',
                instruction: 'Select from the dropdown',
                input: 'Click the "Category" dropdown and pick any option',
                expected: 'The selected option replaces the placeholder text',
            },
            {
                id: 'step-checkbox',
                instruction: 'Toggle a checkbox',
                input: 'Click the "Subscribe to updates" checkbox',
                expected: 'The checkbox shows a checkmark; click again to uncheck',
            },
            {
                id: 'step-radio',
                instruction: 'Select a radio button',
                input: 'Click any Priority option (Low, Medium, High)',
                expected: 'Only one option can be selected at a time',
            },
            {
                id: 'step-submit',
                instruction: 'Submit the form',
                input: 'Click the Submit Feedback button',
                expected: 'A success screen shows a summary of all your inputs',
            },
        ],
        renderEnv: (props) => <InputTypesEnv {...props} />,
    },

    checkboxes: {
        id: 'checkboxes',
        title: 'Input Types Exploration',
        description: 'Interact with different form input types — text fields, dropdowns, checkboxes, and radio buttons — and observe how each behaves.',
        steps: [
            {
                id: 'step-text',
                instruction: 'Use the text input field',
                input: 'Click the "Your name" field and type your name',
                expected: 'Text appears as you type',
            },
            {
                id: 'step-dropdown',
                instruction: 'Select from the dropdown',
                input: 'Click the Category dropdown and pick any option',
                expected: 'The selected option replaces the placeholder',
            },
            {
                id: 'step-checkbox',
                instruction: 'Toggle a checkbox',
                input: 'Click the "Subscribe to updates" checkbox',
                expected: 'The checkbox toggles on and off',
            },
            {
                id: 'step-radio',
                instruction: 'Select a radio button',
                input: 'Click any Priority option',
                expected: 'Only one radio can be selected at a time',
            },
            {
                id: 'step-submit',
                instruction: 'Submit the form',
                input: 'Click Submit Feedback',
                expected: 'A success screen shows your inputs',
            },
        ],
        renderEnv: (props) => <InputTypesEnv {...props} />,
    },
};

// For any scenario not in LAB_SCENARIOS, use the bug finder as default
const DEFAULT_SCENARIO: LabScenario = {
    id: 'default',
    title: 'Bug-Finding Challenge',
    description: 'This form has intentional bugs planted in it. Your job is to find them by testing edge cases — just like a real QA engineer would.',
    steps: [
        {
            id: 'bug-required',
            instruction: 'Find the missing required field validation',
            input: 'Leave the Full Name field empty and click Place Order',
            expected: 'Bug: the form submits without error — name is not validated!',
        },
        {
            id: 'bug-email',
            instruction: 'Find the broken email validation',
            input: 'Type "notanemail" in the Email field (without @)',
            expected: 'Bug: invalid email text is accepted — should be rejected!',
            hint: 'The input type is wrong — try inspecting the HTML',
        },
        {
            id: 'bug-negative',
            instruction: 'Find the missing boundary check',
            input: 'Enter -5 in the Quantity field',
            expected: 'Bug: negative quantities are allowed — should be rejected!',
        },
    ],
    renderEnv: (props) => <BugFinderEnv {...props} />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ManualTestLabProps {
    scenarioId: string;
    onComplete: () => void;
    onBack: () => void;
}

const ManualTestLab: React.FC<ManualTestLabProps> = ({ scenarioId, onComplete, onBack }) => {
    const lab = LAB_SCENARIOS[scenarioId] ?? DEFAULT_SCENARIO;
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    const handleStepComplete = useCallback((stepId: string) => {
        setCompletedSteps(prev => {
            if (prev.has(stepId)) return prev;
            return new Set(prev).add(stepId);
        });
    }, []);

    const allDone = lab.steps.every(s => completedSteps.has(s.id));
    const progress = lab.steps.filter(s => completedSteps.has(s.id)).length;

    return (
        <div className="flex h-[calc(100vh-120px)] min-h-[500px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">

            {/* ── Left Sidebar ─────────────────────────────────────────── */}
            <aside className="w-[32%] min-w-[260px] max-w-[340px] bg-slate-800/80 border-r border-slate-700 flex flex-col overflow-hidden">

                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-700 flex-shrink-0">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-3 transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to scenarios
                    </button>
                    <h2 className="text-white font-semibold text-sm leading-tight">{lab.title}</h2>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{lab.description}</p>

                    {/* Progress bar */}
                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500">Progress</span>
                            <span className="text-xs text-slate-400">{progress}/{lab.steps.length}</span>
                        </div>
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${(progress / lab.steps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Steps Checklist — scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Test Steps</p>

                    {lab.steps.map((step, idx) => {
                        const done = completedSteps.has(step.id);
                        return (
                            <div
                                key={step.id}
                                className={`rounded-xl p-3 border transition-all duration-300 ${
                                    done
                                        ? 'border-green-500/30 bg-green-500/5'
                                        : 'border-slate-600/50 bg-slate-700/30'
                                }`}
                            >
                                <div className="flex items-start gap-2.5 mb-2">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {done ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center">
                                                <span className="text-[9px] text-slate-500 font-mono">{idx + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-xs font-medium leading-tight ${done ? 'text-green-300' : 'text-slate-300'}`}>
                                        {step.instruction}
                                    </p>
                                </div>

                                {step.input && (
                                    <div className="ml-6.5 ml-[26px] space-y-1.5">
                                        <div className="flex items-start gap-1.5">
                                            <span className="text-[10px] font-medium text-blue-400 flex-shrink-0 mt-0.5">DO:</span>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{step.input}</p>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <span className="text-[10px] font-medium text-purple-400 flex-shrink-0 mt-0.5">EXPECT:</span>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{step.expected}</p>
                                        </div>
                                        {step.hint && (
                                            <div className="flex items-start gap-1.5 mt-1">
                                                <Info className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-amber-400/80 leading-relaxed">{step.hint}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    {allDone ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <Trophy className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <p className="text-green-300 text-xs font-medium">All steps completed!</p>
                            </div>
                            <button
                                onClick={onComplete}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                            >
                                Continue →
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 text-center">
                            Complete all steps in the test environment →
                        </p>
                    )}
                </div>
            </aside>

            {/* ── Right Panel — Test Environment ───────────────────────── */}
            <main className="flex-1 overflow-y-auto bg-slate-900/50">
                {lab.renderEnv({ completedSteps, onStepComplete: handleStepComplete })}
            </main>
        </div>
    );
};

export default ManualTestLab;
