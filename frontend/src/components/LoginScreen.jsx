import React, { useState } from 'react';
import { Activity, Crown, User, ArrowRight, Shield, Zap, BarChart3, TrendingUp, Truck, Scale } from 'lucide-react';
import { useTier } from '../context/TierContext';

/**
 * LoginScreen Component
 * 
 * Premium mock authentication interface for tier selection.
 * NO real authentication - UI-level simulation only.
 */
export const LoginScreen = () => {
  const { loginAsFree, loginAsPremium } = useTier();
  const [hoveredTier, setHoveredTier] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogin = (tier) => {
    setIsTransitioning(true);
    // Smooth transition delay
    setTimeout(() => {
      if (tier === 'free') {
        loginAsFree();
      } else {
        loginAsPremium();
      }
    }, 500);
  };

  return (
    <div className={`login-screen min-h-screen bg-background relative overflow-hidden transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated Grid Background */}
      <div className="absolute inset-0 landing-grid-bg opacity-30" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      
      {/* Floating Particles */}
      <div className="particle particle-1" />
      <div className="particle particle-2" />
      <div className="particle particle-3" />
      <div className="particle particle-4" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Logo & Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 border border-primary/30 rounded-2xl float-animation">
            <Activity size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            AGRO <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">INTEL</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Decision Intelligence Platform
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2 font-mono">
            MARKET STABILITY • SHOCK SIMULATION • TRANSFER OPTIMIZATION
          </p>
        </div>

        {/* Login Panel */}
        <div className="w-full max-w-4xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-panel p-8 rounded-3xl border border-border/50 backdrop-blur-xl bg-card/80">
            {/* Panel Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Select Your Access Level</h2>
              <p className="text-sm text-muted-foreground">
                Choose your operator role to access the platform
              </p>
            </div>

            {/* Tier Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Tier Card */}
              <button
                onClick={() => handleLogin('free')}
                onMouseEnter={() => setHoveredTier('free')}
                onMouseLeave={() => setHoveredTier(null)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                  hoveredTier === 'free'
                    ? 'border-primary/50 bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/30 bg-secondary/30'
                }`}
                data-testid="login-free"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  hoveredTier === 'free' ? 'bg-primary/20' : 'bg-secondary'
                }`}>
                  <User size={28} className={hoveredTier === 'free' ? 'text-primary' : 'text-muted-foreground'} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-1">Free Operator</h3>
                <p className="text-sm text-muted-foreground mb-4">Basic monitoring & simulation</p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 size={14} className="text-primary" />
                    <span className="text-muted-foreground">Dashboard Overview</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap size={14} className="text-primary" />
                    <span className="text-muted-foreground">Shock Simulation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield size={14} className="text-primary" />
                    <span className="text-muted-foreground">Risk Monitoring</span>
                  </div>
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-2 font-semibold transition-colors ${
                  hoveredTier === 'free' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  <span>Continue as Free</span>
                  <ArrowRight size={18} className={`transition-transform ${hoveredTier === 'free' ? 'translate-x-1' : ''}`} />
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-secondary rounded-full">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Basic Access</span>
                </div>
              </button>

              {/* Premium Tier Card */}
              <button
                onClick={() => handleLogin('premium')}
                onMouseEnter={() => setHoveredTier('premium')}
                onMouseLeave={() => setHoveredTier(null)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group ${
                  hoveredTier === 'premium'
                    ? 'border-amber-500/50 bg-amber-500/5 scale-[1.02]'
                    : 'border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5'
                }`}
                data-testid="login-premium"
              >
                {/* Recommended Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                  <span className="text-[10px] font-mono uppercase text-black font-semibold">Recommended</span>
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  hoveredTier === 'premium' 
                    ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30' 
                    : 'bg-amber-500/10'
                }`}>
                  <Crown size={28} className="text-amber-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-1">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Premium Operator
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Full intelligence suite access</p>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Scale size={14} className="text-amber-400" />
                    <span className="text-muted-foreground">Surplus/Deficit Intelligence</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck size={14} className="text-amber-400" />
                    <span className="text-muted-foreground">Transfer Intelligence</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={14} className="text-amber-400" />
                    <span className="text-muted-foreground">Price Forecasting</span>
                  </div>
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-2 font-semibold transition-colors ${
                  hoveredTier === 'premium' ? 'text-amber-400' : 'text-amber-400/70'
                }`}>
                  <span>Continue as Premium</span>
                  <ArrowRight size={18} className={`transition-transform ${hoveredTier === 'premium' ? 'translate-x-1' : ''}`} />
                </div>

                {/* Premium Glow Effect */}
                {hoveredTier === 'premium' && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 animate-pulse pointer-events-none" />
                )}
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                <Shield size={12} className="inline mr-1" />
                Demo mode: No credentials required. Select a role to explore the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs text-muted-foreground/50 font-mono">
            FOOD SYSTEM EARLY WARNING & SHOCK SIMULATOR
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
