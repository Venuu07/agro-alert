/**
 * MarketUpdatePanel - Operator Market Input Component
 * ====================================================
 * Allows operators to update market signals (arrivals only).
 * Price, MSI, and other metrics are SYSTEM-COMPUTED.
 * 
 * CRITICAL CONSTRAINTS:
 * - Operator inputs ONLY arrivals (mandatory, numeric > 0)
 * - Optional contextual notes
 * - NO price input allowed
 */

import React, { useState } from 'react';
import { TrendingUp, Package, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const MarketUpdatePanel = ({ 
  mandiId, 
  mandiName, 
  commodities = [],
  currentArrivals,
  onUpdateComplete 
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState(
    commodities.find(c => c.isPrimary)?.name || commodities[0]?.name || ''
  );
  const [arrivals, setArrivals] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate arrivals
    const arrivalsNum = parseInt(arrivals, 10);
    if (isNaN(arrivalsNum) || arrivalsNum <= 0) {
      setError('Arrivals must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/market-update`, {
        mandiId,
        commodity: selectedCommodity,
        arrivals: arrivalsNum,
        optionalContext: context.trim() || null
      });

      setLastUpdate(response.data);
      toast.success(response.data.message);
      
      // Clear form
      setArrivals('');
      setContext('');
      
      // Notify parent to refresh
      if (onUpdateComplete) {
        onUpdateComplete(response.data);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update market signals';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-6"
      data-testid="market-update-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Update Market Signals</h3>
          <p className="text-xs text-muted-foreground font-mono">OPERATOR INPUT PANEL</p>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-3 mb-6 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Enter the latest arrivals data. <span className="text-blue-400">Price and MSI will be automatically computed</span> using the elasticity model.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Commodity Selection */}
        {commodities.length > 1 && (
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">
              Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="commodity-select"
            >
              {commodities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} {c.isPrimary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Arrivals Input */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">
            Latest Arrivals (Quintals) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              value={arrivals}
              onChange={(e) => setArrivals(e.target.value)}
              placeholder="Enter arrivals quantity..."
              className="pl-10 font-mono rounded-xl"
              required
              data-testid="arrivals-input"
            />
          </div>
          {currentArrivals && (
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              Current: {currentArrivals.toLocaleString()} quintals
            </p>
          )}
        </div>

        {/* Optional Context */}
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase">
            Optional Notes
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Heavy rains delayed shipments..."
            className="font-mono text-sm rounded-xl resize-none"
            rows={2}
            data-testid="context-input"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !arrivals}
          className="w-full rounded-xl font-mono uppercase tracking-wider"
          data-testid="submit-update-btn"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <TrendingUp size={16} className="mr-2" />
              Update Market Signals
            </>
          )}
        </Button>
      </form>

      {/* Last Update Result */}
      {lastUpdate && (
        <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl animate-fade-in" data-testid="update-result">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase">Update Applied</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Price Change</p>
              <p className={`text-lg font-bold font-mono ${lastUpdate.priceChange > 0 ? 'text-red-400' : lastUpdate.priceChange < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {lastUpdate.priceChange > 0 ? '+' : ''}{lastUpdate.priceChange}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                ₹{lastUpdate.previousPrice?.toLocaleString()} → ₹{lastUpdate.newPrice?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Arrivals Change</p>
              <p className={`text-lg font-bold font-mono ${lastUpdate.arrivalsChange > 0 ? 'text-green-400' : lastUpdate.arrivalsChange < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {lastUpdate.arrivalsChange > 0 ? '+' : ''}{lastUpdate.arrivalsChange}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {lastUpdate.previousArrivals?.toLocaleString()} → {lastUpdate.newArrivals?.toLocaleString()} qt
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketUpdatePanel;
