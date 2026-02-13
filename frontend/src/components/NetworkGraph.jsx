/**
 * NetworkGraph Component - SVG Network Visualization
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
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Network, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getColor = (impact) => {
  if (impact <= 0.33) return '#22c55e';
  if (impact <= 0.66) return '#ffb86b';
  return '#ff6b6b';
};

// SVG content renderer - separate component to avoid React reconciliation issues
const GraphSVG = ({ nodes, edges, simulationTarget, affectedMandis, hoveredNode, setHoveredNode, onNodeClick }) => {
  if (!nodes || nodes.length === 0) return null;
  
  // Calculate effective impact for a node
  const getImpact = (node) => {
    if (simulationTarget && node.id === simulationTarget) return 1.0;
    const affected = affectedMandis?.find(am => am.mandiId === node.id);
    if (affected) {
      return Math.min(1.0, Math.abs(affected.priceChange || 0) / 50 + 0.3);
    }
    return node.impact || 0;
  };
  
  return (
    <>
      {/* Gradient definitions */}
      <defs>
        <radialGradient id="pulse-red" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pulse-amber" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb86b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffb86b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pulse-green" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (!from || !to) return null;
        
        const isHighlighted = simulationTarget && (
          edge.from === simulationTarget || 
          edge.to === simulationTarget ||
          affectedMandis?.some(am => am.mandiId === edge.from || am.mandiId === edge.to)
        );
        
        return (
          <g key={`edge-${i}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={isHighlighted ? '#ff6b6b' : '#4a5568'}
              strokeWidth={isHighlighted ? 3 : 2}
              strokeOpacity={isHighlighted ? 0.7 : 0.4}
              strokeLinecap="round"
            />
            {/* Animated particle on affected edges */}
            {isHighlighted && (
              <circle r="4" fill="#ff6b6b" opacity="0.8">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${from.x},${from.y} L${to.x},${to.y}`}
                />
              </circle>
            )}
          </g>
        );
      })}
      
      {/* Nodes */}
      {nodes.map((node) => {
        const impact = getImpact(node);
        const color = getColor(impact);
        const r = 16 + impact * 12;
        const isTarget = simulationTarget === node.id;
        const isHovered = hoveredNode === node.id;
        
        // Gradient ID based on color
        let pulseGradient = 'pulse-green';
        if (impact > 0.66) pulseGradient = 'pulse-red';
        else if (impact > 0.33) pulseGradient = 'pulse-amber';
        
        return (
          <g 
            key={`node-${node.id}`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onNodeClick && onNodeClick(node)}
          >
            {/* Pulse overlay for impact > 0.15 */}
            {impact > 0.15 && (
              <circle
                cx={node.x}
                cy={node.y}
                r={r + 20}
                fill={`url(#${pulseGradient})`}
                opacity={isTarget ? 1 : 0.7}
              >
                {isTarget && (
                  <animate
                    attributeName="r"
                    from={r + 10}
                    to={r + 35}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            )}
            
            {/* Outer glow for high impact */}
            {(impact > 0.5 || isTarget) && (
              <circle
                cx={node.x}
                cy={node.y}
                r={r + 8}
                fill={color}
                opacity={0.25}
              />
            )}
            
            {/* Ripple effect for shock origin */}
            {isTarget && (
              <>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.6}
                >
                  <animate
                    attributeName="r"
                    from={r}
                    to={r + 30}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}
            
            {/* Main node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={r}
              fill={color}
              stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.3)'}
              strokeWidth={isHovered ? 3 : 1}
              filter={isTarget ? 'url(#glow)' : undefined}
            />
            
            {/* MSI score */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={r > 20 ? "12" : "10"}
              fontWeight="bold"
              fontFamily="monospace"
              style={{ pointerEvents: 'none' }}
            >
              {node.msi}
            </text>
            
            {/* Node label - below */}
            <text
              x={node.x}
              y={node.y + r + 14}
              textAnchor="middle"
              fill={isHovered ? '#ffffff' : 'rgba(255,255,255,0.8)'}
              fontSize="10"
              fontWeight="600"
              style={{ pointerEvents: 'none' }}
            >
              {node.name?.split(' ')[0]}
            </text>
            
            {/* Commodity and price - smaller text below name */}
            <text
              x={node.x}
              y={node.y + r + 26}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8"
              fontFamily="monospace"
              style={{ pointerEvents: 'none' }}
            >
              {node.primary} · ₹{node.price?.toLocaleString()}
            </text>
          </g>
        );
      })}
    </>
  );
};

export const NetworkGraph = ({ 
  simulationTarget = null, 
  affectedMandis = [], 
  onNodeClick = null 
}) => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = simulationTarget 
        ? `${BACKEND_URL}/api/graph?origin=${simulationTarget}`
        : `${BACKEND_URL}/api/graph`;
      console.log('[NetworkGraph] Fetching:', url);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      console.log('[NetworkGraph] Got:', json.nodes?.length, 'nodes');
      
      // Validate coordinates
      if (json.nodes) {
        const missingCoords = json.nodes.filter(n => !n.x || !n.y);
        if (missingCoords.length > 0) {
          console.error('[NetworkGraph] Graph payload missing coordinates:', missingCoords.map(n => n.id));
        }
      }
      
      setData(json);
      setError(null);
    } catch (e) {
      console.error('[NetworkGraph] Error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [simulationTarget]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Loading state
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

  // Error state
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
          <p className="text-muted-foreground mb-4">Failed to load network data</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Find hovered node for info panel
  const hoveredNodeData = hoveredNode ? data.nodes?.find(n => n.id === hoveredNode) : null;

  return (
    <div 
      className="bg-card border border-border rounded-2xl p-6" 
      style={{ minHeight: '520px', position: 'relative', zIndex: 1 }} 
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
          onClick={fetchData} 
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
          style={{ overflow: 'visible' }}
        >
          <GraphSVG 
            nodes={data.nodes} 
            edges={data.edges} 
            simulationTarget={simulationTarget}
            affectedMandis={affectedMandis}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            onNodeClick={onNodeClick}
          />
        </svg>
      </div>

      {/* Hover Info Panel */}
      {hoveredNodeData && (
        <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{hoveredNodeData.name}</p>
              <p className="text-xs text-muted-foreground">
                {hoveredNodeData.primary} · ₹{hoveredNodeData.price?.toLocaleString()}/qt
              </p>
            </div>
            <div className="text-right">
              <p 
                className="font-mono text-2xl font-bold" 
                style={{ color: getColor(hoveredNodeData.impact || 0) }}
              >
                {hoveredNodeData.msi}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">
                {hoveredNodeData.status === 'high' ? 'HIGH RISK' : hoveredNodeData.status === 'watch' ? 'WATCH' : 'NORMAL'}
              </p>
            </div>
          </div>
        </div>
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

export default NetworkGraph;
