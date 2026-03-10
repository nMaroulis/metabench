import { useState, useEffect } from 'react';
import { GitCompareArrows, Plus, X, Search } from 'lucide-react';
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
    };

    const removeModel = (name) => {
        setSelectedNames(selectedNames.filter(n => n !== name));
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

    return (
        <div className="page-container">
            <SEO
                title="Compare LLMs"
                description="Side-by-side comparison of Large Language Models. Compare benchmarks, cost, and performance of GPT-4, Claude, Gemini, and more."
            />
            {/* Header */}
            <div className="mb-8">
                <h1 className="section-title flex items-center gap-3">
                    <GitCompareArrows className="w-8 h-8 text-brand-500" />
                    Compare Models
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Select 2-5 models for side-by-side comparison</p>
            </div>

            {/* Model selector */}
            <div className="glass-card p-6 mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedNames.map(name => (
                        <span key={name} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-medium">
                            {name}
                            <button onClick={() => removeModel(name)} className="hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                    {selectedNames.length < 5 && (
                        <div className="relative">
                            <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Add a model..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                    className="bg-transparent border-none outline-none text-sm placeholder-gray-400 w-48"
                                />
                            </div>
                            {showDropdown && searchQuery && (
                                <div className="absolute top-full left-0 mt-2 w-64 glass-card rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {filteredModels.slice(0, 10).map(m => (
                                        <button
                                            key={m.name}
                                            onClick={() => addModel(m.name)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        >
                                            <span className="font-medium">{m.name}</span>
                                            <span className="text-gray-400 ml-2 text-xs">{m.provider} · {m.overall_score?.toFixed(1)}</span>
                                        </button>
                                    ))}
                                    {filteredModels.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-gray-400">No models found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400">{selectedNames.length}/5 models selected{selectedNames.length < 2 && ' • Select at least 2 to compare'}</p>
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
                    {/* Chart toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartType('radar')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${chartType === 'radar' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            Radar Chart
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${chartType === 'bar' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-surface-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            Bar Chart
                        </button>
                    </div>

                    {/* Chart */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-display font-bold mb-4">Benchmark Comparison</h3>
                        {chartType === 'radar' ? (
                            <BenchmarkRadarChart modelsData={modelsChartData} benchmarks={benchmarkNames} />
                        ) : (
                            <BenchmarkBarChart modelsData={modelsChartData} benchmarks={benchmarkNames} />
                        )}
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
                            <h3 className="text-lg font-display font-bold mb-4">Latency Comparison</h3>
                            <div className="space-y-4">
                                {comparisonData.models.map(m => (
                                    <div key={m.model.name}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{m.model.name}</span>
                                            <span className="text-gray-500">
                                                {m.model.performance?.avg_latency_ms != null
                                                    ? (m.model.performance.avg_latency_ms < 1000
                                                        ? `${m.model.performance.avg_latency_ms}ms`
                                                        : `${(m.model.performance.avg_latency_ms / 1000).toFixed(1)}s`)
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <ScoreBar
                                            score={Math.max(0, 100 - (m.model.performance?.avg_latency_ms || 0) / 100)}
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
