import React from 'react';
import { AlertTriangle, Eye, CheckCircle, BarChart3 } from 'lucide-react';

export const SummaryStats = ({ data }) => {
  const stats = [
    {
      label: 'TOTAL MANDIS',
      value: data.totalMandis,
      icon: BarChart3,
      color: 'text-foreground',
      bgGradient: 'from-slate-500/10 to-slate-500/5',
    },
    {
      label: 'HIGH RISK',
      value: data.highRiskCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      pulse: data.highRiskCount > 0,
      bgGradient: 'from-red-500/10 to-red-500/5',
    },
    {
      label: 'UNDER WATCH',
      value: data.watchCount,
      icon: Eye,
      color: 'text-orange-500',
      bgGradient: 'from-orange-500/10 to-orange-500/5',
    },
    {
      label: 'STABLE',
      value: data.normalCount,
      icon: CheckCircle,
      color: 'text-green-500',
      bgGradient: 'from-green-500/10 to-green-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="summary-stats">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`metric-card-premium bg-gradient-to-br ${stat.bgGradient} animate-fade-in ${stat.pulse ? 'critical-indicator' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between mb-3">
              <Icon 
                size={20} 
                className={`${stat.color} ${stat.pulse ? 'status-pulse' : ''}`} 
              />
              {stat.pulse && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <span className={`font-mono text-4xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
            <span className="data-label block mt-2">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryStats;
