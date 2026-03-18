import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, BarChart3, Users, ArrowRight, Sparkles, Zap, Shield, Code, Terminal, BookOpen, Brain, Calculator, MessageSquare, Bot, Heart, Layers, FlaskConical } from 'lucide-react';
import api from '../services/api';
import ModelCard from '../components/ModelCard';
import ScoreBar from '../components/ScoreBar';

const dataSources = [
    { name: 'HuggingFace', logo: '/logos/huggingface.svg', type: 'image' },
    { name: 'OpenRouter', logo: '/logos/openrouter.png', type: 'image', rounded: true },
    { name: 'Chatbot Arena', logo: '/logos/lmsys.png', type: 'image' },
    { name: 'LiveBench', logo: 'LB', type: 'text', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' },
    { name: 'ArtificialAnalysis', logo: '/logos/artificialanalysis.svg', type: 'image' },
    { name: 'EQBench', logo: '/logos/eqbench.png', type: 'image', rounded: true },
];

import SEO from '../components/SEO';

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
        { icon: Code, title: 'Open Source', desc: 'Fully open source codebase. Inspect, contribute, or fork the project', color: 'from-rose-500 to-pink-500' },
        { icon: Terminal, title: 'Code Evaluation', desc: 'Comprehensive code benchmarks including HumanEval and advanced coding tasks', color: 'from-indigo-500 to-blue-500' },
        { icon: Zap, title: 'REST API', desc: 'Simple REST API to access model data, benchmarks, and leaderboards programmatically', color: 'from-yellow-500 to-amber-500' },
    ];

    return (
        <div>
            <SEO
                title="The Intelligence Leaderboard"
                description="Aggregating benchmark results from MMLU, HumanEval, GSM8K, and 10+ more sources into one Overall Intelligence Score per model."
            />
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
                        Aggregating benchmark results from MMLU, HumanEval, GSM8K, and 10+ more sources into one
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="section-title">Benchmarks</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Evaluations we track across all models</p>
                    </div>
                    <Link to="/benchmarks" className="btn-secondary">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                        { name: 'MMLU', category: 'Knowledge', desc: 'Massive Multitask Language Understanding — 57 subjects', icon: BookOpen, color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                        { name: 'HumanEval', category: 'Coding', desc: 'Python coding — functional correctness evaluation', icon: Code, color: 'from-emerald-500 to-green-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                        { name: 'GSM8K', category: 'Mathematics', desc: 'Grade School Math — multi-step word problems', icon: Calculator, color: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                        { name: 'GPQA Diamond', category: 'Knowledge', desc: 'Graduate-level science Q&A — PhD-level difficulty', icon: BookOpen, color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                        { name: 'BigBench-Hard', category: 'Reasoning', desc: '23 challenging reasoning tasks from BIG-Bench', icon: Brain, color: 'from-purple-500 to-violet-500', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
                        { name: 'Arena Elo', category: 'Human Preference', desc: 'Chatbot Arena Elo — crowd-sourced human votes', icon: Heart, color: 'from-pink-500 to-rose-500', badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' },
                    ].map(({ name, category, desc, icon: Icon, color, badge }) => (
                        <Link key={name} to="/benchmarks" className="glass-card p-5 flex items-start gap-4 group cursor-pointer">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{name}</h3>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge}`}>{category}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Live Data Sources */}
            <section className="page-container">
                <div className="glass-card p-8">
                    <h2 className="section-title mb-6">Live Data Sources</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-8">
                        MetaBench continuously aggregates real-time data from the community's most trusted platforms
                    </p>

                    {/* CSS-based infinite scroll carousel */}
                    <div className="relative w-full overflow-hidden h-20 flex items-center bg-gray-50/50 dark:bg-surface-800/30 rounded-2xl border border-gray-100 dark:border-surface-700">
                        {/* Left/Right fading edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-surface-800 to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-surface-800 to-transparent z-10" />

                        <div className="flex w-max animate-slide-infinite items-center">
                            {[...dataSources, ...dataSources].map((source, idx) => (
                                <div key={idx} className="flex items-center gap-4 w-72 justify-center opacity-80 backdrop-blur-md pointer-events-none">
                                    {source.type === 'image' ? (
                                        <img
                                            src={source.logo}
                                            alt={source.name}
                                            className={`w-14 h-14 object-contain ${source.rounded ? 'rounded-2xl' : ''} ${source.invertDark ? 'brightness-0 dark:brightness-200' : ''} drop-shadow-sm`}
                                        />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${source.color}`}>
                                            {source.logo}
                                        </div>
                                    )}
                                    <span className="font-display font-bold text-2xl text-gray-800 dark:text-gray-200 whitespace-nowrap drop-shadow-sm">{source.name}</span>
                                </div>
                            ))}
                        </div>
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
