import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Wand2, AlertCircle } from 'lucide-react';

interface AIPanelProps {
    testDescription: string;
    onTestDescriptionChange: (value: string) => void;
    uploadedFile: File | null;
    onFileUpload: (file: File) => void;
    onRemoveFile: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    error: string | null;
    isLlamaAvailable: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({
    testDescription,
    onTestDescriptionChange,
    uploadedFile,
    onFileUpload,
    onRemoveFile,
    onGenerate,
    isGenerating,
    error,
    isLlamaAvailable,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter  = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave  = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver   = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) isValidFile(file) ? onFileUpload(file) : alert('Please upload a text file (.txt, .md, .py, or .java)');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) isValidFile(file) ? onFileUpload(file) : alert('Please upload a text file (.txt, .md, .py, or .java)');
    };

    const isValidFile = (file: File) =>
        ['.txt', '.md', '.py', '.java', '.json', '.xml'].some(ext => file.name.toLowerCase().endsWith(ext));

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden h-full flex flex-col">

            {/* Panel header */}
            <div className="border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">AI Code Generator</span>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white
                               bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Upload className="w-3.5 h-3.5" />
                    Import File
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.py,.java,.json,.xml"
                       onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Drop / text area */}
            <div className="flex-1 p-5 flex flex-col">
                <div
                    className={`flex-1 rounded-lg border transition-colors ${
                        isDragging
                            ? 'border-purple-400/50 bg-purple-500/5'
                            : 'border-white/10 bg-black/20'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {uploadedFile ? (
                        <div className="h-full p-6 flex flex-col items-center justify-center gap-3">
                            <FileText className="w-10 h-10 text-slate-400" />
                            <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                            <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                            <button
                                onClick={onRemoveFile}
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white
                                           bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> Remove
                            </button>
                        </div>
                    ) : isDragging ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2">
                            <Upload className="w-8 h-8 text-purple-400 animate-bounce" />
                            <p className="text-sm text-purple-300">Drop your file here</p>
                            <p className="text-xs text-slate-500">.txt · .md · .py · .java · .json · .xml</p>
                        </div>
                    ) : (
                        <textarea
                            value={testDescription}
                            onChange={e => onTestDescriptionChange(e.target.value)}
                            placeholder={`Write or paste your test scenario here...\n\nExample:\nNavigate to https://example.com/login\nEnter username 'testuser'\nEnter password 'password123'\nClick the 'Sign In' button\nVerify redirect to dashboard\n\n...or drag and drop a test scenario file`}
                            className="w-full h-full min-h-[260px] bg-transparent text-white text-sm font-mono
                                       placeholder-slate-600 focus:outline-none resize-none p-4 leading-relaxed"
                            disabled={isGenerating}
                        />
                    )}
                </div>

                {/* Character count */}
                {testDescription && !uploadedFile && (
                    <div className="mt-2 flex justify-between items-center">
                        <span className={`text-xs ${testDescription.length > 2000 ? 'text-red-400' : 'text-slate-600'}`}>
                            {testDescription.length} / 2000
                        </span>
                        {testDescription.length > 2000 && (
                            <span className="text-xs text-red-400">Too long — please shorten</span>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-3 flex items-start gap-2 bg-red-500/8 border border-red-500/20
                                    rounded-lg px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* Generate button */}
                <button
                    onClick={onGenerate}
                    disabled={isGenerating || (!testDescription.trim() && !uploadedFile) || !isLlamaAvailable || testDescription.length > 2000}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-lg
                               bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-slate-600
                               disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating with Llama 3…
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4" />
                            Generate Selenium Code
                        </>
                    )}
                </button>

                <p className="mt-2.5 text-center text-xs text-slate-600">
                    {isGenerating
                        ? 'This may take 10–15 seconds…'
                        : 'The more detail you provide, the better the result'}
                </p>
            </div>
        </div>
    );
};

export default AIPanel;
