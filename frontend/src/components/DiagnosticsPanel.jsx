import React from 'react';
import { StressGauge } from './StressGauge';
import { StatusBadge } from './StatusBadge';
import { TrendingUp, TrendingDown, Activity, Package, CloudRain, PartyPopper, AlertCircle } from 'lucide-react';

export const DiagnosticsPanel = ({ mandi }) => {
  const priceChange = mandi.priceChangePct ?? ((mandi.currentPrice - mandi.previousPrice) / mandi.previousPrice) * 100;
  const arrivalsChange = mandi.arrivalChangePct ?? ((mandi.arrivals - mandi.previousArrivals) / mandi.previousArrivals) * 100;

  const metrics = [
    {
      label: 'CURRENT PRICE',
      value: `₹${mandi.currentPrice.toLocaleString()}`,
      change: priceChange,
      unit: '/quintal',
      icon: TrendingUp,
    },
    {
      label: 'ARRIVALS',
      value: mandi.arrivals.toLocaleString(),
      change: arrivalsChange,
      unit: 'quintals',
      icon: Package,
    },
    {
      label: 'VOLATILITY',
      value: `${mandi.volatility?.toFixed(1) || 0}%`,
      threshold: mandi.volatility > 15 ? 'high' : mandi.volatility > 10 ? 'medium' : 'low',
      icon: Activity,
    },
  ];

  const getChangeColor = (change) => {
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getThresholdColor = (threshold) => {
    switch (threshold) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="bg-card border border-border p-6 space-y-6" data-testid="diagnostics-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{mandi.name}</h3>
          <p className="text-sm text-muted-foreground">{mandi.location} • {mandi.commodity}</p>
        </div>
        <StatusBadge status={mandi.status} />
      </div>

      {/* Stress Score */}
      <div className="flex items-center justify-center py-4 border border-border bg-secondary/30">
        <div className="text-center">
          <span className="data-label block mb-2">STRESS SCORE</span>
          <StressGauge score={mandi.stressScore} size={120} />
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="flex items-center justify-between p-3 bg-secondary/30 border border-border">
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-muted-foreground" />
                <div>
                  <span className="data-label">{metric.label}</span>
                  <p className="font-mono text-lg font-medium">
                    {metric.value}
                    {metric.unit && <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>}
                  </p>
                </div>
              </div>
              {metric.change !== undefined && (
                <span className={`font-mono text-sm flex items-center gap-1 ${getChangeColor(metric.change)}`}>
                  {metric.change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              )}
              {metric.threshold && (
                <span className={`font-mono text-sm uppercase ${getThresholdColor(metric.threshold)}`}>
                  {metric.threshold}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {mandi.stressScore >= 60 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-sm text-red-500 uppercase tracking-wider">Critical Alert</p>
            <p className="text-sm text-muted-foreground mt-1">
              High stress detected. Immediate intervention recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
