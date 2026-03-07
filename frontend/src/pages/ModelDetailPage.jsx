import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, DollarSign, Clock, Zap, Code, Shield, BookOpen, Brain } from 'lucide-react';
import api from '../services/api';
import ScoreBar from '../components/ScoreBar';
import BenchmarkRadarChart from '../charts/RadarChart';
import TrendChart from '../charts/TrendChart';

export default function ModelDetailPage() {
    const { modelName } = useParams();
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        api.getModelDetail(decodeURIComponent(modelName))
            .then(setModel)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [modelName]);

    if (loading) {
        return (
            <div className="page-container">
                <div className="glass-card p-12 animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3 mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2 mb-8" />
                    <div className="h-64 bg-gray-200 dark:bg-surface-700 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !model) {
        return (
            <div className="page-container">
                <div className="glass-card p-12 text-center">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Model Not Found</h2>
                    <p className="text-gray-400 mb-4">{error || 'The requested model could not be found.'}</p>
                    <Link to="/leaderboard" className="btn-primary">Back to Leaderboard</Link>
                </div>
            </div>
        );
    }

    const getScoreColorClass = (score) => {
        if (score >= 85) return 'score-high';
        if (score >= 70) return 'score-mid';
        return 'score-low';
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'coding': return Code;
            case 'math': return Brain;
            case 'reasoning': return BookOpen;
            case 'safety': return Shield;
            default: return Zap;
        }
    };

    // Group scores by category
    const scoresByCategory = (model.scores || []).reduce((acc, s) => {
        const cat = s.benchmark_category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(s);
        return acc;
    }, {});

    const radarData = [{
        name: model.name,
        scores: model.scores || [],
    }];
    const benchmarkNames = (model.scores || []).map(s => s.benchmark_name);

    return (
        <div className="page-container">
            {/* Back link */}
            <Link to="/leaderboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
            </Link>

            {/* Model Header */}
            <div className="glass-card p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mb-2">
                            {model.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-medium">
                                {model.provider}
                            </span>
                            {model.parameters && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">{model.parameters}</span>
                            )}
                            {model.architecture && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">• {model.architecture}</span>
                            )}
                            {model.license_type && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">• {model.license_type}</span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                            {model.description}
                        </p>
                    </div>

                    <div className="text-center md:text-right shrink-0">
                        <div className="text-5xl font-display font-black gradient-text mb-1">
                            {model.overall_score?.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Overall Score</div>
                        <div className={`score-badge mt-2 ${getScoreColorClass(model.overall_score)}`}>
                            Confidence: {model.confidence?.toFixed(0)}%
                        </div>
                    </div>
                </div>

                {/* Quick metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                    {[
                        { icon: DollarSign, label: 'Input Cost', value: model.cost_per_1m_input_tokens != null ? `$${model.cost_per_1m_input_tokens}/1M` : 'N/A' },
                        { icon: DollarSign, label: 'Output Cost', value: model.cost_per_1m_output_tokens != null ? `$${model.cost_per_1m_output_tokens}/1M` : 'N/A' },
                        { icon: Clock, label: 'Avg Latency', value: model.avg_latency_ms != null ? (model.avg_latency_ms < 1000 ? `${model.avg_latency_ms}ms` : `${(model.avg_latency_ms / 1000).toFixed(1)}s`) : 'N/A' },
                        { icon: Zap, label: 'Context Window', value: model.context_window != null ? (model.context_window >= 1000000 ? `${(model.context_window / 1000000).toFixed(0)}M tokens` : `${(model.context_window / 1000).toFixed(0)}K tokens`) : 'N/A' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="p-4 rounded-xl bg-gray-50 dark:bg-surface-700/50">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Icon className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wider">{label}</span>
                            </div>
                            <div className="text-lg font-bold">{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Radar chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-display font-bold mb-4">Capability Profile</h3>
                    <BenchmarkRadarChart modelsData={radarData} benchmarks={benchmarkNames} />
                </div>

                {/* Score breakdown by category */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-display font-bold mb-4">Scores by Category</h3>
                    <div className="space-y-6">
                        {Object.entries(scoresByCategory).map(([category, scores]) => {
                            const CatIcon = getCategoryIcon(category);
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CatIcon className="w-4 h-4 text-brand-500" />
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {category}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        {scores.map(s => (
                                            <ScoreBar
                                                key={s.benchmark_name}
                                                score={s.normalized_score}
                                                label={s.benchmark_name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* All benchmark scores table */}
            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                    <h3 className="text-lg font-display font-bold">All Benchmark Scores</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">
                                <th className="px-6 py-3 text-left">Benchmark</th>
                                <th className="px-6 py-3 text-left">Category</th>
                                <th className="px-6 py-3 text-center">Raw Score</th>
                                <th className="px-6 py-3 text-center">Normalized</th>
                                <th className="px-6 py-3 text-left hidden md:table-cell">Language</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                            {(model.scores || []).map(s => (
                                <tr key={s.benchmark_name} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium">{s.benchmark_name}</td>
                                    <td className="px-6 py-3">
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400 capitalize">
                                            {s.benchmark_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center text-sm font-mono">{s.raw_score}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`text-sm font-bold ${s.normalized_score >= 85 ? 'text-emerald-600 dark:text-emerald-400' : s.normalized_score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {s.normalized_score?.toFixed(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500 hidden md:table-cell">{s.language || 'en'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
