import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { type Scenario, SCENARIOS } from '../../data/scenarios';

interface Level0Props {
    onBack: () => void;
    onAIFeedback: (feedback: string) => void;
}

// ─── LEVEL 0 SHELL ──────────────────────────────────────────────────────────

const Level0: React.FC<Level0Props> = ({ onBack, onAIFeedback }) => {
    const [completedScenarios, setCompleted] = useState<Set<string>>(new Set());
    const [activeScenario, setActive]        = useState<string | null>(null);

    const isUnlocked = (i: number) => i === 0 || completedScenarios.has(SCENARIOS[i - 1].id);
    const complete   = (id: string) => { setCompleted(p => new Set(p).add(id)); setActive(null); };

    const active  = SCENARIOS.find(s => s.id === activeScenario);
    const allDone = completedScenarios.size === SCENARIOS.length;

    const mainContent = active ? (
        <ScenarioShell
            scenario={active}
            onComplete={() => complete(active.id)}
            onBack={() => setActive(null)}
            onAIFeedback={onAIFeedback}
        />
    ) : (
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

    return (
        <div style={{ padding: '1.5rem 1.25rem' }}>
            {mainContent}
        </div>
    );
};

// ─── SCENARIO SHELL (3-step wrapper for every scenario) ─────────────────────

type ScenarioStep = 'manual' | 'why' | 'automation';

const ScenarioShell: React.FC<{ scenario: Scenario; onComplete: () => void; onBack: () => void; onAIFeedback: (feedback: string) => void }> = ({ scenario, onComplete, onBack, onAIFeedback }) => {
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
            {step === 'manual'     && <ManualStep     scenario={scenario} onComplete={() => completeStep('manual', 'why')} onAIFeedback={onAIFeedback} />}
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

    navigation: {
        manualTasks: [
            'Click each navigation link and note which page it opens',
            'Use the browser Back button and confirm you return to the correct page',
            'Check that the active link is visually highlighted',
            'Try navigating via the keyboard (Tab + Enter)',
        ],
        whyPoints: [
            { title: 'Broken Links After Refactors', desc: 'Renaming a route during a refactor is a common cause of 404 errors. Automation verifies every nav link resolves correctly after each build.' },
            { title: 'Consistent Active State', desc: 'The highlighted "current page" indicator can break when routes change. Automation checks the CSS state without manual inspection.' },
            { title: 'Cross-Browser URL Handling', desc: 'Hash-based and history-based routing behave differently across browsers. Selenium confirms the final URL in every target browser.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/navigation")

wait = WebDriverWait(driver, 10)
links = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "nav a")))

for link in links:
    href = link.get_attribute("href")
    text = link.text
    assert href, f"Link '{text}' has no href attribute"
    print(f"Link '{text}' points to: {href}")

# Click the first real nav link and verify URL changes
links[0].click()
wait.until(lambda d: d.current_url != "https://the-internet.herokuapp.com/navigation")
print(f"Navigated to: {driver.current_url}")

print("Test passed: navigation links are present and functional")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the navigation page.',
            3: 'All <a> tags inside <nav> are collected into a list.',
            4: 'We loop through each link, assert an href exists, and print the destination.',
            5: 'We click the first link and use a lambda wait to confirm the URL actually changed.',
        },
        quizQuestion: 'What does driver.current_url return after a successful navigation?',
        quizOptions: [
            'The page title',
            'The full URL of the currently loaded page',
            'The URL the driver started on',
            'The href of the last clicked link',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. driver.current_url reflects the URL in the browser address bar after any navigation or redirect has settled.',
        quizFeedbackWrong: 'driver.current_url returns the full URL currently shown in the browser address bar, updated after every navigation event.',
    },

    modal: {
        manualTasks: [
            'Wait for the modal to appear automatically on page load',
            'Read the modal\'s title and body text',
            'Click the close button (×) and confirm the modal disappears',
            'Reload and try clicking outside the modal — does it close?',
        ],
        whyPoints: [
            { title: 'Overlay Timing', desc: 'Modals appear after a delay or async event. Automation uses explicit waits to handle the timing precisely, removing flakiness.' },
            { title: 'Focus Trap Regression', desc: 'A code change could accidentally let users click through a modal onto the page beneath. Automation confirms the overlay blocks interaction.' },
            { title: 'Multiple Close Paths', desc: 'Modals often close via a button, the Esc key, or an outside click. Automation verifies all three paths every release.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/entry_ad")

wait = WebDriverWait(driver, 10)

# Wait for modal to appear
modal = wait.until(EC.visibility_of_element_located((By.ID, "modal")))
assert modal.is_displayed(), "Modal should be visible on load"

# Read modal body text
body = driver.find_element(By.CSS_SELECTOR, "#modal .modal-body p")
assert len(body.text) > 0, "Modal body should contain text"

# Close the modal
close_btn = driver.find_element(By.CSS_SELECTOR, "#modal .modal-footer p")
close_btn.click()

wait.until(EC.invisibility_of_element_located((By.ID, "modal")))
print("Test passed: Modal appeared and closed correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the entry ad page which shows a modal on load.',
            3: 'visibility_of_element_located waits until the modal is both in the DOM and visible.',
            4: 'We assert the modal body has text, confirming content rendered correctly.',
            5: 'After clicking close, invisibility_of_element_located waits until the modal is gone from view.',
        },
        quizQuestion: 'What is the difference between presence_of_element_located and visibility_of_element_located?',
        quizOptions: [
            'There is no difference — they are aliases',
            'presence checks the DOM exists; visibility also checks the element is visible on screen',
            'visibility_of_element_located is faster',
            'presence_of_element_located only works for modals',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. An element can be in the DOM (display:none) without being visible. visibility_of_element_located ensures it is both present AND rendered on screen.',
        quizFeedbackWrong: 'presence_of_element_located only confirms the element exists in the DOM. visibility_of_element_located additionally confirms it is rendered and visible to the user.',
    },

    tables: {
        manualTasks: [
            'Identify all column headers in the table',
            'Click a column header to sort — does the data reorder?',
            'Find the row with the last name "Smith" and note its full data',
            'Count the total number of rows in the table',
        ],
        whyPoints: [
            { title: 'Sort Regression', desc: 'Sorting logic can silently break after backend changes. Automation reads the column values before and after sorting and verifies the order.' },
            { title: 'Dynamic Row Counts', desc: 'Tables populated from a database can return fewer rows after a migration. Automation asserts the expected row count every build.' },
            { title: 'Cell Data Accuracy', desc: 'A join query change can transpose columns or drop data. Automation reads specific cells and compares against expected values.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/tables")

wait = WebDriverWait(driver, 10)
table = wait.until(EC.presence_of_element_located((By.ID, "table1")))

# Read all header names
headers = [th.text for th in table.find_elements(By.CSS_SELECTOR, "thead th")]
print("Headers:", headers)

# Count data rows
rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
assert len(rows) > 0, "Table should have at least one data row"
print(f"Row count: {len(rows)}")

# Find a specific cell
last_names = [row.find_elements(By.TAG_NAME, "td")[0].text for row in rows]
assert "Smith" in last_names, "Expected 'Smith' in the last name column"

print("Test passed: Table data is correct")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the tables page.',
            3: 'We scope all queries to table1 to avoid matching the second table on the page.',
            4: 'A list comprehension reads the text of every <th> to build the headers list.',
            5: 'We extract the first <td> from each row to build a list of last names, then assert the expected name exists.',
        },
        quizQuestion: 'Why do we scope find_elements to the table element rather than using driver.find_elements?',
        quizOptions: [
            'It is required by the Selenium API',
            'To avoid matching elements from other tables or parts of the page',
            'Scoped queries are faster',
            'driver.find_elements does not support CSS selectors',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Calling find_elements on a specific parent element restricts the search to its descendants, preventing accidental matches from other tables or page sections.',
        quizFeedbackWrong: 'Scoping a find_elements call to a parent element restricts results to that element\'s descendants, preventing false matches from other parts of the page.',
    },

    notifications: {
        manualTasks: [
            'Click "Add Element" and observe the notification or new element that appears',
            'Click "Delete" on an added element and observe the result',
            'Add multiple elements and delete them one by one',
            'Note whether the page state resets on reload',
        ],
        whyPoints: [
            { title: 'Async DOM Updates', desc: 'Notifications appear after JavaScript executes. Automation uses explicit waits to detect the new element reliably, avoiding false passes.' },
            { title: 'Add/Remove Cycle Testing', desc: 'Adding and deleting items is a core CRUD pattern. Automation can repeat the cycle hundreds of times to detect intermittent DOM bugs.' },
            { title: 'Count Verification', desc: 'After adding N elements, automation can assert exactly N items are in the DOM — something tedious to verify by hand on every build.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/add_remove_elements/")

wait = WebDriverWait(driver, 10)
add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Add Element']")))

# Add three elements
for _ in range(3):
    add_btn.click()

delete_buttons = driver.find_elements(By.CLASS_NAME, "added-manually")
assert len(delete_buttons) == 3, f"Expected 3 delete buttons, got {len(delete_buttons)}"

# Remove one
delete_buttons[0].click()
remaining = driver.find_elements(By.CLASS_NAME, "added-manually")
assert len(remaining) == 2, "Should have 2 elements after one deletion"

print("Test passed: Add/Remove elements work correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the add/remove elements page.',
            3: 'element_to_be_clickable waits until the button is both visible and interactable.',
            4: 'We click Add three times using a loop — automation makes repetition trivial.',
            5: 'After deletion we re-query the DOM to get a fresh count and assert the exact expected value.',
        },
        quizQuestion: 'Why do we re-query find_elements after deletion instead of reusing the old list?',
        quizOptions: [
            'The old list becomes None after a click',
            'The old list is a snapshot; re-querying reflects the current DOM state after the deletion',
            'Selenium clears all references on every click',
            'It is only needed for Internet Explorer',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. find_elements returns a snapshot at the time of the call. After a DOM mutation, that list is stale. Re-querying returns the live state.',
        quizFeedbackWrong: 'A find_elements result is a snapshot taken at call time. After the DOM changes, you must call find_elements again to get an updated list reflecting the current state.',
    },

    dragdrop: {
        manualTasks: [
            'Drag column A to the position of column B',
            'Verify the labels swapped after the drop',
            'Drag B back to A\'s original position',
            'Try dragging quickly vs slowly — does it behave differently?',
        ],
        whyPoints: [
            { title: 'HTML5 Drag API Changes', desc: 'Browsers change their drag-and-drop event model between versions. Automation detects when a browser update silently breaks the feature.' },
            { title: 'Order-Dependent UI', desc: 'Dashboards with draggable widgets must preserve order on reload. Automation verifies the stored order matches the visual order after every deploy.' },
            { title: 'Touch Parity', desc: 'Drag interactions must work on both mouse and touch events. Automation frameworks can simulate both input types in CI.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import ActionChains

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/drag_and_drop")

wait = WebDriverWait(driver, 10)
source = wait.until(EC.presence_of_element_located((By.ID, "column-a")))
target = driver.find_element(By.ID, "column-b")

before_a = source.find_element(By.TAG_NAME, "header").text

ActionChains(driver).drag_and_drop(source, target).perform()

after_a = driver.find_element(By.ID, "column-a").find_element(By.TAG_NAME, "header").text

assert before_a != after_a, "Column header should have changed after drag"
print(f"Dragged: column-a now shows '{after_a}'")
print("Test passed: Drag and drop worked correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium, waits, and ActionChains are imported. ActionChains provides the drag_and_drop method.',
            2: 'Chrome opens the drag and drop demo page.',
            3: 'We locate both columns and read the header text of column-a before dragging.',
            4: 'ActionChains.drag_and_drop(source, target).perform() executes the drag in one call.',
            5: 'After the drag we re-read column-a\'s header and assert it changed, confirming the swap occurred.',
        },
        quizQuestion: 'What does .perform() do at the end of an ActionChains chain?',
        quizOptions: [
            'It resets the action queue',
            'It executes all queued actions in the browser',
            'It validates the actions before running them',
            'It is optional — actions run automatically',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. ActionChains queues actions but does not execute them until .perform() is called. Without it, nothing happens in the browser.',
        quizFeedbackWrong: '.perform() triggers execution of all queued actions. ActionChains builds a queue of inputs; they only run in the browser when .perform() is called.',
    },

    tabs: {
        manualTasks: [
            'Click the link that opens a new browser window/tab',
            'Switch to the new tab and read its heading',
            'Switch back to the original tab and confirm it is still intact',
            'Close the new tab and verify focus returns to the original',
        ],
        whyPoints: [
            { title: 'Window Handle Management', desc: 'Applications that open popups or new tabs must be tested with window switching. Automation manages multiple handles reliably in headless mode.' },
            { title: 'Cross-Tab State', desc: 'Auth tokens and session state should persist (or not) across tabs. Automation can open tabs programmatically and verify the expected behavior.' },
            { title: 'OAuth Flows', desc: 'Many SSO flows open a provider window. Automation switches handles to fill credentials and then returns to the main app to assert successful login.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/windows")

wait = WebDriverWait(driver, 10)
original_handle = driver.current_window_handle

link = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Click Here")))
link.click()

# Wait for new window and switch to it
wait.until(lambda d: len(d.window_handles) > 1)
new_handle = [h for h in driver.window_handles if h != original_handle][0]
driver.switch_to.window(new_handle)

heading = wait.until(EC.presence_of_element_located((By.TAG_NAME, "h3")))
assert heading.text == "New Window", f"Expected 'New Window', got '{heading.text}'"

# Switch back
driver.close()
driver.switch_to.window(original_handle)
assert "windows" in driver.current_url

print("Test passed: Window switching works correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the windows demo and we save the original window handle.',
            3: 'After clicking the link we wait until window_handles has more than one entry.',
            4: 'We find the new handle by filtering out the original, then switch_to.window() focuses it.',
            5: 'After asserting the new window content we close it and switch back to the original handle.',
        },
        quizQuestion: 'What does driver.switch_to.window(handle) do?',
        quizOptions: [
            'Opens a new browser window',
            'Moves WebDriver focus to the specified window or tab',
            'Closes all other windows',
            'Refreshes the window with the given handle',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. switch_to.window() moves all subsequent driver commands to operate on the window identified by the given handle.',
        quizFeedbackWrong: 'switch_to.window(handle) redirects all subsequent driver commands to the window identified by that handle. It does not open or close windows.',
    },

    search: {
        manualTasks: [
            'Click the search input and type a country name (e.g. "United")',
            'Observe whether a suggestion list appears',
            'Select a suggestion and confirm it populates the field',
            'Clear the field and type a string that matches no options',
        ],
        whyPoints: [
            { title: 'Debounce Timing', desc: 'Autocomplete fires after a delay. Automation must wait for the suggestion list to appear rather than immediately asserting, or tests fail intermittently.' },
            { title: 'Keyboard vs Click', desc: 'Users select suggestions via mouse click or arrow keys. Automation can verify both interaction paths work correctly.' },
            { title: 'Empty State Testing', desc: 'When no results match, a "no results" message should appear. Automation verifies this edge case on every build without manual effort.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/autocomplete")

wait = WebDriverWait(driver, 10)
search_input = wait.until(EC.presence_of_element_located((By.ID, "myCountry")))
search_input.send_keys("Uni")

# Wait for dropdown suggestions to appear
suggestions = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".ui-autocomplete li"))
)
assert len(suggestions) > 0, "Should have autocomplete suggestions"

# Click the first suggestion
first = suggestions[0]
first_text = first.text
first.click()

result = search_input.get_attribute("value")
assert result == first_text, f"Field should contain '{first_text}', got '{result}'"

print("Test passed: Autocomplete suggestion selected correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the autocomplete page.',
            3: 'We type "Uni" into the search field to trigger suggestions.',
            4: 'We wait for the suggestion list items to appear using a CSS selector for the jQuery UI list.',
            5: 'We record the first suggestion\'s text, click it, then assert the input value matches.',
        },
        quizQuestion: 'Why do we wait for suggestions to appear rather than checking immediately after send_keys?',
        quizOptions: [
            'send_keys is asynchronous and returns before typing is complete',
            'Autocomplete suggestions are fetched asynchronously after a debounce delay',
            'The browser blocks find_elements during typing',
            'Suggestions require a page reload to appear',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Autocomplete typically waits for the user to pause typing (debounce) and then fires an async request. The list is not instant, so an explicit wait is required.',
        quizFeedbackWrong: 'Autocomplete is async — suggestions appear after a debounce delay and sometimes a network request. Without waiting, find_elements runs before the list exists.',
    },

    hovers: {
        manualTasks: [
            'Hover over the first user avatar and read the tooltip/caption',
            'Hover over each avatar in turn — does each show different info?',
            'Move the mouse away and confirm the tooltip disappears',
            'Note whether the tooltip contains a link and if it works',
        ],
        whyPoints: [
            { title: 'CSS Hover State Regression', desc: ':hover-triggered content can disappear silently when CSS is refactored. Automation moves the mouse programmatically and confirms content is visible.' },
            { title: 'Dynamic Content in Tooltips', desc: 'Tooltips often render user-specific data from an API. Automation verifies the correct data appears for each hover target.' },
            { title: 'Accessibility Parity', desc: 'Hover-only content must also be reachable via focus for keyboard users. Automation can test both mouse hover and keyboard focus.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import ActionChains

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/hovers")

wait = WebDriverWait(driver, 10)
figures = wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "figure")))

for i, figure in enumerate(figures):
    ActionChains(driver).move_to_element(figure).perform()
    caption = wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, f".figure:nth-child({i+1}) .figcaption")
    ))
    assert caption.is_displayed(), f"Caption {i+1} should be visible on hover"
    print(f"Figure {i+1} caption: {caption.text}")

print("Test passed: All hover captions are visible")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium, waits, and ActionChains are imported for mouse movement.',
            2: 'Chrome opens the hovers page.',
            3: 'We collect all figure elements to loop through them.',
            4: 'move_to_element() simulates the mouse hovering over the target element.',
            5: 'We wait for the caption to become visible, then assert it is displayed.',
        },
        quizQuestion: 'What Selenium method simulates moving the mouse over an element?',
        quizOptions: [
            'driver.hover(element)',
            'ActionChains(driver).move_to_element(element).perform()',
            'element.mouse_over()',
            'driver.actions.hover(element)',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. ActionChains provides move_to_element() which simulates the cursor moving onto the element, triggering CSS :hover and JavaScript mouseover events.',
        quizFeedbackWrong: 'ActionChains(driver).move_to_element(element).perform() is the correct way to simulate hovering. Selenium has no direct driver.hover() shortcut.',
    },

    upload: {
        manualTasks: [
            'Click "Choose File" and select any file from your computer',
            'Confirm the file name appears next to the input',
            'Click the upload button and observe the result page',
            'Try uploading without selecting a file — what happens?',
        ],
        whyPoints: [
            { title: 'File Type Validation', desc: 'Upload fields should reject invalid file types. Automation can try uploading .exe or .txt files and assert the correct error appears.' },
            { title: 'Size Limit Enforcement', desc: 'Large file uploads can silently timeout or crash the server. Automation generates boundary-size files and verifies the response.' },
            { title: 'CI Without a Mouse', desc: 'Headless CI has no GUI file picker. Selenium bypasses the OS dialog by sending the file path directly to the input element.' },
        ],
        seleniumCode: `import os
import tempfile
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/upload")

# Create a temporary test file
with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w") as f:
    f.write("test content")
    temp_path = f.name

wait = WebDriverWait(driver, 10)
file_input = wait.until(EC.presence_of_element_located((By.ID, "file-upload")))
file_input.send_keys(temp_path)

driver.find_element(By.ID, "file-submit").click()

uploaded = wait.until(EC.presence_of_element_located((By.ID, "uploaded-files")))
assert os.path.basename(temp_path) in uploaded.text

print("Test passed: File uploaded successfully")
os.unlink(temp_path)
driver.quit()`,
        codeExplanations: {
            1: 'os and tempfile are imported to create a real file for the test without hardcoding a path.',
            2: 'Chrome opens the upload page.',
            3: 'A temporary .txt file is created with known content. send_keys() on a file input sets the path directly — no OS dialog needed.',
            4: 'The submit button is clicked after the file path is set.',
            5: 'We wait for the confirmation element and assert the file name appears in the upload result.',
        },
        quizQuestion: 'Why do we use send_keys() on the file input instead of clicking it and using an OS file dialog?',
        quizOptions: [
            'send_keys is always faster than clicking',
            'Selenium cannot interact with OS-level dialogs, so send_keys sets the path directly in the DOM',
            'Clicking a file input throws a SecurityException',
            'The OS file dialog is not supported on Linux',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. OS file picker dialogs are native windows outside the browser DOM — Selenium has no API to control them. send_keys on the input element bypasses the dialog.',
        quizFeedbackWrong: 'Native OS dialogs are outside the browser DOM and cannot be controlled by Selenium. send_keys() writes the file path directly into the input\'s value, bypassing the dialog.',
    },

    alerts: {
        manualTasks: [
            'Click "Click for JS Alert" and accept the alert',
            'Click "Click for JS Confirm" and dismiss it, then accept it',
            'Click "Click for JS Prompt", type text, and submit',
            'Read the result text after each action to confirm the right response was recorded',
        ],
        whyPoints: [
            { title: 'Non-DOM Interruption', desc: 'JS alerts pause page execution. Automation must explicitly switch context to the alert, otherwise subsequent commands throw exceptions.' },
            { title: 'Confirm Dialog Paths', desc: 'A confirm dialog has two outcomes: accept and dismiss. Both code paths must be tested. Automation handles each with a single method call.' },
            { title: 'Prompt Text Capture', desc: 'JS prompts can accept user input. Automation sends text via send_keys() on the alert object and verifies it is reflected in the page result.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/javascript_alerts")

wait = WebDriverWait(driver, 10)

# Test 1: Accept a simple alert
driver.find_element(By.XPATH, "//button[text()='Click for JS Alert']").click()
alert = wait.until(EC.alert_is_present())
alert.accept()
result = driver.find_element(By.ID, "result").text
assert "You successfuly clicked an alert" in result

# Test 2: Dismiss a confirm dialog
driver.find_element(By.XPATH, "//button[text()='Click for JS Confirm']").click()
alert = wait.until(EC.alert_is_present())
alert.dismiss()
result = driver.find_element(By.ID, "result").text
assert "You clicked: Cancel" in result

print("Test passed: JS alerts handled correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the JavaScript alerts page.',
            3: 'alert_is_present() waits until the browser alert dialog is active, then we call accept().',
            4: 'We read the #result element text and assert the expected confirmation message.',
            5: 'For the confirm dialog, dismiss() simulates clicking Cancel, and we verify the result updates accordingly.',
        },
        quizQuestion: 'What happens if you call driver.find_element() while a JS alert is open without switching to it first?',
        quizOptions: [
            'The element is found normally',
            'An UnexpectedAlertPresentException is raised',
            'The alert auto-closes',
            'Selenium ignores the alert and continues',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. An open JS alert blocks the browser. Any WebDriver command that touches the DOM will raise UnexpectedAlertPresentException until the alert is handled.',
        quizFeedbackWrong: 'An open JS alert blocks DOM access. Calling find_element() without first handling the alert raises UnexpectedAlertPresentException.',
    },

    iframe: {
        manualTasks: [
            'Click inside the text editor area and type some text',
            'Use the toolbar to make text bold',
            'Select all the text and delete it',
            'Notice the editor is inside a frame — inspect its HTML structure',
        ],
        whyPoints: [
            { title: 'Frame Context Switching', desc: 'Selenium operates in one frame context at a time. Without switching to the iframe, all find_element calls fail with a NoSuchElementException.' },
            { title: 'Rich Text Editors', desc: 'TinyMCE and Quill editors render inside iframes. Automation must enter the frame, interact with the body, then exit — a pattern required in many real apps.' },
            { title: 'Nested Frames', desc: 'Some legacy apps have deeply nested frames. Automation must switch through each level. Missing one causes every locator inside to fail silently.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/iframe")

wait = WebDriverWait(driver, 10)

# Switch into the TinyMCE iframe
iframe = wait.until(EC.presence_of_element_located((By.ID, "mce_0_ifr")))
driver.switch_to.frame(iframe)

# Clear existing content and type new text
body = driver.find_element(By.ID, "tinymce")
body.clear()
body.send_keys("Automated text inside iframe")

assert body.text == "Automated text inside iframe"

# Switch back to the main document
driver.switch_to.default_content()
print("Test passed: Typed inside iframe successfully")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the iframe page with a TinyMCE editor.',
            3: 'switch_to.frame() moves the WebDriver context into the iframe. All subsequent find_element calls search within it.',
            4: 'We clear the editor body and type new text using send_keys().',
            5: 'switch_to.default_content() returns context to the main page after we are done inside the frame.',
        },
        quizQuestion: 'What must you call before interacting with elements inside an iframe?',
        quizOptions: [
            'driver.focus_frame()',
            'driver.switch_to.frame()',
            'driver.enter_iframe()',
            'Nothing — Selenium handles iframes automatically',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. driver.switch_to.frame() changes the WebDriver context so that find_element searches inside the iframe. Without it, elements inside the frame are not reachable.',
        quizFeedbackWrong: 'You must call driver.switch_to.frame() to enter the iframe context. Until you do, Selenium searches the main document and cannot find elements inside the frame.',
    },

    slider: {
        manualTasks: [
            'Click and drag the slider handle to the far right',
            'Drag it back to roughly the middle and read the displayed value',
            'Try using the arrow keys while the slider is focused',
            'Note the minimum and maximum values shown',
        ],
        whyPoints: [
            { title: 'Value Precision', desc: 'Sliders used for price filters or quantity selectors must land on exact values. Automation uses arrow keys or JavaScript to set a precise value and asserts the result.' },
            { title: 'Boundary Testing', desc: 'Sliders should not exceed min/max bounds. Automation can try to drag beyond the boundary and assert the value is clamped correctly.' },
            { title: 'Touch Simulation', desc: 'Sliders on mobile use touch events. Automation frameworks can simulate swipe actions to verify the mobile slider works in cross-platform testing.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/horizontal_slider")

wait = WebDriverWait(driver, 10)
slider = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='range']")))

# Use arrow keys to move slider to value 3
slider.click()
for _ in range(3):
    slider.send_keys(Keys.ARROW_RIGHT)

value_text = driver.find_element(By.ID, "range").text
assert value_text == "3", f"Expected slider value 3, got {value_text}"

print(f"Test passed: Slider value is {value_text}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium, Keys, and wait utilities are imported. Keys provides arrow key constants.',
            2: 'Chrome opens the horizontal slider page.',
            3: 'The range input is located by its type attribute.',
            4: 'We click to focus the slider, then send ARROW_RIGHT three times to increment the value.',
            5: 'We read the displayed value element and assert it equals the expected integer.',
        },
        quizQuestion: 'Why do we use Keys.ARROW_RIGHT instead of ActionChains drag to move the slider?',
        quizOptions: [
            'Arrow keys are faster to execute',
            'Arrow keys produce precise, predictable value increments; pixel-based drag is fragile across screen sizes',
            'ActionChains does not support sliders',
            'Drag requires a touch device',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Arrow keys increment the slider by one step reliably regardless of element size or screen resolution. Drag-based approaches depend on pixel coordinates and break when layout changes.',
        quizFeedbackWrong: 'Arrow keys move the slider by exact defined steps, making assertions predictable. Pixel-based drag calculations depend on element size and break when the layout changes.',
    },

    progressbar: {
        manualTasks: [
            'Click "Start" and watch the progress bar fill',
            'Click "Stop" while in progress and note the value it stopped at',
            'Let the progress bar reach 100% and observe the completion state',
            'Click "Start" again after completion — does it reset or continue?',
        ],
        whyPoints: [
            { title: 'Timing-Sensitive Assertions', desc: 'Progress bars change over time. Automation must use explicit waits to assert state at the right moment rather than polling with sleep.' },
            { title: 'Stop/Resume Logic', desc: 'Pausing and resuming operations (uploads, jobs) is a common pattern. Automation verifies that intermediate values are preserved correctly.' },
            { title: 'Completion Detection', desc: 'A process that silently stalls at 99% is a real bug. Automation waits for 100% and asserts the completion message appears within a timeout.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/dynamic_loading/1")

wait = WebDriverWait(driver, 10)
start_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "#start button")))
start_btn.click()

# Wait for the loading indicator to disappear
wait.until(EC.invisibility_of_element_located((By.ID, "loading")))

# Assert the hidden element is now visible
finish = wait.until(EC.visibility_of_element_located((By.ID, "finish")))
assert "Hello World!" in finish.text

print(f"Test passed: Dynamic loading complete. Text: '{finish.text}'")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the dynamic loading example where an element is hidden until loading completes.',
            3: 'We click Start and wait for the loading spinner (#loading) to disappear.',
            4: 'invisibility_of_element_located confirms the spinner is gone before we check the result.',
            5: 'visibility_of_element_located confirms the previously hidden #finish element is now shown, and we assert its text.',
        },
        quizQuestion: 'What is the advantage of invisibility_of_element_located over a fixed time.sleep()?',
        quizOptions: [
            'It is easier to read',
            'It waits the minimum necessary time; sleep always waits the full duration even if loading finished early',
            'sleep() does not work in Selenium',
            'invisibility_of_element_located works across all browsers',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. An explicit wait returns as soon as the condition is met, making tests faster. A fixed sleep always waits the full duration, slowing the suite and creating flakiness if the wait is too short.',
        quizFeedbackWrong: 'Explicit waits return the moment the condition is met, so tests run as fast as the app allows. A fixed sleep always waits the full duration — too short causes failures, too long wastes time.',
    },

    contextmenu: {
        manualTasks: [
            'Right-click on the highlighted box on the page',
            'Observe the browser or custom context menu that appears',
            'Accept any alert or dialog that appears from the right-click',
            'Try right-clicking outside the box — is the behaviour different?',
        ],
        whyPoints: [
            { title: 'Custom Context Menus', desc: 'Apps that replace the default browser right-click menu must be tested to confirm the custom options appear and work correctly.' },
            { title: 'Alert Side Effects', desc: 'Right-click actions can trigger JS alerts. Automation must handle the alert immediately or subsequent commands fail.' },
            { title: 'Accessibility Paths', desc: 'Context menu actions must also be reachable via keyboard (e.g., the Menu key). Automation can test the keyboard path without a real mouse.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver import ActionChains

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/context_menu")

wait = WebDriverWait(driver, 10)
box = wait.until(EC.presence_of_element_located((By.ID, "hot-spot")))

ActionChains(driver).context_click(box).perform()

alert = wait.until(EC.alert_is_present())
assert "You selected a context menu" in alert.text
alert.accept()

print("Test passed: Context menu triggered and alert handled")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium, waits, and ActionChains are imported.',
            2: 'Chrome opens the context menu page.',
            3: 'ActionChains.context_click() fires a right-click event on the target element.',
            4: 'The right-click triggers a JS alert. alert_is_present() waits for it to appear.',
            5: 'We assert the expected text is in the alert, then accept() dismisses it.',
        },
        quizQuestion: 'Which ActionChains method simulates a right-click?',
        quizOptions: [
            'right_click(element)',
            'context_click(element)',
            'secondary_click(element)',
            'click(element, button=2)',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. ActionChains.context_click(element) fires the contextmenu event, which is the standard right-click action in Selenium.',
        quizFeedbackWrong: 'The correct method is context_click(element) on an ActionChains instance. Selenium does not have right_click() or secondary_click() methods.',
    },

    infinitescroll: {
        manualTasks: [
            'Scroll slowly to the bottom of the page',
            'Observe that new content loads as you scroll',
            'Continue scrolling and count how many new items appear',
            'Note whether a loading spinner appears between batches',
        ],
        whyPoints: [
            { title: 'Lazy Load Verification', desc: 'Infinite scroll uses IntersectionObserver or scroll events. Automation scrolls programmatically and waits for new DOM nodes to confirm the trigger works.' },
            { title: 'Performance Regression', desc: 'A slow API can cause the scroll loading to stall. Automation with timeouts detects when new content takes longer than the defined threshold.' },
            { title: 'Item Count Accuracy', desc: 'After N scroll events, automation counts total DOM items and compares against the expected batch size × scroll count.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/infinite_scroll")

wait = WebDriverWait(driver, 10)
wait.until(EC.presence_of_element_located((By.CLASS_NAME, "jscroll-added")))

initial_items = driver.find_elements(By.CSS_SELECTOR, ".jscroll-added p")
initial_count = len(initial_items)

# Scroll to the bottom to trigger loading
driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")

wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".jscroll-added p")) > initial_count)

new_count = len(driver.find_elements(By.CSS_SELECTOR, ".jscroll-added p"))
assert new_count > initial_count, "New items should have loaded after scroll"

print(f"Test passed: Items grew from {initial_count} to {new_count}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the infinite scroll page.',
            3: 'We count the initial paragraph items before scrolling.',
            4: 'execute_script runs JavaScript to scroll to the bottom, triggering the lazy-load event.',
            5: 'A lambda wait compares the live count against the initial count, returning when new items arrive.',
        },
        quizQuestion: 'Why do we use execute_script to scroll instead of send_keys(Keys.END)?',
        quizOptions: [
            'execute_script is always faster',
            'Keys.END scrolls the focused element; execute_script scrolls the window regardless of focus',
            'send_keys does not work on scroll containers',
            'execute_script bypasses JavaScript event handlers',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Keys.END moves the cursor to the end of a focused input. execute_script("window.scrollTo(...)") reliably scrolls the viewport regardless of which element has focus.',
        quizFeedbackWrong: 'Keys.END operates on the focused element (useful in text fields). execute_script("window.scrollTo(...)") directly scrolls the browser window, which is what triggers scroll-based lazy loading.',
    },

    redirect: {
        manualTasks: [
            'Click the redirect link and note the URL it lands on',
            'Check how many redirects occurred using browser DevTools (Network tab)',
            'Click Back and try the redirect again — is it consistent?',
            'Note the HTTP status code of the redirect response',
        ],
        whyPoints: [
            { title: 'URL Chain Verification', desc: 'Marketing campaigns and auth flows rely on redirect chains. Automation verifies the final URL is always correct after every deploy.' },
            { title: 'Redirect Loop Detection', desc: 'A misconfigured redirect can create an infinite loop. Automation with a timeout detects when navigation never settles.' },
            { title: 'SEO Impact', desc: 'Changing a 301 to a 302 redirect affects SEO. Automation that captures response status codes alerts the team to unintended changes.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/redirector")

wait = WebDriverWait(driver, 10)
redirect_link = wait.until(EC.element_to_be_clickable((By.ID, "redirect")))

start_url = driver.current_url
redirect_link.click()

# Wait for navigation to complete
wait.until(lambda d: d.current_url != start_url)

final_url = driver.current_url
assert "status_codes" in final_url, f"Expected redirect to status_codes, got {final_url}"

print(f"Test passed: Redirected to {final_url}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the redirector page.',
            3: 'We record the starting URL so we can detect when navigation completes.',
            4: 'After clicking the link, a lambda wait polls current_url until it changes from the start URL.',
            5: 'We assert the final URL contains the expected path segment, confirming the redirect destination is correct.',
        },
        quizQuestion: 'Why do we capture driver.current_url before clicking rather than after?',
        quizOptions: [
            'To have a value to compare against after navigation completes',
            'current_url is unavailable after a redirect',
            'Selenium resets current_url on every click',
            'It is only needed for HTTP redirects, not client-side ones',
        ],
        quizCorrect: 0,
        quizFeedbackCorrect: 'Correct. We need the before-URL as a baseline so the lambda wait can detect the moment navigation completes by comparing current_url against it.',
        quizFeedbackWrong: 'We capture the starting URL as a baseline for comparison. The lambda wait uses it to detect when current_url changes, signalling that navigation (and any redirects) have settled.',
    },

    productsearch: {
        manualTasks: [
            'Type "laptop" in the search box and press Enter',
            'Verify the results page shows items containing "laptop"',
            'Search for a nonsense string (e.g. "zzzxxx") and confirm a "no results" message appears',
            'Clear the search and verify the full product catalogue is restored',
        ],
        whyPoints: [
            { title: 'Keyword Ranking Changes', desc: 'A search algorithm update can silently reorder or drop expected results. Automation asserts specific products appear in results after every backend deploy.' },
            { title: 'Empty State Coverage', desc: 'The "no results" branch is easy to forget. Automation tests this path consistently without manual effort.' },
            { title: 'Perf Regression Detection', desc: 'Search endpoints are high-traffic. Automation with timing assertions catches query slowdowns before they affect real users.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/shop")

wait = WebDriverWait(driver, 10)
search_box = wait.until(EC.presence_of_element_located((By.ID, "search-input")))
search_box.send_keys("laptop")
driver.find_element(By.ID, "search-submit").click()

results = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".product-card")))
assert len(results) > 0, "Expected product results for 'laptop'"

titles = [r.find_element(By.CLASS_NAME, "product-title").text.lower() for r in results]
assert any("laptop" in t for t in titles), "At least one result should mention 'laptop'"

print(f"Test passed: {len(results)} results found")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the shop page.',
            3: 'We locate the search input by ID and type the search keyword.',
            4: 'The submit button is clicked to trigger the search.',
            5: 'We wait for product cards to appear, then assert at least one title contains the keyword.',
        },
        quizQuestion: 'Why do we assert on the text content of results rather than just the count?',
        quizOptions: [
            'Text assertions are faster to execute',
            'A non-zero count could include unrelated products; text assertion confirms relevance',
            'Selenium cannot count elements',
            'Count assertions are not reliable in Python',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. A count-only check passes even if the results page shows completely unrelated items. Asserting on title text confirms the search actually filtered by the keyword.',
        quizFeedbackWrong: 'Counting results alone does not confirm relevance. A bug could return all products regardless of the query. Asserting on text content verifies the search actually worked.',
    },

    addtocart: {
        manualTasks: [
            'Open a product page and note the cart icon count in the header',
            'Click "Add to Cart" and observe the cart count increment',
            'Click "Add to Cart" a second time and verify the count is now 2',
            'Navigate to the cart page and confirm the product and quantity are listed correctly',
        ],
        whyPoints: [
            { title: 'Cart State Regression', desc: 'Cart logic involves local state and backend sync. A frontend refactor can break the count badge without breaking the API — automation catches the UI gap.' },
            { title: 'Quantity Accumulation', desc: 'Adding the same item twice should increment quantity, not create a duplicate line. Automation verifies the merge logic every build.' },
            { title: 'Cross-Page Persistence', desc: 'The cart must survive navigation. Automation adds an item then checks the cart page, confirming data persists across routes.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/product/123")

wait = WebDriverWait(driver, 10)
add_btn = wait.until(EC.element_to_be_clickable((By.ID, "add-to-cart")))
add_btn.click()

cart_badge = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".cart-count")))
assert cart_badge.text == "1", f"Expected cart count 1, got '{cart_badge.text}'"

# Add again
add_btn.click()
wait.until(lambda d: d.find_element(By.CSS_SELECTOR, ".cart-count").text == "2")

driver.get("https://example.com/cart")
items = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".cart-item")))
assert len(items) == 1, "Should have one unique cart line"
qty = driver.find_element(By.CSS_SELECTOR, ".cart-item .quantity").text
assert qty == "2", f"Expected quantity 2, got '{qty}'"

print("Test passed: Add to cart works correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the product page.',
            3: 'We click the Add to Cart button and wait for the cart badge to show "1".',
            4: 'We click again and use a lambda wait to confirm the badge updates to "2".',
            5: 'We navigate to the cart page and assert there is one line item with quantity 2.',
        },
        quizQuestion: 'Why do we navigate to /cart to assert quantity instead of only checking the badge?',
        quizOptions: [
            'The badge is not accessible by Selenium',
            'The badge could be a cosmetic-only counter; the cart page reflects actual stored state',
            'Badge assertions require JavaScript execution',
            'Cart pages load faster than product pages',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. A badge could be a local counter that resets on reload. Asserting on the cart page confirms the data was actually saved to the session or backend.',
        quizFeedbackWrong: 'The badge may be a simple JavaScript counter. Navigating to the cart page verifies the item was actually persisted to the server or session storage.',
    },

    checkout: {
        manualTasks: [
            'Add a product to the cart and navigate to checkout',
            'Fill in the shipping address form and click "Continue"',
            'Select a payment method and click "Place Order"',
            'Verify the order confirmation page shows an order number',
        ],
        whyPoints: [
            { title: 'Revenue-Critical Path', desc: 'Checkout is the most business-critical flow. Even a one-hour breakage causes measurable revenue loss. Automation runs it on every deploy.' },
            { title: 'Multi-Step State', desc: 'Checkout spans several pages with shared state. A refactor to step 2 can silently corrupt step 3\'s data. Automation verifies the full chain.' },
            { title: 'Payment Variant Coverage', desc: 'Credit card, PayPal, and gift card all follow different paths. Automation covers each variant systematically.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/cart")

wait = WebDriverWait(driver, 10)
driver.find_element(By.ID, "checkout-btn").click()

# Step 1: Shipping address
wait.until(EC.presence_of_element_located((By.ID, "shipping-form")))
driver.find_element(By.ID, "full-name").send_keys("Jane Doe")
driver.find_element(By.ID, "address").send_keys("123 Main St")
driver.find_element(By.ID, "city").send_keys("Springfield")
driver.find_element(By.ID, "zip").send_keys("12345")
driver.find_element(By.ID, "continue-btn").click()

# Step 2: Payment
wait.until(EC.presence_of_element_located((By.ID, "payment-form")))
driver.find_element(By.ID, "card-number").send_keys("4111111111111111")
driver.find_element(By.ID, "place-order-btn").click()

# Confirmation
confirmation = wait.until(EC.presence_of_element_located((By.ID, "order-confirmation")))
order_num = driver.find_element(By.CSS_SELECTOR, "#order-number").text
assert order_num, "Order number should be present on confirmation page"

print(f"Test passed: Order placed. Order number: {order_num}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the cart page and clicks the checkout button.',
            3: 'On the shipping step we fill every required field using their IDs.',
            4: 'After continuing, we fill the payment form and place the order.',
            5: 'We wait for the confirmation element and assert the order number text is non-empty.',
        },
        quizQuestion: 'Why do we use a test card number like 4111111111111111 in automated checkout tests?',
        quizOptions: [
            'It is the only number Selenium can type',
            'It is a universally recognised test card number that sandbox payment systems accept without charging',
            'Real card numbers are blocked by Selenium',
            'It bypasses the CVV check',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. 4111111111111111 is a standard Luhn-valid test card accepted by Stripe, Braintree, and most sandbox payment gateways without processing a real charge.',
        quizFeedbackWrong: '4111111111111111 is a well-known test card number that satisfies Luhn validation and is accepted by sandbox payment gateways, ensuring no real charge is ever made.',
    },

    register: {
        manualTasks: [
            'Fill in a new email, password, and display name and submit',
            'Verify you are redirected to a welcome or dashboard page',
            'Try registering with the same email again — confirm a duplicate error appears',
            'Submit the form with a weak password (e.g. "123") and observe the validation message',
        ],
        whyPoints: [
            { title: 'Duplicate Prevention', desc: 'Duplicate account creation corrupts user data. Automation tests the second-registration path on every deploy to ensure the duplicate check is always active.' },
            { title: 'Password Policy Enforcement', desc: 'Password rules can be accidentally removed during a UI refactor. Automation verifies the policy error message appears for weak passwords.' },
            { title: 'Post-Register Redirect', desc: 'A broken redirect after registration leaves new users stranded. Automation asserts the correct landing URL every release.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import uuid

driver = webdriver.Chrome()
driver.get("https://example.com/register")

wait = WebDriverWait(driver, 10)
unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

driver.find_element(By.ID, "reg-name").send_keys("Test User")
driver.find_element(By.ID, "reg-email").send_keys(unique_email)
driver.find_element(By.ID, "reg-password").send_keys("SecurePass123!")
driver.find_element(By.ID, "reg-submit").click()

wait.until(lambda d: "/dashboard" in d.current_url or "/welcome" in d.current_url)
print(f"Test passed: Registered {unique_email} and landed on {driver.current_url}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium, wait utilities, and uuid are imported. uuid generates a unique email per run.',
            2: 'Chrome opens the registration page.',
            3: 'A unique email is constructed using a random hex suffix to prevent duplicate conflicts on repeat runs.',
            4: 'We fill all required fields and submit the form.',
            5: 'A lambda wait confirms we landed on either /dashboard or /welcome, verifying the post-register redirect.',
        },
        quizQuestion: 'Why do we generate a unique email with uuid instead of using a hardcoded one?',
        quizOptions: [
            'Hardcoded emails are blocked by email servers',
            'A hardcoded email fails on the second run because the account already exists',
            'uuid() is faster than a string literal',
            'Selenium requires unique strings for email fields',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. After the first run the account exists. A duplicate submission would hit the "email already registered" error path instead of the success path, causing a false failure.',
        quizFeedbackWrong: 'A hardcoded email is registered on the first run. Every subsequent run would receive a "duplicate email" error instead of a successful registration, breaking the test.',
    },

    forgotpassword: {
        manualTasks: [
            'Click the "Forgot Password" link on the login page',
            'Enter a registered email address and submit',
            'Verify the confirmation message says a reset email has been sent',
            'Try submitting with an unregistered email — observe the error or neutral response',
        ],
        whyPoints: [
            { title: 'Account Recovery Critical Path', desc: 'A broken password reset locks users out permanently. Automation verifies the form submits and the success message appears on every release.' },
            { title: 'Email Enumeration Prevention', desc: 'Secure apps show the same message for registered and unregistered emails to prevent account enumeration. Automation can assert both paths show identical copy.' },
            { title: 'Form State Reset', desc: 'After submission the form may disable or change. Automation verifies the UI enters the correct post-submit state.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/forgot_password")

wait = WebDriverWait(driver, 10)
email_field = wait.until(EC.presence_of_element_located((By.ID, "email")))
email_field.send_keys("test@example.com")

driver.find_element(By.ID, "form_submit").click()

confirmation = wait.until(EC.presence_of_element_located((By.ID, "content")))
assert "Your e-mail's been sent" in confirmation.text or len(confirmation.text) > 0

print(f"Test passed: Password reset submitted. Page says: {confirmation.text.strip()}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the forgot password page on the Herokuapp demo.',
            3: 'We locate the email field, type an address, and click submit.',
            4: 'We wait for the content area to update and assert a confirmation message is present.',
            5: 'The test prints the confirmation text for visibility in CI logs.',
        },
        quizQuestion: 'Why might a secure app show the same message for both registered and unregistered emails?',
        quizOptions: [
            'To reduce server load',
            'To prevent attackers from discovering which emails are registered (account enumeration)',
            'Because the backend does not check the database',
            'Email validation is handled client-side only',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Showing a different message for unregistered emails reveals whether an account exists, enabling attackers to harvest valid usernames. Identical responses prevent this.',
        quizFeedbackWrong: 'If the app says "email not found" for unregistered addresses, attackers can probe to discover valid accounts. Returning the same response regardless protects against enumeration attacks.',
    },

    contactform: {
        manualTasks: [
            'Fill in name, email, subject, and message, then click Send',
            'Verify a success confirmation message appears',
            'Submit the form with all fields empty and observe validation errors',
            'Enter an invalid email format (e.g. "notanemail") and observe the error',
        ],
        whyPoints: [
            { title: 'Validation Regression', desc: 'A frontend framework upgrade can silently remove required-field checks. Automation submits empty forms and asserts error messages appear.' },
            { title: 'Email Format Enforcement', desc: 'Invalid emails cause silent delivery failures. Automation verifies the client-side format check catches bad input before submission.' },
            { title: 'Success State Verification', desc: 'The confirmation message must appear and the form should reset or disable. Automation checks both the message and the post-submit form state.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/contact")

wait = WebDriverWait(driver, 10)
driver.find_element(By.ID, "contact-name").send_keys("Alice Smith")
driver.find_element(By.ID, "contact-email").send_keys("alice@example.com")
driver.find_element(By.ID, "contact-subject").send_keys("Test Inquiry")
driver.find_element(By.ID, "contact-message").send_keys("This is an automated test message.")
driver.find_element(By.ID, "contact-submit").click()

success = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".alert-success")))
assert "successfully" in success.text.lower() or "sent" in success.text.lower()

print("Test passed: Contact form submitted successfully")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the contact page.',
            3: 'All four required fields are filled using their IDs.',
            4: 'The form is submitted and we wait for the success alert to become visible.',
            5: 'We assert the success message contains expected keywords confirming the message was sent.',
        },
        quizQuestion: 'Why do we use visibility_of_element_located for the success alert instead of presence_of_element_located?',
        quizOptions: [
            'Presence checks do not work for alert elements',
            'The alert element may already exist in the DOM (hidden) before submission; visibility confirms it was shown',
            'Visibility is always faster',
            'Presence does not work after a form submit',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Many alert components are in the DOM from the start but hidden. presence_of_element_located would pass immediately even before the form is submitted. visibility_of_element_located waits until it is actually displayed.',
        quizFeedbackWrong: 'Alert elements are often pre-rendered in the DOM but hidden via CSS. presence_of_element_located would find the hidden element instantly. visibility_of_element_located correctly waits until the element is rendered on screen.',
    },

    formvalidation: {
        manualTasks: [
            'Click Submit without filling any fields and note which fields show errors',
            'Fill in only the email field with a valid address and submit again',
            'Enter a password shorter than the minimum (e.g. 4 chars) and observe the inline error',
            'Correct all errors and submit — verify the form accepts the valid input',
        ],
        whyPoints: [
            { title: 'Inline Error Presence', desc: 'Validation errors guide users. Automation verifies each required field error appears adjacent to the correct input, not just somewhere on the page.' },
            { title: 'Partial Completion States', desc: 'Filling some fields but not others creates complex validation states. Automation systematically covers each partial completion scenario.' },
            { title: 'Error Clearing on Fix', desc: 'Errors should disappear once the field is corrected. Automation verifies that fixing a field clears its error and does not affect others.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/signup")

wait = WebDriverWait(driver, 10)
submit_btn = wait.until(EC.element_to_be_clickable((By.ID, "signup-submit")))
submit_btn.click()

# All required errors should appear
email_error = driver.find_element(By.CSS_SELECTOR, "#email-field .error-message")
assert email_error.is_displayed(), "Email error should show for empty field"

pass_error = driver.find_element(By.CSS_SELECTOR, "#password-field .error-message")
assert pass_error.is_displayed(), "Password error should show for empty field"

# Fix email, resubmit — password error should remain
driver.find_element(By.ID, "signup-email").send_keys("valid@example.com")
submit_btn.click()
assert not driver.find_element(By.CSS_SELECTOR, "#email-field .error-message").is_displayed()
assert driver.find_element(By.CSS_SELECTOR, "#password-field .error-message").is_displayed()

print("Test passed: Inline validation behaves correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the signup page.',
            3: 'We click Submit immediately without filling anything — both error messages should appear.',
            4: 'We assert each error element is visible, confirming the validation fired.',
            5: 'We fix the email field and submit again — the email error should clear while the password error stays.',
        },
        quizQuestion: 'What does the test verify by checking errors after fixing only the email field?',
        quizOptions: [
            'That the email field is faster to validate',
            'That fixing one field clears its own error without hiding errors on other unfixed fields',
            'That submit_btn is re-clickable after the first submission',
            'That CSS selectors work within parent containers',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. This isolates the error-clearing behaviour: fixing one field should clear exactly its own error and leave all other errors unchanged.',
        quizFeedbackWrong: 'The test confirms that clearing one field\'s error is isolated. Fixing the email should remove the email error but leave the password error visible, verifying independent per-field validation.',
    },

    breadcrumb: {
        manualTasks: [
            'Navigate to a deep category page (e.g. /category/electronics/laptops)',
            'Read the breadcrumb trail and verify it matches the page hierarchy',
            'Click the middle breadcrumb link and confirm you land on the correct parent category',
            'Click the Home breadcrumb and confirm you return to the homepage',
        ],
        whyPoints: [
            { title: 'URL Structure Changes', desc: 'Breadcrumbs are generated from URL segments or category hierarchy. A routing change can silently corrupt them. Automation checks each crumb after every deploy.' },
            { title: 'Link Accuracy', desc: 'A breadcrumb that shows the right label but links to the wrong page is a silent navigation bug. Automation verifies both the label text and the href.' },
            { title: 'SEO Correctness', desc: 'Breadcrumbs are used in structured data for rich search results. Broken breadcrumbs hurt SEO rankings. Automation confirms the structure stays valid.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/category/electronics/laptops")

wait = WebDriverWait(driver, 10)
crumbs = wait.until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".breadcrumb a"))
)

assert len(crumbs) >= 2, "Should have at least Home and one parent crumb"

# Verify labels
assert crumbs[0].text.lower() == "home", f"First crumb should be Home, got '{crumbs[0].text}'"

# Click parent category
crumbs[-1].click()
wait.until(lambda d: "electronics" in d.current_url)
assert "electronics" in driver.current_url

print(f"Test passed: Breadcrumb navigation works. URL: {driver.current_url}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens a deep category page with multiple breadcrumb levels.',
            3: 'We collect all breadcrumb <a> elements and assert at least 2 exist.',
            4: 'We verify the first crumb text is "home" (case-insensitive).',
            5: 'We click the last parent crumb and wait for the URL to contain "electronics", confirming the link is correct.',
        },
        quizQuestion: 'Why do we assert on crumbs[-1] (the last crumb) rather than crumbs[1] (the second crumb)?',
        quizOptions: [
            'crumbs[-1] is always faster to locate',
            'The last crumb is the deepest navigable parent, which is the most likely to have an incorrect href',
            'crumbs[1] is always the current page and has no href',
            'Negative indexing is more reliable in Selenium',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. The last clickable crumb before the current page represents the direct parent, which is the most useful navigation target and the most likely to be incorrectly configured.',
        quizFeedbackWrong: 'The final breadcrumb before the current page is the direct parent category — the most important navigation target. Clicking it is the most valuable path to verify, as it is the most frequently used.',
    },

    tablefilter: {
        manualTasks: [
            'Click the "Last Name" column header and verify the rows sort alphabetically',
            'Click it again and verify reverse-alphabetical order',
            'Use the filter input to type a last name fragment and verify only matching rows remain',
            'Clear the filter and verify all rows are restored',
        ],
        whyPoints: [
            { title: 'Sort Algorithm Regressions', desc: 'A backend query change can revert sort order to insertion order. Automation reads column values and verifies they are in strict alphabetical sequence.' },
            { title: 'Filter Logic Breakage', desc: 'Client-side filters can stop working after a JavaScript bundle update. Automation enters a query and asserts the row count decreases correctly.' },
            { title: 'Pagination Interaction', desc: 'Filtering a paginated table should reset to page 1. Automation verifies pagination state is consistent with the active filter.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/tables")

wait = WebDriverWait(driver, 10)
table = wait.until(EC.presence_of_element_located((By.ID, "table1")))

# Click Last Name header to sort
last_name_header = table.find_element(By.XPATH, ".//th[text()='Last Name']")
last_name_header.click()

rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
last_names = [r.find_elements(By.TAG_NAME, "td")[0].text for r in rows]
assert last_names == sorted(last_names), f"Last names not in ascending order: {last_names}"

# Click again for descending order
last_name_header.click()
rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
last_names = [r.find_elements(By.TAG_NAME, "td")[0].text for r in rows]
assert last_names == sorted(last_names, reverse=True), "Expected descending order after second click"

print("Test passed: Table sorts correctly")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the tables page.',
            3: 'We find the "Last Name" header by its text and click it to trigger ascending sort.',
            4: 'We read all last name cells into a list and assert it matches Python\'s sorted() output.',
            5: 'We click the header again and verify the list matches reverse-sorted order.',
        },
        quizQuestion: 'Why do we compare the extracted list against Python\'s sorted() rather than a hardcoded expected list?',
        quizOptions: [
            'Hardcoded lists are too long to write',
            'sorted() produces a correct reference regardless of the actual data, making the test data-independent',
            'Selenium cannot compare hardcoded lists',
            'Python\'s sorted() is always alphabetically correct for any locale',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Comparing against sorted() makes the test valid regardless of which names are in the table. A hardcoded list would break whenever test data changes.',
        quizFeedbackWrong: 'Using sorted() as the reference means the test verifies the sort behaviour is correct for whatever data is present. Hardcoded expected values would break if the table data ever changed.',
    },

    confirmdialog: {
        manualTasks: [
            'Click the Delete button for any user row and observe the confirmation modal',
            'Click Cancel and verify the user is NOT deleted and the modal closes',
            'Click Delete again and confirm in the modal — verify the row is removed from the table',
            'Check that the modal is not still present after confirmation',
        ],
        whyPoints: [
            { title: 'Destructive Action Guard', desc: 'Confirmation dialogs prevent accidental deletes. Automation verifies the dialog appears every time — a regression that removes it is caught immediately.' },
            { title: 'Cancel Path Coverage', desc: 'The Cancel branch is rarely tested manually. Automation verifies that cancelling leaves all data intact and the modal dismisses correctly.' },
            { title: 'Post-Confirm DOM Update', desc: 'After confirming, the deleted row must disappear and the modal must close. Automation asserts both DOM changes after a single confirm action.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/admin/users")

wait = WebDriverWait(driver, 10)
rows_before = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".user-row")))
count_before = len(rows_before)

# Open confirm dialog
rows_before[0].find_element(By.CSS_SELECTOR, ".delete-btn").click()
modal = wait.until(EC.visibility_of_element_located((By.ID, "confirm-modal")))
assert modal.is_displayed()

# Dismiss first (Cancel path)
driver.find_element(By.ID, "cancel-btn").click()
wait.until(EC.invisibility_of_element_located((By.ID, "confirm-modal")))
rows_after_cancel = driver.find_elements(By.CSS_SELECTOR, ".user-row")
assert len(rows_after_cancel) == count_before, "Row count must not change after Cancel"

# Confirm delete
rows_after_cancel[0].find_element(By.CSS_SELECTOR, ".delete-btn").click()
wait.until(EC.visibility_of_element_located((By.ID, "confirm-modal")))
driver.find_element(By.ID, "confirm-btn").click()

wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".user-row")) == count_before - 1)
wait.until(EC.invisibility_of_element_located((By.ID, "confirm-modal")))

print(f"Test passed: Row deleted. Count: {count_before} → {count_before - 1}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the admin users page and records the initial row count.',
            3: 'We click Delete on the first row, wait for the modal, and assert it is visible.',
            4: 'We click Cancel, wait for the modal to close, then assert the row count is unchanged.',
            5: 'We reopen the dialog, click Confirm, and wait for the row count to decrease by exactly one and the modal to close.',
        },
        quizQuestion: 'Why do we test the Cancel path before the Confirm path?',
        quizOptions: [
            'Cancel is always faster to process',
            'Testing Cancel first leaves the data intact for the subsequent Confirm test which requires a full-count starting state',
            'Selenium processes Cancel buttons before Confirm buttons',
            'The order does not matter — tests are independent',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Cancel first leaves the row count intact so the Confirm test starts from the known full state. Reversing the order would mean the Confirm test starts with one fewer row.',
        quizFeedbackWrong: 'Running Cancel first preserves the data for the Confirm step. If we confirmed first, the row would be gone and we could not test Cancel on a real row in the same test run.',
    },

    editprofile: {
        manualTasks: [
            'Navigate to the profile edit page and change the display name',
            'Click Save and verify the new name appears in the header or profile section',
            'Try saving with an empty display name — observe the validation error',
            'Enter a name that exceeds the character limit and observe the behaviour',
        ],
        whyPoints: [
            { title: 'Optimistic UI Verification', desc: 'Profile pages often update the UI optimistically before the API responds. Automation confirms the displayed name matches what was saved after a reload.' },
            { title: 'Required Field Regression', desc: 'An empty display name can break other users\' views (e.g. comments). Automation verifies the empty-name validation is never accidentally removed.' },
            { title: 'Persistence After Reload', desc: 'A change that appears to save but resets on reload is a common bug. Automation reloads the page and re-asserts the saved value.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/profile/edit")

wait = WebDriverWait(driver, 10)
name_field = wait.until(EC.presence_of_element_located((By.ID, "display-name")))
name_field.clear()
name_field.send_keys("Updated Name")

driver.find_element(By.ID, "save-profile-btn").click()
success = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".save-success")))
assert success.is_displayed()

# Reload and verify persistence
driver.refresh()
wait.until(EC.presence_of_element_located((By.ID, "display-name")))
saved_value = driver.find_element(By.ID, "display-name").get_attribute("value")
assert saved_value == "Updated Name", f"Name did not persist after reload: got '{saved_value}'"

print("Test passed: Profile name updated and persisted")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the profile edit page.',
            3: 'We clear the existing display name and type the new value.',
            4: 'After saving, we wait for the success indicator to appear.',
            5: 'We reload the page and assert the input value still matches, confirming the change was actually persisted.',
        },
        quizQuestion: 'Why do we call driver.refresh() and re-check the field after saving?',
        quizOptions: [
            'To clear the Selenium cache',
            'To verify the change was saved to the server, not just updated in the local DOM',
            'refresh() is required before reading input values',
            'To test that the page loads without errors',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. A success message can appear via client-side state without the save ever reaching the server. Reloading fetches the server\'s current value, proving the data was actually persisted.',
        quizFeedbackWrong: 'Showing a success banner does not guarantee the data was saved to the server. Reloading the page fetches the actual persisted value, distinguishing a real save from a client-only state change.',
    },

    dashboardfilter: {
        manualTasks: [
            'Open the dashboard and note the current default date range displayed',
            'Click the date range picker and select "Last 30 days"',
            'Verify the chart or table data updates to reflect the new range',
            'Select a custom date range spanning a specific month and verify the axis labels change',
        ],
        whyPoints: [
            { title: 'Date Picker Regression', desc: 'Date pickers are complex widgets with many edge cases (month boundaries, leap years). A library upgrade can break the widget. Automation catches this early.' },
            { title: 'Data Refresh After Filter', desc: 'Charts must re-fetch data when the date range changes. Automation verifies the loading state appears and new data renders within the timeout.' },
            { title: 'Label Consistency', desc: 'X-axis labels on charts should match the selected date range. Automation reads the first and last label and asserts they fall within the chosen range.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/dashboard")

wait = WebDriverWait(driver, 10)
date_picker = wait.until(EC.element_to_be_clickable((By.ID, "date-range-picker")))
date_picker.click()

last_30 = wait.until(EC.element_to_be_clickable((By.XPATH, "//li[text()='Last 30 days']")))
last_30.click()

# Wait for loading indicator to appear then disappear
wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".chart-loading")))
wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".chart-loading")))

chart_title = driver.find_element(By.CSS_SELECTOR, ".chart-subtitle").text
assert "30" in chart_title or "last" in chart_title.lower(), \
    f"Chart subtitle should reflect the selected range, got: '{chart_title}'"

print("Test passed: Dashboard date filter updated the chart")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the dashboard page.',
            3: 'We click the date range picker to open its dropdown.',
            4: 'We select "Last 30 days" using an XPath text match.',
            5: 'We wait for the loading spinner to appear and then disappear, then assert the chart subtitle reflects the new range.',
        },
        quizQuestion: 'Why do we wait for the loading indicator to appear AND disappear, rather than just waiting for it to disappear?',
        quizOptions: [
            'It is required by the dashboard framework',
            'Waiting only for it to disappear could pass instantly if the re-fetch has not started yet',
            'The spinner appears before the click is processed',
            'invisibility_of_element_located requires a prior visibility check',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. If the re-fetch has not started when we check, the spinner may not be present yet, so "wait until invisible" passes immediately against stale content. Waiting for it to appear first ensures we track the actual new load cycle.',
        quizFeedbackWrong: 'If we only wait for the spinner to be invisible, we might catch it during a brief moment before the new fetch starts. Waiting for visible then invisible ensures we track the full new data-loading cycle.',
    },

    errorpage: {
        manualTasks: [
            'Navigate to a URL that does not exist (e.g. /missing-page) and observe the page',
            'Verify the HTTP status code shown or the page content clearly indicates 404',
            'Check that the page includes a link back to the homepage',
            'Verify the page title in the browser tab reflects the error state',
        ],
        whyPoints: [
            { title: 'Custom Error Page Regression', desc: 'A deploy can accidentally replace a branded 404 page with a raw server error. Automation verifies the correct error page content is present.' },
            { title: 'Recovery Link Presence', desc: 'Users on a 404 page need a route back. Automation asserts the homepage link is present and functional so users are never stranded.' },
            { title: 'HTTP Status Monitoring', desc: 'Some SPAs return 200 for all routes even for missing pages. Automation using requests or browser logs can catch when the wrong status code is returned.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://the-internet.herokuapp.com/status_codes")

wait = WebDriverWait(driver, 10)
link_404 = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "404")))
link_404.click()

wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
body_text = driver.find_element(By.TAG_NAME, "body").text
assert "404" in body_text, "Page should mention 404 status"

# Verify a back link exists
back_link = driver.find_element(By.PARTIAL_LINK_TEXT, "here")
assert back_link.get_attribute("href"), "Back link should have an href"

print(f"Test passed: 404 page confirmed. Back link: {back_link.get_attribute('href')}")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the status codes demo which has links to different HTTP status pages.',
            3: 'We click the 404 link to navigate to the error page.',
            4: 'We read the body text and assert "404" is mentioned somewhere on the page.',
            5: 'We find the "here" back-link and assert it has a non-empty href, confirming the recovery route exists.',
        },
        quizQuestion: 'Why might a single-page application (SPA) return HTTP 200 even for a 404 route?',
        quizOptions: [
            'SPAs always return 200 by design',
            'The server serves the same HTML shell for all routes; the 404 state is handled in JavaScript after page load',
            'HTTP status codes do not apply to JavaScript applications',
            'Selenium always reports 200 for SPA routes',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. SPAs serve one HTML file from the server regardless of the URL path, so the HTTP status is 200. The 404 visual is rendered by client-side routing after the page loads.',
        quizFeedbackWrong: 'In a SPA, the server returns the same HTML for every URL (status 200) and the JavaScript router decides what to render. The 404 page is a client-side render, not a true HTTP 404 from the server.',
    },

    networkerror: {
        manualTasks: [
            'Open the dashboard and use browser DevTools to simulate offline mode',
            'Click Refresh Data or navigate to a data-heavy section',
            'Verify an error banner or empty state message appears — not a blank screen',
            'Restore network and verify the page recovers and loads data',
        ],
        whyPoints: [
            { title: 'Graceful Degradation', desc: 'An unhandled API error can crash the entire app. Automation intercepts requests and injects error responses to verify the UI degrades gracefully.' },
            { title: 'User-Facing Error Copy', desc: 'Error messages must be user-friendly. Automation asserts a human-readable message is shown rather than a raw JSON error or a blank div.' },
            { title: 'Recovery After Reconnect', desc: 'A successful retry after reconnect is a key UX expectation. Automation simulates offline then online and verifies data loads correctly on reconnect.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

driver = webdriver.Chrome()
driver.get("https://example.com/dashboard")

wait = WebDriverWait(driver, 10)
wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".dashboard-content")))

# Simulate offline by blocking all network requests via CDP
driver.execute_cdp_cmd("Network.enable", {})
driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
    "offline": True, "latency": 0, "downloadThroughput": 0, "uploadThroughput": 0
})

driver.find_element(By.ID, "refresh-btn").click()
error_banner = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".error-banner")))
assert error_banner.is_displayed(), "Error banner should appear when network is offline"
assert len(error_banner.text) > 0, "Error banner should contain a message"

# Restore network
driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
    "offline": False, "latency": 0, "downloadThroughput": -1, "uploadThroughput": -1
})

print(f"Test passed: Network error handled gracefully. Message: '{error_banner.text}'")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and utilities are imported, including DesiredCapabilities for network control.',
            2: 'Chrome opens the dashboard and we wait for it to load successfully.',
            3: 'We use the Chrome DevTools Protocol (CDP) via execute_cdp_cmd to enable network emulation.',
            4: 'We set the network to offline mode, then click the refresh button to trigger a failed API call.',
            5: 'We assert the error banner is visible with a non-empty message, then restore the network and verify.',
        },
        quizQuestion: 'What is execute_cdp_cmd and why is it used here instead of pulling the network cable?',
        quizOptions: [
            'It is a Selenium alias for JavaScript execution',
            'It sends commands directly to Chrome\'s DevTools Protocol, allowing programmatic control of network conditions in CI',
            'It is required to use WebDriverWait with network events',
            'cdp_cmd restarts the Chrome process with new flags',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. The Chrome DevTools Protocol exposes low-level browser APIs like network throttling. execute_cdp_cmd lets Selenium send these commands programmatically, making network simulation possible in headless CI environments.',
        quizFeedbackWrong: 'execute_cdp_cmd sends commands to the Chrome DevTools Protocol directly from Selenium. This enables reliable, scriptable network simulation in CI pipelines without needing any physical network changes.',
    },

    multistepsignup: {
        manualTasks: [
            'Complete Step 1 (account details) and click Next — verify Step 2 loads',
            'Complete Step 2 (personal info) and click Next — verify Step 3 loads',
            'On Step 3, click Back and verify Step 2 data is still populated',
            'Complete Step 3 and submit — verify the success or confirmation page',
        ],
        whyPoints: [
            { title: 'State Preservation on Back Navigation', desc: 'Users who click Back expect their data to still be there. Automation verifies each step retains its form values when navigating backwards.' },
            { title: 'Step Gating Logic', desc: 'Users must not be able to skip to Step 3 without completing Step 1. Automation tests direct URL access to step pages and verifies the redirect guard.' },
            { title: 'Progress Indicator Accuracy', desc: 'The progress bar or step indicator must match the actual current step. Automation reads the active step element and asserts it matches the expected step number.' },
        ],
        seleniumCode: `from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://example.com/onboarding")

wait = WebDriverWait(driver, 10)

# Step 1 - Account details
wait.until(EC.presence_of_element_located((By.ID, "step-1")))
driver.find_element(By.ID, "onboard-email").send_keys("wizard@example.com")
driver.find_element(By.ID, "onboard-password").send_keys("Passw0rd!")
driver.find_element(By.ID, "next-step-1").click()

# Step 2 - Personal info
wait.until(EC.presence_of_element_located((By.ID, "step-2")))
driver.find_element(By.ID, "first-name").send_keys("Alex")
driver.find_element(By.ID, "last-name").send_keys("Morgan")
driver.find_element(By.ID, "next-step-2").click()

# Step 3 - Preferences
wait.until(EC.presence_of_element_located((By.ID, "step-3")))
driver.find_element(By.ID, "back-to-step-2").click()

# Verify step 2 data is still populated
wait.until(EC.presence_of_element_located((By.ID, "step-2")))
assert driver.find_element(By.ID, "first-name").get_attribute("value") == "Alex"
assert driver.find_element(By.ID, "last-name").get_attribute("value") == "Morgan"

print("Test passed: Multi-step wizard preserves data on back navigation")
driver.quit()`,
        codeExplanations: {
            1: 'Selenium and wait utilities are imported.',
            2: 'Chrome opens the onboarding wizard at Step 1.',
            3: 'We fill Step 1 fields and click Next, waiting for Step 2 to appear.',
            4: 'We fill Step 2 and advance to Step 3.',
            5: 'We click Back to Step 2 and assert the first and last name fields still contain the values we entered earlier.',
        },
        quizQuestion: 'What does get_attribute("value") return for an input field, and how does it differ from .text?',
        quizOptions: [
            'They return the same thing — value and text are identical for inputs',
            'get_attribute("value") returns the current input content; .text returns the element\'s visible text, which is empty for input fields',
            '.text returns the placeholder text',
            'get_attribute("value") only works after form submission',
        ],
        quizCorrect: 1,
        quizFeedbackCorrect: 'Correct. Input elements have no inner text — their content lives in the "value" DOM attribute. .text on an input always returns an empty string.',
        quizFeedbackWrong: 'For <input> elements, the typed content is stored in the "value" attribute, not as inner text. .text returns "" for inputs. You must use get_attribute("value") to read what is currently in the field.',
    },
};

// ─── STEP A: MANUAL TEST ────────────────────────────────────────────────────

const ManualStep: React.FC<{ scenario: Scenario; onComplete: () => void; onAIFeedback: (feedback: string) => void }> = ({ scenario, onComplete, onAIFeedback }) => {
    const [phase, setPhase]   = useState<'intro'|'testing'|'write'|'feedback'|'reflection'>('intro');
    const [notes, setNotes]   = useState('');
    const [loading, setLoading] = useState(false);
    const content               = CONTENT[scenario.id];

    const evaluate = async () => {
        if (notes.trim().length < 20) return;
        setLoading(true);
        try {
            const res  = await fetch('http://localhost:8000/api/level0/evaluate-manual-test', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_steps: notes, scenario: scenario.title, url: scenario.url }),
            });
            const data = await res.json();
            onAIFeedback(data.feedback);
        } catch {
            onAIFeedback('Could not retrieve AI feedback. Is the backend running?');
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
                <div className="border border-purple-500/30 rounded-xl p-5 bg-purple-500/5 flex items-start space-x-3">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-purple-300 text-sm font-medium mb-1">AI feedback ready</p>
                        <p className="text-slate-400 text-sm">Your test steps have been evaluated. Open the <span className="text-purple-300 font-medium">AI Chat</span> panel on the right to read the feedback and ask follow-up questions.</p>
                    </div>
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