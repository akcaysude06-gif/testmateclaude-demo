import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Lock } from 'lucide-react';

interface Level0Props {
    onBack: () => void;
}

// ─── SCENARIO REGISTRY ──────────────────────────────────────────────────────
// To add a new scenario: add an entry here and create a ScenarioContent below.

export interface Scenario {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    url: string;
    tag: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'login',
        number: '01',
        title: 'Login Form',
        subtitle: 'Test authentication with valid and invalid credentials',
        url: 'https://the-internet.herokuapp.com/login',
        tag: 'Authentication',
    },
    {
        id: 'inputs',
        number: '02',
        title: 'Form Inputs',
        subtitle: 'Test a numeric input field with various values',
        url: 'https://the-internet.herokuapp.com/inputs',
        tag: 'Forms',
    },
    {
        id: 'dropdown',
        number: '03',
        title: 'Dropdown Selection',
        subtitle: 'Test selecting options from a dropdown menu',
        url: 'https://the-internet.herokuapp.com/dropdown',
        tag: 'UI Controls',
    },
    {
        id: 'checkboxes',
        number: '04',
        title: 'Checkboxes',
        subtitle: 'Test checking and unchecking checkbox elements',
        url: 'https://the-internet.herokuapp.com/checkboxes',
        tag: 'UI Controls',
    },
];

// ─── LEVEL 0 SHELL ──────────────────────────────────────────────────────────

