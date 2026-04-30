import React from 'react';
import { GitBranch, FolderOpen, Plus, Link2 } from 'lucide-react';
import { Repository, CodeType, ScopeType } from './Production';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SavedJira {
    key:        string;
    name:       string;
    avatar_url: string | null;
}

export interface SavedProject {
    id:             string;   // = repo.full_name
    repo:           Repository;
    jira?:          SavedJira;
    codeType?:      CodeType;
    scope?:         ScopeType;
    selectedFiles?: string[];
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'testmate_connected_projects';

export function loadSavedProjects(): SavedProject[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

export function upsertSavedProject(project: SavedProject): void {
    const projects = loadSavedProjects();
    const idx = projects.findIndex(p => p.id === project.id);
    if (idx >= 0) projects[idx] = { ...projects[idx], ...project };
    else projects.unshift(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
    JavaScript: 'bg-yellow-400',
    TypeScript: 'bg-blue-400',
    Python:     'bg-green-400',
    Java:       'bg-red-400',
    'C++':      'bg-pink-400',
    Go:         'bg-cyan-400',
    Rust:       'bg-orange-400',
    Ruby:       'bg-red-500',
    PHP:        'bg-purple-400',
};

function langColor(lang: string | null): string {
    return lang ? (LANGUAGE_COLORS[lang] ?? 'bg-slate-400') : 'bg-slate-600';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ConnectedProjectsPanelProps {
    projects:         SavedProject[];
    activeProjectId:  string | null;
    onProjectSelect:  (project: SavedProject) => void;
    onConnectProject: () => void;
    onConnectJira:    (projectId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ConnectedProjectsPanel: React.FC<ConnectedProjectsPanelProps> = ({
    projects,
    activeProjectId,
    onProjectSelect,
    onConnectProject,
    onConnectJira,
}) => {
    return (
        <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

            {/* Heading */}
            <div className="px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
                <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <span>Connected Projects</span>
                </h2>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                {projects.length === 0 && (
                    <p className="text-slate-500 text-xs px-1 py-2 leading-relaxed">
                        No projects yet. Click "Connect Project" below to get started.
                    </p>
                )}

                {projects.map(project => {
                    const active = project.id === activeProjectId;
                    return (
                        <button
                            key={project.id}
                            onClick={() => onProjectSelect(project)}
                            title={project.repo.full_name}
                            className={`w-full text-left flex flex-col px-2.5 py-2.5 rounded-lg transition-all text-xs group ${
                                active
                                    ? 'border border-purple-400/60 bg-purple-500/15 text-white'
                                    : 'border border-transparent hover:border-white/15 hover:bg-white/5 text-slate-300'
                            }`}
                        >
                            {/* Repo name row */}
                            <div className="flex items-center space-x-2">
                                <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
                                <span className="flex-1 truncate font-medium">{project.repo.name}</span>
                                {project.repo.language && (
                                    <span
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${langColor(project.repo.language)}`}
                                        title={project.repo.language}
                                    />
                                )}
                            </div>

                            {/* Jira badge OR connect nudge */}
                            {project.jira ? (
                                <div className="mt-1.5 ml-5 flex items-center space-x-1.5">
                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                        active ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 text-slate-400'
                                    }`}>
                                        {project.jira.key}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate">{project.jira.name}</span>
                                </div>
                            ) : (
                                <button
                                    onClick={e => { e.stopPropagation(); onConnectJira(project.id); }}
                                    className="mt-1.5 ml-5 flex items-center space-x-1 text-[10px] text-slate-500 hover:text-purple-400 transition-colors"
                                >
                                    <Link2 className="w-2.5 h-2.5" />
                                    <span>Connect Jira</span>
                                </button>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Connect Project button */}
            <div className="flex-shrink-0 border-t border-white/10 px-3 py-3">
                <button
                    onClick={onConnectProject}
                    className="flex items-center justify-center space-x-1.5 w-full px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 transition-all text-xs text-purple-300 hover:text-white font-medium"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect Project</span>
                </button>
            </div>
        </aside>
    );
};

export default ConnectedProjectsPanel;
