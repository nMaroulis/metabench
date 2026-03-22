import { useState, useEffect, useMemo } from 'react';
import { Trophy, Filter, Download, BarChart3, Target, Brain, BookOpen, Code, GraduationCap, MessageSquare, Cpu, Users, Heart, Zap } from 'lucide-react';
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

    const handleLoadMore = () => {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchLeaderboard(nextSkip, true);
    };

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
            case 'coding': return 'from-blue-500 to-cyan-500';
            case 'math': return 'from-purple-500 to-pink-500';
            case 'reasoning': return 'from-emerald-500 to-teal-500';
            case 'knowledge': return 'from-amber-500 to-orange-500';
            case 'instruction': return 'from-indigo-500 to-blue-500';
            case 'agentic': return 'from-red-500 to-rose-500';
            case 'human_preference': return 'from-green-500 to-emerald-500';
            case 'emotional_intelligence': return 'from-pink-500 to-rose-500';
            case 'composite': return 'from-brand-500 to-purple-500';
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
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {getSelectionDescription()}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Stylish View Selector */}
                    <div className="flex bg-gray-100 dark:bg-surface-700 rounded-lg p-1">
                        <button
                            onClick={() => { setSelectedView('category'); setSelectedTask(''); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                selectedView === 'category'
                                    ? 'bg-white dark:bg-surface-600 text-brand-600 dark:text-brand-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Categories
                        </button>
                        <button
                            onClick={() => { setSelectedView('benchmark'); setSelectedCategory('overall'); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                selectedView === 'benchmark'
                                    ? 'bg-white dark:bg-surface-600 text-brand-600 dark:text-brand-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <Target className="w-4 h-4" />
                            Benchmarks
                        </button>
                    </div>

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

            {/* Compact Category Selection */}
            {selectedView === 'category' && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {allCategories.map((category) => {
                            const Icon = getCategoryIcon(category);
                            const isSelected = selectedCategory === category;
                            const isOverall = category === 'overall';
                            
                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-gradient-to-r ' + getCategoryColor(category) + ' text-white shadow-md'
                                            : 'bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                                    <span>{isOverall ? 'Overall' : category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}</span>
                                    {isOverall && !isSelected && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold">
                                            Default
                                        </span>
                                    )}
                                    {!isOverall && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isSelected 
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {benchmarksByCategory[category]?.length || 0}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Compact Benchmark Selection */}
            {selectedView === 'benchmark' && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {benchmarks.map((benchmark) => {
                            const isSelected = selectedTask === benchmark.name;
                            const Icon = getCategoryIcon(benchmark.category);
                            
                            return (
                                <button
                                    key={benchmark.name}
                                    onClick={() => setSelectedTask(benchmark.name)}
                                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                                            : 'bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-500'}`} />
                                    <span className="truncate max-w-[120px]">{benchmark.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                        benchmark.type === 'index'
                                            ? isSelected 
                                                ? 'bg-white/20 text-white'
                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                            : isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {benchmark.type || 'benchmark'}
                                    </span>
                                </button>
                            );
                        })}
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
