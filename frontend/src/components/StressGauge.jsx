import React from 'react';

export const StressGauge = ({ score, size = 96 }) => {
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
  
  return (
    <div 
      className="gauge-container" 
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
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-mono text-2xl font-bold"
          style={{ color }}
        >
          {score}
        </span>
        <span className="data-label text-[10px]">STRESS</span>
      </div>
    </div>
  );
};

export default StressGauge;
