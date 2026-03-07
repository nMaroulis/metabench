import {
    BarChart as RechartsBarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#d946ef', '#06b6d4', '#f59e0b', '#10b981'];

export default function BenchmarkBarChart({ modelsData, benchmarks, stacked = false }) {
    if (!modelsData || modelsData.length === 0) return null;

    const data = benchmarks.map(b => {
        const point = { benchmark: b.length > 15 ? b.substring(0, 15) + '…' : b, fullName: b };
        modelsData.forEach(({ name, scores }) => {
            const score = scores.find(s => s.benchmark_name === b);
            point[name] = score ? score.normalized_score : 0;
        });
        return point;
    });

    return (
        <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                <XAxis
                    dataKey="benchmark"
                    tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-400 dark:text-gray-500' }}
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
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {modelsData.map(({ name }, idx) => (
                    <Bar
                        key={name}
                        dataKey={name}
                        fill={COLORS[idx % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        stackId={stacked ? "stack" : undefined}
                    />
                ))}
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
