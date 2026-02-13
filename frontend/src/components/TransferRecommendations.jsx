import React, { useState, useEffect, useCallback } from 'react';
import { Truck, ArrowRight, TrendingUp, DollarSign, Shield, Package, Loader2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const TransferRecommendations = ({ onTransferComplete }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [executedTransfers, setExecutedTransfers] = useState({});

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/transfer-recommendations`);
      setRecommendations(response.data.recommendations || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transfer recommendations:', err);
      setError('Transfer recommendations unavailable');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleExecuteTransfer = async (rec) => {
    setExecutingId(rec.id);
    
    try {
      const response = await axios.post(`${API}/execute-transfer`, {
        transferId: rec.id,
        sourceMandiId: rec.sourceMandi?.id,
        destMandiId: rec.destinationMandi?.id,
        commodity: rec.commodity,
        quantity: rec.suggestedQuantity
      });

      // Mark as executed
      setExecutedTransfers(prev => ({
        ...prev,
        [rec.id]: response.data
      }));

      toast.success(response.data.message);

      // Notify parent to refresh dashboard
      if (onTransferComplete) {
        onTransferComplete(response.data);
      }

      // Refresh recommendations after a short delay
      setTimeout(() => {
        fetchRecommendations();
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to execute transfer';
      toast.error(errorMsg);
      console.error('Transfer execution failed:', err);
    } finally {
      setExecutingId(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="transfer-recommendations p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Transfer Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">COMMODITY REDISTRIBUTION</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transfer-recommendations p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Transfer Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">COMMODITY REDISTRIBUTION</p>
          </div>
        </div>
        <div className="p-4 bg-secondary/30 rounded-xl border border-border text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="transfer-recommendations p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Transfer Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">COMMODITY REDISTRIBUTION</p>
          </div>
        </div>
        <div className="p-6 bg-green-500/5 rounded-xl border border-green-500/20 text-center">
          <Shield size={32} className="mx-auto mb-3 text-green-500" />
          <p className="font-semibold text-green-400">SYSTEM BALANCED</p>
          <p className="text-sm text-muted-foreground mt-1">No transfer recommendations at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-recommendations p-6 bg-card border border-border rounded-2xl" data-testid="transfer-recommendations">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Transfer Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">COMMODITY REDISTRIBUTION • {recommendations.length} ACTIVE</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecommendations}
          className="text-xs font-mono"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const isExecuting = executingId === rec.id;
          const executedResult = executedTransfers[rec.id];
          
          return (
            <div 
              key={rec.id || index}
              className={`p-4 rounded-xl border transition-all ${
                executedResult 
                  ? 'bg-green-500/5 border-green-500/30' 
                  : 'bg-secondary/30 border-border hover:border-primary/30'
              }`}
              data-testid={`transfer-rec-${index}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-cyan-400" />
                  <span className="font-mono text-sm font-semibold">{rec.commodity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-[10px] font-mono uppercase rounded-lg border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority} PRIORITY
                  </span>
                  {executedResult && (
                    <span className="px-2 py-1 text-[10px] font-mono uppercase rounded-lg border text-green-400 bg-green-500/10 border-green-500/30">
                      EXECUTED
                    </span>
                  )}
                </div>
              </div>

              {/* Source → Destination */}
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg mb-3">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground font-mono">SOURCE</p>
                  <p className="font-mono text-sm">{rec.sourceMandi?.name}</p>
                  <p className="text-[10px] text-green-400 font-mono">
                    Surplus: +{rec.metrics?.sourceSurplus?.toLocaleString()} Q
                  </p>
                </div>
                <ArrowRight size={20} className="text-primary" />
                <div className="flex-1 text-right">
                  <p className="text-[10px] text-muted-foreground font-mono">DESTINATION</p>
                  <p className="font-mono text-sm">{rec.destinationMandi?.name}</p>
                  <p className="text-[10px] text-red-400 font-mono">
                    Deficit: -{rec.metrics?.destDeficit?.toLocaleString()} Q
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground font-mono">QUANTITY</p>
                  <p className="font-mono text-sm text-foreground">{rec.suggestedQuantity?.toLocaleString()} Q</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground font-mono">TRANSPORT</p>
                  <p className="font-mono text-sm text-foreground">{rec.transportCost}</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground font-mono">ARBITRAGE</p>
                  <p className="font-mono text-sm text-green-400">{rec.priceArbitrage}</p>
                </div>
                <div className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground font-mono">STABILITY</p>
                  <p className="font-mono text-sm text-primary">{rec.expectedStabilityImpact}</p>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{rec.reasoning}</p>
              </div>

              {/* Executed Result */}
              {executedResult && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 mb-3 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-green-400" />
                    <span className="text-xs font-mono text-green-400 uppercase">Transfer Executed Successfully</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono">Source Price Impact</p>
                      <p className={`font-mono text-sm ${executedResult.sourcePriceChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {executedResult.sourcePriceChange > 0 ? '+' : ''}{executedResult.sourcePriceChange}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-mono">Dest Price Impact</p>
                      <p className={`font-mono text-sm ${executedResult.destPriceChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {executedResult.destPriceChange > 0 ? '+' : ''}{executedResult.destPriceChange}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Execute Button */}
              {!executedResult && (
                <Button
                  onClick={() => handleExecuteTransfer(rec)}
                  disabled={isExecuting}
                  className="w-full rounded-xl font-mono uppercase tracking-wider"
                  data-testid={`execute-transfer-btn-${index}`}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Executing Transfer...
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Invoke Transfer
                    </>
                  )}
                </Button>
              )}

              {/* Price Differential */}
              {rec.metrics?.priceDifferential > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <DollarSign size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Price Differential: ₹{rec.metrics.priceDifferential?.toLocaleString()}/quintal 
                    (Source: ₹{rec.metrics.sourcePrice?.toLocaleString()} → Dest: ₹{rec.metrics.destPrice?.toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransferRecommendations;
