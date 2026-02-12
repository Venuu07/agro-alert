import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CommodityPanel = ({ mandiId, mandiName }) => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/mandi/${mandiId}/commodities`);
        setCommodities(response.data.commodities || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch commodities:', err);
        setError('Commodity data unavailable');
        setCommodities([]);
      } finally {
        setLoading(false);
      }
    };

    if (mandiId) {
      fetchCommodities();
    }
  }, [mandiId]);

  const getStressColor = (stress) => {
    if (stress >= 60) return 'text-red-500';
    if (stress >= 40) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStressBg = (stress) => {
    if (stress >= 60) return 'bg-red-500/10 border-red-500/30';
    if (stress >= 40) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  const getPriceIcon = (changePct) => {
    if (changePct > 2) return <TrendingUp size={14} className="text-red-400" />;
    if (changePct < -2) return <TrendingDown size={14} className="text-green-400" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="commodity-panel p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Commodity Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">MULTI-COMMODITY ANALYSIS</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-secondary/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || commodities.length === 0) {
    return (
      <div className="commodity-panel p-6 bg-card border border-border rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Commodity Intelligence</h3>
            <p className="text-xs text-muted-foreground font-mono">MULTI-COMMODITY ANALYSIS</p>
          </div>
        </div>
        <div className="p-4 bg-secondary/30 rounded-xl border border-border text-center">
          <p className="text-sm text-muted-foreground">{error || 'Commodity data unavailable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="commodity-panel p-6 bg-card border border-border rounded-2xl" data-testid="commodity-panel">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
          <Package size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Commodity Intelligence</h3>
          <p className="text-xs text-muted-foreground font-mono">MULTI-COMMODITY ANALYSIS • {commodities.length} TRACKED</p>
        </div>
      </div>

      <div className="space-y-3">
        {commodities.map((commodity, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl border transition-all duration-200 hover:border-primary/30 ${
              commodity.isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30 border-border'
            }`}
            data-testid={`commodity-${commodity.name?.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{commodity.name}</span>
                {commodity.isPrimary && (
                  <span className="px-2 py-0.5 text-[9px] font-mono bg-primary/20 text-primary rounded-full">
                    PRIMARY
                  </span>
                )}
              </div>
              <div className={`px-2 py-1 rounded-lg border text-xs font-mono ${getStressBg(commodity.stressIndex)}`}>
                <span className={getStressColor(commodity.stressIndex)}>
                  {commodity.stressIndex}/100 STRESS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Price */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-mono">PRICE</p>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm">₹{commodity.currentPrice?.toLocaleString()}</span>
                  {getPriceIcon(commodity.priceChangePct)}
                </div>
                <p className={`text-[10px] font-mono ${commodity.priceChangePct > 0 ? 'text-red-400' : commodity.priceChangePct < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                  {commodity.priceChangePct > 0 ? '+' : ''}{commodity.priceChangePct?.toFixed(1)}%
                </p>
              </div>

              {/* Arrivals */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-mono">ARRIVALS</p>
                <p className="font-mono text-sm">{commodity.arrivals?.toLocaleString()} Q</p>
                <p className={`text-[10px] font-mono ${commodity.arrivalChangePct < 0 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                  {commodity.arrivalChangePct > 0 ? '+' : ''}{commodity.arrivalChangePct?.toFixed(1)}%
                </p>
              </div>

              {/* Volatility */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-mono">VOLATILITY</p>
                <p className={`font-mono text-sm ${commodity.volatility > 10 ? 'text-orange-400' : 'text-foreground'}`}>
                  {commodity.volatility?.toFixed(1)}%
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {commodity.volatility > 10 ? 'HIGH' : commodity.volatility > 5 ? 'MODERATE' : 'LOW'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommodityPanel;
