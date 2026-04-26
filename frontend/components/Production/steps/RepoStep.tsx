import React from 'react';
import { GitBranch, Lock, Globe, RefreshCw, AlertCircle, Folder, ChevronRight } from 'lucide-react';
import { Repository } from '../Production';

interface RepoStepProps {
    repositories:  Repository[];
    isLoading:     boolean;
    error:         string | null;
    selectedRepo:  Repository | null;
    onSelect:      (repo: Repository) => void;
    onRetry:       () => void;
}

const RepoStep: React.FC<RepoStepProps> = ({
    repositories, isLoading, error, selectedRepo, onSelect, onRetry,
}) => {
    const getLanguageColor = (lang: string) => {
        const map: Record<string, string> = {
            JavaScript: 'bg-yellow-400', TypeScript: 'bg-blue-400',
            Python: 'bg-green-400',      Java: 'bg-red-400',
            'C++': 'bg-pink-400',        Go: 'bg-cyan-400',
            Rust: 'bg-orange-400',       Ruby: 'bg-red-500',
            PHP: 'bg-purple-400',
        };
        return map[lang] || 'bg-slate-400';
    };

    const formatDate = (d: string) => {
        const diff = Math.ceil((Date.now() - new Date(d).getTime()) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7)  return `${diff}d ago`;
        if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
        return `${Math.floor(diff / 30)}mo ago`;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Choose a Repository</h2>
                    <p className="text-slate-400 text-sm mt-1">Select the GitHub repo you want to work with</p>
                </div>
                <button
                    onClick={onRetry}
                    disabled={isLoading}
                    className="flex items-center space-x-2 text-purple-300 hover:text-white text-sm transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-purple-300">Loading repositories...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-24">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <p className="text-red-300 mb-4 text-center">{error}</p>
                    <button onClick={onRetry} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-6 py-2 rounded-xl transition-colors text-sm">
                        Try Again
                    </button>
                </div>
            )}

            {!isLoading && !error && repositories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24">
                    <GitBranch className="w-12 h-12 text-purple-400 mb-4 opacity-50" />
                    <p className="text-purple-300">No repositories found</p>
                    <p className="text-slate-500 text-sm mt-1">Create a repository on GitHub to get started</p>
                </div>
            )}

            {!isLoading && !error && repositories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repositories.map(repo => (
                        <button
                            key={repo.id}
                            onClick={() => onSelect(repo)}
                            className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 group ${
                                selectedRepo?.id === repo.id
                                    ? 'border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                    <GitBranch className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <h3 className="font-semibold text-white truncate text-sm">{repo.name}</h3>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                    {repo.private
                                        ? <Lock className="w-3.5 h-3.5 text-yellow-400" />
                                        : <Globe className="w-3.5 h-3.5 text-green-400" />
                                    }
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                {repo.description || 'No description'}
                            </p>

                            <div className="flex items-center justify-between">
                                {repo.language ? (
                                    <div className="flex items-center space-x-1.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${getLanguageColor(repo.language)}`} />
                                        <span className="text-xs text-slate-400">{repo.language}</span>
                                    </div>
                                ) : <span />}
                                <span className="text-xs text-slate-500">{formatDate(repo.updated_at)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RepoStep;
