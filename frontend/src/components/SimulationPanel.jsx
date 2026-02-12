import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { CloudRain, TrendingUp, PackageX, Truck, Zap, Loader2 } from 'lucide-react';

const shockIcons = {
  rain: CloudRain,
  demand_spike: TrendingUp,
  supply_drop: PackageX,
  transport: Truck,
};

export const SimulationPanel = ({ 
  mandis, 
  shockTypes, 
  onSimulate, 
  isLoading 
}) => {
  const [selectedMandi, setSelectedMandi] = useState('');
  const [selectedShock, setSelectedShock] = useState('');
  const [intensity, setIntensity] = useState([50]);
  const [duration, setDuration] = useState([7]);

  const handleSimulate = () => {
    if (!selectedMandi || !selectedShock) return;
    onSimulate({
      mandiId: selectedMandi,
      shockType: selectedShock,
      intensity: intensity[0],
      duration: duration[0],
    });
  };

  const getIntensityLabel = (value) => {
    if (value < 30) return 'Low';
    if (value < 70) return 'Moderate';
    return 'Severe';
  };

  const getIntensityColor = (value) => {
    if (value < 30) return 'text-green-500';
    if (value < 70) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="simulation-panel" data-testid="simulation-panel">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 border border-primary/30 flex items-center justify-center float-animation">
          <Zap size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">SHOCK PROPAGATION ENGINE</h2>
          <p className="text-xs text-muted-foreground font-mono">MODEL DISRUPTION SCENARIOS</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mandi Selection */}
        <div className="control-group">
          <label className="data-label">TARGET MANDI</label>
          <Select value={selectedMandi} onValueChange={setSelectedMandi}>
            <SelectTrigger className="bg-secondary border-border" data-testid="select-mandi">
              <SelectValue placeholder="Select a mandi" />
            </SelectTrigger>
            <SelectContent>
              {mandis.map((mandi) => (
                <SelectItem key={mandi.id} value={mandi.id}>
                  {mandi.name} — {mandi.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shock Type Selection */}
        <div className="control-group">
          <label className="data-label">SHOCK TYPE</label>
          <div className="grid grid-cols-2 gap-2">
            {shockTypes.map((shock) => {
              const Icon = shockIcons[shock.id] || Zap;
              const isSelected = selectedShock === shock.id;
              return (
                <button
                  key={shock.id}
                  onClick={() => setSelectedShock(shock.id)}
                  className={`
                    p-4 border transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border bg-secondary/30 hover:border-primary/50'
                    }
                  `}
                  data-testid={`shock-type-${shock.id}`}
                >
                  <Icon size={20} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="font-mono text-sm mt-2 uppercase tracking-wider">{shock.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{shock.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="control-group">
          <div className="flex items-center justify-between">
            <label className="data-label">INTENSITY</label>
            <span className={`font-mono text-sm ${getIntensityColor(intensity[0])}`}>
              {intensity[0]}% — {getIntensityLabel(intensity[0])}
            </span>
          </div>
          <div className="pt-2">
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              max={100}
              min={10}
              step={5}
              className="custom-slider"
              data-testid="intensity-slider"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Duration Slider */}
        <div className="control-group">
          <div className="flex items-center justify-between">
            <label className="data-label">DURATION</label>
            <span className="font-mono text-sm text-foreground">
              {duration[0]} days
            </span>
          </div>
          <div className="pt-2">
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={30}
              min={1}
              step={1}
              className="custom-slider"
              data-testid="duration-slider"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono mt-1">
            <span>1 day</span>
            <span>30 days</span>
          </div>
        </div>

        {/* Run Button */}
        <Button 
          onClick={handleSimulate}
          disabled={!selectedMandi || !selectedShock || isLoading}
          className="w-full uppercase tracking-wider font-mono h-12"
          data-testid="run-simulation-btn"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              SIMULATING...
            </>
          ) : (
            <>
              <Zap size={18} className="mr-2" />
              RUN SIMULATION
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SimulationPanel;
