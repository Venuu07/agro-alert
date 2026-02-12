import React from 'react';
import { Badge } from '../components/ui/badge';

export const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'high_risk':
        return {
          label: 'HIGH RISK',
          className: 'status-high-risk border font-mono text-xs tracking-wider',
        };
      case 'watch':
        return {
          label: 'WATCH',
          className: 'status-watch border font-mono text-xs tracking-wider',
        };
      default:
        return {
          label: 'NORMAL',
          className: 'status-normal border font-mono text-xs tracking-wider',
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
