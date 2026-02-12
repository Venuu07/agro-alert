import React from 'react';
import { Badge } from '../components/ui/badge';

export const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'high_risk':
        return {
          label: 'HIGH RISK',
          className: 'status-high-risk border font-mono text-[10px] tracking-wider rounded-md px-2 py-0.5',
        };
      case 'watch':
        return {
          label: 'WATCH',
          className: 'status-watch border font-mono text-[10px] tracking-wider rounded-md px-2 py-0.5',
        };
      default:
        return {
          label: 'STABLE',
          className: 'status-normal border font-mono text-[10px] tracking-wider rounded-md px-2 py-0.5',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant="outline" 
      className={config.className}
      data-testid="status-badge"
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
