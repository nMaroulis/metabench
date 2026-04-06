import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Clock, Brain } from 'lucide-react';
import ScoreBar from './ScoreBar';

const getReasoningLevel = (tag) => {
    if (!tag) return -1;
    const lowerTag = tag.toLowerCase();

    if (lowerTag.includes('max effort') || lowerTag === 'xhigh') return 5;
    if ((lowerTag.includes('reasoning') && !lowerTag.includes('non-reasoning')) || lowerTag === 'high') return 4;
    if (lowerTag === 'medium') return 3;
    if (lowerTag === 'low') return 2;
    if (lowerTag.includes('non-reasoning')) return 0;

    return -1;
};

const getProviderStyle = (provider) => {
    if (!provider) return '';
    const p = provider.toLowerCase().trim();
    
    // Core base classes for a premium, sharp glassy pill
    const base = "inline-flex items-center px-2 py-[3px] rounded-full border text-[9px] font-black uppercase tracking-[0.15em] leading-none shadow-sm backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md";

    let colorClass = "bg-gray-100/50 text-gray-600 border-gray-200/50 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50";

    if (p.includes('openai')) {
        colorClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    } else if (p.includes('google')) {
        colorClass = "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
    } else if (p.includes('anthropic')) {
        colorClass = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
    } else if (p.includes('meta')) {
        colorClass = "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]";
    } else if (p.includes('xai') || p.includes('x ai')) {
        colorClass = "bg-zinc-500/10 text-zinc-900 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-100 dark:border-zinc-500/30 hover:bg-zinc-500/20 dark:hover:bg-zinc-500/30";
    } else if (p.includes('mistral')) {
        colorClass = "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30 hover:bg-orange-500/20 dark:hover:bg-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]";
    } else if (p.includes('deepseek')) {
        colorClass = "bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
    } else if (p.includes('microsoft')) {
        colorClass = "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.1)]";
    } else if (p.includes('cohere')) {
        colorClass = "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
    } else if (p.includes('alibaba') || p.includes('qwen')) {
        colorClass = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
    } else if (p.includes('amazon')) {
        colorClass = "bg-yellow-500/10 text-yellow-800 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30 hover:bg-yellow-500/20 dark:hover:bg-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]";
    }

    return `${base} ${colorClass}`;
};

const parseModelName = (name) => {
    const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
        const tag = match[2];
        const level = getReasoningLevel(tag);
        if (level !== -1) {
            return {
                baseName: match[1],
                tag: tag,
                level: level
            };
        }
    }
    return {
        baseName: name,
        tag: null,
        level: -1
    };
};

const ReasoningVisual = ({ tag, level }) => {
    if (level === -1) return <span className="text-gray-300 dark:text-gray-700 font-medium">—</span>;

    let iconColor = "";
    let dotsColor = "";

    if (level === 5) {
        iconColor = "text-fuchsia-500 drop-shadow-[0_0_4px_rgba(217,70,239,0.4)]";
        dotsColor = "bg-fuchsia-500 shadow-[0_0_4px_rgba(217,70,239,0.3)]";
    }
    else if (level === 4) {
        iconColor = "text-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]";
        dotsColor = "bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.3)]";
    }
    else if (level === 3) {
        iconColor = "text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.2)]";
        dotsColor = "bg-amber-500";
    }
    else if (level === 2) {
        iconColor = "text-teal-500";
        dotsColor = "bg-teal-500";
    }
    else {
        iconColor = "text-slate-400";
        dotsColor = "bg-slate-400";
    }

    const getDisplayText = () => {
        if (level === 0) return "None";
        if (tag.toLowerCase() === 'reasoning') return "Standard";
        return tag;
    };

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" title={`${tag} (${level === 0 ? 'None' : level + '/5'} Reasoning)`}>
                <Brain className={`w-[14px] h-[14px] ${iconColor}`} />
                <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`w-1 h-3 rounded-full transition-all duration-300 ${i <= level ? dotsColor : 'bg-gray-200 dark:bg-gray-700/50'}`}
                        />
                    ))}
                </div>
            </div>
            <span className="text-[10px] font-bold capitalize tracking-wide text-gray-500 dark:text-gray-400 hidden xl:inline-block whitespace-nowrap">
                {getDisplayText()}
            </span>
        </div>
    );
};

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
                case 'reasoning':
                    valA = parseModelName(a.model.name).level;
                    valB = parseModelName(b.model.name).level;
                    break;
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
                            <th className="px-6 py-3 text-left hidden sm:table-cell cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort('reasoning')}>
                                <span className="flex items-center gap-1">Reasoning <SortIcon columnKey="reasoning" /></span>
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
                        {sorted.map((entry, idx) => {
                            const { baseName, tag, level } = parseModelName(entry.model.name);
                            return (
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
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    to={`/model/${encodeURIComponent(entry.model.name)}`}
                                                    className="text-sm font-semibold hover:text-brand-500 transition-colors"
                                                    title={entry.model.name}
                                                >
                                                    {baseName}
                                                </Link>
                                                {entry.model.provider && (
                                                    <span 
                                                        className={getProviderStyle(entry.model.provider)}
                                                        onClick={(e) => { e.preventDefault(); setSearch(entry.model.provider); }}
                                                    >
                                                        {entry.model.provider}
                                                    </span>
                                                )}
                                            </div>

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
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <ReasoningVisual tag={tag} level={level} />
                                    </td>
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
                            );
                        })}
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
