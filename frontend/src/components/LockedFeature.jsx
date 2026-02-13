import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useTier, FEATURES } from '../context/TierContext';

/**
 * LockedFeature Component
 * 
 * Wraps premium features with:
 * - Lock overlay for free tier users
 * - Blur effect on content
 * - Click to show upgrade modal
 * - Tooltip with feature name
 */
export const LockedFeature = ({ 
  feature, 
  children, 
  className = '',
  showPreview = true,  // Whether to show blurred preview
  compact = false,     // Compact lock display
}) => {
  const { hasAccess, promptUpgrade } = useTier();
  
  // If user has access, render children normally
  if (hasAccess(feature)) {
    return <>{children}</>;
  }

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
    promptUpgrade(feature);
  };

  if (compact) {
    return (
      <div 
        className={`relative cursor-pointer group ${className}`}
        onClick={handleUpgradeClick}
      >
        <div className="opacity-40 pointer-events-none select-none blur-[2px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-xl">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full">
            <Lock size={12} className="text-amber-400" />
            <span className="text-[10px] font-mono uppercase text-amber-400">Premium</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative cursor-pointer group ${className}`}
      onClick={handleUpgradeClick}
      data-testid={`locked-feature-${feature?.id}`}
    >
      {/* Blurred preview of the feature */}
      {showPreview && (
        <div className="opacity-30 pointer-events-none select-none blur-[3px] transition-all duration-300">
          {children}
        </div>
      )}
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-2xl border border-amber-500/20 transition-all duration-300 group-hover:bg-background/80 group-hover:border-amber-500/40">
        {/* Lock icon container */}
        <div className="w-16 h-16 mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <Lock size={28} className="text-amber-400" />
        </div>
        
        {/* Feature name */}
        <h4 className="font-semibold text-lg mb-1">{feature?.name || 'Premium Feature'}</h4>
        
        {/* Tier badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full mb-4">
          <Sparkles size={12} className="text-amber-400" />
          <span className="text-xs font-mono uppercase text-amber-400">Premium Intelligence</span>
        </div>
        
        {/* Upgrade CTA */}
        <button 
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40"
          onClick={handleUpgradeClick}
        >
          Unlock Feature
        </button>
        
        {/* Subtle hint */}
        <p className="mt-3 text-xs text-muted-foreground">Click to learn more</p>
      </div>
    </div>
  );
};

/**
 * LockedBadge Component
 * 
 * Small inline badge showing lock status
 */
export const LockedBadge = ({ feature, className = '' }) => {
  const { hasAccess, promptUpgrade } = useTier();
  
  if (hasAccess(feature)) {
    return null;
  }

  return (
    <button 
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        promptUpgrade(feature);
      }}
    >
      <Lock size={10} className="text-amber-400" />
      <span className="text-[9px] font-mono uppercase text-amber-400">Premium</span>
    </button>
  );
};

/**
 * PremiumOnly Component
 * 
 * Renders children only for premium users, shows nothing for free users
 */
export const PremiumOnly = ({ feature, children, fallback = null }) => {
  const { hasAccess } = useTier();
  
  if (hasAccess(feature)) {
    return <>{children}</>;
  }
  
  return fallback;
};

/**
 * FeatureGate Component
 * 
 * Conditional rendering based on tier access
 */
export const FeatureGate = ({ 
  feature, 
  children, 
  lockedContent = null,
  showLocked = true 
}) => {
  const { hasAccess, promptUpgrade } = useTier();
  
  if (hasAccess(feature)) {
    return <>{children}</>;
  }
  
  if (showLocked && lockedContent) {
    return (
      <div onClick={() => promptUpgrade(feature)} className="cursor-pointer">
        {lockedContent}
      </div>
    );
  }
  
  return null;
};

export default LockedFeature;
