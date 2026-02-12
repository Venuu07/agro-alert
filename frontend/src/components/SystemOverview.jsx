import React from 'react';
import { Shield, TrendingDown, Activity, Gauge } from 'lucide-react';

export const SystemOverview = ({ data }) => {
  // Calculate system-level metrics from mandi data
  const calculateSystemMetrics = () => {
    if (!data?.mandis) return { stability: 0, volatilityReduction: 0, supplyStress: 'Low' };
    
    const totalMandis = data.mandis.length;
    const avgStress = data.mandis.reduce((sum, m) => sum + m.stressScore, 0) / totalMandis;
    const avgVolatility = data.mandis.reduce((sum, m) => sum + (m.volatility || 0), 0) / totalMandis;
    
    // System Stability Score = inverse of average stress
    const stabilityScore = Math.max(0, Math.min(100, 100 - avgStress));
    
    // Volatility reduction potential (mock but deterministic)
    const volatilityReduction = Math.round(Math.max(0, (100 - avgVolatility) / 5));
    
    // Supply stress level
    const highStressMandis = data.mandis.filter(m => m.stressScore > 65).length;
    const supplyStress = highStressMandis > 2 ? 'Critical' : highStressMandis > 0 ? 'Moderate' : 'Low';
    
    return { 
      stabilityScore: Math.round(stabilityScore), 
      volatilityReduction, 
      supplyStress,
      avgStress: Math.round(avgStress)
    };
  };

  const metrics = calculateSystemMetrics();

  const getStabilityColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSupplyStressColor = (level) => {
    if (level === 'Low') return 'text-green-500';
    if (level === 'Moderate') return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="system-overview-panel p-6 mb-6 animate-fade-in" data-testid="system-overview">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Shield size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">SYSTEM STABILITY OVERVIEW</h2>
          <p className="text-xs text-muted-foreground font-mono">REAL-TIME MARKET INTELLIGENCE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* System Stability Score */}
        <div className="metric-card-premium" data-testid="system-stability">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={16} className="text-muted-foreground" />
            <span className="data-label">SYSTEM STABILITY</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${getStabilityColor(metrics.stabilityScore)}`}>
              {metrics.stabilityScore}
            </span>
            <span className="text-muted-foreground font-mono text-lg">%</span>
          </div>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${metrics.stabilityScore >= 70 ? 'bg-green-500' : metrics.stabilityScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${metrics.stabilityScore}%` }}
            />
          </div>
        </div>

        {/* Volatility Reduction */}
        <div className="metric-card-premium" data-testid="volatility-reduction">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-muted-foreground" />
            <span className="data-label">VOLATILITY DAMPENING</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-primary">
              {metrics.volatilityReduction}
            </span>
            <span className="text-muted-foreground font-mono text-lg">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            POTENTIAL REDUCTION
          </p>
        </div>

        {/* Supply Stress Level */}
        <div className="metric-card-premium" data-testid="supply-stress">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-muted-foreground" />
            <span className="data-label">SUPPLY STRESS</span>
          </div>
          <div className={`font-mono text-3xl font-bold uppercase ${getSupplyStressColor(metrics.supplyStress)}`}>
            {metrics.supplyStress}
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            NETWORK-WIDE LEVEL
          </p>
        </div>

        {/* Average Market Stress */}
        <div className="metric-card-premium" data-testid="avg-stress">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-muted-foreground" />
            <span className="data-label">AVG MARKET STRESS</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-4xl font-bold ${metrics.avgStress > 65 ? 'text-red-500' : metrics.avgStress > 35 ? 'text-orange-500' : 'text-green-500'}`}>
              {metrics.avgStress}
            </span>
            <span className="text-muted-foreground font-mono text-lg">/100</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            INDEX SCORE
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
