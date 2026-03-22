import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Clock } from 'lucide-react';
import ScoreBar from './ScoreBar';

export default function LeaderboardTable({ entries, showBenchmark = false, onLoadMore, hasMore, loadingMore, remainingCount }) {
    const [sortKey, setSortKey] = useState('score');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');
    const loadMoreBtnRef = useRef(null);

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

    const SortIcon = ({ columnKey }) => {
        if (sortKey !== columnKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
    };

    const getScoreColor = (score) => {
        if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
        if (score >= 70) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getLicenseColor = (licenseType) => {
        switch (licenseType?.toLowerCase()) {
            case 'open source':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'proprietary':
                return 'text-blue-600 dark:text-blue-400';
            default:
                return 'text-gray-500 dark:text-gray-400';
        }
    };

    const getParameterColor = (params) => {
        if (!params || params === 'Unknown') return 'text-gray-400 dark:text-gray-500';
        
        // Remove tilde prefix if present and check if it's an approximate value
        const hasTilde = params.startsWith('~');
        const cleanParams = hasTilde ? params.slice(1) : params;
        const paramValue = parseFloat(cleanParams);
        
        if (isNaN(paramValue)) return 'text-gray-600 dark:text-gray-400';
        
        if (hasTilde) {
            // Lighter purple for approximate values (with ~)
            return 'text-purple-400 dark:text-purple-300';
        } else {
            // Regular colors for exact values
            if (paramValue >= 70) return 'text-purple-600 dark:text-purple-400';
            if (paramValue >= 30) return 'text-blue-600 dark:text-blue-400';
            return 'text-gray-600 dark:text-gray-400';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === 'Unknown') return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch {
            return null;
        }
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
                        {sorted.map((entry, idx) => (
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
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            to={`/model/${encodeURIComponent(entry.model.name)}`}
                                            className="text-sm font-semibold hover:text-brand-500 transition-colors"
                                        >
                                            {entry.model.name}
                                        </Link>
                                        
                                        {/* Metadata Row */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            {/* License */}
                                            {entry.model.license_type && entry.model.license_type !== 'Unknown' && (
                                                <span className={`${getLicenseColor(entry.model.license_type)}`}>
                                                    {entry.model.license_type.toLowerCase()}
                                                </span>
                                            )}
                                            
                                            {/* Parameters */}
                                            {entry.model.parameters && entry.model.parameters !== 'Unknown' && (
                                                <>
                                                    {entry.model.license_type && entry.model.license_type !== 'Unknown' && (
                                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                                    )}
                                                    <span className={`${getParameterColor(entry.model.parameters)}`}>
                                                        {entry.model.parameters}
                                                    </span>
                                                </>
                                            )}
                                            
                                            {/* Release Date */}
                                            {formatDate(entry.model.release_date) && (
                                                <>
                                                    {(entry.model.license_type && entry.model.license_type !== 'Unknown' || 
                                                      entry.model.parameters && entry.model.parameters !== 'Unknown') && (
                                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                                    )}
                                                    <span className="text-amber-600 dark:text-amber-400">
                                                        {formatDate(entry.model.release_date)}
                                                    </span>
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

            {hasMore && (
                <div className="relative border-t border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    <button
                        ref={loadMoreBtnRef}
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="w-full group relative py-10 px-4 flex flex-col items-center justify-center transition-all duration-500 hover:bg-gray-50/50 dark:hover:bg-brand-500/5 disabled:opacity-50"
                    >
                        {/* Interactive Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-brand-500/10 dark:via-brand-500/10 dark:to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        {/* Animated Mesh/Gradient Lines */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-20 group-hover:opacity-100 group-hover:w-[120%] transition-all duration-1000"></div>

                        <div className="relative flex flex-col items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover:text-brand-500 transition-colors duration-300">
                                {loadingMore ? 'Loading...' : 'Click to Expand'}
                            </span>

                            <div className="flex items-center gap-4 mt-1">
                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700 group-hover:to-brand-500 transition-all"></div>
                                <span className="text-lg font-display font-light text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                                    {loadingMore ? 'Fetching next models...' : (
                                        <>
                                            Reveal <span className="font-bold text-brand-600 dark:text-brand-400">{remainingCount}</span> more models
                                        </>
                                    )}
                                </span>
                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700 group-hover:to-brand-500 transition-all"></div>
                            </div>

                            <ArrowDown className={`w-5 h-5 mt-4 text-brand-500/40 group-hover:text-brand-500 group-hover:translate-y-2 transition-all duration-500 ease-out ${loadingMore ? 'animate-bounce' : ''}`} />
                        </div>

                        {/* Subtle bottom fade */}
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none opacity-60"></div>
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
