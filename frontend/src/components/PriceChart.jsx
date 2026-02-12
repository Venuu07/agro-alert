import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 shadow-lg rounded-lg">
        <p className="data-label mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="font-mono text-sm" style={{ color: entry.color }}>
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const PriceChart = ({ data, title, showComparison = false, comparisonData = null }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = data.map((item, index) => ({
    date: formatDate(item.date),
    price: item.price,
    ...(showComparison && comparisonData && comparisonData[index] 
      ? { simulated: comparisonData[index].price } 
      : {}),
  }));

  return (
    <div data-testid="price-chart">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">{title || 'PRICE TREND'}</h3>
        <span className="data-label">₹/QUINTAL</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="simulatedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)" 
            vertical={false} 
          />
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            tick={{ fontSize: 11, fontFamily: 'Inter' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fontSize: 11, fontFamily: 'Inter' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            width={60}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            name="Actual"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
          {showComparison && comparisonData && (
            <Area
              type="monotone"
              dataKey="simulated"
              name="Simulated"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#simulatedGradient)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
