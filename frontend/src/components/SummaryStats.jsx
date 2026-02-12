import React from 'react';
import { AlertTriangle, Eye, CheckCircle, BarChart3 } from 'lucide-react';

export const SummaryStats = ({ data }) => {
  const stats = [
    {
      label: 'TOTAL MANDIS',
      value: data.totalMandis,
      icon: BarChart3,
      color: 'text-foreground',
    },
    {
      label: 'HIGH RISK',
      value: data.highRiskCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      pulse: data.highRiskCount > 0,
    },
    {
      label: 'WATCH',
      value: data.watchCount,
      icon: Eye,
      color: 'text-orange-500',
    },
    {
      label: 'NORMAL',
      value: data.normalCount,
      icon: CheckCircle,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-stats">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="summary-stat"
            data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
          >
            <Icon 
              size={20} 
              className={`${stat.color} ${stat.pulse ? 'status-pulse' : ''}`} 
            />
            <span className={`kpi-value mt-2 ${stat.color}`}>
              {stat.value}
            </span>
            <span className="data-label mt-1">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryStats;
