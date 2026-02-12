/**
 * NetworkGraph Component - SVG-based Network Visualization
 * =========================================================
 * Renders a deterministic network graph with backend-provided coordinates.
 * NO force layout - positions come from /api/graph endpoint.
 * 
 * HOW TO TEST:
 * 1. Open browser DevTools → Network tab
 * 2. Load the dashboard page
 * 3. Verify GET /api/graph returns 200 with nodes array
 * 4. Check each node has x > 0 and y > 0
 * 5. SVG should render with visible nodes and edges
 * 
 * Debug: Click "Reload Graph" button to re-fetch data
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Network, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Color scale based on impact
const getNodeColor = (impact) => {
  if (impact <= 0.33) return '#22c55e'; // green
  if (impact <= 0.66) return '#ffb86b'; // amber
  return '#ff6b6b'; // red
};

// Get status color
const getStatusColor = (status) => {
  if (status === 'high') return '#ff6b6b';
  if (status === 'watch') return '#ffb86b';
  return '#22c55e';
};

export const NetworkGraph = ({ 
  mandis = [], 
  simulationTarget = null, 
  affectedMandis = [],
  onNodeClick = null 
}) => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Fetch graph data from backend
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = simulationTarget 
        ? `${BACKEND_URL}/api/graph?origin=${simulationTarget}`
        : `${BACKEND_URL}/api/graph`;
      
      console.log('[NetworkGraph] Fetching graph data from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[NetworkGraph] Received payload:', data);
      
      // Validate nodes have coordinates
      if (data.nodes && data.nodes.length > 0) {
        const missingCoords = data.nodes.filter(n => !n.x || !n.y || n.x === 0 || n.y === 0);
        if (missingCoords.length > 0) {
          console.error('[NetworkGraph] Graph payload missing coordinates:', missingCoords.map(n => n.id));
        }
      }
      
      setGraphData(data);
    } catch (err) {
      console.error('[NetworkGraph] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [simulationTarget]);

  // Fetch on mount and when simulation target changes
  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Merge affected mandis impact if simulation is running
  const getNodeImpact = (node) => {
    // If this node is the simulation target, max impact
    if (simulationTarget && node.id === simulationTarget) {
      return 1.0;
    }
    
    // Check if in affected mandis
    const affected = affectedMandis.find(am => am.mandiId === node.id);
    if (affected) {
      // Calculate impact from price change
      const priceChangeImpact = Math.abs(affected.priceChange || 0) / 50;
      return Math.min(1.0, Math.max(0.2, priceChangeImpact + 0.3));
    }
    
    // Use backend-provided impact
    return node.impact || 0;
  };

  // Calculate node radius based on impact
  const getNodeRadius = (impact) => {
    return 14 + impact * 16; // 14-30 range
  };

  // Render loading state
  if (loading) {
    return (
      <div 
        className="network-graph-container bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-loading"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Network size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Market Network</h3>
            <p className="text-xs text-muted-foreground font-mono">SUPPLY CHAIN CONNECTIONS</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading network graph...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className="network-graph-container bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-error"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Network Graph Error</h3>
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <p className="text-muted-foreground mb-4">Failed to load network data</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchGraphData}
            className="gap-2"
          >
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { nodes, edges } = graphData;

  // If no nodes, show empty state
  if (!nodes || nodes.length === 0) {
    return (
      <div 
        className="network-graph-container bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-empty"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Network size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Market Network</h3>
            <p className="text-xs text-muted-foreground font-mono">SUPPLY CHAIN CONNECTIONS</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No network data available
        </div>
      </div>
    );
  }

  return (
    <div 
      className="network-graph-container bg-card border border-border rounded-2xl p-6"
      style={{ minHeight: '520px' }}
      data-testid="network-graph"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Network size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Market Network</h3>
            <p className="text-xs text-muted-foreground font-mono">SUPPLY CHAIN CONNECTIONS</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={fetchGraphData}
          className="gap-2 text-xs font-mono"
          data-testid="reload-graph-btn"
        >
          <RefreshCw size={14} />
          Reload Graph
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff6b6b]" />
          <span className="text-[10px] font-mono text-muted-foreground">HIGH IMPACT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ffb86b]" />
          <span className="text-[10px] font-mono text-muted-foreground">MEDIUM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
          <span className="text-[10px] font-mono text-muted-foreground">LOW</span>
        </div>
        {simulationTarget && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 rounded-full bg-[#ff6b6b] animate-pulse" />
            <span className="text-[10px] font-mono text-red-400">SHOCK ORIGIN</span>
          </div>
        )}
      </div>

      {/* SVG Graph */}
      <div 
        className="relative rounded-xl overflow-hidden border border-border"
        style={{ height: '400px', backgroundColor: 'rgb(15, 18, 25)' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 640"
          preserveAspectRatio="xMidYMid meet"
          className="network-svg"
          style={{ zIndex: 1 }}
        >
          <defs>
            {/* Radial gradient for pulse effect */}
            <radialGradient id="pulse-gradient-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pulse-gradient-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb86b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffb86b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pulse-gradient-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
            </radialGradient>
            
            {/* Glow filter */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            const strength = edge.strength || 0.5;
            const isAffected = simulationTarget && (
              edge.from === simulationTarget || 
              edge.to === simulationTarget ||
              affectedMandis.some(am => am.mandiId === edge.from || am.mandiId === edge.to)
            );
            
            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isAffected ? '#ff6b6b' : '#64748b'}
                  strokeWidth={2 + strength * 2}
                  strokeOpacity={isAffected ? 0.8 : 0.4 + strength * 0.3}
                  strokeLinecap="round"
                />
                {/* Animated particle for affected edges */}
                {isAffected && (
                  <circle r="4" fill="#ff6b6b">
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const impact = getNodeImpact(node);
            const radius = getNodeRadius(impact);
            const color = getNodeColor(impact);
            const isTarget = simulationTarget === node.id;
            const isHovered = hoveredNode === node.id;
            
            // Determine pulse gradient
            let pulseGradient = 'pulse-gradient-green';
            if (impact > 0.66) pulseGradient = 'pulse-gradient-red';
            else if (impact > 0.33) pulseGradient = 'pulse-gradient-amber';

            return (
              <g
                key={node.id}
                className="network-node-group cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick && onNodeClick(node)}
                style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
              >
                {/* Pulse overlay for impact > 0.15 */}
                {impact > 0.15 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 20}
                    fill={`url(#${pulseGradient})`}
                    className={isTarget ? 'animate-pulse' : ''}
                  />
                )}
                
                {/* Outer glow for high impact or target */}
                {(impact > 0.5 || isTarget) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 8}
                    fill={color}
                    opacity={0.25}
                  />
                )}
                
                {/* Ripple rings for shock origin */}
                {isTarget && (
                  <>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      opacity="0.6"
                      className="animate-ping"
                      style={{ animationDuration: '1.5s' }}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 12}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.3"
                      className="animate-ping"
                      style={{ animationDuration: '2s', animationDelay: '0.5s' }}
                    />
                  </>
                )}

                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isHovered ? 3 : 1}
                  filter={isTarget ? 'url(#node-glow)' : undefined}
                />

                {/* MSI score inside node */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={radius > 20 ? '12' : '10'}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.msi}
                </text>

                {/* Node label - to the right */}
                <text
                  x={node.x + radius + 8}
                  y={node.y - 6}
                  textAnchor="start"
                  fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.85)'}
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name?.split(' ')[0]}
                </text>
                
                {/* Secondary label: commodity · price */}
                <text
                  x={node.x + radius + 8}
                  y={node.y + 8}
                  textAnchor="start"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.primary} · ₹{node.price?.toLocaleString()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered Node Info Panel */}
      {hoveredNode && (
        <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border animate-fade-in">
          {(() => {
            const node = nodes.find(n => n.id === hoveredNode);
            if (!node) return null;
            const impact = getNodeImpact(node);
            const color = getNodeColor(impact);
            
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{node.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {node.primary} · ₹{node.price?.toLocaleString()}/qt
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold" style={{ color }}>
                    {node.msi}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">
                    {node.status === 'high' ? 'HIGH RISK' : node.status === 'watch' ? 'WATCH' : 'NORMAL'}
                  </p>
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
