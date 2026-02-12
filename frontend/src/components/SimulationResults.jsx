import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { PriceChart } from './PriceChart';

export const SimulationResults = ({ results, originalData }) => {
  if (!results) return null;

  const priceImpact = results.priceImpact;
  const isNegative = priceImpact < 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="simulation-results">
      {/* Impact Summary */}
      <div className="bg-card border border-border p-6">
        <h3 className="text-lg font-bold mb-4">SIMULATION IMPACT</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">ORIGINAL PRICE</span>
            <p className="font-mono text-2xl mt-1">₹{results.originalPrice.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">PREDICTED PRICE</span>
            <p className={`font-mono text-2xl mt-1 ${results.predictedPrice > results.originalPrice ? 'text-red-500' : 'text-green-500'}`}>
              ₹{results.predictedPrice.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">PRICE IMPACT</span>
            <p className={`font-mono text-2xl mt-1 flex items-center gap-2 ${priceImpact > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {priceImpact > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-secondary/30 border border-border">
            <span className="data-label">DURATION</span>
            <p className="font-mono text-2xl mt-1">{results.duration} days</p>
          </div>
        </div>
      </div>

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
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connected mandis affected by the simulated shock
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
                  <div className="w-10 h-10 border border-orange-500/50 bg-orange-500/10 flex items-center justify-center">
                    <ArrowRight size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-mono text-sm">{affected.mandiName}</p>
                    <p className="text-xs text-muted-foreground">Connected Market</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {affected.previousStressScore}
                    </span>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <span className={`font-mono text-sm ${affected.newStressScore >= 60 ? 'text-red-500' : affected.newStressScore >= 40 ? 'text-orange-500' : 'text-green-500'}`}>
                      {affected.newStressScore}
                    </span>
                  </div>
                  <p className="text-xs text-orange-500 font-mono">
                    +{affected.priceChange.toFixed(1)}% price impact
                  </p>
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
