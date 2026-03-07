import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, BarChart3, Users, ArrowRight, Sparkles, Zap, Shield, Code } from 'lucide-react';
import api from '../services/api';
import ModelCard from '../components/ModelCard';
import ScoreBar from '../components/ScoreBar';

export default function LandingPage() {
    const [models, setModels] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getModels({ limit: 6 }), api.getStats()])
            .then(([modelsData, statsData]) => {
                setModels(modelsData);
                setStats(statsData);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const features = [
        { icon: Trophy, title: 'Unified Scoring', desc: 'Normalized 0-100 scores across 12+ benchmarks for fair comparison', color: 'from-amber-500 to-orange-500' },
        { icon: BarChart3, title: 'Deep Analytics', desc: 'Per-task breakdowns, radar charts, and historical performance trends', color: 'from-blue-500 to-cyan-500' },
        { icon: Shield, title: 'Confidence Rating', desc: 'Statistical confidence based on benchmark coverage and score consistency', color: 'from-emerald-500 to-green-500' },
        { icon: Users, title: 'Community Driven', desc: 'Submit your own evaluations and contribute to the knowledge base', color: 'from-purple-500 to-violet-500' },
    ];

    return (
        <div>
            {/* Hero Section */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-medium mb-6 animate-fade-in">
                        <Sparkles className="w-4 h-4" />
                        Metacritic for LLMs
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight mb-6 animate-slide-up">
                        The Intelligence
                        <br />
                        <span className="gradient-text">Leaderboard</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed">
                        Aggregating benchmark results from MMLU, HumanEval, GSM8K, and 9+ more sources into one
                        <strong className="text-gray-900 dark:text-gray-200"> Overall Intelligence Score</strong> per model.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 animate-slide-up">
                        <Link to="/leaderboard" className="btn-primary text-base px-8 py-3">
                            <Trophy className="w-5 h-5" />
                            View Leaderboard
                        </Link>
                        <Link to="/compare" className="btn-secondary text-base px-8 py-3">
                            <BarChart3 className="w-5 h-5" />
                            Compare Models
                        </Link>
                    </div>

                    {/* Stats row */}
                    {stats && (
                        <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in">
                            {[
                                { value: stats.total_models, label: 'Models' },
                                { value: stats.total_benchmarks, label: 'Benchmarks' },
                                { value: stats.total_scores, label: 'Data Points' },
                                { value: stats.providers?.length || 0, label: 'Providers' },
                            ].map(({ value, label }) => (
                                <div key={label} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-display font-black gradient-text">{value}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features */}
            <section className="page-container -mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map(({ icon: Icon, title, desc, color }) => (
                        <div key={title} className="glass-card p-6 text-center animate-fade-in">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Top Models */}
            <section className="page-container">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="section-title">Top Models</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Ranked by Overall Intelligence Score</p>
                    </div>
                    <Link to="/leaderboard" className="btn-secondary">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-lg w-3/4 mb-4" />
                                <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2 mb-6" />
                                <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {models.map((model, idx) => (
                            <ModelCard key={model.name} model={model} rank={idx + 1} />
                        ))}
                    </div>
                )}
            </section>

            {/* Benchmarks Overview */}
            <section className="page-container">
                <div className="glass-card p-8">
                    <h2 className="section-title mb-6">Benchmark Sources</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {['MMLU', 'MMLU-Pro', 'HumanEval', 'GSM8K', 'MATH', 'GPQA', 'BigBench-Hard', 'ARC-Challenge', 'HellaSwag', 'TruthfulQA', 'IFEval', 'MBPP'].map(name => (
                            <div key={name} className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-700/50 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-default">
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="page-container pb-20">
                <div className="glass-card p-12 text-center gradient-border rounded-2xl">
                    <h2 className="text-3xl font-display font-bold mb-4">Have evaluation data?</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                        Submit your community benchmark results and contribute to the most comprehensive LLM intelligence index.
                    </p>
                    <Link to="/submit" className="btn-primary text-base px-8 py-3">
                        Submit Evaluation <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
