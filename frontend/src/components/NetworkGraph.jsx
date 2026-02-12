/**
 * NetworkGraph Component - SVG-based Network Visualization
 * =========================================================
 * Renders a deterministic network graph with backend-provided coordinates.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Network, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getNodeColor = (impact) => {
  if (impact <= 0.33) return '#22c55e';
  if (impact <= 0.66) return '#ffb86b';
  return '#ff6b6b';
};

export const NetworkGraph = ({ 
  simulationTarget = null, 
  affectedMandis = [],
  onNodeClick = null 
}) => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

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
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[NetworkGraph] Received:', data.nodes?.length, 'nodes');
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

  // Memoize SVG content
  const svgContent = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return null;
    }

    const { nodes, edges } = graphData;
    const elements = [];

    // Add edges
    if (edges && edges.length > 0) {
      edges.forEach((edge, i) => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (from && to) {
          elements.push(
            <line
              key={`e-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#4a5568"
              strokeWidth="2"
              strokeOpacity="0.5"
            />
          );
        }
      });
    }

    // Add nodes
    nodes.forEach((node, i) => {
      const impact = node.impact || 0;
      const color = getNodeColor(impact);
      const radius = 18 + impact * 10;
      
      elements.push(
        <g key={`n-${node.id}`}>
          {/* Glow */}
          {impact > 0.5 && (
            <circle
              cx={node.x}
              cy={node.y}
              r={radius + 10}
              fill={color}
              opacity="0.2"
            />
          )}
          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={radius}
            fill={color}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          {/* Label */}
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="10"
            fontWeight="bold"
          >
            {node.msi}
          </text>
          <text
            x={node.x}
            y={node.y + radius + 12}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="9"
          >
            {node.name?.split(' ')[0]}
          </text>
        </g>
      );
    });

    return elements;
  }, [graphData]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6" style={{ minHeight: '520px' }} data-testid="network-graph-loading">
        <Header />
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6" style={{ minHeight: '520px' }} data-testid="network-graph-error">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={20} className="text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchGraphData}>Retry</Button>
      </div>
    );
  }

  if (!graphData?.nodes?.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6" style={{ minHeight: '520px' }} data-testid="network-graph-empty">
        <Header />
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6" style={{ minHeight: '520px' }} data-testid="network-graph">
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
        <Button variant="ghost" size="sm" onClick={fetchGraphData} className="gap-2 text-xs" data-testid="reload-graph-btn">
          <RefreshCw size={14} /> Reload
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-lg border border-border">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ff6b6b]" /><span className="text-[10px] font-mono">HIGH</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ffb86b]" /><span className="text-[10px] font-mono">MEDIUM</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#22c55e]" /><span className="text-[10px] font-mono">LOW</span></div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: '400px', backgroundColor: '#0a0d14' }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet">
          {svgContent}
        </svg>
      </div>
    </div>
  );
};

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

export default NetworkGraph;
