import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import ScoreBar from './ScoreBar';

export default function LeaderboardTable({ entries, showBenchmark = false }) {
    const [sortKey, setSortKey] = useState('score');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');

    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sorted = useMemo(() => {
        let filtered = entries.filter(e =>
            e.model.name.toLowerCase().includes(search.toLowerCase()) ||
            e.model.provider.toLowerCase().includes(search.toLowerCase())
        );
        return [...filtered].sort((a, b) => {
            let valA, valB;
            switch (sortKey) {
                case 'score': valA = a.score; valB = b.score; break;
                case 'name': valA = a.model.name.toLowerCase(); valB = b.model.name.toLowerCase(); break;
                case 'provider': valA = a.model.provider.toLowerCase(); valB = b.model.provider.toLowerCase(); break;
                case 'cost': valA = a.model.pricing?.cost_per_1m_input_tokens || 999; valB = b.model.pricing?.cost_per_1m_input_tokens || 999; break;
                case 'latency': valA = a.model.performance?.avg_latency_ms || 99999; valB = b.model.performance?.avg_latency_ms || 99999; break;
                default: valA = a.score; valB = b.score;
            }
            if (typeof valA === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });
    }, [entries, sortKey, sortDir, search]);

    const SortIcon = ({ columnKey }) => {
        if (sortKey !== columnKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    };

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
        if (score >= 70) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search models or providers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">
                            <th className="px-6 py-3 text-left w-16">#</th>
                            <th className="px-6 py-3 text-left cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('name')}>
                                <span className="flex items-center gap-1">Model <SortIcon columnKey="name" /></span>
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('provider')}>
                                <span className="flex items-center gap-1">Provider <SortIcon columnKey="provider" /></span>
                            </th>
                            <th className="px-6 py-3 text-left cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('score')}>
                                <span className="flex items-center gap-1">Score <SortIcon columnKey="score" /></span>
                            </th>
                            <th className="px-6 py-3 text-left hidden md:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('cost')}>
                                <span className="flex items-center gap-1">Cost <SortIcon columnKey="cost" /></span>
                            </th>
                            <th className="px-6 py-3 text-left hidden lg:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('latency')}>
                                <span className="flex items-center gap-1">Latency <SortIcon columnKey="latency" /></span>
                            </th>
                            <th className="px-6 py-3 text-left hidden lg:table-cell w-48">Score Bar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                        {sorted.map((entry, idx) => (
                            <tr key={entry.model.name} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${idx < 3 ? 'text-brand-500' : 'text-gray-400'}`}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link
                                        to={`/model/${encodeURIComponent(entry.model.name)}`}
                                        className="text-sm font-semibold hover:text-brand-500 transition-colors"
                                    >
                                        {entry.model.name}
                                    </Link>
                                    {entry.model.parameters && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{entry.model.parameters}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{entry.model.provider}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${getScoreColor(entry.score)}`}>
                                        {entry.score?.toFixed(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                                    {entry.model.pricing?.cost_per_1m_input_tokens != null
                                        ? `$${entry.model.pricing.cost_per_1m_input_tokens}`
                                        : '—'}
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                                    {entry.model.avg_latency_ms != null
                                        ? entry.model.avg_latency_ms < 1000
                                            ? `${entry.model.avg_latency_ms}ms`
                                            : `${(entry.model.avg_latency_ms / 1000).toFixed(1)}s`
                                        : '—'}
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <ScoreBar score={entry.score} showLabel={false} height="h-2" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {sorted.length === 0 && (
                <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                    No models found matching your search.
                </div>
            )}
        </div>
    );
}
