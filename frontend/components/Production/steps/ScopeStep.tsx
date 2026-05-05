import React, { useState } from 'react';
import { FolderTree, FileCode, ChevronRight, Folder, File, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { Repository, CodeType, ScopeType } from '../Production';
import { apiService } from '../../../services/api';
import { authUtils } from '../../../utils/auth';

interface ScopeStepProps {
    repo:      Repository;
    codeType:  CodeType;
    onConfirm: (scope: ScopeType, files: string[]) => void;
}

interface TreeNode {
    name:      string;
    path:      string;
    type:      'file' | 'dir';
    children?: TreeNode[];
}

const ScopeStep: React.FC<ScopeStepProps> = ({ repo, codeType, onConfirm }) => {
    const [chosen,        setChosen]        = useState<ScopeType | null>(null);
    const [tree,          setTree]          = useState<TreeNode[]>([]);
    const [loadingTree,   setLoadingTree]   = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [expandedDirs,  setExpandedDirs]  = useState<Set<string>>(new Set());

    const codeLabel = codeType === 'application-code' ? 'application code' : 'test code';

    const handleChooseScope = async (sc: ScopeType) => {
        setChosen(sc);
        if (sc === 'specific-files' && tree.length === 0) {
            setLoadingTree(true);
            try {
                const token         = authUtils.getToken();
                const [owner, name] = repo.full_name.split('/');
                const res           = await apiService.getRepositoryTree(owner, name, token!);
                setTree(res.tree);
            } catch (e) {
                console.error('Failed to load tree', e);
            } finally {
                setLoadingTree(false);
            }
        }
    };

    const toggleDir = (path: string) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    };

    const toggleFile = (path: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev);
            next.has(path) ? next.delete(path) : next.add(path);
            return next;
        });
    };

    const renderTree = (nodes: TreeNode[], level = 0): React.ReactNode =>
        nodes.map(node => {
            const isDir      = node.type === 'dir';
            const isExpanded = expandedDirs.has(node.path);
            const isSelected = selectedFiles.has(node.path);
            return (
                <div key={node.path} style={{ marginLeft: level * 14 }}>
                    <div className="flex items-center space-x-1.5 py-1 px-2 hover:bg-white/5 rounded group text-xs cursor-pointer">
                        {isDir ? (
                            <button onClick={() => toggleDir(node.path)} className="flex-shrink-0">
                                {isExpanded
                                    ? <ChevronDown className="w-3 h-3 text-slate-500" />
                                    : <ChevronRight className="w-3 h-3 text-slate-500" />
                                }
                            </button>
                        ) : <span className="w-3" />}

                        <button onClick={() => toggleFile(node.path)} className="flex-shrink-0">
                            {isSelected
                                ? <CheckSquare className="w-3 h-3 text-purple-400" />
                                : <Square className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                            }
                        </button>

                        {isDir
                            ? <Folder className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            : <File className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        }

                        <span className={`truncate flex-1 ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                            {node.name}
                        </span>
                    </div>
                    {isDir && isExpanded && node.children && renderTree(node.children, level + 1)}
                </div>
            );
        });

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">Choose your scope</h2>
                <p className="text-slate-400 text-sm">
                    How much of <span className="text-purple-300 font-medium">{repo.name}</span>'s {codeLabel} should the AI see?
                </p>
            </div>

            {/* Two scope cards */}
            {!chosen && (
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <button
                        onClick={() => handleChooseScope('whole-project')}
                        className="text-left p-7 rounded-2xl border-2 border-blue-500/30 hover:border-blue-400 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-200 group"
                    >
                        <div className="inline-flex p-3 rounded-xl bg-blue-500/20 mb-5">
                            <FolderTree className="w-8 h-8 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Whole Project</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Give the AI full context of the repository. Best for high-level analysis and test planning.
                        </p>
                        <div className="flex items-center space-x-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                            <span>Continue</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>

                    <button
                        onClick={() => handleChooseScope('specific-files')}
                        className="text-left p-7 rounded-2xl border-2 border-purple-500/30 hover:border-purple-400 bg-gradient-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-200 group"
                    >
                        <div className="inline-flex p-3 rounded-xl bg-purple-500/20 mb-5">
                            <FileCode className="w-8 h-8 text-purple-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Specific Files</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Pick exactly which files to include. Best for focused, precise AI assistance.
                        </p>
                        <div className="flex items-center space-x-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                            <span>Browse files</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            )}

            {/* Whole project confirmed */}
            {chosen === 'whole-project' && (
                <div className="max-w-lg">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                        <div className="flex items-center space-x-3 mb-3">
                            <FolderTree className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">Whole Project selected</span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            The AI will have full context of <strong className="text-white">{repo.full_name}</strong> when responding.
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setChosen(null)}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
                        >
                            ← Change
                        </button>
                        <button
                            onClick={() => onConfirm('whole-project', [])}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Specific files — file tree */}
            {chosen === 'specific-files' && (
                <div className="max-w-2xl">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-5">
                        <div className="bg-purple-500/10 border-b border-white/10 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <FileCode className="w-4 h-4 text-purple-400" />
                                <span className="text-white text-sm font-medium">{repo.name}</span>
                            </div>
                            <span className="text-xs text-slate-400">
                                {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                            </span>
                        </div>

                        <div className="p-3 max-h-80 overflow-y-auto">
                            {loadingTree ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : tree.length > 0 ? (
                                renderTree(tree)
                            ) : (
                                <p className="text-center text-slate-500 text-xs py-6">No files found</p>
                            )}
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => setChosen(null)}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
                        >
                            ← Change
                        </button>
                        <button
                            onClick={() => onConfirm('specific-files', Array.from(selectedFiles))}
                            disabled={selectedFiles.size === 0}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScopeStep;
