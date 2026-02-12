import React from 'react';
import { Card } from '../components/ui/card';
import { StressGauge } from './StressGauge';
import { StatusBadge } from './StatusBadge';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

export const MandiCard = ({ mandi, onClick }) => {
  const priceChange = ((mandi.currentPrice - mandi.previousPrice) / mandi.previousPrice) * 100;
  const arrivalsChange = ((mandi.arrivals - mandi.previousArrivals) / mandi.previousArrivals) * 100;
  const isPriceUp = priceChange > 0;
  const isArrivalsDown = arrivalsChange < 0;

  return (
    <Card
      className="card-hover border border-border bg-card cursor-pointer overflow-hidden"
      onClick={() => onClick(mandi)}
      data-testid={`mandi-card-${mandi.id}`}
    >
      {/* Image header */}
      <div className="relative h-24 overflow-hidden">
        <img
          src={mandi.image}
          alt={mandi.commodity}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className="data-label">{mandi.commodity}</span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={mandi.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{mandi.name}</h3>
            <p className="text-sm text-muted-foreground">{mandi.location}</p>
          </div>
          <StressGauge score={mandi.stressScore} size={72} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div className="space-y-1">
            <span className="data-label">PRICE</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-medium">
                ₹{mandi.currentPrice.toLocaleString()}
              </span>
              <span className={`flex items-center text-xs font-mono ${isPriceUp ? 'text-red-500' : 'text-green-500'}`}>
                {isPriceUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(priceChange).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Arrivals */}
          <div className="space-y-1">
            <span className="data-label">ARRIVALS</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-medium">
                {mandi.arrivals.toLocaleString()}
              </span>
              <span className={`flex items-center text-xs font-mono ${isArrivalsDown ? 'text-red-500' : 'text-green-500'}`}>
                <Package size={12} className="mr-0.5" />
                {arrivalsChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Volatility indicator */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="data-label">VOLATILITY</span>
            <span className={`font-mono text-sm ${mandi.volatility > 15 ? 'text-red-500' : mandi.volatility > 10 ? 'text-orange-500' : 'text-green-500'}`}>
              {mandi.volatility}%
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-secondary overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${mandi.volatility > 15 ? 'bg-red-500' : mandi.volatility > 10 ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(mandi.volatility * 5, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MandiCard;
