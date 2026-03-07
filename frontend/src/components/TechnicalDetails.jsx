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
    Code
} from 'lucide-react';
import { getTechnicalDetails } from '../utils/technicalDetails';

export default function TechnicalDetails({ model }) {
    if (!model) return null;

    const sections = getTechnicalDetails(model);

    // Map section titles to lucide-react icons for a stylish presentation
    const getSectionIcon = (title) => {
        const iconMap = {
            "Core Model Identity": Fingerprint,
            "Model Size": Database,
            "Transformer Architecture": Layers,
            "Attention Architecture": Network,
            "Positional Encoding": Hexagon,
            "Context Window": Maximize,
            "Feed Forward Network Details": Activity,
            "Tokenization": Code,
            "Training Dataset": FileText,
            "Training Process": Cpu,
            "Post-Training": Brain,
            "Quantization Support": Zap,
            "Inference Characteristics": Gauge,
            "Hardware Requirements": Server,
            "Advanced Architecture Features": Hexagon,
            "Safety / Alignment": Shield,
            "System / Infrastructure": Settings,
        };
        const IconNode = iconMap[title] || Server;
        return <IconNode className="w-5 h-5" />;
    };

    return (
        <div className="mt-16 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <Settings className="w-8 h-8 text-brand-500" />
                <h2 className="text-3xl font-display font-black tracking-tight text-gray-900 dark:text-gray-100">
                    Advanced Technical Architecture
                </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
                Deep dive into the structural mechanics, scaling metrics, and system-level characteristics of this AI model. Designed for engineers and researchers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sections.map((section, idx) => {
                    const Icon = getSectionIcon(section.title);
                    return (
                        <div key={idx} className="glass-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="bg-gradient-to-r from-gray-100 to-transparent dark:from-surface-700/50 dark:to-transparent p-5 border-b border-gray-200/50 dark:border-surface-700/50 flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-surface-800 rounded-lg text-brand-500 shadow-sm border border-gray-100 dark:border-surface-700 shrink-0">
                                    {Icon}
                                </div>
                                <h3 className="font-display font-bold text-gray-900 dark:text-gray-100 text-lg">
                                    {section.title}
                                </h3>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-5">
                                    {section.facts.map((fact, fIdx) => (
                                        <li key={fIdx}>
                                            <div className="text-xs font-bold uppercase tracking-widest text-brand-500/80 mb-1.5 flex items-center gap-2">
                                                {fact.label}
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                                {fact.value}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
