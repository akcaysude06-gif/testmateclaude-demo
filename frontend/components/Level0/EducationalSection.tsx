import React from 'react';
import { ChevronDown, CheckCircle, Circle } from 'lucide-react';

interface Section {
    id: string;
    title: string;
    icon: string;
    color: string;
    content: string;
}

interface EducationalSectionProps {
    section: Section;
    index: number;
    isExpanded: boolean;
    isCompleted: boolean;
    onToggle: () => void;
}

const EducationalSection: React.FC<EducationalSectionProps> = ({
                                                                   section,
                                                                   index,
                                                                   isExpanded,
                                                                   isCompleted,
                                                                   onToggle
                                                               }) => {
    return (
        <div
            className={`bg-white/5 backdrop-blur-lg rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded
                    ? 'border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : 'border-white/10 hover:border-white/30'
            }`}
        >
            {/* Header - Always Visible */}
            <button
                onClick={onToggle}
                className="w-full p-6 flex items-center justify-between group transition-all"
            >
                <div className="flex items-center space-x-4 flex-1">
                    {/* Number Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="text-4xl flex-shrink-0">
                        {section.icon}
                    </div>

                    {/* Title */}
                    <div className="text-left flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            {section.title}
                        </h3>
                        <p className="text-sm text-purple-300 mt-1">
                            Click to {isExpanded ? 'collapse' : 'expand'} and learn
                        </p>
                    </div>
                </div>

                {/* Right Side - Status & Arrow */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                    {/* Completion Status */}
                    {isCompleted ? (
                        <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-300 font-medium">Completed</span>
                        </div>
                    ) : (
                        <Circle className="w-5 h-5 text-purple-400/50" />
                    )}

                    {/* Expand/Collapse Arrow */}
                    <ChevronDown
                        className={`w-6 h-6 text-purple-300 transition-transform duration-300 ${
                            isExpanded ? 'transform rotate-180' : ''
                        }`}
                    />
                </div>
            </button>

            {/* Content - Expandable */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-6 pb-6">
                    {/* Divider */}
                    <div className={`h-px bg-gradient-to-r ${section.color} mb-6 opacity-30`}></div>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        <div className="text-purple-100 leading-relaxed space-y-4">
                            {section.content.split('\n\n').map((paragraph, idx) => {
                                // Handle bold text with **
                                if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                                    return (
                                        <div key={idx} className="bg-purple-500/10 border-l-4 border-purple-400 pl-4 py-2 rounded-r-lg">
                                            <p className="text-purple-200 font-semibold whitespace-pre-line">
                                                {paragraph.replace(/\*\*/g, '')}
                                            </p>
                                        </div>
                                    );
                                }

                                // Handle bullet points
                                if (paragraph.startsWith('•')) {
                                    const points = paragraph.split('\n');
                                    return (
                                        <ul key={idx} className="space-y-2 ml-4">
                                            {points.map((point, pidx) => (
                                                <li key={pidx} className="text-purple-200 flex items-start">
                                                    <span className="text-purple-400 mr-2">•</span>
                                                    <span className="flex-1">
                                                        {point.replace('• ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }

                                // Handle checkmarks
                                if (paragraph.includes('✓') || paragraph.includes('✅')) {
                                    const points = paragraph.split('\n');
                                    return (
                                        <ul key={idx} className="space-y-2 ml-4">
                                            {points.map((point, pidx) => (
                                                <li key={pidx} className="text-green-300 flex items-start">
                                                    <CheckCircle className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                                                    <span className="flex-1">{point.replace('✓', '').replace('✅', '').trim()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }

                                // Regular paragraphs
                                return (
                                    <p key={idx} className="text-purple-200 whitespace-pre-line">
                                        {paragraph}
                                    </p>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer with gradient */}
                    <div className={`mt-6 pt-4 border-t border-white/10`}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-400">
                                Topic {index + 1} of 7
                            </span>
                            {isCompleted && (
                                <span className="text-sm text-green-400 flex items-center space-x-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>You've read this!</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EducationalSection;