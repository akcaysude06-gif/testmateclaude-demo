import React from 'react';
import { LogIn, Search, List, CheckSquare, PlusSquare, Globe, Loader2, AlertCircle } from 'lucide-react';

interface Scenario {
    id: string;
    title: string;
    cardDesc: string;
    category: string;
    Icon: React.FC<{ className?: string }>;
    llmDescription: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'title',
        title: 'Page Title Check',
        category: 'Verification',
        cardDesc: 'Open a webpage and verify its title matches what is expected.',
        Icon: Globe,
        llmDescription:
            "Navigate to https://the-internet.herokuapp.com. Verify the page title is 'The Internet'.",
    },
    {
        id: 'login',
        title: 'Login Flow',
        category: 'Authentication',
        cardDesc: 'Type a username and password into a login form and submit it.',
        Icon: LogIn,
        llmDescription:
            "Navigate to https://the-internet.herokuapp.com/login. Enter 'tomsmith' into the field with id 'username'. Enter 'SuperSecretPassword!' into the field with id 'password'. Click the login button.",
    },
    {
        id: 'checkbox',
        title: 'Checkbox Toggle',
        category: 'Forms',
        cardDesc: 'Find a checkbox on the page and click it to check it.',
        Icon: CheckSquare,
        llmDescription:
            "Navigate to https://the-internet.herokuapp.com/checkboxes. Find the first checkbox on the page and click it.",
    },
    {
        id: 'dropdown',
        title: 'Dropdown Selection',
        category: 'Forms',
        cardDesc: 'Open a dropdown menu and select one of its options.',
        Icon: List,
        llmDescription:
            "Navigate to https://the-internet.herokuapp.com/dropdown. Use Selenium's Select class on the element with id 'dropdown' to select 'Option 1' by visible text.",
    },
    {
        id: 'add-element',
        title: 'Button Click',
        category: 'UI Interaction',
        cardDesc: "Click a button on the page and verify a new element appears.",
        Icon: PlusSquare,
        llmDescription:
            "Navigate to https://the-internet.herokuapp.com/add_remove_elements/. Click the 'Add Element' button. Verify a 'Delete' button appears on the page.",
    },
    {
        id: 'search',
        title: 'Search Input',
        category: 'Search',
        cardDesc: 'Type a search term into an input field and submit the form.',
        Icon: Search,
        llmDescription:
            "Navigate to https://www.google.com. Find the search input with name 'q'. Type 'Selenium' and press Enter.",
    },
];

interface ScenarioPickerProps {
    onSelect: (id: string, description: string) => void;
    isGenerating: boolean;
    selectedId: string | null;
    error: string | null;
    isLlamaAvailable: boolean;
}

const ScenarioPicker: React.FC<ScenarioPickerProps> = ({
    onSelect,
    isGenerating,
    selectedId,
    error,
    isLlamaAvailable,
}) => (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-2">Step 4</p>
            <h2 className="text-2xl font-light text-white tracking-tight mb-1">Choose a scenario to see it automated</h2>
            <p className="text-sm text-slate-500">Click any card — Llama 3 generates the code instantly.</p>
        </div>

        {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-5 py-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map(scenario => {
                const isSelected = selectedId === scenario.id;
                const isOther    = isGenerating && !isSelected;

                return (
                    <button
                        key={scenario.id}
                        onClick={() => !isGenerating && onSelect(scenario.id, scenario.llmDescription)}
                        disabled={isGenerating}
                        className={`text-left rounded-xl border p-5 flex flex-col gap-3 transition-all ${
                            isSelected
                                ? 'bg-purple-500/12 border-purple-500/40'
                                : isOther
                                    ? 'bg-white/3 border-white/8 opacity-40 cursor-not-allowed'
                                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 cursor-pointer'
                        }`}
                    >
                        {/* Icon row */}
                        <div className="flex items-start justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                    ? 'bg-purple-500/20 border border-purple-500/30'
                                    : 'bg-white/5 border border-white/10'
                            }`}>
                                {isSelected && isGenerating ? (
                                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                ) : (
                                    <scenario.Icon className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                                )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                isSelected
                                    ? 'text-purple-300 border-purple-500/30 bg-purple-500/10'
                                    : 'text-slate-500 border-white/10 bg-white/5'
                            }`}>
                                {scenario.category}
                            </span>
                        </div>

                        {/* Text */}
                        <div>
                            <p className="text-sm font-semibold text-white mb-1">{scenario.title}</p>
                            <p className="text-xs text-slate-400 leading-relaxed">{scenario.cardDesc}</p>
                        </div>

                        {isSelected && isGenerating && (
                            <p className="text-xs text-purple-400">Generating Selenium code…</p>
                        )}
                    </button>
                );
            })}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
            {isLlamaAvailable
                ? 'Generation typically takes 10–15 seconds'
                : 'Llama 3 is offline — start Ollama to enable generation'}
        </p>
    </div>
);

export default ScenarioPicker;
