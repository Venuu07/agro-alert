import React from 'react';
import { Crown, User } from 'lucide-react';
import { useTier } from '../context/TierContext';

/**
 * TierToggle Component
 * 
 * Allows switching between Free and Premium tiers for demo purposes.
 * Shows current tier status in the navbar.
 */
export const TierToggle = ({ className = '' }) => {
  const { currentTier, toggleTier, isPremium } = useTier();

  return (
    <button
      onClick={toggleTier}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
        isPremium 
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50' 
          : 'bg-secondary/50 border-border hover:border-primary/30'
      } ${className}`}
      data-testid="tier-toggle"
      title={`Current: ${currentTier.toUpperCase()} tier. Click to toggle.`}
    >
      {/* Icon */}
      {isPremium ? (
        <Crown size={14} className="text-amber-400" />
      ) : (
        <User size={14} className="text-muted-foreground" />
      )}
      
      {/* Tier label */}
      <span className={`text-xs font-mono uppercase ${
        isPremium ? 'text-amber-400' : 'text-muted-foreground'
      }`}>
        {currentTier}
      </span>
      
      {/* Toggle indicator */}
      <div className={`w-8 h-4 rounded-full relative transition-colors ${
        isPremium ? 'bg-amber-500/30' : 'bg-secondary'
      }`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
          isPremium 
            ? 'right-0.5 bg-amber-400' 
            : 'left-0.5 bg-muted-foreground'
        }`} />
      </div>
    </button>
  );
};

/**
 * TierBadge Component
 * 
 * Compact badge showing current tier
 */
export const TierBadge = ({ className = '' }) => {
  const { isPremium, promptUpgrade } = useTier();

  if (isPremium) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-full ${className}`}>
        <Crown size={12} className="text-amber-400" />
        <span className="text-[10px] font-mono uppercase text-amber-400">Premium</span>
      </div>
    );
  }

  return (
    <button 
      onClick={() => promptUpgrade(null)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 border border-border rounded-full hover:border-amber-500/30 transition-colors ${className}`}
    >
      <User size={12} className="text-muted-foreground" />
      <span className="text-[10px] font-mono uppercase text-muted-foreground">Free</span>
    </button>
  );
};

export default TierToggle;
