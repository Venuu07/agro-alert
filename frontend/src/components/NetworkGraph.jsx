import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'lucide-react';

export const NetworkGraph = ({ mandis = [], simulationTarget = null, affectedMandis = [] }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 });
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width || 600, height: 300 });
      }
    };
    
    // Initial measurement after mount
    const timer = setTimeout(updateDimensions, 100);
    
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  if (mandis.length === 0) return null;

  const { width, height } = dimensions;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // Calculate node positions in a circular layout
  const nodePositions = mandis.map((mandi, index) => {
    const angle = (index / mandis.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...mandi,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // Build connections from connectedMandis
  const connections = [];
  nodePositions.forEach((node) => {
    if (node.connectedMandis) {
      node.connectedMandis.forEach((connectedId) => {
        const targetNode = nodePositions.find((n) => n.id === connectedId);
        if (targetNode) {
          // Avoid duplicate connections
          const exists = connections.some(
            (c) =>
              (c.source.id === node.id && c.target.id === targetNode.id) ||
              (c.source.id === targetNode.id && c.target.id === node.id)
          );
          if (!exists) {
            connections.push({
              source: node,
              target: targetNode,
              isAffected: affectedMandis.some(
                (am) => am.mandiId === node.id || am.mandiId === targetNode.id
              ),
            });
          }
        }
      });
    }
  });

  const getNodeColor = (node) => {
    if (simulationTarget === node.id) return '#ef4444'; // Red for simulation target
    if (affectedMandis.some((am) => am.mandiId === node.id)) return '#f97316'; // Orange for affected
    if (node.stressScore >= 60) return '#ef4444'; // High risk
    if (node.stressScore >= 40) return '#f97316'; // Watch
    return '#22c55e'; // Normal
  };

  const getNodeRadius = (node) => {
    if (simulationTarget === node.id) return 20;
    if (node.stressScore >= 60) return 16;
    return 12;
  };

  return (
    <div className="network-graph-container" data-testid="network-graph">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
          <Network size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Market Network</h3>
          <p className="text-xs text-muted-foreground font-mono">SUPPLY CHAIN CONNECTIONS</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[10px] font-mono text-muted-foreground">HIGH RISK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-[10px] font-mono text-muted-foreground">WATCH</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[10px] font-mono text-muted-foreground">NORMAL</span>
        </div>
        {simulationTarget && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono text-red-400">SHOCK ORIGIN</span>
          </div>
        )}
      </div>

      {/* SVG Graph */}
      <div className="relative h-[300px] rounded-xl overflow-hidden bg-secondary/20 border border-border">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width || 600} ${height || 300}`}
          className="network-svg"
        >
          <defs>
            {/* Gradient for connections */}
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
            </linearGradient>
            
            {/* Affected connection gradient */}
            <linearGradient id="affectedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(249, 115, 22, 0.5)" />
              <stop offset="100%" stopColor="rgba(249, 115, 22, 0.2)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connections */}
          {connections.map((conn, index) => (
            <g key={`conn-${index}`}>
              <line
                x1={conn.source.x}
                y1={conn.source.y}
                x2={conn.target.x}
                y2={conn.target.y}
                stroke={conn.isAffected ? 'url(#affectedGradient)' : 'url(#connectionGradient)'}
                strokeWidth={conn.isAffected ? 3 : 2}
                className={conn.isAffected ? 'network-connection-affected' : 'network-connection'}
              />
              {conn.isAffected && (
                <circle
                  r="4"
                  fill="#f97316"
                  className="ripple-particle"
                >
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path={`M${conn.source.x},${conn.source.y} L${conn.target.x},${conn.target.y}`}
                  />
                </circle>
              )}
            </g>
          ))}

          {/* Nodes */}
          {nodePositions.map((node) => {
            const nodeColor = getNodeColor(node);
            const nodeRadius = getNodeRadius(node);
            const isTarget = simulationTarget === node.id;
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="network-node-group"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node glow for high stress */}
                {(node.stressScore >= 60 || isTarget) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 8}
                    fill={nodeColor}
                    opacity={0.2}
                    className="node-glow"
                  />
                )}

                {/* Ripple for target */}
                {isTarget && (
                  <>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      opacity="0.6"
                      className="ripple-ring-1"
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      opacity="0.3"
                      className="ripple-ring-2"
                    />
                  </>
                )}

                {/* Main node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={nodeColor}
                  stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isHovered ? 3 : 1}
                  filter={isTarget ? 'url(#glow)' : undefined}
                  className="network-node"
                  style={{ cursor: 'pointer' }}
                />

                {/* Stress score inside node */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={nodeRadius > 14 ? '10' : '8'}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.stressScore}
                </text>

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 14}
                  textAnchor="middle"
                  fill={isHovered ? '#fff' : 'rgba(255,255,255,0.7)'}
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name?.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered Node Info */}
      {hoveredNode && (
        <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border animate-fade-in">
          {(() => {
            const node = nodePositions.find((n) => n.id === hoveredNode);
            if (!node) return null;
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{node.name}</p>
                  <p className="text-xs text-muted-foreground">{node.location} • {node.commodity}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold" style={{ color: getNodeColor(node) }}>
                    {node.stressScore}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">STRESS INDEX</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
