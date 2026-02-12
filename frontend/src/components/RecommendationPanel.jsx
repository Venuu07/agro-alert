import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  Eye, 
  CheckCircle,
  DollarSign,
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';

const priorityIcons = {
  high: AlertTriangle,
  medium: Eye,
  low: CheckCircle,
};

const priorityColors = {
  high: 'text-red-500',
  medium: 'text-orange-500',
  low: 'text-green-500',
};

// Tradeoff Visualization Component
const TradeoffBar = ({ costLevel = 50 }) => {
  // costLevel: 0 = lowest cost, 100 = highest stability
  return (
    <div className="mt-4 p-4 bg-secondary/30 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">LOWER COST</span>
        <span className="text-xs font-mono text-muted-foreground">HIGHER STABILITY</span>
      </div>
      <div className="tradeoff-bar">
        <div 
          className="tradeoff-indicator"
          style={{ left: `calc(${costLevel}% - 8px)` }}
        />
      </div>
      <div className="flex items-center justify-center mt-2">
        <span className="text-xs font-mono text-primary">RECOMMENDED BALANCE</span>
      </div>
    </div>
  );
};

// Detected Signals Component
const DetectedSignals = ({ metrics, mandi }) => {
  if (!metrics) return null;
  
  const signals = [];
  
  if (metrics.priceChange !== undefined) {
    signals.push({
      label: 'Price Change',
      value: `${metrics.priceChange > 0 ? '+' : ''}${metrics.priceChange?.toFixed(1)}%`,
      icon: metrics.priceChange > 0 ? TrendingUp : TrendingDown,
      color: metrics.priceChange > 5 ? 'text-red-500' : metrics.priceChange > 0 ? 'text-orange-500' : 'text-green-500'
    });
  }
  
  if (metrics.targetStress !== undefined || metrics.currentStress !== undefined) {
    const stress = metrics.targetStress || metrics.currentStress;
    signals.push({
      label: 'Stress Index',
      value: `${stress}/100`,
      icon: Shield,
      color: stress > 65 ? 'text-red-500' : stress > 35 ? 'text-orange-500' : 'text-green-500'
    });
  }
  
  if (metrics.supplyStressContribution !== undefined && metrics.supplyStressContribution > 0) {
    signals.push({
      label: 'Supply Stress',
      value: `+${metrics.supplyStressContribution}`,
      icon: Package,
      color: 'text-orange-500'
    });
  }

  if (signals.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {signals.map((signal, idx) => {
        const Icon = signal.icon;
        return (
          <div key={idx} className="signal-card">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{signal.label}</span>
            </div>
            <span className={`font-mono text-sm font-bold ${signal.color}`}>{signal.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export const RecommendationPanel = ({ 
  recommendations, 
  mandiName, 
  stressScore, 
  isLoading,
  onRequestRecommendations 
}) => {
  if (isLoading) {
    return (
      <div className="bg-card border border-border p-6" data-testid="recommendations-loading">
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-3 font-mono text-sm">Analyzing stabilization strategies...</span>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="bg-card border border-border p-6" data-testid="recommendations-empty">
        <div className="text-center py-8">
          <Target size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Select a market to view stabilization strategies</p>
          <Button 
            variant="outline" 
            onClick={onRequestRecommendations}
            className="font-mono uppercase tracking-wider"
          >
            Load Strategies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="recommendations-panel">
      {/* Header */}
      <div className="system-overview-panel p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">STABILIZATION STRATEGY ENGINE</h3>
              <p className="text-sm text-muted-foreground font-mono">
                {mandiName} • Market Stress Index: {stressScore}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 border font-mono text-xs uppercase tracking-wider ${stressScore >= 60 ? 'border-red-500/30 text-red-500 bg-red-500/10' : stressScore >= 40 ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' : 'border-green-500/30 text-green-500 bg-green-500/10'}`}>
            {stressScore >= 60 ? 'CRITICAL' : stressScore >= 40 ? 'ELEVATED' : 'STABLE'}
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      {recommendations.map((rec, index) => {
        const PriorityIcon = priorityIcons[rec.priority] || CheckCircle;
        const priorityColor = priorityColors[rec.priority] || 'text-muted-foreground';
        const tradeoffLevel = rec.priority === 'high' ? 75 : rec.priority === 'medium' ? 50 : 25;

        return (
          <div
            key={rec.id}
            className={`recommendation-card ${rec.priority === 'high' ? 'priority-high' : rec.priority === 'medium' ? 'priority-medium' : 'priority-low'} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
            data-testid={`recommendation-${rec.id}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 border ${rec.priority === 'high' ? 'border-red-500/50 bg-red-500/10' : rec.priority === 'medium' ? 'border-orange-500/50 bg-orange-500/10' : 'border-green-500/50 bg-green-500/10'} flex items-center justify-center`}>
                  <PriorityIcon size={18} className={priorityColor} />
                </div>
                <div>
                  <p className="font-mono text-sm uppercase tracking-wider font-bold">{rec.action}</p>
                  <p className={`text-xs font-mono uppercase ${priorityColor}`}>
                    {rec.priority} priority strategy
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer Info */}
            {rec.sourceMandi && rec.destinationMandi && (
              <div className="flex items-center gap-3 p-4 bg-secondary/30 border border-border mt-4">
                <div className="flex-1">
                  <span className="data-label">SOURCE</span>
                  <p className="font-mono text-sm font-medium">{rec.sourceMandi}</p>
                </div>
                <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                  <ArrowRight size={20} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <span className="data-label">DESTINATION</span>
                  <p className="font-mono text-sm font-medium">{rec.destinationMandi}</p>
                </div>
              </div>
            )}

            {/* Detected Signals */}
            {rec.metrics && (
              <div className="mt-4">
                <span className="data-label block mb-2">DETECTED SIGNALS</span>
                <DetectedSignals metrics={rec.metrics} />
              </div>
            )}

            {/* System Interpretation */}
            <div className="intelligence-panel mt-4">
              <div className="intelligence-panel-header">
                <Target size={14} className="text-primary" />
                <span className="data-label text-primary">SYSTEM INTERPRETATION</span>
              </div>
              <p className="text-sm text-foreground">{rec.reasoning}</p>
            </div>

            {/* Expected Impact */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-muted-foreground" />
                  <span className="data-label">EST. COST</span>
                </div>
                <p className="font-mono text-lg font-bold">{rec.estimatedCost}</p>
              </div>
              <div className="p-4 bg-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-green-500" />
                  <span className="data-label text-green-500">STABILITY GAIN</span>
                </div>
                <p className="font-mono text-lg font-bold text-green-500">{rec.stabilityGain}</p>
              </div>
            </div>

            {/* Tradeoff Visualization */}
            {rec.priority !== 'low' && (
              <TradeoffBar costLevel={tradeoffLevel} />
            )}

            {/* AI Insight */}
            {rec.aiInsight && (
              <div className="intelligence-panel mt-4">
                <div className="intelligence-panel-header">
                  <Sparkles size={14} className="text-primary" />
                  <span className="data-label text-primary">AI INTELLIGENCE ANALYSIS</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{rec.aiInsight}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationPanel;
