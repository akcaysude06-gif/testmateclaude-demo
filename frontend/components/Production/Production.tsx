import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import RepositoryList from './RepoList';
import WorkModePanel from './WorkModePanel';
import ActionPanel from './ActionPanel';
import { apiService } from '../../services/api';
import { authUtils } from '../../utils/auth';

interface ProductionProps {
    onBack: () => void;
}

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

type WorkMode = 'whole-project' | 'specific-files' | null;

const Production: React.FC<ProductionProps> = ({ onBack }) => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [workMode, setWorkMode] = useState<WorkMode>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRepositories();
    }, []);

    // Reset when repository changes
    useEffect(() => {
        if (selectedRepo) {
            setWorkMode(null);
            setSelectedFiles([]);
        }
    }, [selectedRepo]);

    const loadRepositories = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = authUtils.getToken();
            const data = await apiService.getUserRepositories(token!);
            setRepositories(data.repositories);
        } catch (err: any) {
            console.error('Failed to load repositories:', err);
            setError(err.response?.data?.detail || 'Failed to load repositories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRepo = (repo: Repository) => {
        setSelectedRepo(repo);
    };

    const handleWorkModeSelect = (mode: WorkMode) => {
        setWorkMode(mode);
        if (mode === 'whole-project') {
            setSelectedFiles([]);
        }
    };

    const handleFilesSelected = (files: string[]) => {
        setSelectedFiles(files);
    };

    return (
        <div className="max-w-[1800px] mx-auto">
            {/* Header */}
            <button
                onClick={onBack}
                className="text-purple-300 hover:text-white mb-6 flex items-center space-x-2 transition-colors"
            >
                <ChevronRight className="w-4 h-4 transform rotate-180" />
                <span>Back to modes</span>
            </button>

            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Production Mode
                        </h1>
                        <p className="text-purple-100">
                            Work with your GitHub repositories and get AI-powered testing assistance
                        </p>
                    </div>
                    <Sparkles className="w-12 h-12 text-white/30" />
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-12 gap-6">
                {/* Column 1: Repository List (3/12) */}
                <div className="col-span-3">
                    <RepositoryList
                        repositories={repositories}
                        selectedRepo={selectedRepo}
                        onSelectRepo={handleSelectRepo}
                        isLoading={isLoading}
                        error={error}
                        onRetry={loadRepositories}
                    />
                </div>

                {/* Column 2: Work Mode Selection (3/12) */}
                <div className="col-span-3">
                    <WorkModePanel
                        selectedRepo={selectedRepo}
                        workMode={workMode}
                        onSelectMode={handleWorkModeSelect}
                        onFilesSelected={handleFilesSelected}
                        selectedFilesCount={selectedFiles.length}
                    />
                </div>

                {/* Column 3: Action Panel & Results (6/12) */}
                <div className="col-span-6">
                    <ActionPanel
                        selectedRepo={selectedRepo}
                        workMode={workMode}
                        selectedFiles={selectedFiles}
                    />
                </div>
            </div>
        </div>
    );
};

export default Production;