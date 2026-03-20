import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Zap, Clock } from 'lucide-react';
import ScoreBar from './ScoreBar';

export default function LeaderboardTable({ entries, showBenchmark = false }) {
    const [sortKey, setSortKey] = useState('score');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(50);
    const loadMoreBtnRef = useRef(null);

    // Reset visible count when filters or sorting change
    useEffect(() => {
        setVisibleCount(50);
    }, [search, sortKey, sortDir]);

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
                case 'speed': valA = a.model.performance?.median_output_tokens_per_second || 0; valB = b.model.performance?.median_output_tokens_per_second || 0; break;
                default: valA = a.score; valB = b.score;
            }
            if (typeof valA === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDir === 'asc' ? valA - valB : valB - valA;
        });
    }, [entries, sortKey, sortDir, search]);

    const visibleRows = useMemo(() => {
        return sorted.slice(0, visibleCount);
    }, [sorted, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 50);
        setTimeout(() => {
            window.scrollBy({ top: 350, behavior: 'smooth' });
        }, 50);
    };

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
                            <th className="px-6 py-3 text-left hidden lg:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('speed')}>
                                <span className="flex items-center gap-1">Speed <Clock className="w-3 h-3" /> <SortIcon columnKey="speed" /></span>
                            </th>
                            <th className="px-6 py-3 text-left hidden lg:table-cell w-48">Score Bar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                        {visibleRows.map((entry, idx) => (
                            <tr 
                                key={entry.model.name} 
                                className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors animate-fade-in group"
                                style={{ animationDelay: `${(idx % 50) * 15}ms`, animationFillMode: 'both' }}
                            >
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${idx < 3 ? 'text-brand-500' : 'text-gray-400'}`}>
                                        {idx + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <Link
                                            to={`/model/${encodeURIComponent(entry.model.name)}`}
                                            className="text-sm font-semibold hover:text-brand-500 transition-colors"
                                        >
                                            {entry.model.name}
                                        </Link>
                                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                                            <span className={
                                                entry.model.license_type === 'Open Source' 
                                                    ? 'text-emerald-500/70' 
                                                    : entry.model.license_type === 'Proprietary'
                                                    ? 'text-blue-500/60 dark:text-blue-400/60'
                                                    : 'text-gray-400/50'
                                            }>
                                                {(entry.model.license_type || 'unknown').toLowerCase()}
                                            </span>
                                            {entry.model.parameters && entry.model.parameters !== 'Unknown' && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-700 font-bold">·</span>
                                                    <span>{entry.model.parameters.toLowerCase()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
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
                                    {entry.model.performance?.median_output_tokens_per_second != null
                                        ? `${entry.model.performance.median_output_tokens_per_second.toFixed(1)} tokens/s`
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

            {sorted.length > visibleCount && (
                <div className="p-8 py-10 flex justify-center border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-transparent to-gray-50/30 dark:to-surface-800/30">
                    <button 
                        ref={loadMoreBtnRef}
                        onClick={handleLoadMore}
                        className="px-8 py-3.5 rounded-xl font-bold text-sm bg-white dark:bg-surface-800 border-2 border-brand-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] hover:border-brand-500/50 text-brand-600 dark:text-brand-400 transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        Expand Leaderboard
                        <span className="bg-brand-500/10 px-2 py-0.5 rounded-lg text-xs ml-1">
                            {sorted.length - visibleCount} more
                        </span>
                        <ArrowDown className="w-4 h-4 ml-1 group-hover:translate-y-1 transition-transform" />
                    </button>
                </div>
            )}

            {sorted.length === 0 && (
                <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                    No models found matching your search.
                </div>
            )}
        </div>
    );
}