const Level0: React.FC<Level0Props> = ({ onBack }) => {
    const [completedScenarios, setCompleted] = useState<Set<string>>(new Set());
    const [activeScenario, setActive]        = useState<string | null>(null);

    const isUnlocked = (i: number) => i === 0 || completedScenarios.has(SCENARIOS[i - 1].id);
    const complete   = (id: string) => { setCompleted(p => new Set(p).add(id)); setActive(null); };

    const active = SCENARIOS.find(s => s.id === activeScenario);
    if (active) {
        return (
            <ScenarioShell
                scenario={active}
                onComplete={() => complete(active.id)}
                onBack={() => setActive(null)}
            />
        );
    }

    const allDone = completedScenarios.size === SCENARIOS.length;

    return (
        <div className="max-w-3xl mx-auto">
            <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-10 text-sm">
                <ChevronRight className="w-4 h-4 rotate-180" /><span>Back</span>
            </button>

            <div className="mb-12">
                <p className="text-purple-400 text-xs tracking-widest uppercase font-medium mb-3">Level 0</p>
                <h1 className="text-4xl font-light text-white mb-4 tracking-tight">
                    Testing & Automation<br /><span className="text-slate-400">Fundamentals</span>
                </h1>
                <p className="text-slate-400 text-base leading-relaxed max-w-lg">
                    Each scenario takes you through manual testing, the case for automation,
                    and your first automated test — on a different real-world UI element.
                </p>
            </div>

            <div className="mb-10">
                <div className="flex justify-between mb-2">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className="text-xs text-slate-400">{completedScenarios.size} / {SCENARIOS.length} scenarios</span>
                </div>
                <div className="h-px bg-slate-800 w-full">
                    <div className="h-px bg-purple-500 transition-all duration-700"
                         style={{ width: `${(completedScenarios.size / SCENARIOS.length) * 100}%` }} />
                </div>
            </div>

            <div className="space-y-3">
                {SCENARIOS.map((s, i) => {
                    const unlocked  = isUnlocked(i);
                    const completed = completedScenarios.has(s.id);
                    return (
                        <button key={s.id} onClick={() => unlocked && setActive(s.id)} disabled={!unlocked}
                                className={`w-full text-left group transition-all duration-200 ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <div className={`border rounded-xl p-6 transition-all duration-200 ${
                                completed ? 'border-purple-500/30 bg-purple-500/5'
                                    : unlocked ? 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                                        : 'border-slate-800 bg-slate-900/30'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-5">
                                        <div className={`text-2xl font-light tracking-tighter ${completed ? 'text-purple-400' : unlocked ? 'text-slate-500' : 'text-slate-700'}`}>{s.number}</div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className={`font-medium text-base ${completed ? 'text-white' : unlocked ? 'text-white' : 'text-slate-600'}`}>{s.title}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                                    completed ? 'border-purple-500/30 text-purple-400'
                                                        : unlocked ? 'border-slate-600 text-slate-500'
                                                            : 'border-slate-800 text-slate-700'}`}>{s.tag}</span>
                                            </div>
                                            <p className={`text-sm ${completed ? 'text-slate-400' : unlocked ? 'text-slate-500' : 'text-slate-700'}`}>{s.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {completed ? <CheckCircle className="w-5 h-5 text-purple-400" />
                                            : !unlocked ? <Lock className="w-4 h-4 text-slate-700" />
                                                : <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {allDone && (
                <div className="mt-8 border border-purple-500/20 rounded-xl p-6 bg-purple-500/5">
                    <p className="text-purple-300 font-medium mb-1">Level 0 Complete</p>
                    <p className="text-slate-400 text-sm">All scenarios finished. You are ready for Level 1.</p>
                    <button onClick={onBack} className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-2">
                        <span>Go to Level 1</span><ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── SCENARIO SHELL (3-step wrapper for every scenario) ─────────────────────

type ScenarioStep = 'manual' | 'why' | 'automation';

const ScenarioShell: React.FC<{ scenario: Scenario; onComplete: () => void; onBack: () => void }> = ({ scenario, onComplete, onBack }) => {
    const [step, setStep]           = useState<ScenarioStep>('manual');
    const [doneSteps, setDoneSteps] = useState<Set<ScenarioStep>>(new Set());

    const completeStep = (s: ScenarioStep, next: ScenarioStep | 'done') => {
        setDoneSteps(p => new Set(p).add(s));
        if (next === 'done') onComplete();
        else setStep(next);
    };

    const steps: { id: ScenarioStep; label: string }[] = [
        { id: 'manual',     label: 'Manual Test' },
        { id: 'why',        label: 'Why Automate?' },
        { id: 'automation', label: 'First Automation' },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
                <ChevronRight className="w-4 h-4 rotate-180" /><span>Back to scenarios</span>
            </button>

            <div className="mb-8">
                <div className="flex items-center space-x-3 mb-2">
                    <p className="text-purple-400 text-xs tracking-widest uppercase font-medium">Scenario {scenario.number}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-500">{scenario.tag}</span>
                </div>
                <h2 className="text-3xl font-light text-white tracking-tight">{scenario.title}</h2>
            </div>

            {/* Step tabs */}
            <div className="flex space-x-1 mb-8 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                {steps.map((s, i) => {
                    const done    = doneSteps.has(s.id);
                    const active  = step === s.id;
                    const locked  = !done && !active;
                    return (
                        <div key={s.id} className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                            active ? 'bg-slate-800 text-white'
                                : done  ? 'text-purple-400'
                                    : 'text-slate-600'}`}>
                            {done ? <CheckCircle className="w-3 h-3" /> : <span className="font-mono">{String(i+1).padStart(2,'0')}</span>}
                            <span>{s.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Step content */}
            {step === 'manual'     && <ManualStep     scenario={scenario} onComplete={() => completeStep('manual', 'why')} />}
            {step === 'why'        && <WhyStep        scenario={scenario} onComplete={() => completeStep('why', 'automation')} />}
            {step === 'automation' && <AutomationStep scenario={scenario} onComplete={() => completeStep('automation', 'done')} />}
        </div>
    );
};

// ─── SCENARIO CONTENT REGISTRY ──────────────────────────────────────────────

interface ScenarioContent {
    manualTasks: string[];
    credentials?: { label: string; value: string }[];
    whyPoints: { title: string; desc: string }[];
    seleniumCode: string;
    codeExplanations: Record<number, string>;
    quizQuestion: string;
    quizOptions: string[];
    quizCorrect: number;
    quizFeedbackCorrect: string;
    quizFeedbackWrong: string;
}

const CONTENT: Record<string, ScenarioContent> = {
    login: {
        manualTasks: [
            'Log in with valid credentials (tomsmith / SuperSecretPassword!)',
            'Try logging in with an incorrect password',
            'Submit the form with empty fields',
            'Observe the error messages and behavior',
        ],
        credentials: [
            { label: 'Username', value: 'tomsmith' },
            { label: 'Password', value: 'SuperSecretPassword!' },
        ],
        whyPoints: [
            { title: 'Daily Deployments', desc: 'Login is the entry point to every feature. After every release you must verify it still works — automation runs it in seconds.' },
            { title: 'Multiple User Roles', desc: 'Admin, editor, viewer — each role may have different credentials and access levels. Automating covers all combinations instantly.' },
            { title: 'Security Regression', desc: 'A code change could accidentally allow login with wrong credentials. Automated tests catch this before it reaches production.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/login")

wait = WebDriverWait(driver, 10)
username = wait.until(EC.presence_of_element_located((By.ID, "username")))
username.send_keys("tomsmith")

password = driver.find_element(By.ID, "password")
password.send_keys("SuperSecretPassword!")

driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

success = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "flash.success")))
assert "You logged into a secure area" in success.text

print("Test passed: Login successful")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium WebDriver and wait utilities are imported.',
            2: 'Chrome is launched and the login page is opened.',
            3: 'We wait for the username field to appear, then type the credentials.',
            4: 'The submit button is clicked via a CSS selector.',
            5: 'We wait for the success banner and assert the expected text is present.',
        },
        quizQuestion: 'Why is By.ID preferred over By.CLASS_NAME for locating the username field?',
        quizOptions: ['IDs load faster in the browser','IDs are unique on a page, making the locator more reliable','Class names are harder to type','By.CLASS_NAME does not work in Chrome'],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. An ID must be unique within a page, so By.ID will always target exactly one element. Class names can appear on many elements, causing ambiguity.',
        quizFeedbackWrong: 'The key reason is uniqueness. IDs must be unique per page, so By.ID always resolves to exactly one element. Class names can repeat, making the locator fragile.',
    },

    inputs: {
        manualTasks: [
            'Type a positive integer (e.g. 42) into the number field',
            'Type a negative number (e.g. -5) and observe',
            'Type letters or special characters and observe',
            'Use the arrow keys to increment/decrement the value',
        ],
        whyPoints: [
            { title: 'Boundary Values', desc: 'Input fields must handle 0, max int, negative numbers, and letters. Testing all boundaries manually for every build is tedious.' },
            { title: 'Cross-Browser Input Behavior', desc: 'Number inputs behave differently in Chrome vs Firefox vs Safari. Selenium can verify consistent behavior across all browsers.' },
            { title: 'Form Validation Regression', desc: 'A small HTML change could accidentally remove input validation. Automated tests will immediately flag the regression.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/inputs")

wait = WebDriverWait(driver, 10)
number_input = wait.until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='number']"))
)

# Test: enter a valid number
number_input.clear()
number_input.send_keys("42")
assert number_input.get_attribute("value") == "42"

# Test: clear and enter negative number
number_input.clear()
number_input.send_keys("-5")
assert number_input.get_attribute("value") == "-5"

print("Test passed: Input field accepts valid numbers")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome is launched and the inputs page is opened.',
            3: 'The number input is located using a CSS attribute selector — useful when no ID is available.',
            4: 'clear() removes any existing value before send_keys() types the new one.',
            5: 'get_attribute("value") reads the current field value so we can assert it matches what we typed.',
        },
        quizQuestion: 'Why do we call clear() before send_keys()?',
        quizOptions: [
            'To make the test run faster',
            'To remove any pre-existing value before typing, preventing concatenation',
            'clear() is required by Selenium before every interaction',
            'To reset the browser cache',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Without clear(), any existing text in the field would remain and the new value would be appended to it, producing unexpected results.',
        quizFeedbackWrong: 'The reason is to prevent value concatenation. If the field already contains text, send_keys() appends to it. clear() ensures the field is empty first.',
    },

    dropdown: {
        manualTasks: [
            'Open the dropdown and note the default selected option',
            'Select "Option 1" and observe the page',
            'Select "Option 2" and observe the page',
            'Try selecting the placeholder option ("Please select an option") again',
        ],
        whyPoints: [
            { title: 'Option Availability', desc: 'Dropdowns can be populated dynamically from an API. Automation can verify that all expected options are present after every build.' },
            { title: 'Default State Testing', desc: 'A broken default selection can cause form submission errors. Automated tests check the initial state reliably every time.' },
            { title: 'Dependent Dropdowns', desc: 'Many forms have cascading dropdowns (country → city). Testing all combinations manually is impractical; automation handles it trivially.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/dropdown")

wait = WebDriverWait(driver, 10)
dropdown_element = wait.until(EC.presence_of_element_located((By.ID, "dropdown")))
dropdown = Select(dropdown_element)

# Select by visible text
dropdown.select_by_visible_text("Option 1")
assert dropdown.first_selected_option.text == "Option 1"

# Select by value attribute
dropdown.select_by_value("2")
assert dropdown.first_selected_option.text == "Option 2"

print("Test passed: Dropdown selections work correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium imports include the Select helper class, which provides a clean API for <select> elements.',
            2: 'Chrome is launched and the dropdown page is opened.',
            3: 'The raw <select> element is located by ID, then wrapped in Select() to access dropdown-specific methods.',
            4: 'select_by_visible_text() selects the option matching the displayed label. first_selected_option returns the currently selected item.',
            5: 'select_by_value() selects by the HTML value attribute instead of the visible text — useful when labels change but values stay stable.',
        },
        quizQuestion: 'What does the Select class provide that a regular find_element does not?',
        quizOptions: [
            'Faster element location',
            'Dropdown-specific methods like select_by_visible_text() and select_by_value()',
            'Automatic waiting for options to load',
            'Support for multi-select dropdowns only',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. The Select wrapper adds convenient methods designed specifically for <select> elements: selecting by text, by value, by index, and reading the current selection.',
        quizFeedbackWrong: 'The Select class wraps a <select> element and adds methods like select_by_visible_text() and select_by_value() — things you cannot do with a plain WebElement.',
    },

    checkboxes: {
        manualTasks: [
            'Note the initial state of both checkboxes (checked / unchecked)',
            'Click checkbox 1 and observe its new state',
            'Click checkbox 2 and observe its new state',
            'Click each checkbox again to toggle back — does it work reliably?',
        ],
        whyPoints: [
            { title: 'State Verification', desc: 'A checkbox that visually appears checked but is not actually checked in the DOM causes silent form submission bugs. Automation reads the real DOM state.' },
            { title: 'Bulk Operations', desc: 'Forms with 20+ checkboxes (permissions, settings) need all combinations tested. Only automation makes this practical.' },
            { title: 'Accessibility & Keyboard', desc: 'Checkboxes must also work via the keyboard (Space key). Automated tests can cover both click and keyboard interactions programmatically.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/checkboxes")

wait = WebDriverWait(driver, 10)
checkboxes = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input[type='checkbox']"))
)

checkbox1 = checkboxes[0]
checkbox2 = checkboxes[1]

# Verify initial state
assert not checkbox1.is_selected(), "Checkbox 1 should be unchecked initially"
assert checkbox2.is_selected(),     "Checkbox 2 should be checked initially"

# Toggle both
checkbox1.click()
checkbox2.click()

# Verify toggled state
assert checkbox1.is_selected(),      "Checkbox 1 should now be checked"
assert not checkbox2.is_selected(),  "Checkbox 2 should now be unchecked"

print("Test passed: Checkbox states toggle correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome is launched and the checkboxes page is opened.',
            3: 'presence_of_all_elements_located() returns a list of all matching elements — useful when there are multiple checkboxes.',
            4: 'is_selected() returns True if the checkbox is currently checked. We assert the known initial state before doing anything.',
            5: 'After clicking both checkboxes, we assert that their states have flipped — this confirms the click interaction actually worked.',
        },
        quizQuestion: 'What does is_selected() return for an unchecked checkbox?',
        quizOptions: ['None', 'False', '0', 'An exception is raised'],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. is_selected() returns a boolean: True if the checkbox is checked, False if it is not. This makes it straightforward to use in assert statements.',
        quizFeedbackWrong: 'is_selected() returns a boolean. For an unchecked checkbox it returns False, and for a checked one it returns True.',
    },
};

// ─── STEP A: MANUAL TEST ────────────────────────────────────────────────────

const ManualStep: React.FC<{ scenario: Scenario; onComplete: () => void }> = ({ scenario, onComplete }) => {
    const [phase, setPhase]         = useState<'intro'|'testing'|'write'|'feedback'|'reflection'>('intro');
    const [notes, setNotes]         = useState('');
    const [feedback, setFeedback]   = useState('');
    const [loading, setLoading]     = useState(false);
    const content                   = CONTENT[scenario.id];

    const evaluate = async () => {
        if (notes.trim().length < 20) return;
        setLoading(true);
        try {
            const res  = await fetch('http://localhost:8000/api/level0/evaluate-manual-test', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_steps: notes, scenario: scenario.title, url: scenario.url }),
            });
            const data = await res.json();
            setFeedback(data.feedback);
        } catch {
            setFeedback('Could not retrieve feedback. Is the backend running?');
        } finally {
            setLoading(false);
            setPhase('feedback');
        }
    };

    return (
        <div className="space-y-6">
            {phase === 'intro' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-3">Manual Testing</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        You will open a real page and test it by hand — no code, just clicking and observing.
                        Take notes on what you find.
                    </p>
                    <div className="border-t border-slate-700 pt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Page Under Test</p>
                        <p className="text-slate-300 text-sm font-mono">{scenario.url.replace('https://', '')}</p>
                    </div>
                </div>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-3">Your Tasks</h3>
                    <div className="space-y-3 mb-4">
                        {content.manualTasks.map((t, i) => (
                            <div key={i} className="flex items-start space-x-3">
                                <span className="text-purple-400 text-xs mt-0.5 font-mono">{String(i+1).padStart(2,'0')}</span>
                                <span className="text-slate-300 text-sm">{t}</span>
                            </div>
                        ))}
                    </div>
                    {content.credentials && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <p className="text-xs text-slate-500 mb-2">Credentials</p>
                            {content.credentials.map(c => (
                                <p key={c.label} className="text-sm font-mono text-slate-300">{c.label}: <span className="text-purple-300">{c.value}</span></p>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => { window.open(scenario.url, '_blank'); setPhase('testing'); }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
                    Open Page and Start Testing
                </button>
            </>)}

            {phase === 'testing' && (<>
                <div className="border border-purple-500/30 rounded-xl p-6 bg-purple-500/5">
                    <p className="text-purple-300 text-sm font-medium mb-1">Page opened</p>
                    <p className="text-slate-400 text-sm">Complete all tasks in the new tab, then return here.</p>
                </div>
                <button onClick={() => setPhase('write')}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
                    I Finished Testing, Continue
                </button>
            </>)}

            {phase === 'write' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-2">Document Your Test Steps</h3>
                    <p className="text-slate-400 text-sm">Write what you did and what you observed for each task.</p>
                </div>
                <div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                              placeholder={`Test 1: ...\n- Action: ...\n- Result: ...\n\nTest 2: ...`}
                              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-slate-500 resize-none" />
                    <p className="text-xs text-slate-600 mt-2 text-right">{notes.length} characters</p>
                </div>
                <button onClick={evaluate} disabled={loading || notes.trim().length < 20}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium">
                    {loading ? 'Evaluating...' : 'Evaluate with AI'}
                </button>
            </>)}

            {phase === 'feedback' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Your Submission</p>
                    <pre className="text-slate-400 text-sm whitespace-pre-wrap font-mono leading-relaxed">{notes}</pre>
                </div>
                <div className="border border-purple-500/30 rounded-xl p-6 bg-purple-500/5">
                    <p className="text-xs text-purple-400 uppercase tracking-wide font-medium mb-3">AI Feedback</p>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{feedback}</div>
                </div>
                <button onClick={() => setPhase('reflection')}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">Continue</button>
            </>)}

            {phase === 'reflection' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-3">Reflect</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        You just manually tested one scenario on one page. Now imagine:
                    </p>
                    <div className="mt-4 space-y-3">
                        {['Running these same checks after every single code commit.','Doing this across 5 different browsers simultaneously.','Covering 50 different pages with similar interactions.'].map((t,i) => (
                            <div key={i} className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg">
                                <span className="text-slate-600 text-xs font-mono mt-0.5">{String(i+1).padStart(2,'0')}</span>
                                <p className="text-slate-400 text-sm">{t}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onComplete}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
                    Continue to Why Automate?
                </button>
            </>)}
        </div>
    );
};

// ─── STEP B: WHY AUTOMATE ───────────────────────────────────────────────────

const WhyStep: React.FC<{ scenario: Scenario; onComplete: () => void }> = ({ scenario, onComplete }) => {
    const content = CONTENT[scenario.id];

    return (
        <div className="space-y-6">
            <p className="text-slate-400 text-sm leading-relaxed">
                You have tested <span className="text-white">{scenario.title}</span> manually.
                Here is why automating this specific scenario makes sense.
            </p>

            <div className="space-y-4">
                {content.whyPoints.map((p, i) => (
                    <div key={i} className="border border-slate-700 rounded-xl p-5 bg-slate-800/30">
                        <p className="text-slate-300 font-medium text-sm mb-2">{p.title}</p>
                        <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
                    </div>
                ))}
            </div>

            <div className="border border-slate-700 rounded-xl p-5 bg-slate-800/30">
                <p className="text-slate-400 text-sm leading-relaxed">
                    Manual testing remains essential for <span className="text-white">exploratory and UX testing</span>.
                    But for repetitive, verifiable checks like these, automation is the right tool.
                </p>
            </div>

            <button onClick={onComplete}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
                Continue to First Automation
            </button>
        </div>
    );
};

// ─── STEP C: AUTOMATION ─────────────────────────────────────────────────────

const AutomationStep: React.FC<{ scenario: Scenario; onComplete: () => void }> = ({ scenario, onComplete }) => {
    const [phase, setPhase]       = useState<'code'|'quiz'|'ask-ai'|'done'>('code');
    const [selectedBlock, setBlock] = useState<number|null>(null);
    const [picked, setPicked]     = useState<number|null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer]     = useState('');
    const [loading, setLoading]   = useState(false);
    const content                 = CONTENT[scenario.id];

    const askAI = async () => {
        if (!question.trim()) return;
        setLoading(true);
        try {
            const res  = await fetch('http://localhost:8000/api/level0/ask', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, context: `Selenium Python, ${scenario.title} test, ${scenario.url}` }),
            });
            const data = await res.json();
            setAnswer(data.answer);
        } catch { setAnswer('Could not retrieve an answer. Is the backend running?'); }
        finally  { setLoading(false); }
    };

    const lines      = content.seleniumCode.split('\n');
    const blockCount = Object.keys(content.codeExplanations).length;
    const lineBlock  = (i: number) => {
        const size = Math.ceil(lines.length / blockCount);
        return Math.min(Math.floor(i / size) + 1, blockCount);
    };

    return (
        <div className="space-y-6">
            {phase === 'code' && (<>
                <p className="text-slate-400 text-sm">
                    This is the Selenium code that automates what you just tested manually. Click any line for an explanation.
                </p>
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                    <div className="border-b border-slate-700 px-4 py-2 bg-slate-900/50 flex justify-between">
                        <span className="text-xs text-slate-500 font-mono">{scenario.id}_test.py</span>
                        <span className="text-xs text-slate-600">Python / Selenium</span>
                    </div>
                    <div className="bg-slate-900/70 p-4 overflow-x-auto">
                        {lines.map((line, i) => (
                            <div key={i} onClick={() => setBlock(lineBlock(i))}
                                 className={`flex items-start cursor-pointer rounded px-2 py-0.5 transition-colors ${selectedBlock === lineBlock(i) ? 'bg-purple-500/10' : 'hover:bg-slate-800/50'}`}>
                                <span className="text-slate-700 text-xs font-mono mr-4 select-none w-6 text-right flex-shrink-0 pt-0.5">{i+1}</span>
                                <pre className="text-sm font-mono text-slate-300 whitespace-pre">{line||' '}</pre>
                            </div>
                        ))}
                    </div>
                </div>
                {selectedBlock
                    ? <div className="border border-purple-500/30 rounded-xl p-4 bg-purple-500/5">
                        <p className="text-xs text-purple-400 uppercase tracking-wide mb-2">Explanation</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{content.codeExplanations[selectedBlock]}</p>
                    </div>
                    : <p className="text-slate-600 text-xs text-center">Click a line to see its explanation</p>
                }
                <button onClick={() => setPhase('quiz')}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">Knowledge Check</button>
            </>)}

            {phase === 'quiz' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <p className="text-slate-300 font-medium mb-6">{content.quizQuestion}</p>
                    <div className="space-y-3">
                        {content.quizOptions.map((o, i) => (
                            <button key={i} onClick={() => !submitted && setPicked(i)}
                                    className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${
                                        submitted
                                            ? i === content.quizCorrect ? 'border-green-500/40 bg-green-500/10 text-green-300'
                                                : i === picked             ? 'border-red-500/40 bg-red-500/10 text-red-300'
                                                    : 'border-slate-700 text-slate-500'
                                            : picked === i ? 'border-purple-500/50 bg-purple-500/10 text-white'
                                                : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                <span className="font-mono text-xs mr-3 opacity-50">{String.fromCharCode(65+i)}</span>{o}
                            </button>
                        ))}
                    </div>
                </div>
                {!submitted
                    ? <button onClick={() => picked !== null && setSubmitted(true)} disabled={picked === null}
                              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium">Submit Answer</button>
                    : <div className="space-y-4">
                        <div className={`border rounded-xl p-4 text-sm leading-relaxed ${picked===content.quizCorrect?'border-green-500/30 bg-green-500/5 text-green-300':'border-slate-700 bg-slate-800/30 text-slate-400'}`}>
                            {picked === content.quizCorrect ? content.quizFeedbackCorrect : content.quizFeedbackWrong}
                        </div>
                        <button onClick={() => setPhase('ask-ai')}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">Ask the AI a Question</button>
                    </div>
                }
            </>)}

            {phase === 'ask-ai' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-2 text-sm">Any questions about this test?</h3>
                    <p className="text-slate-400 text-sm">Ask anything about the code, Selenium concepts, or this scenario.</p>
                </div>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                          placeholder={`Ask about the ${scenario.title} automation code...`}
                          className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm placeholder-slate-600 focus:outline-none focus:border-slate-500 resize-none" />
                <button onClick={askAI} disabled={loading || !question.trim()}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium">
                    {loading ? 'Waiting...' : 'Ask'}
                </button>
                {answer && (
                    <div className="border border-purple-500/30 rounded-xl p-5 bg-purple-500/5">
                        <p className="text-xs text-purple-400 uppercase tracking-wide font-medium mb-3">Response</p>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
                    </div>
                )}
                <button onClick={() => setPhase('done')}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium">
                    {answer ? 'Complete Scenario' : 'Skip, Complete Scenario'}
                </button>
            </>)}

            {phase === 'done' && (<>
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h3 className="text-white font-medium mb-4">Scenario complete</h3>
                    <div className="space-y-3">
                        {['Manually tested the page and documented findings','Understood why this scenario benefits from automation','Read and understood the Selenium code for this test'].map((t,i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <span className="text-slate-400 text-sm">{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onComplete}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium">
                    Complete Scenario
                </button>
            </>)}
        </div>
    );
};

export default Level0;