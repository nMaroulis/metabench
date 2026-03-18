import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Brain, Code, Calculator, Lightbulb, MessageSquare, Layers,
    ExternalLink, Trophy, ArrowRight, Sparkles, Bot, Heart, FlaskConical
} from 'lucide-react';
import api from '../services/api';
import SEO from '../components/SEO';

// ─── Benchmark → reference URL mapping ──────────────────────────────────────
const PAPER_LINKS = {
    'MMLU': 'https://arxiv.org/abs/2009.03300',
    'MMLU-Pro': 'https://arxiv.org/abs/2406.01574',
    'GPQA Diamond': 'https://arxiv.org/abs/2311.12022',
    'HLE': 'https://arxiv.org/abs/2501.14249',
    'GSM8K': 'https://arxiv.org/abs/2110.14168',
    'MATH-500': 'https://arxiv.org/abs/2103.03874',
    'AIME': 'https://artofproblemsolving.com/wiki/index.php/AIME',
    'AIME 2025': 'https://artofproblemsolving.com/wiki/index.php/2025_AIME',
    'HumanEval': 'https://arxiv.org/abs/2107.03374',
    'LiveCodeBench': 'https://livecodebench.github.io/',
    'SciCode': 'https://scicode-bench.github.io/',
    'TerminalBench Hard': 'https://terminalbench.com/',
    'BigBench-Hard': 'https://arxiv.org/abs/2210.09261',
    'ARC-Challenge': 'https://arxiv.org/abs/1803.05457',
    'LCR': 'https://artificialanalysis.ai/',
    'IFEval': 'https://arxiv.org/abs/2311.07911',
    'TAU2': 'https://arxiv.org/abs/2407.10362',
    'Arena Elo': 'https://lmarena.ai/',
    'LiveBench': 'https://livebench.ai/',
    'EQBench': 'https://eqbench.com/',
    'AA Intelligence Index': 'https://artificialanalysis.ai/leaderboards/models',
    'AA Coding Index': 'https://artificialanalysis.ai/leaderboards/models',
    'AA Math Index': 'https://artificialanalysis.ai/leaderboards/models',
};

