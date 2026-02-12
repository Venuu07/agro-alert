import React from 'react';
import { Network, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { StressGauge } from './StressGauge';

export const LinkedMandis = ({ linkedMandis, currentMandiId, onMandiClick }) => {
  if (!linkedMandis || linkedMandis.length === 0) return null;

  return (
    <div className="linked-mandis-panel mt-6" data-testid="linked-mandis">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center rounded-lg">
          <Network size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Linked Markets</h3>
          <p className="text-xs text-muted-foreground">Connected nodes in the supply network</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {linkedMandis.map((mandi) => (
          <div
            key={mandi.id}
            className="linked-mandi-pill"
            onClick={() => onMandiClick && onMandiClick(mandi)}
            data-testid={`linked-mandi-${mandi.id}`}
          >
            <StressGauge score={mandi.stressScore} size={36} showLabel={false} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{mandi.name}</span>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{mandi.location}</span>
                <span>•</span>
                <span className={mandi.priceChangePct > 0 ? 'text-red-400' : 'text-green-400'}>
                  {mandi.priceChangePct > 0 ? '+' : ''}{mandi.priceChangePct?.toFixed(1)}%
                </span>
              </div>
            </div>
            <ArrowRight size={14} className="text-muted-foreground ml-1" />
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="text-blue-400 font-medium">Network Effect:</span> Shocks propagate at 60% impact to Level 1 connections, 30% to Level 2.
        </p>
      </div>
    </div>
  );
};

export default LinkedMandis;
