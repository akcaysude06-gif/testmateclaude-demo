import React, { useState, useEffect } from 'react';
import { FolderTree, FileCode, CheckCircle, Loader } from 'lucide-react';
// @ts-ignore
import FileTreeSelector from './FileTreeSelector';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface Repository {
    id: number;
    name: string;
    full_name: string;
}

interface WorkModePanelProps {
    selectedRepo: Repository | null;
    workMode: 'whole-project' | 'specific-files' | null;
    onSelectMode: (mode: 'whole-project' | 'specific-files') => void;
    onFilesSelected: (files: string[]) => void;
    selectedFilesCount: number;
}

const WorkModePanel: React.FC<WorkModePanelProps> = ({
                                                         selectedRepo,
                                                         workMode,
                                                         onSelectMode,
                                                         onFilesSelected,
                                                         selectedFilesCount
                                                     }) => {
    const [showFileTree, setShowFileTree] = useState(false);
    const [fileTree, setFileTree] = useState<any[]>([]);
    const [isLoadingTree, setIsLoadingTree] = useState(false);

    useEffect(() => {
        if (workMode === 'specific-files' && selectedRepo && fileTree.length === 0) {
            loadFileTree();
            setShowFileTree(true);
        }
    }, [workMode, selectedRepo]);

    const loadFileTree = async () => {
        if (!selectedRepo) return;

        setIsLoadingTree(true);
        try {
            const token = authUtils.getToken();
            const [owner, repo] = selectedRepo.full_name.split('/');
            const response = await apiService.getRepositoryTree(owner, repo, token!);
            setFileTree(response.tree);
        } catch (error) {
            console.error('Failed to load file tree:', error);
        } finally {
            setIsLoadingTree(false);
        }
    };

    const handleModeSelect = (mode: 'whole-project' | 'specific-files') => {
        onSelectMode(mode);
        if (mode === 'whole-project') {
            setShowFileTree(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-300px)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10 p-4">
                <h3 className="font-semibold text-white">Work Scope</h3>
                <p className="text-xs text-blue-200 mt-1">
                    {selectedRepo ? 'Choose your analysis scope' : 'Select a repository first'}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {!selectedRepo ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FolderTree className="w-12 h-12 text-purple-400 mb-4 opacity-50" />
                        <p className="text-purple-300 text-sm">
                            Select a repository to choose work scope
                        </p>
                    </div>
                ) : showFileTree ? (
                    <FileTreeSelector
                        tree={fileTree}
                        isLoading={isLoadingTree}
                        onFilesSelected={onFilesSelected}
                        onBack={() => {
                            setShowFileTree(false);
                            onSelectMode(null as any);
                        }}
                    />
                ) : (
                    <div className="space-y-3">
                        {/* Whole Project Option */}
                        <button
                            onClick={() => handleModeSelect('whole-project')}
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                                workMode === 'whole-project'
                                    ? 'bg-blue-500/30 border-2 border-blue-400'
                                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                    workMode === 'whole-project'
                                        ? 'bg-blue-500/30'
                                        : 'bg-blue-500/20'
                                }`}>
                                    <FolderTree className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-sm">
                                            Whole Project
                                        </h4>
                                        {workMode === 'whole-project' && (
                                            <CheckCircle className="w-4 h-4 text-blue-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-blue-200">
                                        Analyze entire repository
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Specific Files Option */}
                        <button
                            onClick={() => handleModeSelect('specific-files')}
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                                workMode === 'specific-files'
                                    ? 'bg-purple-500/30 border-2 border-purple-400'
                                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${
                                    workMode === 'specific-files'
                                        ? 'bg-purple-500/30'
                                        : 'bg-purple-500/20'
                                }`}>
                                    <FileCode className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-white text-sm">
                                            Specific Files
                                        </h4>
                                        {workMode === 'specific-files' && (
                                            <CheckCircle className="w-4 h-4 text-purple-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-purple-200">
                                        {selectedFilesCount > 0
                                            ? `${selectedFilesCount} file${selectedFilesCount !== 1 ? 's' : ''} selected`
                                            : 'Select specific files'
                                        }
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkModePanel;