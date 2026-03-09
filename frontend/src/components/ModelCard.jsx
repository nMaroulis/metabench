import { Link } from 'react-router-dom';
import { ArrowRight, Zap, DollarSign, Clock, Activity, Cpu } from 'lucide-react';
import ScoreBar from './ScoreBar';

export default function ModelCard({ model, rank }) {
    const getScoreColor = (score) => {
        if (score >= 85) return 'score-high';
        if (score >= 70) return 'score-mid';
        return 'score-low';
    };

    const getProviderGradient = (provider) => {
        const gradients = {
            'OpenAI': 'from-emerald-500 to-teal-500',
            'Anthropic': 'from-orange-500 to-amber-500',
            'Google': 'from-blue-500 to-cyan-500',
            'Meta': 'from-blue-600 to-indigo-500',
            'Mistral AI': 'from-violet-500 to-purple-500',
            'DeepSeek': 'from-sky-500 to-blue-600',
            'Alibaba': 'from-orange-600 to-red-500',
            'xAI': 'from-gray-600 to-gray-800',
            'Cohere': 'from-green-500 to-emerald-600',
        };
        return gradients[provider] || 'from-brand-500 to-accent-500';
    };

    return (
        <div className="glass-card p-6 animate-fade-in group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {rank && (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${rank <= 3
                            ? `bg-gradient-to-br ${rank === 1 ? 'from-yellow-400 to-amber-500' : rank === 2 ? 'from-gray-300 to-gray-400' : 'from-amber-600 to-orange-700'} text-white shadow-lg`
                            : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'
                            }`}>
                            {rank}
                        </div>
                    )}
                    <div>
                        <Link
                            to={`/model/${encodeURIComponent(model.name)}`}
                            className="text-lg font-display font-bold hover:text-brand-500 transition-colors"
                        >
                            {model.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium text-white bg-gradient-to-r ${getProviderGradient(model.provider)}`}>
                                {model.provider}
                            </span>
                            {model.parameters && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{model.parameters}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className={`score-badge ${getScoreColor(model.overall_score)}`}>
                        {model.overall_score?.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                        ±{((100 - (model.confidence || 0)) * 0.05).toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Score bar */}
            <ScoreBar score={model.overall_score} label="Overall Score" />

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                {model.pricing?.cost_per_1m_input_tokens != null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                        <DollarSign className="w-3.5 h-3.5" />
                        ${model.pricing.cost_per_1m_input_tokens}/1M in
                    </span>
                )}
                {model.performance?.avg_latency_ms != null && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {model.performance.avg_latency_ms < 1000 ? `${model.performance.avg_latency_ms}ms` : `${(model.performance.avg_latency_ms / 1000).toFixed(1)}s`}
                    </span>
                )}
                {model.performance?.context_window != null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                        <Activity className="w-3 h-3" />
                        {model.performance.context_window >= 1000000 ? `${(model.performance.context_window / 1000000).toFixed(0)}M ctx` : `${(model.performance.context_window / 1000).toFixed(0)}K ctx`}
                    </span>
                )}
            </div>

            {/* View detail link */}
            <Link
                to={`/model/${encodeURIComponent(model.name)}`}
                className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
                View details <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
