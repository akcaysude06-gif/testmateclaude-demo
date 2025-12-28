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
                                             isLlamaAvailable
                                         }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidFile(file)) {
                onFileUpload(file);
            } else {
                alert('Please upload a text file (.txt, .md, .py, or .java)');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (isValidFile(file)) {
                onFileUpload(file);
            } else {
                alert('Please upload a text file (.txt, .md, .py, or .java)');
            }
        }
    };

    const isValidFile = (file: File): boolean => {
        const validExtensions = ['.txt', '.md', '.py', '.java', '.json', '.xml'];
        return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Wand2 className="w-5 h-5 text-green-400" />
                        <h3 className="font-semibold text-white">AI Code Generator</h3>
                    </div>
                    <button
                        onClick={handleImportClick}
                        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all text-sm"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Import File</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md,.py,.java,.json,.xml"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 flex flex-col">
                {/* Drag & Drop Zone / Text Area */}
                <div
                    className={`flex-1 border-2 border-dashed rounded-xl transition-all ${
                        isDragging
                            ? 'border-green-400 bg-green-500/10'
                            : 'border-white/20 bg-white/5'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {uploadedFile ? (
                        /* File Uploaded State */
                        <div className="h-full p-6 flex flex-col items-center justify-center">
                            <div className="bg-green-500/20 rounded-2xl p-6 mb-4">
                                <FileText className="w-16 h-16 text-green-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-2">{uploadedFile.name}</h4>
                            <p className="text-purple-300 text-sm mb-4">
                                {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                                onClick={onRemoveFile}
                                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-all"
                            >
                                <X className="w-4 h-4" />
                                <span>Remove File</span>
                            </button>
                        </div>
                    ) : (
                        /* Text Input / Drop Zone */
                        <div className="h-full p-6 flex flex-col">
                            {isDragging ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <Upload className="w-16 h-16 text-green-400 mb-4 animate-bounce" />
                                    <p className="text-green-300 font-semibold text-lg">Drop your file here</p>
                                    <p className="text-green-200 text-sm mt-2">
                                        Supports .txt, .md, .py, .java, .json, .xml
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col">
                                    <textarea
                                        ref={textareaRef}
                                        value={testDescription}
                                        onChange={(e) => onTestDescriptionChange(e.target.value)}
                                        placeholder="Write or paste your test scenario here...&#10;&#10;Example:&#10;Navigate to https://example.com/login&#10;Enter username 'testuser'&#10;Enter password 'password123'&#10;Click the 'Sign In' button&#10;Verify redirect to dashboard&#10;&#10;...or drag and drop a test scenario file"
                                        className="flex-1 w-full bg-transparent text-white placeholder-purple-300/50 focus:outline-none resize-none font-mono text-sm"
                                        disabled={isGenerating}
                                    />

                                    {!testDescription && (
                                        <div className="mt-4 flex items-center justify-center text-purple-300/50">
                                            <Upload className="w-5 h-5 mr-2" />
                                            <span className="text-sm">Drag files here</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Character Count */}
                {testDescription && !uploadedFile && (
                    <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm ${testDescription.length > 2000 ? 'text-red-400' : 'text-purple-300'}`}>
                {testDescription.length} / 2000 characters
            </span>
                        {testDescription.length > 2000 && (
                            <span className="text-xs text-red-400">Too long! Please reduce.</span>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                )}

                {/* Generate Button */}
                <div className="mt-6">
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating || (!testDescription.trim() && !uploadedFile) || !isLlamaAvailable || testDescription.length > 2000}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center space-x-3"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Generating Code with Llama 3...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span>Generate Selenium Code</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Info Text */}
                <p className="mt-4 text-center text-sm text-purple-300">
                    {isGenerating ? (
                        <span>⏳ This may take 10-15 seconds...</span>
                    ) : (
                        <span>💡 The more details you provide, the better the generated code</span>
                    )}
                </p>
            </div>
        </div>
    );
};

export default AIPanel;