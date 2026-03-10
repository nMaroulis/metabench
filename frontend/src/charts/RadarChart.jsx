import {
    Radar, RadarChart as RechartsRadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#d946ef', '#06b6d4', '#f59e0b', '#10b981'];

export default function BenchmarkRadarChart({ modelsData, benchmarks, colorOffset = 0 }) {
    if (!modelsData || modelsData.length === 0) return null;

    // Build data: each benchmark is a data point
    const data = benchmarks.map(b => {
        const point = { benchmark: b.length > 12 ? b.substring(0, 12) + '…' : b, fullName: b };
        modelsData.forEach(({ name, scores }) => {
            const score = scores.find(s => s.benchmark_name === b);
            point[name] = score ? score.normalized_score : 0;
        });
        return point;
    });

    return (
        <ResponsiveContainer width="100%" height={400}>
            <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                <PolarAngleAxis
                    dataKey="benchmark"
                    tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
                />
                <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: 'currentColor', fontSize: 10, className: 'text-gray-400 dark:text-gray-500' }}
                />
                {modelsData.map(({ name }, idx) => (
                    <Radar
                        key={name}
                        name={name}
                        dataKey={name}
                        stroke={COLORS[(idx + colorOffset) % COLORS.length]}
                        fill={COLORS[(idx + colorOffset) % COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                    />
                ))}
                <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                    }}
                />
            </RechartsRadarChart>
        </ResponsiveContainer>
    );
}
