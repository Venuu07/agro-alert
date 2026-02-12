import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Box, Users, Zap } from 'lucide-react';
import { PriceChart } from './PriceChart';

export const SimulationResults = ({ results, originalData }) => {
  if (!results) return null;

  const priceImpact = results.priceImpact;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="simulation-results">
      {/* Impact Summary */}
      <div className="system-overview-panel p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Zap size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold">PROPAGATION ANALYSIS</h3>
            <p className="text-xs text-muted-foreground font-mono">SHOCK IMPACT PROJECTION</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="metric-card-premium">
            <span className="data-label">ORIGINAL PRICE</span>
            <p className="font-mono text-2xl font-bold mt-2">₹{results.originalPrice.toLocaleString()}</p>
          </div>
          <div className="metric-card-premium">
            <span className="data-label">PROJECTED PRICE</span>
            <p className={`font-mono text-2xl font-bold mt-2 ${results.predictedPrice > results.originalPrice ? 'text-red-500' : 'text-green-500'}`}>
              ₹{Math.round(results.predictedPrice).toLocaleString()}
            </p>
          </div>
          <div className="metric-card-premium">
            <span className="data-label">PRICE DELTA</span>
            <p className={`font-mono text-2xl font-bold mt-2 flex items-center gap-2 ${priceImpact > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {priceImpact > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(1)}%
            </p>
          </div>
          <div className="metric-card-premium">
            <span className="data-label">STRESS INDEX Δ</span>
            <p className={`font-mono text-2xl font-bold mt-2 ${results.newStressScore > results.previousStressScore ? 'text-red-500' : 'text-green-500'}`}>
              {results.previousStressScore} → {results.newStressScore}
            </p>
          </div>
        </div>

        {/* Arrivals Impact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="signal-card">
            <span className="data-label">SUPPLY BEFORE</span>
            <p className="font-mono text-lg font-bold mt-1">{results.originalArrivals?.toLocaleString() || '-'} qt</p>
          </div>
          <div className="signal-card">
            <span className="data-label">SUPPLY AFTER</span>
            <p className={`font-mono text-lg font-bold mt-1 ${(results.predictedArrivals || 0) < (results.originalArrivals || 0) ? 'text-orange-500' : 'text-green-500'}`}>
              {results.predictedArrivals?.toLocaleString() || '-'} qt
            </p>
          </div>
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">DURATION</span>
            <p className="font-mono text-xl mt-1">{results.duration} days</p>
          </div>
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">NEW STATUS</span>
            <p className={`font-mono text-xl mt-1 uppercase ${results.newStatus === 'high_risk' ? 'text-red-500' : results.newStatus === 'watch' ? 'text-orange-500' : 'text-green-500'}`}>
              {results.newStatus?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Simulation Parameters (Elasticity Model) */}
      {results.simulationParameters && (
        <div className="intelligence-panel">
          <div className="intelligence-panel-header">
            <Box size={16} className="text-primary" />
            <span className="data-label text-primary">ECONOMIC MODEL PARAMETERS</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            <div className="signal-card text-center">
              <span className="text-[10px] text-muted-foreground uppercase">ELASTICITY</span>
              <p className="font-mono text-xl font-bold text-primary">{results.simulationParameters.elasticity}</p>
            </div>
            <div className="signal-card text-center">
              <span className="text-[10px] text-muted-foreground uppercase">SUPPLY PRE</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.supplyBefore)}</p>
            </div>
            <div className="signal-card text-center">
              <span className="text-[10px] text-muted-foreground uppercase">SUPPLY POST</span>
              <p className="font-mono text-lg text-orange-500">{Math.round(results.simulationParameters.supplyAfter)}</p>
            </div>
            <div className="signal-card text-center">
              <span className="text-[10px] text-muted-foreground uppercase">DEMAND PRE</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.demandBefore)}</p>
            </div>
            <div className="signal-card text-center">
              <span className="text-[10px] text-muted-foreground uppercase">DEMAND POST</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.demandAfter)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Formula: price_new = price_old × (Demand/Supply)^{results.simulationParameters.elasticity}
          </p>
        </div>
      )}

      {/* Before/After Chart */}
      <div className="chart-premium">
        <PriceChart 
          data={originalData} 
          title="PRICE TRAJECTORY PROJECTION" 
          showComparison={true}
          comparisonData={results.simulatedPriceHistory}
        />
      </div>

      {/* Affected Mandis - Ripple Effect */}
      {results.affectedMandis && results.affectedMandis.length > 0 && (
        <div className="system-overview-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <AlertTriangle size={20} className="text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">NETWORK PROPAGATION</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {results.affectedMandis.length} CONNECTED MARKETS IMPACTED
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 border border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-xs font-mono">LEVEL 1: 60% IMPACT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-xs font-mono">LEVEL 2: 30% IMPACT</span>
            </div>
          </div>

          <div className="space-y-3">
            {results.affectedMandis.map((affected, index) => (
              <div 
                key={affected.mandiId}
                className={`risk-card ${affected.rippleLevel === 1 ? 'risk-card-watch' : ''} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`affected-mandi-${affected.mandiId}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border flex items-center justify-center ${affected.rippleLevel === 1 ? 'border-orange-500/50 bg-orange-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
                      <Users size={16} className={affected.rippleLevel === 1 ? 'text-orange-500' : 'text-yellow-500'} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold">{affected.mandiName}</p>
                      <p className="text-xs text-muted-foreground">
                        Propagation Level {affected.rippleLevel}
                      </p>
                    </div>
                  </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">₹{affected.originalPrice?.toLocaleString()}</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-xs text-orange-500">₹{Math.round(affected.newPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {affected.previousStressScore}
                    </span>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <span className={`font-mono text-sm ${affected.newStressScore >= 60 ? 'text-red-500' : affected.newStressScore >= 40 ? 'text-orange-500' : 'text-green-500'}`}>
                      {affected.newStressScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationResults;
