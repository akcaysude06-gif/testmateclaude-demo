import React from 'react';
import { GitBranch, Lock, Globe, RefreshCw, AlertCircle, Folder } from 'lucide-react';

interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string;
    private: boolean;
    html_url: string;
    language: string;
    updated_at: string;
}

interface RepositoryListProps {
    repositories: Repository[];
    selectedRepo: Repository | null;
    onSelectRepo: (repo: Repository) => void;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
                                                           repositories,
                                                           selectedRepo,
                                                           onSelectRepo,
                                                           isLoading,
                                                           error,
                                                           onRetry
                                                       }) => {
    const getLanguageColor = (language: string) => {
        const colors: { [key: string]: string } = {
            JavaScript: 'bg-yellow-500',
            TypeScript: 'bg-blue-500',
            Python: 'bg-green-500',
            Java: 'bg-red-500',
            'C++': 'bg-pink-500',
            Go: 'bg-cyan-500',
            Rust: 'bg-orange-500',
            Ruby: 'bg-red-600',
            PHP: 'bg-purple-500',
        };
        return colors[language] || 'bg-gray-500';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden h-[calc(100vh-300px)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Folder className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white">Your Repositories</h3>
                    </div>
                    <button
                        onClick={onRetry}
                        disabled={isLoading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-purple-300 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                {!isLoading && !error && (
                    <p className="text-sm text-purple-300 mt-2">
                        {repositories.length} repositories found
                    </p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-300">Loading repositories...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-red-300 text-center mb-4">{error}</p>
                        <button
                            onClick={onRetry}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : repositories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <GitBranch className="w-12 h-12 text-purple-400 mb-4" />
                        <p className="text-purple-300 mb-2">No repositories found</p>
                        <p className="text-sm text-purple-400">
                            Create a repository on GitHub to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {repositories.map((repo) => (
                            <button
                                key={repo.id}
                                onClick={() => onSelectRepo(repo)}
                                className={`w-full text-left p-4 rounded-xl transition-all ${
                                    selectedRepo?.id === repo.id
                                        ? 'bg-purple-500/30 border-2 border-purple-400'
                                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <GitBranch className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <h4 className="font-semibold text-white truncate">
                                            {repo.name}
                                        </h4>
                                    </div>
                                    {repo.private ? (
                                        <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0 ml-2" />
                                    ) : (
                                        <Globe className="w-4 h-4 text-green-400 flex-shrink-0 ml-2" />
                                    )}
                                </div>

                                <p className="text-sm text-purple-200 mb-3 line-clamp-2">
                                    {repo.description || 'No description'}
                                </p>

                                <div className="flex items-center justify-between">
                                    {repo.language && (
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                                            <span className="text-xs text-purple-300">{repo.language}</span>
                                        </div>
                                    )}
                                    <span className="text-xs text-purple-400">
                                        {formatDate(repo.updated_at)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepositoryList;