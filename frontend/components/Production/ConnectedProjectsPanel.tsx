import React, { useState } from 'react';
import { GitBranch, FolderOpen, Plus, Link2, AlertTriangle, X } from 'lucide-react';
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
    onRemoveProject?: (projectId: string) => void;
    jiraConnected?:   boolean;
    onSetupJira?:     () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ConnectedProjectsPanel: React.FC<ConnectedProjectsPanelProps> = ({
    projects,
    activeProjectId,
    onProjectSelect,
    onConnectProject,
    onConnectJira,
    onRemoveProject,
    jiraConnected = true,
    onSetupJira,
}) => {
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

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
                    const confirming = confirmRemoveId === project.id;
                    return (
                        <div key={project.id} className="relative group/item">
                            <button
                                onClick={() => onProjectSelect(project)}
                                title={project.repo.full_name}
                                className={`w-full text-left flex flex-col px-2.5 py-2.5 rounded-lg transition-all text-xs ${
                                    active
                                        ? 'border border-purple-400/60 bg-purple-500/15 text-white'
                                        : 'border border-transparent hover:border-white/15 hover:bg-white/5 text-slate-300'
                                }`}
                            >
                                {/* Repo name row */}
                                <div className="flex items-center space-x-2">
                                    <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-purple-400' : 'text-slate-500'}`} />
                                    <span className="flex-1 truncate font-medium pr-4">{project.repo.name}</span>
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

                            {/* Remove button — appears on hover */}
                            {onRemoveProject && !confirming && (
                                <button
                                    onClick={e => { e.stopPropagation(); setConfirmRemoveId(project.id); }}
                                    title="Remove project"
                                    className="absolute top-1.5 right-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-600 hover:text-red-400"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}

                            {/* Inline confirm */}
                            {confirming && onRemoveProject && (
                                <div className="flex items-center gap-1 px-2.5 pb-2 -mt-0.5">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            onRemoveProject(project.id);
                                            setConfirmRemoveId(null);
                                        }}
                                        className="flex-1 text-[10px] py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all"
                                    >
                                        Remove
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); setConfirmRemoveId(null); }}
                                        className="text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Jira not connected warning */}
            {!jiraConnected && (
                <div className="flex-shrink-0 px-3 pt-2">
                    <button
                        onClick={onSetupJira}
                        className="w-full flex items-start space-x-2 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 transition-colors rounded-lg px-2.5 py-2 text-left"
                    >
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-yellow-300 text-[10px] font-medium leading-tight">Jira not connected</p>
                            <p className="text-yellow-500 text-[9px] mt-0.5 leading-tight">Tap to connect</p>
                        </div>
                    </button>
                </div>
            )}

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
