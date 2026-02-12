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
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Box size={18} className="text-primary" />
            <h3 className="text-lg font-bold">ELASTICITY MODEL</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-secondary/30 border border-border text-center">
              <span className="text-xs text-muted-foreground">ELASTICITY</span>
              <p className="font-mono text-lg">{results.simulationParameters.elasticity}</p>
            </div>
            <div className="p-3 bg-secondary/30 border border-border text-center">
              <span className="text-xs text-muted-foreground">SUPPLY BEFORE</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.supplyBefore)}</p>
            </div>
            <div className="p-3 bg-secondary/30 border border-border text-center">
              <span className="text-xs text-muted-foreground">SUPPLY AFTER</span>
              <p className="font-mono text-lg text-orange-500">{Math.round(results.simulationParameters.supplyAfter)}</p>
            </div>
            <div className="p-3 bg-secondary/30 border border-border text-center">
              <span className="text-xs text-muted-foreground">DEMAND BEFORE</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.demandBefore)}</p>
            </div>
            <div className="p-3 bg-secondary/30 border border-border text-center">
              <span className="text-xs text-muted-foreground">DEMAND AFTER</span>
              <p className="font-mono text-lg">{Math.round(results.simulationParameters.demandAfter)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Formula: price_new = price_old × (Demand/Supply)^{results.simulationParameters.elasticity}
          </p>
        </div>
      )}

      {/* Before/After Chart */}
      <PriceChart 
        data={originalData} 
        title="PRICE PROJECTION" 
        showComparison={true}
        comparisonData={results.simulatedPriceHistory}
      />

      {/* Affected Mandis - Ripple Effect */}
      {results.affectedMandis && results.affectedMandis.length > 0 && (
        <div className="bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-lg font-bold">RIPPLE EFFECT</h3>
            <span className="text-xs text-muted-foreground ml-2">
              ({results.affectedMandis.length} mandis affected)
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Impact decays: Level 1 = 60%, Level 2 = 30%
          </p>

          <div className="space-y-3">
            {results.affectedMandis.map((affected, index) => (
              <div 
                key={affected.mandiId}
                className="flex items-center justify-between p-4 bg-secondary/30 border border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`affected-mandi-${affected.mandiId}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 border flex items-center justify-center ${affected.rippleLevel === 1 ? 'border-orange-500/50 bg-orange-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
                    <Users size={16} className={affected.rippleLevel === 1 ? 'text-orange-500' : 'text-yellow-500'} />
                  </div>
                  <div>
                    <p className="font-mono text-sm">{affected.mandiName}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {affected.rippleLevel} • {affected.rippleLevel === 1 ? '60%' : '30%'} impact
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
