import { useState, useEffect, useRef } from 'react';
import { GitCompareArrows, Plus, X, Search, Clapperboard, Brain, Zap } from 'lucide-react';
import api from '../services/api';
import BenchmarkRadarChart from '../charts/RadarChart';
import BenchmarkBarChart from '../charts/BarChart';
import ScoreBar from '../components/ScoreBar';
import SEO from '../components/SEO';

export default function ComparePage() {
    const [allModels, setAllModels] = useState([]);
    const [selectedNames, setSelectedNames] = useState([]);
    const [comparisonData, setComparisonData] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chartType, setChartType] = useState('radar');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowDropdown(false);
                setFocusedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        api.getModels({ limit: 100 }).then(setAllModels).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedNames.length >= 2) {
            setLoading(true);
            api.compareModels(selectedNames)
                .then(setComparisonData)
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setComparisonData(null);
        }
    }, [selectedNames]);

    const addModel = (name) => {
        if (selectedNames.length < 5 && !selectedNames.includes(name)) {
            setSelectedNames([...selectedNames, name]);
        }
        setSearchQuery('');
        setShowDropdown(false);
        setFocusedIndex(-1);
    };

    const removeModel = (name) => {
        setSelectedNames(selectedNames.filter(n => n !== name));
    };

    const handleKeyDown = (e) => {
        const results = filteredModels.slice(0, 10);

        if (e.key === 'Backspace' && searchQuery === '' && selectedNames.length > 0) {
            // Remove last model if backspacing on empty input
            removeModel(selectedNames[selectedNames.length - 1]);
            return;
        }

        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < results.length) {
                addModel(results[focusedIndex].name);
            } else if (results.length > 0) {
                addModel(results[0].name); // Select first by default
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
            setFocusedIndex(-1);
        }
    };

    const filteredModels = allModels.filter(m =>
        !selectedNames.includes(m.name) &&
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const benchmarkNames = comparisonData?.benchmarks?.map(b => b.name) || [];
    const modelsChartData = comparisonData?.models?.map(m => ({
        name: m.model.name,
        scores: m.scores,
    })) || [];

    const capabilityCategories = [
        'knowledge', 'math', 'coding', 'reasoning',
        'instruction', 'agentic', 'human_preference', 'emotional_intelligence'
    ];

    // 1. Process category data for each model
    const categoryRadarData = comparisonData?.models?.map(m => {
        const scoresByCategory = (m.scores || []).reduce((acc, s) => {
            const cat = s.benchmark_category || 'other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(s.normalized_score);
            return acc;
        }, {});

        const avgScores = capabilityCategories.map(cat => {
            const scores = scoresByCategory[cat] || [];
            const avg = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0;
            return {
                benchmark_name: cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                normalized_score: avg
            };
        });

        return {
            name: m.model.name,
            scores: avgScores
        };
    }) || [];

    // 2. Filter categories to only those with at least one non-zero score across all models
    const categoryNames = capabilityCategories.map(cat =>
        cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    );

    const filteredCategoryNames = categoryNames.filter(name =>
        categoryRadarData.some(m => m.scores.find(s => s.benchmark_name === name)?.normalized_score > 0)
    );

    // 3. Filter benchmarks to only those with at least one value
    const filteredBenchmarkNames = benchmarkNames.filter(name =>
        modelsChartData.some(m => m.scores.find(s => s.benchmark_name === name)?.normalized_score > 0)
    );

    return (
        <div className="page-container">
            <SEO
                title="Compare LLMs"
                description="Side-by-side comparison of Large Language Models. Compare benchmarks, cost, and performance of GPT-4, Claude, Gemini, and more."
            />
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight uppercase italic flex items-center gap-3 select-none">
                    <GitCompareArrows className="w-8 h-8 text-brand-500" />
                    Compare Models
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Select 2-5 models for side-by-side comparison</p>
            </div>

            {/* Model selector */}
            <div className="glass-card p-6 mb-8 w-full relative z-40">
                <div className="mb-2 flex justify-between items-end">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Models to compare
                    </label>
                    <span className="text-xs text-brand-500 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full">
                        {selectedNames.length}/5 selected
                    </span>
                </div>

                <div
                    ref={containerRef}
                    className="relative flex items-center flex-wrap gap-2 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all shadow-sm"
                    onClick={() => inputRef.current?.focus()}
                >
                    <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />

                    {selectedNames.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in group">
                            {name}
                            <button
                                onClick={(e) => { e.stopPropagation(); removeModel(name); }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}

                    {selectedNames.length < 5 && (
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={selectedNames.length === 0 ? "Search for a model (e.g. GPT-4)..." : "Add another model..."}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowDropdown(true);
                                setFocusedIndex(0);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400 min-w-[150px] py-1"
                        />
                    )}

                    {showDropdown && (searchQuery || filteredModels.length > 0) && selectedNames.length < 5 && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full glass-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[360px] overflow-y-auto animate-slide-up origin-top">
                            <div className="p-2 flex flex-col gap-0.5">
                                {filteredModels.slice(0, 10).map((m, idx) => (
                                    <button
                                        key={m.name}
                                        onClick={() => addModel(m.name)}
                                        onMouseEnter={() => setFocusedIndex(idx)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg flex items-center justify-between transition-colors ${focusedIndex === idx
                                            ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                                            : 'hover:bg-gray-50 dark:hover:bg-surface-700'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{m.name}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 max-w-[200px] truncate">{m.description}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                {m.provider}
                                            </span>
                                            {m.overall_score && (
                                                <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-500">
                                                    Score: {m.overall_score.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                                {filteredModels.length === 0 && (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No models found</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try a different search term.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {selectedNames.length < 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium flex items-center gap-1">
                        Select at least 2 models to see the comparison.
                    </p>
                )}
            </div>

            {/* Comparison results */}
            {loading && (
                <div className="glass-card p-12 text-center animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3 mx-auto mb-4" />
                    <div className="h-64 bg-gray-200 dark:bg-surface-700 rounded-xl" />
                </div>
            )}

            {comparisonData && !loading && (
                <div className="space-y-8">
                    {/* Charts View */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartType('radar')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${chartType === 'radar' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                Radar View
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                Bar Chart
                            </button>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Showing active metrics only
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Capability Radar */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-display font-bold">Capability Profile</h3>
                            </div>
                            {chartType === 'radar' ? (
                                <BenchmarkRadarChart modelsData={categoryRadarData} benchmarks={filteredCategoryNames} colorOffset={2} />
                            ) : (
                                <BenchmarkBarChart modelsData={categoryRadarData} benchmarks={filteredCategoryNames} />
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 text-center italic">
                                Comparison of broad cognitive domains (Average normalized scores)
                            </p>
                        </div>

                        {/* Benchmark Radar */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-display font-bold">Benchmark Detail</h3>
                            </div>
                            {chartType === 'radar' ? (
                                <BenchmarkRadarChart modelsData={modelsChartData} benchmarks={filteredBenchmarkNames} />
                            ) : (
                                <BenchmarkBarChart modelsData={modelsChartData} benchmarks={filteredBenchmarkNames} />
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 text-center italic">
                                Side-by-side performance on specific industry-standard metrics
                            </p>
                        </div>
                    </div>

                    {/* Score breakdown table */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                            <h3 className="text-lg font-display font-bold">Score Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">
                                        <th className="px-6 py-3 text-left">Benchmark</th>
                                        {comparisonData.models.map(m => (
                                            <th key={m.model.name} className="px-6 py-3 text-center">{m.model.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                    <tr className="bg-brand-50/50 dark:bg-brand-900/10 font-bold">
                                        <td className="px-6 py-3 text-sm">Overall Score</td>
                                        {comparisonData.models.map(m => (
                                            <td key={m.model.name} className="px-6 py-3 text-center text-sm">
                                                <span className={`score-badge ${m.model.overall_score >= 85 ? 'score-high' : m.model.overall_score >= 70 ? 'score-mid' : 'score-low'}`}>
                                                    {m.model.overall_score?.toFixed(1)}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    {benchmarkNames.map(bench => (
                                        <tr key={bench} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                                            <td className="px-6 py-3 text-sm font-medium">{bench}</td>
                                            {comparisonData.models.map(m => {
                                                const score = m.scores.find(s => s.benchmark_name === bench);
                                                const val = score?.normalized_score || 0;
                                                const isMax = comparisonData.models.every(om => {
                                                    const os = om.scores.find(s => s.benchmark_name === bench);
                                                    return (os?.normalized_score || 0) <= val;
                                                });
                                                return (
                                                    <td key={m.model.name} className="px-6 py-3 text-center">
                                                        <span className={`text-sm font-mono ${isMax ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {val.toFixed(1)}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cost/Latency comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-display font-bold mb-4">Cost Comparison</h3>
                            <div className="space-y-4">
                                {comparisonData.models.map(m => (
                                    <div key={m.model.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{m.model.name}</span>
                                            <span className="text-gray-500">${m.model.pricing?.cost_per_1m_input_tokens}/1M input</span>
                                        </div>
                                        <ScoreBar
                                            score={Math.max(0, 100 - (m.model.pricing?.cost_per_1m_input_tokens || 0) * 5)}
                                            showLabel={false}
                                            height="h-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-display font-bold mb-4">Speed Comparison</h3>
                            <div className="space-y-4">
                                {comparisonData.models.map(m => (
                                    <div key={m.model.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{m.model.name}</span>
                                            <span className="text-gray-500">
                                                {m.model.performance?.median_output_tokens_per_second != null
                                                    ? `${m.model.performance.median_output_tokens_per_second.toFixed(1)} tokens/s`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <ScoreBar
                                            score={Math.min(100, (m.model.performance?.median_output_tokens_per_second || 0) / 2)}
                                            showLabel={false}
                                            height="h-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!comparisonData && !loading && selectedNames.length < 2 && (
                <div className="glass-card p-16 text-center">
                    <GitCompareArrows className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-gray-400 dark:text-gray-500 mb-2">Select Models to Compare</h3>
                    <p className="text-gray-400 dark:text-gray-500">Choose 2 or more models from the search above to see a detailed comparison</p>
                </div>
            )}
        </div>
    );
}
