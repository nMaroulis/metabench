import { useState, useEffect, useMemo } from 'react';
import { Trophy, Filter, Download, BarChart3, Target, Brain, BookOpen, Code, GraduationCap, MessageSquare, Cpu, Users, Heart, Zap, Check, X, ChevronDown } from 'lucide-react';
import api from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';
import SEO from '../components/SEO';

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([]);
    const [benchmarks, setBenchmarks] = useState([]);
    const [selectedView, setSelectedView] = useState('category'); // 'category', 'benchmark'
    const [selectedCategory, setSelectedCategory] = useState('overall');
    const [selectedTask, setSelectedTask] = useState('');
    const [loading, setLoading] = useState(true);
    const [benchmarkTypeFilter, setBenchmarkTypeFilter] = useState('all'); // 'all', 'index', 'benchmark'
    const [showAllBenchmarks, setShowAllBenchmarks] = useState(false);

    // Filtered benchmarks based on type
    const filteredBenchmarks = useMemo(() => {
        if (benchmarkTypeFilter === 'all') return benchmarks;
        return benchmarks.filter(b => b.type === benchmarkTypeFilter);
    }, [benchmarks, benchmarkTypeFilter]);

    const [skip, setSkip] = useState(0);
    const [total, setTotal] = useState(0);
    const LIMIT = 50;
    const [loadingMore, setLoadingMore] = useState(false);

    // Extract unique categories and organize benchmarks
    const { categories, benchmarksByCategory } = useMemo(() => {
        const cats = [...new Set(benchmarks.map(b => b.category).filter(Boolean))];
        const grouped = benchmarks.reduce((acc, benchmark) => {
            const cat = benchmark.category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(benchmark);
            return acc;
        }, {});
        return { categories: cats, benchmarksByCategory: grouped };
    }, [benchmarks]);

    useEffect(() => {
        api.getBenchmarks().then(setBenchmarks).catch(console.error);
    }, []);

    const fetchLeaderboard = (newSkip, isAppend = false) => {
        if (isAppend) setLoadingMore(true);
        else setLoading(true);

        const params = { limit: LIMIT, skip: newSkip };
        
        if (selectedView === 'category') {
            if (selectedCategory !== 'overall') {
                params.category = selectedCategory;
            }
            // No filtering for overall
        } else if (selectedView === 'benchmark' && selectedTask) {
            params.task = selectedTask;
        }
        
        api.getLeaderboard(params)
            .then((data) => {
                setEntries(prev => isAppend ? [...prev, ...(data.entries || [])] : (data.entries || []));
                setTotal(data.total || 0);
            })
            .catch(console.error)
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        setSkip(0);
        fetchLeaderboard(0, false);
    }, [selectedView, selectedCategory, selectedTask]);

    const handleExport = async (format) => {
        try {
            if (format === 'csv') {
                const csv = await api.exportCSV();
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'metabench_export.csv';
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const data = await api.exportData('json');
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'metabench_export.json';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    const handleLoadMore = () => {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchLeaderboard(nextSkip, true);
    };

    const getSelectionDescription = () => {
        if (selectedView === 'category') {
            if (selectedCategory === 'overall') return 'Ranked by Overall Intelligence Score';
            return `Ranked by ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('_', ' ')} Performance`;
        }
        if (selectedView === 'benchmark') return `Ranked by ${selectedTask} Score`;
        return 'Ranked by Overall Intelligence Score';
    };

    const getCategoryIcon = (category) => {
        switch (category?.toLowerCase()) {
            case 'coding': return Code;
            case 'math': return Brain;
            case 'reasoning': return BookOpen;
            case 'knowledge': return GraduationCap;
            case 'instruction': return MessageSquare;
            case 'agentic': return Cpu;
            case 'human_preference': return Users;
            case 'emotional_intelligence': return Heart;
            case 'composite': return Trophy;
            default: return Zap;
        }
    };

    const getCategoryColor = (category) => {
        switch (category?.toLowerCase()) {
            case 'overall': return 'from-amber-500 to-orange-600';
            case 'knowledge': return 'from-blue-500 to-indigo-600';
            case 'reasoning': return 'from-purple-500 to-violet-600';
            case 'math': return 'from-red-500 to-rose-600';
            case 'coding': return 'from-emerald-500 to-teal-600';
            case 'instruction': return 'from-cyan-500 to-blue-600';
            case 'agentic': return 'from-orange-500 to-amber-600';
            case 'human_preference': return 'from-pink-500 to-fuchsia-600';
            case 'emotional_intelligence': return 'from-rose-500 to-pink-600';
            case 'composite': return 'from-indigo-500 to-brand-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const allCategories = ['overall', ...categories];

    return (
        <div className="page-container">
            <SEO
                title="LLM Intelligence Leaderboard"
                description="The ultimate leaderboard for Large Language Models. Compare GPT-4, Claude, Gemini and more based on aggregated benchmark scores."
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="section-title flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        Leaderboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Comprehensive model evaluation across 20+ benchmarks
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Export */}
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('json')} className="btn-secondary text-xs px-4 py-2">
                            <Download className="w-3 h-3" /> JSON
                        </button>
                        <button onClick={() => handleExport('csv')} className="btn-secondary text-xs px-4 py-2">
                            <Download className="w-3 h-3" /> CSV
                        </button>
                    </div>
                </div>
            </div>


            {/* Ultra-Minimal Monolithic Selector */}
            <div className="mb-1 bg-white dark:bg-surface-900 border-y border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center h-[48px]">
                    
                    {/* Perspective Switcher */}
                    <div className="flex border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800">
                        {['category', 'benchmark'].map((view) => (
                            <button
                                key={view}
                                onClick={() => setSelectedView(view)}
                                className={`flex-1 sm:flex-none px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                                    selectedView === view
                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                        : 'text-gray-400 hover:text-black dark:hover:text-white'
                                }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex items-center overflow-hidden min-w-0">
                        {/* Fixed Type Filter - Only for Benchmark View */}
                        {selectedView === 'benchmark' && (
                            <div className="flex border-r border-gray-100 dark:border-gray-800 flex-shrink-0">
                                {['all', 'index', 'benchmark'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setBenchmarkTypeFilter(type)}
                                        className={`px-3 py-4 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${
                                            benchmarkTypeFilter === type
                                                ? 'text-black dark:text-white'
                                                : 'text-gray-300 hover:text-gray-500'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-x-auto scrollbar-hide min-w-0">
                            <div className="flex items-center px-4 h-[48px]">
                                {selectedView === 'category' ? (
                                    allCategories.map((category) => {
                                        const isSelected = selectedCategory === category;
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`px-4 py-4 font-display font-black tracking-tighter uppercase italic text-[10px] whitespace-nowrap transition-all leading-none ${
                                                    isSelected
                                                        ? 'text-black dark:text-white underline decoration-2 underline-offset-8'
                                                        : 'text-gray-400 hover:text-black dark:hover:text-white'
                                                }`}
                                            >
                                                {category.replace('_', ' ')}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <>
                                        {/* Benchmark List */}
                                        {filteredBenchmarks.slice(0, 10).map((benchmark) => {
                                            const isSelected = selectedTask === benchmark.name;
                                            return (
                                                <button
                                                    key={benchmark.name}
                                                    onClick={() => setSelectedTask(benchmark.name)}
                                                    className={`px-4 py-4 font-display font-black tracking-tighter uppercase italic text-[10px] whitespace-nowrap transition-all leading-none ${
                                                        isSelected
                                                            ? 'text-black dark:text-white underline decoration-2 underline-offset-8'
                                                            : 'text-gray-400 hover:text-black dark:hover:text-white'
                                                    }`}
                                                >
                                                    {benchmark.name}
                                                </button>
                                            );
                                        })}
                                        
                                        <button 
                                            onClick={() => setShowAllBenchmarks(true)}
                                            className="px-4 py-4 text-[9px] font-black text-brand-500 tracking-widest hover:bg-gray-50 dark:hover:bg-black/20 transition-colors flex-shrink-0"
                                        >
                                            + DIRECTORY
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popovers */}
            {showAllBenchmarks && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="w-full max-w-4xl bg-white dark:bg-surface-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-black uppercase tracking-widest">Full Benchmark Directory</span>
                            <button onClick={() => setShowAllBenchmarks(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                            {benchmarks.map((benchmark) => (
                                <button
                                    key={benchmark.name}
                                    onClick={() => { setSelectedTask(benchmark.name); setSelectedView('benchmark'); setShowAllBenchmarks(false); }}
                                    className={`p-4 rounded-xl text-left border transition-all ${
                                        selectedTask === benchmark.name 
                                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                                            : 'bg-gray-50 dark:bg-surface-800 border-transparent hover:border-gray-200'
                                    }`}
                                >
                                    <span className="block text-[8px] font-black uppercase opacity-50 mb-1">{benchmark.category}</span>
                                    <span className="text-xs font-bold">{benchmark.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="glass-card p-12 text-center">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2 mx-auto mb-4" />
                        <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3 mx-auto" />
                    </div>
                </div>
            ) : (
                <LeaderboardTable 
                    entries={entries} 
                    showBenchmark={selectedView === 'benchmark' && !!selectedTask} 
                    onLoadMore={handleLoadMore}
                    loadingMore={loadingMore}
                    hasMore={entries.length < total}
                    remainingCount={total - entries.length}
                />
            )}
        </div>
    );
}
