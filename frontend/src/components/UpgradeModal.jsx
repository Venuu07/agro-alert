import React from 'react';
import { X, Sparkles, Check, Crown, Lock, TrendingUp, Truck, BarChart3, Scale, Edit, History, Zap } from 'lucide-react';
import { useTier, PREMIUM_BENEFITS } from '../context/TierContext';
import { Button } from './ui/button';

// Icon mapping for benefits
const ICON_MAP = {
  'scale': Scale,
  'truck': Truck,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'edit': Edit,
  'history': History,
};

/**
 * UpgradeModal Component
 * 
 * Premium upgrade modal with:
 * - Feature benefit list
 * - Pricing display (simulated)
 * - Upgrade CTA
 * - Current feature highlight
 */
export const UpgradeModal = () => {
  const { showUpgradeModal, closeUpgradeModal, upgradeToPremium, upgradeFeature } = useTier();

  if (!showUpgradeModal) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeUpgradeModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      data-testid="upgrade-modal"
    >
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-scale-in">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        
        {/* Close button */}
        <button 
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/80 transition-colors z-10"
          data-testid="close-upgrade-modal"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl">
            <Crown size={40} className="text-amber-400" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            Upgrade to{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Premium Intelligence
            </span>
          </h2>
          
          <p className="text-muted-foreground max-w-md mx-auto">
            Unlock the full power of AGRO INTEL with advanced analytics, forecasting, and transfer intelligence.
          </p>

          {/* Current feature highlight */}
          {upgradeFeature && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Lock size={14} className="text-amber-400" />
              <span className="text-sm">
                <span className="text-amber-400 font-semibold">{upgradeFeature.name}</span>
                {' '}requires Premium
              </span>
            </div>
          )}
        </div>

        {/* Benefits grid */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {PREMIUM_BENEFITS.map((benefit, index) => {
              const IconComponent = ICON_MAP[benefit.icon] || Zap;
              const isHighlighted = upgradeFeature?.name === benefit.title;
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighlighted 
                      ? 'bg-amber-500/10 border-amber-500/40' 
                      : 'bg-secondary/30 border-border hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isHighlighted ? 'bg-amber-500/20' : 'bg-primary/10'}`}>
                      <IconComponent size={18} className={isHighlighted ? 'text-amber-400' : 'text-primary'} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing section */}
          <div className="p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Premium Intelligence</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    $49
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                  <Check size={14} />
                  <span>All features included</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
              </div>
            </div>
            
            {/* Feature checklist */}
            <div className="grid grid-cols-2 gap-2">
              {[
                'Surplus/Deficit Engine',
                'Transfer Intelligence',
                '30-day Forecasts',
                'Multi-Commodity Analysis',
                'Market Update Panel',
                'Full Historical Data',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Check size={12} className="text-green-400" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={upgradeToPremium}
              className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/20"
              data-testid="upgrade-btn"
            >
              <Sparkles size={18} className="mr-2" />
              Upgrade to Premium
            </Button>
            <Button
              onClick={closeUpgradeModal}
              variant="outline"
              className="flex-1 h-12 rounded-xl"
            >
              Maybe Later
            </Button>
          </div>
          
          {/* Demo note */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Sparkles size={10} className="inline mr-1" />
            Demo mode: Click "Upgrade" to simulate premium access
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
