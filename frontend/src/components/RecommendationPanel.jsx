import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  Eye, 
  CheckCircle,
  DollarSign,
  BarChart3,
  Loader2
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
          <span className="ml-3 font-mono text-sm">Generating recommendations...</span>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="bg-card border border-border p-6" data-testid="recommendations-empty">
        <div className="text-center py-8">
          <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Select a mandi to view recommendations</p>
          <Button 
            variant="outline" 
            onClick={onRequestRecommendations}
            className="font-mono uppercase tracking-wider"
          >
            Load Recommendations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="recommendations-panel">
      {/* Header */}
      <div className="bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">INTERVENTION RECOMMENDATIONS</h3>
            <p className="text-sm text-muted-foreground">
              For {mandiName} • Stress Score: {stressScore}
            </p>
          </div>
          <div className={`px-3 py-1 border font-mono text-xs ${stressScore >= 60 ? 'border-red-500/30 text-red-500 bg-red-500/10' : stressScore >= 40 ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' : 'border-green-500/30 text-green-500 bg-green-500/10'}`}>
            {stressScore >= 60 ? 'CRITICAL' : stressScore >= 40 ? 'MONITOR' : 'STABLE'}
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      {recommendations.map((rec, index) => {
        const PriorityIcon = priorityIcons[rec.priority] || CheckCircle;
        const priorityColor = priorityColors[rec.priority] || 'text-muted-foreground';

        return (
          <div
            key={rec.id}
            className={`recommendation-card ${rec.priority === 'high' ? 'priority-high' : rec.priority === 'medium' ? 'priority-medium' : 'priority-low'}`}
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
                  <p className="font-mono text-sm uppercase tracking-wider">{rec.action}</p>
                  <p className={`text-xs font-mono uppercase ${priorityColor}`}>
                    {rec.priority} priority
                  </p>
                </div>
              </div>
            </div>

            {/* Transfer Info */}
            {rec.sourceMandi && rec.destinationMandi && (
              <div className="flex items-center gap-3 p-3 bg-secondary/30 border border-border">
                <div className="flex-1">
                  <span className="data-label">FROM</span>
                  <p className="font-mono text-sm">{rec.sourceMandi}</p>
                </div>
                <ArrowRight size={20} className="text-primary" />
                <div className="flex-1 text-right">
                  <span className="data-label">TO</span>
                  <p className="font-mono text-sm">{rec.destinationMandi}</p>
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div>
              <span className="data-label">REASONING</span>
              <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
            </div>

            {/* Cost & Benefit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 border border-border">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-muted-foreground" />
                  <span className="data-label">EST. COST</span>
                </div>
                <p className="font-mono text-sm mt-1">{rec.estimatedCost}</p>
              </div>
              <div className="p-3 bg-secondary/30 border border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-green-500" />
                  <span className="data-label">STABILITY GAIN</span>
                </div>
                <p className="font-mono text-sm text-green-500 mt-1">{rec.stabilityGain}</p>
              </div>
            </div>

            {/* AI Insight */}
            {rec.aiInsight && (
              <div className="ai-insight-box">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-primary" />
                  <span className="data-label text-primary">AI INSIGHT</span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.aiInsight}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationPanel;
