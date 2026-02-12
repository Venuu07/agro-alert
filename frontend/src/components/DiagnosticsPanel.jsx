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
      <div className="flex items-center justify-center py-4 border border-border bg-gradient-to-b from-secondary/50 to-secondary/20">
        <div className="text-center">
          <span className="data-label block mb-2">MARKET STRESS INDEX</span>
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

      {/* Stress Breakdown */}
      {mandi.stressBreakdown && (
        <div className="space-y-3">
          <span className="data-label">STRESS BREAKDOWN</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-secondary/30 border border-border">
              <span className="text-xs text-muted-foreground">Price Stress</span>
              <p className="font-mono text-lg">{mandi.stressBreakdown.priceStress}</p>
            </div>
            <div className="p-2 bg-secondary/30 border border-border">
              <span className="text-xs text-muted-foreground">Supply Stress</span>
              <p className="font-mono text-lg">{mandi.stressBreakdown.supplyStress}</p>
            </div>
            <div className="p-2 bg-secondary/30 border border-border">
              <span className="text-xs text-muted-foreground">Instability</span>
              <p className="font-mono text-lg">{mandi.stressBreakdown.instabilityStress}</p>
            </div>
            <div className="p-2 bg-secondary/30 border border-border">
              <span className="text-xs text-muted-foreground">External</span>
              <p className="font-mono text-lg">{mandi.stressBreakdown.externalStress}</p>
            </div>
          </div>
        </div>
      )}

      {/* External Flags */}
      {(mandi.rainFlag || mandi.festivalFlag) && (
        <div className="flex gap-2">
          {mandi.rainFlag && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">
              <CloudRain size={14} />
              RAIN ACTIVE
            </div>
          )}
          {mandi.festivalFlag && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">
              <PartyPopper size={14} />
              FESTIVAL PERIOD
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
