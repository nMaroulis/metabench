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
        return <IconNode className="w-5 h-5" />;
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
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl shadow-lg shadow-brand-500/20">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-black tracking-tight text-gray-900 dark:text-gray-100">
                        Technical Specifications
                    </h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-3xl">
                    Comprehensive technical breakdown of model architecture, training methodology, and deployment characteristics.
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeCategory === 'all'
                            ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                            : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
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
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                activeCategory === key
                                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                                    : 'bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
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
                            className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200/50 dark:border-surface-700/50 overflow-hidden hover:shadow-lg transition-all duration-200"
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-surface-700/50 flex items-center gap-3">
                                <div className={`p-2 bg-gradient-to-br ${categoryColor} rounded-lg text-white shadow-md`}>
                                    {Icon}
                                </div>
                                <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-sm">
                                    {section.title}
                                </h3>
                            </div>

                            {/* Card Content - Always visible */}
                            <div className="p-4">
                                <div className="space-y-3">
                                    {section.facts.map((fact, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-3">
                                            <div className="w-1 h-1 rounded-full bg-brand-500 mt-2 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    {fact.label}
                                                </span>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={fact.value}>
                                                    {fact.value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
