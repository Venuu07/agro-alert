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

export const NetworkGraph = ({ 
  mandis = [], 
  simulationTarget = null, 
  affectedMandis = [],
  onNodeClick = null 
}) => {
  const [graphData, setGraphData] = useState(null);
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
      
      console.log('[NetworkGraph] Fetching:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[NetworkGraph] Received:', data);
      
      setGraphData(data);
    } catch (err) {
      console.error('[NetworkGraph] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [simulationTarget]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Render loading state
  if (loading) {
    return (
      <div 
        className="bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-loading"
      >
        <Header />
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading network...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className="bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-error"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Network Error</h3>
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Button variant="outline" size="sm" onClick={fetchGraphData} className="gap-2">
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No data
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div 
        className="bg-card border border-border rounded-2xl p-6"
        style={{ minHeight: '520px' }}
        data-testid="network-graph-empty"
      >
        <Header />
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No network data available
        </div>
      </div>
    );
  }

  const { nodes, edges } = graphData;
  
  // Debug: Log what we're about to render
  console.log('[NetworkGraph] About to render nodes:', nodes);
  console.log('[NetworkGraph] About to render edges:', edges);

  // Calculate node impact considering simulation
  const getImpact = (node) => {
    if (simulationTarget && node.id === simulationTarget) return 1.0;
    const affected = affectedMandis.find(am => am.mandiId === node.id);
    if (affected) {
      return Math.min(1.0, Math.abs(affected.priceChange || 0) / 50 + 0.3);
    }
    return node.impact || 0;
  };

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-6"
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
          <span className="text-[10px] font-mono text-muted-foreground">HIGH</span>
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

      {/* SVG Container */}
      <div 
        className="relative rounded-xl overflow-hidden border border-border"
        style={{ height: '400px', backgroundColor: '#0a0d14' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 640"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Test circles - should always show */}
          <circle cx="200" cy="200" r="30" fill="red" />
          <circle cx="500" cy="320" r="30" fill="green" />
          <circle cx="800" cy="200" r="30" fill="blue" />
          
          {/* Background grid */}
          <rect x="0" y="0" width="1000" height="640" fill="transparent" />
          
          {/* Draw edges first (underneath nodes) */}
          {edges && edges.length > 0 && edges.map((edge, i) => {
            console.log('[NetworkGraph] Drawing edge:', i, edge);
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) {
              console.log('[NetworkGraph] Skipping edge - missing nodes:', edge.from, edge.to);
              return null;
            }
            
            const isHighlighted = simulationTarget && (
              edge.from === simulationTarget || 
              edge.to === simulationTarget
            );
            
            return (
              <line
                key={`edge-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlighted ? '#ff6b6b' : '#4a5568'}
                strokeWidth={isHighlighted ? 3 : 2}
                strokeOpacity={isHighlighted ? 0.8 : 0.5}
              />
            );
          })}
          
          {/* Draw nodes */}
          {nodes && nodes.length > 0 && nodes.map((node, idx) => {
            console.log('[NetworkGraph] Drawing node:', idx, node.id, 'at', node.x, node.y);
            const impact = getImpact(node);
            const color = getNodeColor(impact);
            const radius = 16 + impact * 12;
            const isTarget = simulationTarget === node.id;
            const isHover = hoveredNode === node.id;
            
            return (
              <g 
                key={`node-${node.id}`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick && onNodeClick(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow effect for high impact */}
                {impact > 0.5 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 10}
                    fill={color}
                    opacity={0.2}
                  />
                )}
                
                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  stroke={isHover ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isHover ? 3 : 1}
                />
                
                {/* MSI number */}
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.msi}
                </text>
                
                {/* Label below node */}
                <text
                  x={node.x}
                  y={node.y + radius + 14}
                  textAnchor="middle"
                  fill={isHover ? '#fff' : 'rgba(255,255,255,0.7)'}
                  fontSize="10"
                  fontWeight="500"
                >
                  {node.name?.split(' ')[0] || node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover info panel */}
      {hoveredNode && graphData.nodes && (
        <HoverPanel node={graphData.nodes.find(n => n.id === hoveredNode)} getImpact={getImpact} />
      )}
    </div>
  );
};

// Header component
const Header = () => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
      <Network size={20} className="text-blue-400" />
    </div>
    <div>
      <h3 className="text-lg font-semibold">Market Network</h3>
      <p className="text-xs text-muted-foreground font-mono">SUPPLY CHAIN CONNECTIONS</p>
    </div>
  </div>
);

// Hover panel component
const HoverPanel = ({ node, getImpact }) => {
  if (!node) return null;
  const impact = getImpact(node);
  const color = getNodeColor(impact);
  
  return (
    <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border">
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
    </div>
  );
};

export default NetworkGraph;
