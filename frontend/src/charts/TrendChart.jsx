import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#d946ef', '#06b6d4', '#f59e0b', '#10b981'];

export default function TrendChart({ data, lines, xKey = 'date' }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
                No historical data available yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: 'currentColor', fontSize: 11, className: 'text-gray-600 dark:text-gray-400' }}
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
                {lines.map((line, idx) => (
                    <Line
                        key={line}
                        type="monotone"
                        dataKey={line}
                        stroke={COLORS[idx % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