// ─── Category metadata ──────────────────────────────────────────────────────
const CATEGORY_META = {
    knowledge:           { label: 'Knowledge',              icon: BookOpen,      color: 'from-blue-500 to-cyan-500',      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    reasoning:           { label: 'Reasoning',              icon: Brain,         color: 'from-purple-500 to-violet-500',  badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    math:                { label: 'Mathematics',            icon: Calculator,    color: 'from-amber-500 to-orange-500',   badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    coding:              { label: 'Coding',                 icon: Code,          color: 'from-emerald-500 to-green-500',  badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    instruction:         { label: 'Instruction Following',  icon: MessageSquare, color: 'from-rose-500 to-pink-500',      badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
    agentic:             { label: 'Agentic',                icon: Bot,           color: 'from-indigo-500 to-blue-500',    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
    human_preference:    { label: 'Human Preference',       icon: Heart,         color: 'from-pink-500 to-rose-500',      badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' },
    emotional_intelligence: { label: 'Emotional Intelligence', icon: Sparkles,   color: 'from-fuchsia-500 to-purple-500',badge: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400' },
    composite:           { label: 'Composite Indexes',      icon: Layers,        color: 'from-gray-500 to-slate-500',     badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
};

const CATEGORY_ORDER = ['knowledge', 'reasoning', 'math', 'coding', 'instruction', 'agentic', 'human_preference', 'emotional_intelligence', 'composite'];

// ─── Helper: Score bar colour ────────────────────────────────────────────────
function scoreBarColor(score) {
    if (score >= 80) return 'from-emerald-500 to-green-400';
    if (score >= 60) return 'from-amber-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
}

// ─── Benchmark Card ──────────────────────────────────────────────────────────
function BenchmarkCard({ benchmark, topModels }) {
    const cat = CATEGORY_META[benchmark.category] || CATEGORY_META.knowledge;
    const CatIcon = cat.icon;
    const paperUrl = PAPER_LINKS[benchmark.name];

    return (
        <div className="glass-card p-6 flex flex-col gap-4 group">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <CatIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-tight">
                            {benchmark.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.badge}`}>
                                {cat.label}
                            </span>
                            {benchmark.type === 'index' && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    Composite Index
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {benchmark.description}
            </p>

            {/* Source & Paper Link */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="text-gray-400 dark:text-gray-500">
                    Source: <span className="text-gray-600 dark:text-gray-300 font-medium">{benchmark.source}</span>
                </span>
                {paperUrl && (
                    <a
                        href={paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
                    >
                        <FlaskConical className="w-3 h-3" />
                        Reference
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

            {/* Top Models */}
            {topModels && topModels.length > 0 && (
                <div className="mt-auto pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-1.5 mb-2.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Performers</span>
                    </div>
                    <div className="space-y-2">
                        {topModels.map((entry, idx) => (
                            <div key={entry.model?.name || idx} className="flex items-center gap-3">
                                <span className={`text-xs font-black w-5 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700 dark:text-amber-600'}`}>
                                    {idx + 1}
                                </span>
                                <Link
                                    to={`/model/${encodeURIComponent(entry.model?.name)}`}
                                    className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-brand-500 transition-colors truncate flex-1"
                                >
                                    {entry.model?.name}
                                </Link>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-surface-700 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(entry.score)}`}
                                            style={{ width: `${Math.min(entry.score, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-8 text-right">
                                        {entry.score?.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BenchmarksPage() {
    const [benchmarks, setBenchmarks] = useState([]);
    const [topModelsMap, setTopModelsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);
    const sectionRefs = useRef({});

    useEffect(() => {
        api.getBenchmarks()
            .then(async (data) => {
                setBenchmarks(data);

                // Fetch top 3 models for each benchmark in parallel
                const entries = await Promise.allSettled(
                    data.map(async (b) => {
                        const lb = await api.getLeaderboard({ task: b.name, limit: 3 });
                        return [b.name, lb.entries || []];
                    })
                );

                const map = {};
                for (const result of entries) {
                    if (result.status === 'fulfilled') {
                        const [name, models] = result.value;
                        map[name] = models;
                    }
                }
                setTopModelsMap(map);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Group benchmarks by category
    const grouped = {};
    for (const b of benchmarks) {
        const cat = b.category || 'knowledge';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(b);
    }

    const orderedCategories = CATEGORY_ORDER.filter(c => grouped[c]);

    const scrollToCategory = (cat) => {
        setActiveCategory(cat);
        sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div>
            <SEO
                title="Benchmarks Wiki"
                description="Explore all LLM benchmarks tracked by MetaBench — descriptions, whitepaper links, and top performing models for each."
            />

            {/* Hero */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent" />
                <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-medium mb-5 animate-fade-in">
                        <FlaskConical className="w-4 h-4" />
                        Benchmark Encyclopedia
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight mb-4 animate-slide-up">
                        LLM <span className="gradient-text">Benchmarks</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto animate-slide-up leading-relaxed">
                        Comprehensive wiki of every benchmark we track — from knowledge and reasoning to coding and mathematics.
                        Explore descriptions, reference papers, and see which models lead each evaluation.
                    </p>
                </div>
            </section>

            {/* Category Filter Bar */}
            <section className="sticky top-16 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 py-3 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => { setActiveCategory(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                activeCategory === null
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                            }`}
                        >
                            All
                        </button>
                        {orderedCategories.map(cat => {
                            const meta = CATEGORY_META[cat];
                            const Icon = meta?.icon || BookOpen;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => scrollToCategory(cat)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                        activeCategory === cat
                                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {meta?.label || cat}
                                    <span className="text-xs opacity-60">({grouped[cat]?.length})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benchmark Grid by Category */}
            <div className="page-container pb-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="glass-card p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-surface-700" />
                                    <div>
                                        <div className="h-5 bg-gray-200 dark:bg-surface-700 rounded-lg w-32 mb-2" />
                                        <div className="h-3 bg-gray-200 dark:bg-surface-700 rounded-full w-20" />
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-full mb-2" />
                                <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : (
                    orderedCategories.map(cat => {
                        const meta = CATEGORY_META[cat];
                        const Icon = meta?.icon || BookOpen;
                        return (
                            <section
                                key={cat}
                                ref={el => sectionRefs.current[cat] = el}
                                className="mb-12 scroll-mt-32"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-md`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                                        {meta?.label || cat}
                                    </h2>
                                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        {grouped[cat].length} benchmark{grouped[cat].length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {grouped[cat].map(b => (
                                        <BenchmarkCard
                                            key={b.id}
                                            benchmark={b}
                                            topModels={topModelsMap[b.name]}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}
            </div>
        </div>
    );
}
