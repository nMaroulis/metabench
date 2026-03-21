import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BarChart3, Users, ArrowRight, Sparkles, Zap, Shield, Code, Terminal, BookOpen, Brain, Calculator, Heart, Star, Crown } from 'lucide-react';
import api from '../services/api';
import ScoreBar from '../components/ScoreBar';
import SEO from '../components/SEO';
import ModelCard from '../components/ModelCard';

const dataSources = [
    { name: 'HuggingFace', logo: '/logos/huggingface.svg', type: 'image' },
    { name: 'OpenRouter', logo: '/logos/openrouter.png', type: 'image', rounded: true },
    { name: 'Chatbot Arena', logo: '/logos/lmsys.png', type: 'image' },
    { name: 'LiveBench', logo: 'LB', type: 'text', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' },
    { name: 'ArtificialAnalysis', logo: '/logos/artificialanalysis.svg', type: 'image' },
    { name: 'EQBench', logo: '/logos/eqbench.png', type: 'image', rounded: true },
];



const CATEGORIES = [
    {
        id: 'coding',
        title: 'Coding',
        benchmark: 'AA Coding Index',
        icon: Code,
        color: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
    },
    {
        id: 'reasoning',
        title: 'Reasoning',
        benchmark: 'GPQA Diamond',
        icon: Brain,
        color: 'from-violet-500 to-indigo-500',
        bg: 'bg-violet-500/10',
        text: 'text-violet-500',
    },
    {
        id: 'math',
        title: 'Mathematics',
        benchmark: 'AA Math Index',
        icon: Calculator,
        color: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
    },
];

export default function LandingPage() {
    const [overallTop, setOverallTop] = useState([]);
    const [categoryWinners, setCategoryWinners] = useState([]);
    const [latestModels, setLatestModels] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsData, overall, latest, ...categoryResults] = await Promise.all([
                    api.getStats(),
                    api.getModels({ limit: 3 }),
                    api.getModels({ sort: 'latest', limit: 3 }),
                    ...CATEGORIES.map(cat => api.getLeaderboard({ category: cat.id, limit: 1 })),
                ]);

                setStats(statsData);
                setOverallTop(overall || []);
                setLatestModels(latest || []);
                setCategoryWinners(categoryResults.map(res => res.entries?.[0] || null));
            } catch (err) {
                console.error('Failed to fetch landing data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
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

            {/* Champions & Podium Section */}
            <section className="relative py-20 overflow-hidden bg-white dark:bg-surface-900">
                {/* Refined Background Highlights - cleaner spotlights */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/[0.03] dark:bg-brand-500/[0.05] rounded-[100%] blur-[120px] pointer-events-none" />

                <div className="page-container relative">
                    <div className="flex flex-col items-center text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-bold uppercase tracking-widest mb-4">
                            <Crown className="w-4 h-4" /> Current Champions
                        </div>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tighter mb-6 max-w-4xl mx-auto">
                            The Intelligence <span className="gradient-text">Elite</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            A curated look at the models defining the frontier of AI intelligence, ranked by normalized multi-benchmark performance.
                        </p>
                    </div>

                    {/* Overall Podium */}
                    <div className="mb-24 relative">
                        {/* Dramatic Spotlight for Podium */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/[0.05] dark:bg-yellow-500/[0.07] rounded-full blur-[100px] pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-0 max-w-5xl mx-auto px-4 relative z-10">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-64">
                                    {[...Array(3)].map((_, i) => <div key={i} className="glass-card animate-pulse rounded-3xl" />)}
                                </div>
                            ) : overallTop.length >= 3 ? (
                                <>
                                    {/* #2 Silver */}
                                    <Link
                                        to={`/model/${encodeURIComponent(overallTop[1].name)}`}
                                        className="w-full md:w-1/3 group order-2 md:order-1"
                                    >
                                        <div className="glass-card p-6 md:min-h-[18rem] flex flex-col justify-end items-center text-center border-gray-200 dark:border-surface-800 relative overflow-hidden group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-500 rounded-2xl md:rounded-r-none md:rounded-l-3xl">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-300 to-gray-400" />
                                            <div className="text-4xl mb-4 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">🥈</div>
                                            <h3 className="font-display font-bold text-xl mb-1 w-full px-4 break-words leading-tight">{overallTop[1].name}</h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">{overallTop[1].provider}</p>
                                            <div className="text-3xl font-display font-black text-gray-400 dark:text-gray-500">{overallTop[1].overall_score.toFixed(1)}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Silver Tier</div>
                                        </div>
                                    </Link>

                                    {/* #1 Gold */}
                                    <Link
                                        to={`/model/${encodeURIComponent(overallTop[0].name)}`}
                                        className="w-full md:w-1/3 z-10 order-1 md:order-2 group"
                                    >
                                        <div className="glass-card p-8 md:min-h-[24rem] flex flex-col justify-end items-center text-center ring-2 ring-yellow-400/30 shadow-[0_40px_80px_-15px_rgba(234,179,8,0.15)] bg-white dark:bg-surface-800/80 relative overflow-hidden group-hover:-translate-y-4 group-hover:shadow-[0_50px_100px_-20px_rgba(234,179,8,0.25)] transition-all duration-700 rounded-3xl md:scale-110">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-600" />
                                            <div className="absolute top-6 right-6 animate-pulse">
                                                <Trophy className="w-8 h-8 text-yellow-500/20" />
                                            </div>
                                            <div className="text-7xl mb-6 drop-shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform">🥇</div>
                                            <h3 className="font-display font-black text-2xl mb-1 w-full px-4 break-words leading-tight pb-1">{overallTop[0].name}</h3>
                                            <p className="text-[10px] text-yellow-600 dark:text-yellow-500 uppercase tracking-widest font-black mb-4">{overallTop[0].provider}</p>
                                            <div className="text-6xl font-display font-black gradient-text mb-3 leading-none">{overallTop[0].overall_score.toFixed(1)}</div>
                                            <div className="px-5 py-1.5 rounded-full bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 text-[10px] font-black uppercase tracking-widest ring-1 ring-yellow-400/20">Global Master</div>
                                        </div>
                                    </Link>

                                    {/* #3 Bronze */}
                                    <Link
                                        to={`/model/${encodeURIComponent(overallTop[2].name)}`}
                                        className="w-full md:w-1/3 group order-3"
                                    >
                                        <div className="glass-card p-6 md:min-h-[16rem] flex flex-col justify-end items-center text-center border-gray-200 dark:border-surface-800 relative overflow-hidden group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-500 rounded-2xl md:rounded-l-none md:rounded-r-3xl">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />
                                            <div className="text-4xl mb-4 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all transform group-hover:scale-110">🥉</div>
                                            <h3 className="font-display font-bold text-xl mb-1 w-full px-4 break-words leading-tight">{overallTop[2].name}</h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-4">{overallTop[2].provider}</p>
                                            <div className="text-3xl font-display font-black text-amber-800/60 dark:text-amber-700">{overallTop[2].overall_score.toFixed(1)}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-opacity-50">Bronze Tier</div>
                                        </div>
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* Category Top Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {CATEGORIES.map((cat, i) => {
                            const winner = categoryWinners[i];
                            return (
                                <div key={cat.id} className="relative group flex flex-col">
                                    <div className="flex items-center gap-3 mb-6 px-4">
                                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                                            <cat.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-display font-black text-sm uppercase tracking-widest text-gray-400 leading-none mb-1">{cat.title} Champion</h3>
                                            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Category Leader</p>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="glass-card p-8 h-44 animate-pulse rounded-[32px]" />
                                    ) : winner ? (
                                        <Link
                                            to={`/model/${encodeURIComponent(winner.model.name)}`}
                                            className="grow glass-card p-8 rounded-[32px] group-hover:border-brand-500/50 group-hover:shadow-2xl group-hover:shadow-brand-500/5 transition-all duration-500 relative overflow-hidden"
                                        >
                                            {/* Vivid Accent Gradient */}
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.color} opacity-[0.03] group-hover:opacity-[0.08] -translate-y-1/2 translate-x-1/2 rounded-full transition-opacity duration-700`} />

                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <div className="min-w-0 pr-4">
                                                    <h4 className="font-display font-black text-xl mb-2 group-hover:text-brand-500 transition-colors uppercase leading-tight tracking-tight">{winner.model.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${cat.bg} ${cat.text}`}>
                                                            {winner.benchmark_name || cat.benchmark}
                                                        </span>
                                                        <Sparkles className={`w-3 h-3 ${cat.text} animate-pulse`} />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-4xl font-display font-black leading-none gradient-text mb-1">{winner.score.toFixed(1)}</div>
                                                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Index Score</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 relative z-10">
                                                <ScoreBar score={winner.score} showLabel={false} height="h-1.5" />
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-gray-500 font-black uppercase tracking-widest">{winner.model.provider}</span>
                                                    <div className="flex items-center gap-1 text-brand-500 font-bold">
                                                        Analysis <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="glass-card p-8 rounded-[32px] flex items-center justify-center text-gray-400 text-sm italic border-dashed border-2">
                                            Winner data not yet available
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Latest Models */}
            <section className="page-container py-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
                            <Sparkles className="w-3 h-3" /> New Arrivals
                        </div>
                        <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Latest Models</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Recently added to the intelligence index</p>
                    </div>
                    <Link to="/leaderboard" className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-brand-500 transition-colors">
                        View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="glass-card p-8 animate-pulse h-48 rounded-[32px]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {latestModels.map((model, idx) => (
                            <ModelCard key={model.name} model={model} rank={idx + 1} />
                        ))}
                    </div>
                )}
            </section>

            {/* Benchmarks Overview */}
            <section className="page-container py-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-widest mb-3 w-fit">
                            <Shield className="w-3 h-3" /> Comprehensive Index
                        </div>
                        <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Benchmarks</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">Evaluations we track across all models</p>
                    </div>
                    <Link to="/benchmarks" className="btn-secondary">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                        { name: 'MMLU', category: 'Knowledge', desc: 'Massive Multitask Language Understanding - 57 subjects', icon: BookOpen, color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                        { name: 'HumanEval', category: 'Coding', desc: 'Python coding - functional correctness evaluation', icon: Code, color: 'from-emerald-500 to-green-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
                        { name: 'GSM8K', category: 'Mathematics', desc: 'Grade School Math - multi-step word problems', icon: Calculator, color: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
                        { name: 'GPQA Diamond', category: 'Knowledge', desc: 'Graduate-level science Q&A - PhD-level difficulty', icon: BookOpen, color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
                        { name: 'BigBench-Hard', category: 'Reasoning', desc: '23 challenging reasoning tasks from BIG-Bench', icon: Brain, color: 'from-purple-500 to-violet-500', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
                        { name: 'Arena Elo', category: 'Human Preference', desc: 'Chatbot Arena Elo - crowd-sourced human votes', icon: Heart, color: 'from-pink-500 to-rose-500', badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' },
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
            <section className="page-container py-12">
                <div className="flex flex-col mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3 w-fit">
                        <Sparkles className="w-3 h-3" /> Verifiable Data
                    </div>
                    <h2 className="text-3xl font-display font-black tracking-tighter uppercase italic">Live Data Sources</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
                        MetaBench continuously aggregates real-time data from the community's most trusted platforms
                    </p>
                </div>

                <div className="glass-card p-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
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
