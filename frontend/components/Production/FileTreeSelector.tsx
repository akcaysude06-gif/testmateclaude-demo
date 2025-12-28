import React, { useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, CheckSquare, Square, ArrowLeft } from 'lucide-react';

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'dir';
    children?: TreeNode[];
}

interface FileTreeSelectorProps {
    tree: TreeNode[];
    isLoading: boolean;
    onFilesSelected: (files: string[]) => void;
    onBack: () => void;
}

const FileTreeSelector: React.FC<FileTreeSelectorProps> = ({
                                                               tree,
                                                               isLoading,
                                                               onFilesSelected,
                                                               onBack
                                                           }) => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

    const toggleDir = (path: string) => {
        const newExpanded = new Set(expandedDirs);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedDirs(newExpanded);
    };

    const toggleFile = (path: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(path)) {
            newSelected.delete(path);
        } else {
            newSelected.add(path);
        }
        setSelectedFiles(newSelected);
        onFilesSelected(Array.from(newSelected));
    };

    const renderTree = (nodes: TreeNode[], level: number = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedDirs.has(node.path);
            const isSelected = selectedFiles.has(node.path);
            const isDir = node.type === 'dir';

            return (
                <div key={node.path} style={{ marginLeft: `${level * 12}px` }}>
                    <div className="flex items-center space-x-1 py-1 px-2 hover:bg-white/5 rounded group text-sm">
                        {isDir && (
                            <button onClick={() => toggleDir(node.path)} className="flex-shrink-0">
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-purple-400" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-purple-400" />
                                )}
                            </button>
                        )}

                        <button onClick={() => toggleFile(node.path)} className="flex-shrink-0">
                            {isSelected ? (
                                <CheckSquare className="w-3 h-3 text-green-400" />
                            ) : (
                                <Square className="w-3 h-3 text-purple-400 opacity-50 group-hover:opacity-100" />
                            )}
                        </button>

                        {isDir ? (
                            <Folder className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        ) : (
                            <File className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        )}

                        <span className={`text-xs flex-1 truncate ${isSelected ? 'text-white font-medium' : 'text-purple-200'}`}>
                            {node.name}
                        </span>
                    </div>

                    {isDir && isExpanded && node.children && (
                        <div>{renderTree(node.children, level + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="h-full flex flex-col">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-purple-300 hover:text-white text-sm mb-3 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
            </button>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto bg-black/20 rounded-lg p-2 text-xs">
                        {tree.length > 0 ? renderTree(tree) : <p className="text-center text-purple-300 py-4">No files</p>}
                    </div>

                    <div className="mt-3 text-center">
                        <p className="text-xs text-purple-300">
                            <span className="font-semibold text-white">{selectedFiles.size}</span> selected
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default FileTreeSelector;
