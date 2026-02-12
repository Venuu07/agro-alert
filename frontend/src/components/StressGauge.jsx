import React from 'react';

export const StressGauge = ({ score, size = 96, showLabel = true }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score) => {
    if (score >= 60) return '#ef4444'; // red
    if (score >= 40) return '#f97316'; // orange
    return '#22c55e'; // green
  };
  
  const getGlowClass = (score) => {
    if (score >= 60) return 'stress-high';
    if (score >= 40) return 'stress-medium';
    return 'stress-low';
  };
  
  const color = getColor(score);
  const glowClass = getGlowClass(score);
  const isHighRisk = score >= 60;
  
  return (
    <div 
      className={`gauge-container ${isHighRisk ? 'critical-indicator' : ''}`}
      style={{ width: size, height: size }}
      data-testid="stress-gauge"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={glowClass}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="6"
        />
        {/* Secondary track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="square"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        {/* Glow effect for high risk */}
        {isHighRisk && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="square"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              filter: 'blur(4px)',
              opacity: 0.5,
            }}
          />
        )}
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={`font-mono font-bold ${isHighRisk ? 'score-glow-animation' : ''}`}
          style={{ 
            color,
            fontSize: size > 80 ? '1.5rem' : '1.25rem',
          }}
        >
          {score}
        </span>
        {showLabel && (
          <span className="data-label text-[8px]">MSI</span>
        )}
      </div>
    </div>
  );
};

export default StressGauge;
