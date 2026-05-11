import React, { useState, useRef } from 'react';
import {
    LogIn, Search, List, CheckSquare, PlusSquare, Globe,
    Loader2, AlertCircle, Upload, X, Wand2, FileText,
} from 'lucide-react';

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

interface GenerateScreenProps {
    onGenerate: (description: string) => void;
    isGenerating: boolean;
    error: string | null;
    isLlamaAvailable: boolean;
}

const GenerateScreen: React.FC<GenerateScreenProps> = ({
    onGenerate,
    isGenerating,
    error,
    isLlamaAvailable,
}) => {
    const [description, setDescription] = useState('');
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName]       = useState<string | null>(null);
    const fileInputRef                  = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setFileContent(text);
            setFileName(file.name);
            if (!description.trim()) {
                setDescription(text.slice(0, 2000));
            }
        };
        reader.readAsText(file);
    };

    const clearFile = () => {
        setFileContent(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleScenarioClick = (scenario: Scenario) => {
        if (isGenerating) return;
        setDescription(scenario.llmDescription);
        clearFile();
    };

    const handleSubmit = () => {
        const text = fileContent ?? description;
        if (!text.trim() || isGenerating) return;
        onGenerate(text.trim());
    };

    const canSubmit = (fileContent || description.trim()) && !isGenerating && isLlamaAvailable;

    return (
        <div className="flex gap-6">
            {/* ── Main generate panel ──────────────────────────────────── */}
            <div className="flex-1 min-w-0">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col gap-5">

                    {/* Textarea */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                            Describe your test scenario
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder={
                                'e.g. Navigate to https://example.com/login. Enter "admin" into the username field and "password123" into the password field. Click the submit button. Verify the dashboard heading appears.'
                            }
                            rows={7}
                            disabled={isGenerating}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/8" />
                        <span className="text-xs text-slate-600">or</span>
                        <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {/* File upload */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                            Upload a file
                        </label>
                        {fileName ? (
                            <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3">
                                <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <span className="text-sm text-purple-300 flex-1 truncate">{fileName}</span>
                                <button
                                    onClick={clearFile}
                                    disabled={isGenerating}
                                    className="text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating}
                                className="w-full border border-dashed border-white/15 hover:border-purple-500/40 rounded-xl px-4 py-5 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <Upload className="w-5 h-5 text-slate-500" />
                                <span className="text-xs text-slate-500">
                                    Drop a .txt, .feature, or .md file with your test steps
                                </span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.feature,.md,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl
                                   bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed
                                   text-white font-medium text-sm transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Selenium code…
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4" />
                                Generate Selenium Code
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-600">
                        {isLlamaAvailable
                            ? 'Generation typically takes 10–15 seconds'
                            : 'Llama 3 is offline — start Ollama to enable generation'}
                    </p>
                </div>
            </div>

            {/* ── Example scenarios side panel ─────────────────────────── */}
            <div className="w-64 flex-shrink-0">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">
                    Example scenarios
                </p>
                <div className="flex flex-col gap-2">
                    {SCENARIOS.map(scenario => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario)}
                            disabled={isGenerating}
                            className={`text-left rounded-xl border p-3.5 flex flex-col gap-1.5 transition-all
                                ${description === scenario.llmDescription && !fileContent
                                    ? 'bg-purple-500/12 border-purple-500/40'
                                    : 'bg-white/4 border-white/8 hover:bg-white/7 hover:border-white/18 cursor-pointer'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            <div className="flex items-center gap-2">
                                <scenario.Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-xs font-semibold text-white">{scenario.title}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-snug">{scenario.cardDesc}</p>
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                    Click any example to pre-fill the description, then customise or generate as-is.
                </p>
            </div>
        </div>
    );
};

export default GenerateScreen;
