import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 shadow-lg">
        <p className="data-label mb-1">{label}</p>
        <p className="font-mono text-sm text-primary">
          Arrivals: {payload[0].value.toLocaleString()} quintals
        </p>
      </div>
    );
  }
  return null;
};

export const ArrivalsChart = ({ data, title }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map((item, index) => ({
    date: formatDate(item.date),
    arrivals: item.arrivals,
    isLatest: index === data.length - 1,
  }));

  // Calculate trend
  const trend = chartData.length >= 2 
    ? chartData[chartData.length - 1].arrivals - chartData[chartData.length - 2].arrivals 
    : 0;
  const isDecreasing = trend < 0;

  return (
    <div className="chart-container" data-testid="arrivals-chart">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{title || 'ARRIVALS TREND'}</h3>
        <span className={`data-label ${isDecreasing ? 'text-orange-500' : 'text-green-500'}`}>
          {isDecreasing ? '▼' : '▲'} {Math.abs(trend).toLocaleString()} QTL
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#27272a" 
            vertical={false} 
          />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={false}
            width={50}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="arrivals" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isLatest ? (isDecreasing ? '#f97316' : '#22c55e') : '#3f3f46'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ArrivalsChart;
