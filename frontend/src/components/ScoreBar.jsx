import { useEffect, useState } from 'react';

export default function ScoreBar({ score, label, maxScore = 100, showLabel = true, height = 'h-2.5', animated = true }) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => setWidth(Math.min(score, maxScore)), 100);
            return () => clearTimeout(timer);
        } else {
            setWidth(Math.min(score, maxScore));
        }
    }, [score, maxScore, animated]);

    const percentage = (width / maxScore) * 100;

    const getBarColor = (score) => {
        if (score >= 90) return 'from-emerald-400 to-emerald-500';
        if (score >= 80) return 'from-green-400 to-emerald-400';
        if (score >= 70) return 'from-yellow-400 to-green-400';
        if (score >= 60) return 'from-amber-400 to-yellow-400';
        if (score >= 50) return 'from-orange-400 to-amber-400';
        return 'from-red-400 to-orange-400';
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{score?.toFixed(1)}</span>
                </div>
            )}
            <div className={`w-full ${height} rounded-full bg-gray-100 dark:bg-surface-700 overflow-hidden`}>
                <div
                    className={`${height} rounded-full bg-gradient-to-r ${getBarColor(score)} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
