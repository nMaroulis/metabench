import { useState, useEffect } from 'react';
import { Trophy, Filter, Download } from 'lucide-react';
import api from '../services/api';
import LeaderboardTable from '../components/LeaderboardTable';
import SEO from '../components/SEO';

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([]);
    const [benchmarks, setBenchmarks] = useState([]);
    const [selectedTask, setSelectedTask] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBenchmarks().then(setBenchmarks).catch(console.error);
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = {};
        if (selectedTask) params.task = selectedTask;
        api.getLeaderboard(params)
            .then((data) => setEntries(data.entries || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedTask]);

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
                        {selectedTask ? `Ranked by ${selectedTask} score` : 'Ranked by Overall Intelligence Score'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Benchmark filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={selectedTask}
                            onChange={(e) => setSelectedTask(e.target.value)}
                            className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[180px]"
                        >
                            <option value="">Overall Score</option>
                            {benchmarks.map(b => (
                                <option key={b.name || b} value={b.name || b}>{b.name || b}</option>
                            ))}
                        </select>
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

            {/* Table */}
            {loading ? (
                <div className="glass-card p-12 text-center">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/2 mx-auto mb-4" />
                        <div className="h-4 bg-gray-200 dark:bg-surface-700 rounded-lg w-1/3 mx-auto" />
                    </div>
                </div>
            ) : (
                <LeaderboardTable entries={entries} showBenchmark={!!selectedTask} />
            )}
        </div>
    );
}
