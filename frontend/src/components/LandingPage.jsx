import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, Zap, Shield, BarChart3, Network, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

export const LandingPage = ({ onEnterPlatform, onRunSimulator }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="landing-page min-h-screen relative overflow-hidden" data-testid="landing-page">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 landing-grid-bg" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
      </div>

      {/* Glass Header */}
      <header className="glass-header fixed top-0 left-0 right-0 z-50" data-testid="landing-header">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="logo-container w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                <Activity size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">AGRO INTEL</h1>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
                  DECISION INTELLIGENCE
                </p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#technology" className="nav-link text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Technology
              </a>
              <Button 
                onClick={onEnterPlatform}
                className="glass-button rounded-xl font-mono text-xs uppercase tracking-wider"
                data-testid="header-cta"
              >
                Enter Platform
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Content */}
            <div className={`space-y-8 ${isVisible ? 'animate-hero-fade-in' : 'opacity-0'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-mono text-primary uppercase tracking-wider">
                  AI-Powered Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-headline text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Prevent Food Market
                <span className="text-gradient block">Failures Before</span>
                They Happen
              </h1>

              {/* Subtext */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Detect systemic stress, simulate disruptions, and stabilize markets with 
                enterprise-grade decision intelligence.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={onRunSimulator}
                  className="cta-primary h-14 px-8 rounded-xl font-mono text-sm uppercase tracking-wider group"
                  data-testid="cta-simulator"
                >
                  <Zap size={18} className="mr-2 group-hover:animate-pulse" />
                  Run Shock Propagation Engine
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline"
                  onClick={onEnterPlatform}
                  className="cta-secondary h-14 px-8 rounded-xl font-mono text-sm uppercase tracking-wider border-2"
                  data-testid="cta-platform"
                >
                  Explore Decision Platform
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                <div className="stat-item">
                  <p className="font-mono text-3xl font-bold text-primary">6</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">Markets Tracked</p>
                </div>
                <div className="stat-item">
                  <p className="font-mono text-3xl font-bold text-foreground">0.4</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">Price Elasticity</p>
                </div>
                <div className="stat-item">
                  <p className="font-mono text-3xl font-bold text-foreground">60%</p>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">Ripple Factor</p>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className={`relative ${isVisible ? 'animate-dashboard-float' : 'opacity-0'}`}>
              <div className="dashboard-preview-wrapper">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-3xl" />
                
                {/* Dashboard Preview Card */}
                <div className="dashboard-preview relative">
                  {/* Mini Dashboard Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">LIVE MONITORING</span>
                  </div>

                  {/* Preview Content */}
                  <div className="p-6 space-y-4">
                    {/* System Status Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="preview-metric-card">
                        <Shield size={14} className="text-green-500 mb-2" />
                        <p className="text-[10px] text-muted-foreground">STABILITY</p>
                        <p className="font-mono text-lg font-bold text-green-500">72%</p>
                      </div>
                      <div className="preview-metric-card">
                        <AlertTriangle size={14} className="text-orange-500 mb-2" />
                        <p className="text-[10px] text-muted-foreground">AT RISK</p>
                        <p className="font-mono text-lg font-bold text-orange-500">2</p>
                      </div>
                      <div className="preview-metric-card">
                        <Network size={14} className="text-blue-500 mb-2" />
                        <p className="text-[10px] text-muted-foreground">LINKED</p>
                        <p className="font-mono text-lg font-bold text-blue-500">12</p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="preview-chart">
                      <div className="flex items-end justify-between h-16 gap-1">
                        {[35, 42, 38, 55, 48, 62, 58, 72, 68, 75, 71, 78].map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-primary/20 rounded-t transition-all duration-500"
                            style={{ 
                              height: `${h}%`,
                              animationDelay: `${i * 0.05}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Alert Badge */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-red-400">HIGH STRESS: Azadpur Mandi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-32">
          <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Intelligence Engines</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three deterministic engines working in harmony to provide actionable market intelligence
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Stress Engine */}
              <div className="feature-card group" data-testid="feature-stress">
                <div className="feature-icon-wrapper bg-red-500/10 border-red-500/20 group-hover:bg-red-500/20">
                  <BarChart3 size={24} className="text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-3">Market Stress Index</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time stress scoring based on price volatility, supply changes, and external factors. 
                  Deterministic calculations you can trust.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Price + Supply + External Factors
                  </div>
                </div>
              </div>

              {/* Simulation Engine */}
              <div className="feature-card group" data-testid="feature-simulation">
                <div className="feature-icon-wrapper bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20">
                  <Zap size={24} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-3">Shock Propagation Engine</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Model disruption scenarios with elasticity-based price propagation. 
                  See ripple effects across connected markets before they happen.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    60% L1 • 30% L2 Propagation
                  </div>
                </div>
              </div>

              {/* Recommendation Engine */}
              <div className="feature-card group" data-testid="feature-recommendation">
                <div className="feature-icon-wrapper bg-green-500/10 border-green-500/20 group-hover:bg-green-500/20">
                  <Shield size={24} className="text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-3">Stabilization Strategy</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Rule-based intervention recommendations with AI-powered explanations. 
                  Cost-benefit analysis for every action.
                </p>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Pull • Push • Buffer Strategies
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section id="technology" className="mt-32">
          <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
            <div className="tech-card">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                    <Network size={14} className="text-blue-500" />
                    <span className="text-xs font-mono text-blue-400">NETWORK INTELLIGENCE</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Connected Market Network</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Visualize the interconnected web of agricultural markets. Understand how shocks 
                    propagate through trade links and plan interventions accordingly.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp size={14} className="text-primary" />
                      </div>
                      <span className="text-sm">Elasticity-based price modeling</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Network size={14} className="text-primary" />
                      </div>
                      <span className="text-sm">Multi-level ripple propagation</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield size={14} className="text-primary" />
                      </div>
                      <span className="text-sm">Real-time stability monitoring</span>
                    </li>
                  </ul>
                </div>
                <div className="tech-visual">
                  {/* Network Animation Preview */}
                  <div className="network-preview">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Connection Lines */}
                      <line x1="100" y1="40" x2="50" y2="100" className="network-line" />
                      <line x1="100" y1="40" x2="150" y2="100" className="network-line" />
                      <line x1="50" y1="100" x2="80" y2="160" className="network-line" />
                      <line x1="150" y1="100" x2="120" y2="160" className="network-line" />
                      <line x1="50" y1="100" x2="150" y2="100" className="network-line" />
                      <line x1="80" y1="160" x2="120" y2="160" className="network-line" />
                      
                      {/* Nodes */}
                      <circle cx="100" cy="40" r="12" className="network-node node-critical" />
                      <circle cx="50" cy="100" r="10" className="network-node node-warning" />
                      <circle cx="150" cy="100" r="10" className="network-node node-normal" />
                      <circle cx="80" cy="160" r="8" className="network-node node-normal" />
                      <circle cx="120" cy="160" r="8" className="network-node node-normal" />
                      
                      {/* Ripple Animation */}
                      <circle cx="100" cy="40" r="12" className="ripple-ring" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-32 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Market Operations?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Access the full power of AI-driven decision intelligence
            </p>
            <Button 
              onClick={onEnterPlatform}
              className="cta-primary h-14 px-10 rounded-xl font-mono text-sm uppercase tracking-wider"
              data-testid="final-cta"
            >
              Launch Decision Platform
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              <span className="text-sm font-medium">AGRO INTEL</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              AI-POWERED DECISION INTELLIGENCE PLATFORM
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
