import React, { useState, useEffect } from 'react';
import { Scale, ArrowUp, ArrowDown, Minus, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SurplusDeficitPanel = ({ mandiId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/surplus-deficit/${mandiId}`);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch surplus/deficit data:', err);
        setError('Supply-demand data unavailable');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (mandiId) {
      fetchData();
    }
  }, [mandiId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'surplus':
        return <ArrowUp size={14} className="text-green-400" />;
      case 'deficit':
        return <ArrowDown size={14} className="text-red-400" />;
      default:
        return <Minus size={14} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'surplus':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'deficit':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'PULL_STOCK_URGENT':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'PUSH_STOCK_RECOMMENDED':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'MONITOR_STABILITY':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-muted-foreground bg-secondary/30 border-border';
    }
  };

  const getSignalLabel = (signal) => {
    const labels = {
      'PULL_STOCK_URGENT': 'Pull Stock Urgent',
      'PUSH_STOCK_RECOMMENDED': 'Push Stock Recommended',
      'MONITOR_STABILITY': 'Monitor Stability',
      'STANDARD_OPERATIONS': 'Standard Operations'
    };
    return labels[signal] || signal;
  };

  if (loading) {
    return (
      <div className="surplus-deficit-panel p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Supply-Demand Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">SURPLUS/DEFICIT ANALYSIS</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="surplus-deficit-panel p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Supply-Demand Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">SURPLUS/DEFICIT ANALYSIS</p>
          </div>
        </div>
        <div className="p-4 bg-secondary/30 rounded-xl border border-border text-center">
          <p className="text-sm text-muted-foreground">{error || 'Data unavailable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="surplus-deficit-panel p-6 bg-card border border-border rounded-2xl" data-testid="surplus-deficit-panel">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Scale size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Supply-Demand Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">SURPLUS/DEFICIT ANALYSIS</p>
          </div>
        </div>
        
        {/* Overall Status Badge */}
        <div className={`px-3 py-1.5 rounded-lg border ${getStatusColor(data.overallStatus?.replace('net_', ''))}`}>
          <span className="text-xs font-mono uppercase">
            {data.overallStatus?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Commodity Analysis Cards */}
      <div className="space-y-3">
        {data.commodityAnalyses?.map((analysis, index) => (
          <div 
            key={index}
            className="p-4 bg-secondary/30 rounded-xl border border-border"
            data-testid={`analysis-${analysis.commodity?.toLowerCase()}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(analysis.status)}
                <span className="font-mono text-sm font-semibold">{analysis.commodity}</span>
                <span className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded-full border ${getStatusColor(analysis.status)}`}>
                  {analysis.status}
                </span>
              </div>
              <span className={`px-2 py-1 text-[10px] font-mono rounded-lg border ${getSignalColor(analysis.stabilizationSignal)}`}>
                {getSignalLabel(analysis.stabilizationSignal)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {/* Supply */}
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">SUPPLY</p>
                <p className="font-mono text-sm">{analysis.supply?.toLocaleString()} Q</p>
              </div>

              {/* Demand */}
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">DEMAND</p>
                <p className="font-mono text-sm">{analysis.baseDemand?.toLocaleString()} Q</p>
              </div>

              {/* Balance */}
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">BALANCE</p>
                <p className={`font-mono text-sm ${analysis.balance > 0 ? 'text-green-400' : analysis.balance < 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {analysis.balance > 0 ? '+' : ''}{analysis.balance?.toLocaleString()} Q
                </p>
              </div>

              {/* Balance % */}
              <div>
                <p className="text-[10px] text-muted-foreground font-mono">BALANCE %</p>
                <p className={`font-mono text-sm ${analysis.balancePct > 0 ? 'text-green-400' : analysis.balancePct < 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {analysis.balancePct > 0 ? '+' : ''}{analysis.balancePct?.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Action Indicator */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  SUGGESTED ACTION: {analysis.suggestedAction?.toUpperCase().replace('_', ' ')}
                </span>
                {analysis.priceChangePct !== 0 && (
                  <span className={`text-[10px] font-mono ${analysis.priceChangePct > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    • Price {analysis.priceChangePct > 0 ? '+' : ''}{analysis.priceChangePct?.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {(data.deficitCommodities?.length > 0 || data.surplusCommodities?.length > 0) && (
        <div className="mt-4 p-3 bg-secondary/20 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={12} className="text-primary" />
            <span className="text-[10px] font-mono text-muted-foreground">BALANCE SUMMARY</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.deficitCommodities?.map((c, i) => (
              <span key={`def-${i}`} className="px-2 py-1 text-[10px] font-mono bg-red-500/10 text-red-400 rounded border border-red-500/30">
                {c} (Deficit)
              </span>
            ))}
            {data.surplusCommodities?.map((c, i) => (
              <span key={`sur-${i}`} className="px-2 py-1 text-[10px] font-mono bg-green-500/10 text-green-400 rounded border border-green-500/30">
                {c} (Surplus)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurplusDeficitPanel;
