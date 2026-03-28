import { useState, useEffect, useMemo, useRef } from 'react';
import { Trophy, Download, X } from 'lucide-react';
import api from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';
import SEO from '../components/SEO';

/**
 * LeaderboardPage Component
 * Displays the main LLM intelligence leaderboard with category and benchmark filtering.
 */
export default function LeaderboardPage() {
    // --- State Management ---
    const [entries, setEntries] = useState([]); // Leaderboard data rows
    const [benchmarks, setBenchmarks] = useState([]); // List of all available benchmarks
    const [selectedView, setSelectedView] = useState('category'); // Toggle between 'category' and 'benchmark' views
    const [selectedCategory, setSelectedCategory] = useState('overall'); // Active category filter (e.g., 'coding', 'math')
    const [selectedTask, setSelectedTask] = useState(''); // Active specific benchmark filter
    const [loading, setLoading] = useState(true); // Initial load state
    const [benchmarkTypeFilter, setBenchmarkTypeFilter] = useState('all'); // Filter benchmarks by type ('index', 'benchmark')
    const [showAllBenchmarks, setShowAllBenchmarks] = useState(false); // Popover toggle for benchmark directory

    const [skip, setSkip] = useState(0); // Pagination offset
    const [total, setTotal] = useState(0); // Total number of entries available
    const [loadingMore, setLoadingMore] = useState(false); // Load more state
    const LIMIT = 50; // Items per page

    // --- Dynamic Scroll Feedback ---
    const scrollRef = useRef(null);
    const [scrollState, setScrollState] = useState({ isAtStart: true, isAtEnd: false });

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setScrollState({
            isAtStart: scrollLeft < 10,
            isAtEnd: scrollLeft + clientWidth >= scrollWidth - 10
        });
    };

    // Initialize scroll state on mount/change
    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [benchmarks, selectedView, selectedCategory, selectedTask]);

    // --- Memoized Values ---

    // Filtered list of benchmarks based on the type filter (all/index/benchmark)
    const filteredBenchmarks = useMemo(() => {
        if (benchmarkTypeFilter === 'all') return benchmarks;
        return benchmarks.filter(b => b.type === benchmarkTypeFilter);
    }, [benchmarks, benchmarkTypeFilter]);

    // Extract unique categories from the benchmarks list
    const categories = useMemo(() => {
        return [...new Set(benchmarks.map(b => b.category).filter(Boolean))];
    }, [benchmarks]);

    // Combined list of 'overall' plus individual categories
    const allCategories = ['overall', ...categories];

    // --- Data Fetching ---

    // Initial fetch of all available benchmarks
    useEffect(() => {
        api.getBenchmarks().then(setBenchmarks).catch(console.error);
    }, []);

    /**
     * Fetches leaderboard entries from the API based on current filters and pagination.
     * @param {number} newSkip - Pagination offset
     * @param {boolean} isAppend - Whether to append data to existing list (Load More)
     */
    const fetchLeaderboard = (newSkip, isAppend = false) => {
        if (isAppend) setLoadingMore(true);
        else setLoading(true);

        const params = { limit: LIMIT, skip: newSkip };

        if (selectedView === 'category') {
            if (selectedCategory !== 'overall') {
                params.category = selectedCategory;
            }
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

    // Re-fetch when view or filters change
    useEffect(() => {
        setSkip(0);
        fetchLeaderboard(0, false);
    }, [selectedView, selectedCategory, selectedTask]);

    // --- Handlers ---

    /**
     * Handles data export in various formats
     * @param {string} format - 'csv' or 'json'
     */
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

    /**
     * Handles pagination for more results
     */
    const handleLoadMore = () => {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchLeaderboard(nextSkip, true);
    };

    return (
        <div className="page-container">
            <SEO
                title="LLM Intelligence Leaderboard"
                description="The ultimate leaderboard for Large Language Models. Compare GPT-4, Claude, Gemini and more based on aggregated benchmark scores."
            />

            {/* --- Header Section --- */}
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

                {/* Export Buttons */}
                <div className="flex items-center gap-3">
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


            {/* --- Navigation & Filter Bar --- */}
            <div className="mb-1 bg-white dark:bg-surface-900 border-y border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center min-h-[48px] sm:h-[48px]">

                    {/* Perspective Switcher (Toggle between Rankings by Category or by Benchmark) */}
                    <div className="flex border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800">
                        {['category', 'benchmark'].map((view) => (
                            <button
                                key={view}
                                onClick={() => setSelectedView(view)}
                                className={`flex-1 sm:flex-none px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${selectedView === view
                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                    : 'text-gray-400 hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>

                    {/* Content Area - Scrollable Categories or Benchmarks */}
                    <div className="flex-1 flex items-center min-w-0 relative h-[48px]">

                        {/* Type Filter for Benchmark View (Only shown when Benchmark perspective is active) */}
                        {selectedView === 'benchmark' && (
                            <div className="flex border-r border-gray-100 dark:border-gray-800 flex-shrink-0">
                                {['all', 'index', 'benchmark'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setBenchmarkTypeFilter(type)}
                                        className={`px-3 py-4 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ${benchmarkTypeFilter === type
                                            ? 'text-black dark:text-white'
                                            : 'text-gray-300 hover:text-gray-500'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Scrollable Container with Dynamic Mask Fade */}
                        <div
                            className="flex-1 flex items-center min-w-0 relative overflow-hidden h-full"
                            style={{
                                maskImage: `linear-gradient(to right, 
                                    ${scrollState.isAtStart ? 'black' : 'transparent'} 0%, 
                                    black ${scrollState.isAtStart ? '0%' : '15%'}, 
                                    black ${scrollState.isAtEnd ? '100%' : '85%'}, 
                                    ${scrollState.isAtEnd ? 'black' : 'transparent'} 100%)`,
                                WebkitMaskImage: `linear-gradient(to right, 
                                    ${scrollState.isAtStart ? 'black' : 'transparent'} 0%, 
                                    black ${scrollState.isAtStart ? '0%' : '15%'}, 
                                    black ${scrollState.isAtEnd ? '100%' : '85%'}, 
                                    ${scrollState.isAtEnd ? 'black' : 'transparent'} 100%)`
                            }}
                        >
                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide min-w-0 flex items-center px-4 h-full"
                            >
                                <div className="flex items-center">
                                    {selectedView === 'category' ? (
                                        // Category Selection
                                        allCategories.map((category) => {
                                            const isSelected = selectedCategory === category;
                                            return (
                                                <button
                                                    key={category}
                                                    onClick={() => setSelectedCategory(category)}
                                                    className={`px-4 py-4 font-display font-black tracking-tighter uppercase italic text-[10px] whitespace-nowrap transition-all leading-none ${isSelected
                                                        ? 'text-black dark:text-white underline decoration-2 underline-offset-8'
                                                        : 'text-gray-400 hover:text-black dark:hover:text-white'
                                                        }`}
                                                >
                                                    {category.replace('_', ' ')}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        // Benchmark Selection
                                        <>
                                            {filteredBenchmarks.slice(0, 10).map((benchmark) => {
                                                const isSelected = selectedTask === benchmark.name;
                                                return (
                                                    <button
                                                        key={benchmark.name}
                                                        onClick={() => setSelectedTask(benchmark.name)}
                                                        className={`px-4 py-4 font-display font-black tracking-tighter uppercase italic text-[10px] whitespace-nowrap transition-all leading-none ${isSelected
                                                            ? 'text-black dark:text-white underline decoration-2 underline-offset-8'
                                                            : 'text-gray-400 hover:text-black dark:hover:text-white'
                                                            }`}
                                                    >
                                                        {benchmark.name}
                                                    </button>
                                                );
                                            })}

                                            {/* Directory Button to show all benchmarks in a popover */}
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
            </div>

            {/* --- All Benchmarks Popover (Directory) --- */}
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
                                    className={`p-4 rounded-xl text-left border transition-all ${selectedTask === benchmark.name
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

            {/* --- Main Table Section --- */}
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

