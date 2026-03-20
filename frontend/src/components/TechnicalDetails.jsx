import { useState } from 'react';
import {
    Fingerprint,
    Database,
    Layers,
    Network,
    Activity,
    FileText,
    Cpu,
    Brain,
    Zap,
    Gauge,
    Server,
    Hexagon,
    Shield,
    Settings,
    Maximize,
    Code,
    Sparkles,
    Box,
    Workflow
} from 'lucide-react';

export default function TechnicalDetails({ model }) {
    const [activeCategory, setActiveCategory] = useState('all');

    if (!model || !model.technical_details) return null;

    const sections = model.technical_details;

    // Group sections into categories
    const categories = {
        overview: {
            title: 'Overview',
            icon: Sparkles,
            sections: ['Core Model Identity', 'Model Size'],
            color: 'from-blue-500 to-cyan-500'
        },
        architecture: {
            title: 'Architecture',
            icon: Box,
            sections: ['Transformer Architecture', 'Attention Architecture', 'Positional Encoding', 'Feed Forward Network Details'],
            color: 'from-violet-500 to-purple-500'
        },
        capabilities: {
            title: 'Capabilities',
            icon: Zap,
            sections: ['Context Window', 'Tokenization', 'Inference Characteristics'],
            color: 'from-amber-500 to-orange-500'
        },
        training: {
            title: 'Training',
            icon: Brain,
            sections: ['Training Dataset', 'Training Process', 'Post-Training'],
            color: 'from-emerald-500 to-teal-500'
        },
        deployment: {
            title: 'Deployment',
            icon: Server,
            sections: ['Quantization Support', 'Hardware Requirements', 'System / Infrastructure', 'Safety / Alignment'],
            color: 'from-rose-500 to-pink-500'
        }
    };

    // Map section titles to lucide-react icons
    const getSectionIcon = (title) => {
        const iconMap = {
            'Core Model Identity': Fingerprint,
            'Model Size': Database,
            'Transformer Architecture': Layers,
            'Attention Architecture': Network,
            'Positional Encoding': Hexagon,
            'Context Window': Maximize,
            'Feed Forward Network Details': Activity,
            'Tokenization': Code,
            'Training Dataset': FileText,
            'Training Process': Cpu,
            'Post-Training': Brain,
            'Quantization Support': Zap,
            'Inference Characteristics': Gauge,
            'Hardware Requirements': Server,
            'Safety / Alignment': Shield,
            'System / Infrastructure': Settings,
        };
        const IconNode = iconMap[title] || Cpu;
        return IconNode;
    };

    const getCategoryForSection = (sectionTitle) => {
        for (const [key, category] of Object.entries(categories)) {
            if (category.sections.includes(sectionTitle)) return key;
        }
        return 'other';
    };

    const filteredSections = activeCategory === 'all'
        ? sections
        : sections.filter(s => getCategoryForSection(s.title) === activeCategory ||
            categories[activeCategory]?.sections.includes(s.title));

    return (
        <div className="mt-16 animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg shadow-sm shadow-brand-500/20">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Technical Specifications
                    </h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl leading-relaxed">
                    Comprehensive technical breakdown of model architecture, training methodology, and deployment characteristics.
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${activeCategory === 'all'
                            ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    All Specs
                </button>
                {Object.entries(categories).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveCategory(key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${activeCategory === key
                                    ? `bg-gradient-to-r ${category.color} border-transparent text-white shadow-sm`
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {category.title}
                        </button>
                    );
                })}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSections.map((section, idx) => {
                    const Icon = getSectionIcon(section.title);
                    const category = getCategoryForSection(section.title);
                    const categoryColor = categories[category]?.color || 'from-gray-500 to-gray-600';

                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-gray-900/40 rounded-xl border border-gray-200/75 dark:border-gray-800 overflow-hidden hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group"
                        >
                            {/* Card Header */}
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-2.5">
                                <div className={`p-1.5 bg-gradient-to-br ${categoryColor} rounded-md text-white shadow-sm ring-1 ring-white/20`}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <h3 className="font-display font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-tight">
                                    {section.title}
                                </h3>
                            </div>

                            {/* Card Content - Compact Table */}
                            <div className="p-0">
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                    {section.facts.map((fact, fIdx) => (
                                        <li key={fIdx} className="px-4 py-2 flex flex-col sm:flex-row sm:justify-between items-start sm:items-baseline gap-1 sm:gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider lg:w-1/3 shrink-0">
                                                {fact.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-300 sm:text-right lg:w-2/3 break-words">
                                                {fact.value}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredSections.length === 0 && (
                <div className="text-center py-16">
                    <Workflow className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No specifications available for this category.</p>
                </div>
            )}
        </div>
    );
}
