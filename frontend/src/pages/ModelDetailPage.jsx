import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, DollarSign, Clock, Zap, Code, Shield,
    BookOpen, Brain, GraduationCap, MessageSquare, Cpu, Users, Heart
} from 'lucide-react';
import api from '../services/api';
import ScoreBar from '../components/ScoreBar';
import BenchmarkRadarChart from '../charts/RadarChart';
import TechnicalDetails from '../components/TechnicalDetails';
import SEO from '../components/SEO';

export default function ModelDetailPage() {
    const { modelName } = useParams();
    const [model, setModel] = useState(null);
    const [allBenchmarks, setAllBenchmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.getModelDetail(decodeURIComponent(modelName)),
            api.getBenchmarks(),
        ])
            .then(([modelData, benchmarksData]) => {
                setModel(modelData);
                setAllBenchmarks(benchmarksData);
            })
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
        const cat = category?.toLowerCase();
        switch (cat) {
            case 'coding': return Code;
            case 'math': return Brain;
            case 'reasoning': return BookOpen;
            case 'knowledge': return GraduationCap;
            case 'instruction': return MessageSquare;
            case 'agentic': return Cpu;
            case 'human_preference': return Users;
            case 'emotional_intelligence': return Heart;
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

    // Build a merged view: all benchmarks grouped by category, with score data where available
    const scoredBenchmarkNames = new Set((model.scores || []).map(s => s.benchmark_name));
    const allScoresByCategory = {};

    // First, add all scored benchmarks
    for (const [cat, scores] of Object.entries(scoresByCategory)) {
        if (!allScoresByCategory[cat]) allScoresByCategory[cat] = [];
        for (const s of scores) {
            allScoresByCategory[cat].push({ ...s, available: true });
        }
    }

    // Then, add missing benchmarks as unavailable
    for (const b of allBenchmarks) {
        if (!scoredBenchmarkNames.has(b.name)) {
            const cat = b.category || 'other';
            if (!allScoresByCategory[cat]) allScoresByCategory[cat] = [];
            allScoresByCategory[cat].push({
                benchmark_name: b.name,
                benchmark_category: cat,
                benchmark_type: b.type || 'benchmark',
                normalized_score: null,
                raw_score: null,
                available: false,
            });
        }
    }

    // Sort: available first, then alphabetical
    for (const cat of Object.keys(allScoresByCategory)) {
        allScoresByCategory[cat].sort((a, b) => {
            if (a.available !== b.available) return a.available ? -1 : 1;
            return a.benchmark_name.localeCompare(b.benchmark_name);
        });
    }

    // Separate scores for radar charts
    const benchmarkScores = (model.scores || []).filter(s => s.benchmark_type === 'benchmark');
    const indexScores = (model.scores || []).filter(s => s.benchmark_type === 'index');

    const benchmarkRadarData = [{
        name: model.name,
        scores: benchmarkScores,
    }];
    const benchmarkNames = benchmarkScores.map(s => s.benchmark_name);

    const indexRadarData = [{
        name: model.name,
        scores: indexScores,
    }];
    const indexNames = indexScores.map(s => s.benchmark_name);

    // Capability Profile: Average score per category
    const capabilityCategories = [
        'knowledge', 'math', 'coding', 'reasoning',
        'instruction', 'agentic', 'human_preference', 'emotional_intelligence'
    ];

    const capabilityScores = capabilityCategories.map(cat => {
        const scores = scoresByCategory[cat] || [];
        const avg = scores.length > 0
            ? scores.reduce((sum, s) => sum + s.normalized_score, 0) / scores.length
            : 0;
        return {
            benchmark_name: cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            normalized_score: avg
        };
    });

    const capabilityRadarData = [{
        name: model.name,
        scores: capabilityScores,
    }];
    const capabilityNames = capabilityScores.map(s => s.benchmark_name);

    return (
        <div className="page-container">
            <SEO
                title={`${model.name} - Performance & Benchmarks`}
                description={`Detailed performance metrics, benchmark scores, and technical specifications for ${model.name} by ${model.provider}.`}
                keywords={`${model.name}, ${model.provider}, benchmarks, ${model.architecture || ''}, LLM`}
            />
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
                        { icon: DollarSign, label: 'Input Cost', value: model.pricing?.cost_per_1m_input_tokens != null ? `$${model.pricing.cost_per_1m_input_tokens}/1M` : 'N/A' },
                        { icon: DollarSign, label: 'Output Cost', value: model.pricing?.cost_per_1m_output_tokens != null ? `$${model.pricing.cost_per_1m_output_tokens}/1M` : 'N/A' },
                        { icon: Clock, label: 'Output tokens per second', value: model.performance?.median_output_tokens_per_second != null ? `${model.performance.median_output_tokens_per_second.toFixed(1)} tokens/s` : 'N/A' },
                        { icon: Zap, label: 'Context Window', value: model.performance?.context_window != null ? (model.performance.context_window >= 1000000 ? `${(model.performance.context_window / 1000000).toFixed(0)}M tokens` : `${(model.performance.context_window / 1000).toFixed(0)}K tokens`) : 'N/A' },
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
                {/* Radar charts */}
                <div className="glass-card p-6">
                    <div className="mb-8">
                        <h3 className="text-lg font-display font-bold mb-4">Benchmark Capability</h3>
                        {benchmarkNames.length > 0 ? (
                            <BenchmarkRadarChart modelsData={benchmarkRadarData} benchmarks={benchmarkNames} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-gray-400 italic">
                                No benchmark data available
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-display font-bold mb-4">Index Performance</h3>
                        {indexNames.length > 0 ? (
                            <BenchmarkRadarChart modelsData={indexRadarData} benchmarks={indexNames} colorOffset={1} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-gray-400 italic">
                                No index data available
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-display font-bold mb-4 text-brand-500">Capability Profile</h3>
                        {capabilityNames.length > 0 ? (
                            <BenchmarkRadarChart modelsData={capabilityRadarData} benchmarks={capabilityNames} colorOffset={2} />
                        ) : (
                            <div className="h-[400px] flex items-center justify-center text-gray-400 italic">
                                General capability data unavailable
                            </div>
                        )}
                    </div>
                </div>

                {/* Score breakdown by category */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-display font-bold mb-4">Scores by Category</h3>
                    <div className="space-y-6">
                        {Object.entries(allScoresByCategory).map(([category, scores]) => {
                            const CatIcon = getCategoryIcon(category);
                            const availableCount = scores.filter(s => s.available).length;
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CatIcon className="w-4 h-4 text-brand-500" />
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {category}
                                        </h4>
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 ml-1">
                                            {availableCount}/{scores.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {scores.map(s => (
                                            s.available ? (
                                                <ScoreBar
                                                    key={s.benchmark_name}
                                                    score={s.normalized_score}
                                                    label={s.benchmark_name}
                                                    type={s.benchmark_type || 'benchmark'}
                                                />
                                            ) : (
                                                <div key={s.benchmark_name} className="w-full opacity-40">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 italic">{s.benchmark_name}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">N/A</span>
                                                    </div>
                                                    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-surface-700 overflow-hidden">
                                                        <div className="h-full rounded-full bg-gray-200 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600" style={{ width: '100%' }} />
                                                    </div>
                                                </div>
                                            )
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
                                <th className="px-6 py-3 text-left">Type</th>
                                <th className="px-6 py-3 text-center">Normalized</th>
                                <th className="px-6 py-3 text-left hidden md:table-cell">Language</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                            {Object.values(allScoresByCategory).flat().map(s => (
                                <tr key={s.benchmark_name} className={`hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors ${!s.available ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-3 text-sm font-medium">
                                        {s.benchmark_name}
                                        {!s.available && <span className="ml-2 text-[10px] text-gray-400 italic">(Missing)</span>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400 capitalize">
                                            {s.benchmark_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                                            s.benchmark_type === 'index' 
                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        }`}>
                                            {s.benchmark_type || 'benchmark'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`text-sm font-bold ${!s.available ? 'text-gray-300' : s.normalized_score >= 85 ? 'text-emerald-600 dark:text-emerald-400' : s.normalized_score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {s.normalized_score != null ? s.normalized_score.toFixed(1) : '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500 hidden md:table-cell">{s.language || 'en'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Render the advanced technical details here at the very bottom */}
            <TechnicalDetails model={model} />

        </div>
    );
}
