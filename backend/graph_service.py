"""
Graph Service Module - Deterministic Network Graph Operations
=============================================================
Provides functions for:
- Circular layout positioning
- Shock propagation along network edges
- EMA (Exponential Moving Average) forecasting
- Agent behavior modeling
- Graph payload construction

HOW TO TEST:
  curl http://localhost:8001/api/graph
  curl "http://localhost:8001/api/graph?origin=mandi-001"
  curl "http://localhost:8001/api/forecast?mandi=mandi-001&commodity=Tomato&horizon=7"
"""

import json
import math
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
DATA_PATH = ROOT_DIR / 'data' / 'mandiData.json'
CONNECTIVITY_PATH = ROOT_DIR / 'data' / 'connectivity.json'


def circular_layout(names: List[str], cx: float = 500, cy: float = 320, radius: float = 240) -> Dict[str, Dict[str, float]]:
    """
    Generate circular layout coordinates for a list of node names.
    
    Args:
        names: List of node names/identifiers
        cx: Center X coordinate (default: 500)
        cy: Center Y coordinate (default: 320)
        radius: Radius of the circle (default: 240)
    
    Returns:
        Dictionary mapping names to {x, y} coordinates (float, rounded to 2 decimals)
    """
    if not names:
        return {}
    
    coords = {}
    n = len(names)
    
    for i, name in enumerate(names):
        # Start from top (-π/2) and go clockwise
        angle = (2 * math.pi * i / n) - (math.pi / 2)
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        coords[name] = {
            "x": round(x, 2),
            "y": round(y, 2)
        }
    
    return coords


def propagate_shock(
    origin_mandi: str,
    base_impacts: Dict[str, float],
    conn: List[Dict],
    decay_level1: float = 0.6,
    decay_level2: float = 0.3
) -> Dict[str, float]:
    """
    Deterministic shock propagation through network edges.
    
    Args:
        origin_mandi: ID of the mandi where shock originates
        base_impacts: Dictionary of mandi_id -> base impact value (0.0 to 1.0)
        conn: List of connection dictionaries with 'from', 'to', 'edge_strength'
        decay_level1: Decay factor for level 1 neighbors (default: 0.6)
        decay_level2: Decay factor for level 2 neighbors (default: 0.3)
    
    Returns:
        Dictionary of mandi_id -> propagated impact value
    """
    impacts = dict(base_impacts)
    
    # Origin mandi gets full impact
    origin_impact = impacts.get(origin_mandi, 1.0)
    impacts[origin_mandi] = min(1.0, max(0.0, origin_impact))
    
    # Find level 1 neighbors (directly connected to origin)
    level1_neighbors = set()
    for c in conn:
        if c.get('from') == origin_mandi:
            level1_neighbors.add(c.get('to'))
        elif c.get('to') == origin_mandi:
            level1_neighbors.add(c.get('from'))
    
    # Apply level 1 decay with edge strength
    for neighbor in level1_neighbors:
        # Find edge strength
        edge_strength = 0.5  # default
        for c in conn:
            if (c.get('from') == origin_mandi and c.get('to') == neighbor) or \
               (c.get('to') == origin_mandi and c.get('from') == neighbor):
                edge_strength = c.get('edge_strength', 0.5)
                break
        
        neighbor_impact = origin_impact * decay_level1 * edge_strength
        impacts[neighbor] = min(1.0, max(0.0, neighbor_impact))
    
    # Find level 2 neighbors (connected to level 1 but not origin)
    level2_neighbors = set()
    for l1 in level1_neighbors:
        for c in conn:
            if c.get('from') == l1:
                candidate = c.get('to')
                if candidate != origin_mandi and candidate not in level1_neighbors:
                    level2_neighbors.add(candidate)
            elif c.get('to') == l1:
                candidate = c.get('from')
                if candidate != origin_mandi and candidate not in level1_neighbors:
                    level2_neighbors.add(candidate)
    
    # Apply level 2 decay
    for neighbor in level2_neighbors:
        # Find best edge strength path (simplified: use average)
        edge_strength = 0.5
        for c in conn:
            if (c.get('from') in level1_neighbors and c.get('to') == neighbor) or \
               (c.get('to') in level1_neighbors and c.get('from') == neighbor):
                edge_strength = c.get('edge_strength', 0.5)
                break
        
        neighbor_impact = origin_impact * decay_level2 * edge_strength
        impacts[neighbor] = min(1.0, max(0.0, neighbor_impact))
    
    return impacts


def ema(series: List[float], alpha: float = 0.25) -> float:
    """
    Calculate Exponential Moving Average of a series.
    
    Args:
        series: List of numeric values (oldest first)
        alpha: Smoothing factor (0 < alpha <= 1), default: 0.25
    
    Returns:
        EMA value (float)
    """
    if not series:
        return 0.0
    
    if len(series) == 1:
        return float(series[0])
    
    # Initialize EMA with first value
    ema_value = float(series[0])
    
    # Apply EMA formula: EMA_t = alpha * X_t + (1 - alpha) * EMA_{t-1}
    for value in series[1:]:
        ema_value = alpha * float(value) + (1 - alpha) * ema_value
    
    return round(ema_value, 2)


def apply_agent_behaviour(supply: int, demand: int, price_change_pct: float) -> Dict[str, int]:
    """
    Apply deterministic agent behavior rules to supply/demand.
    
    Rules:
        - If price_change_pct > 5: reduce supply by 5% per 5% increment (integer floor)
        - If price_change_pct > 8: increase demand by 5% per 5% increment (integer floor)
    
    Args:
        supply: Current supply quantity
        demand: Current demand quantity
        price_change_pct: Percentage change in price
    
    Returns:
        Dictionary with adjusted 'supply' and 'demand' values
    """
    adjusted_supply = supply
    adjusted_demand = demand
    
    # Supply reduction rule: reduce by 5% for each 5% price increase above 5%
    if price_change_pct > 5:
        increments = int((price_change_pct - 5) / 5) + 1
        reduction_pct = increments * 5 / 100
        adjusted_supply = int(supply * (1 - reduction_pct))
    
    # Demand increase rule: increase by 5% for each 5% price increase above 8%
    if price_change_pct > 8:
        increments = int((price_change_pct - 8) / 5) + 1
        increase_pct = increments * 5 / 100
        adjusted_demand = int(demand * (1 + increase_pct))
    
    return {
        "supply": adjusted_supply,
        "demand": adjusted_demand
    }


def load_data() -> tuple:
    """Load mandi and connectivity data from JSON files."""
    try:
        with open(DATA_PATH, 'r') as f:
            mandi_data = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load mandiData.json: {e}")
        mandi_data = {"mandis": []}
    
    try:
        with open(CONNECTIVITY_PATH, 'r') as f:
            conn_data = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load connectivity.json: {e}")
        conn_data = {"connections": []}
    
    return mandi_data, conn_data


def build_graph_payload(origin_mandi: Optional[str] = None, shock_result: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Build complete graph payload for frontend visualization.
    
    Args:
        origin_mandi: Optional ID of shock origin mandi
        shock_result: Optional shock simulation result for impact calculation
    
    Returns:
        Dictionary with 'nodes' and 'edges' arrays for SVG rendering
    """
    mandi_data, conn_data = load_data()
    mandis = mandi_data.get("mandis", [])
    connections = conn_data.get("connections", [])
    
    if not mandis:
        return {"nodes": [], "edges": []}
    
    # Generate circular layout coordinates
    mandi_names = [m["id"] for m in mandis]
    coords = circular_layout(mandi_names, cx=500, cy=320, radius=240)
    
    # Build base impacts from stress scores
    base_impacts = {}
    for m in mandis:
        # Calculate stress score
        stress = calculate_mandi_stress(m)
        # Normalize to 0-1 range
        base_impacts[m["id"]] = stress / 100.0
    
    # Apply shock propagation if origin specified
    if origin_mandi and origin_mandi in base_impacts:
        # Set origin to high impact
        base_impacts[origin_mandi] = 1.0
        base_impacts = propagate_shock(origin_mandi, base_impacts, connections)
    
    # If shock_result provided, use actual impact values
    if shock_result:
        origin_id = shock_result.get("originalMandiId")
        if origin_id:
            # Set origin impact based on price impact
            price_impact = abs(shock_result.get("priceImpact", 0)) / 100.0
            base_impacts[origin_id] = min(1.0, max(0.1, price_impact + 0.4))
            
            # Set affected mandis impacts
            for affected in shock_result.get("affectedMandis", []):
                affected_id = affected.get("mandiId")
                if affected_id:
                    # Use price change as proxy for impact
                    aff_impact = abs(affected.get("priceChange", 0)) / 100.0
                    base_impacts[affected_id] = min(1.0, max(0.05, aff_impact + 0.2))
    
    # Build nodes array
    nodes = []
    for m in mandis:
        mandi_id = m["id"]
        coord = coords.get(mandi_id, {"x": 500, "y": 320})  # Fallback to center
        
        # Ensure valid coordinates
        x = coord.get("x", 500)
        y = coord.get("y", 320)
        
        # Validate coordinates are finite numbers
        if not isinstance(x, (int, float)) or not math.isfinite(x):
            x = 500
        if not isinstance(y, (int, float)) or not math.isfinite(y):
            y = 320
        
        # Get impact value, clamped to 0-1
        impact = base_impacts.get(mandi_id, 0.0)
        impact = min(1.0, max(0.0, impact))
        
        # Calculate MSI (Market Stress Index)
        msi = calculate_mandi_stress(m)
        
        # Determine status
        if msi > 65:
            status = "high"
        elif msi > 35:
            status = "watch"
        else:
            status = "normal"
        
        # Get primary commodity info
        primary_commodity = m.get("commodity", "Unknown")
        primary_price = m.get("currentPrice", 0)
        
        # Check commodities array for primary
        for c in m.get("commodities", []):
            if c.get("isPrimary", False):
                primary_commodity = c.get("name", primary_commodity)
                primary_price = c.get("currentPrice", primary_price)
                break
        
        nodes.append({
            "id": mandi_id,
            "name": m.get("name", mandi_id),
            "x": round(x, 2),
            "y": round(y, 2),
            "impact": round(impact, 2),
            "msi": msi,
            "status": status,
            "primary": primary_commodity,
            "price": primary_price
        })
    
    # Build edges array
    edges = []
    for c in connections:
        edges.append({
            "from": c.get("from", ""),
            "to": c.get("to", ""),
            "strength": c.get("edge_strength", 0.5),
            "cost_per_qt": c.get("cost_per_qt", 50),
            "travel_time": c.get("travel_time", 4.0)
        })
    
    return {"nodes": nodes, "edges": edges}


def calculate_mandi_stress(mandi: Dict) -> int:
    """Calculate stress score for a mandi (simplified version)."""
    stress = 0
    
    # Price stress
    current_price = mandi.get("currentPrice", 0)
    previous_price = mandi.get("previousPrice", 0)
    if previous_price > 0:
        price_change_pct = ((current_price - previous_price) / previous_price) * 100
        if price_change_pct > 8:
            stress += 35
        elif price_change_pct > 4:
            stress += 20
    
    # Supply stress
    arrivals = mandi.get("arrivals", 0)
    prev_arrivals = mandi.get("previousArrivals", 0)
    if prev_arrivals > 0:
        arrival_change_pct = ((arrivals - prev_arrivals) / prev_arrivals) * 100
        if arrival_change_pct < -10:
            stress += 30
        elif arrival_change_pct < -5:
            stress += 15
    
    # Volatility stress
    price_history = mandi.get("priceHistory", [])
    if len(price_history) >= 2:
        prices = [p.get("price", 0) for p in price_history]
        mean = sum(prices) / len(prices)
        variance = sum((p - mean) ** 2 for p in prices) / len(prices)
        volatility = math.sqrt(variance)
        if volatility > 10:
            stress += 20
    
    # External stress
    if mandi.get("rainFlag", False):
        stress += 10
    if mandi.get("festivalFlag", False):
        stress += 10
    
    return min(100, max(0, stress))


def generate_forecast(mandi_id: str, commodity: str, horizon: int = 7) -> List[Dict[str, Any]]:
    """
    Generate price forecast using EMA.
    
    Args:
        mandi_id: ID of the mandi
        commodity: Name of the commodity
        horizon: Number of days to forecast (default: 7)
    
    Returns:
        List of forecast points with date and predicted_price
    """
    mandi_data, _ = load_data()
    mandis = mandi_data.get("mandis", [])
    
    # Find the mandi
    target_mandi = None
    for m in mandis:
        if m["id"] == mandi_id:
            target_mandi = m
            break
    
    if not target_mandi:
        return []
    
    # Get price history
    price_history = target_mandi.get("priceHistory", [])
    
    # Check commodities array if commodity specified
    for c in target_mandi.get("commodities", []):
        if c.get("name", "").lower() == commodity.lower():
            # Use commodity's price if available
            current_price = c.get("currentPrice", 0)
            if current_price > 0:
                # Create synthetic history with current price
                if not price_history:
                    price_history = [{"price": current_price}]
            break
    
    if not price_history:
        return []
    
    # Extract prices
    prices = [p.get("price", 0) for p in price_history]
    
    # Calculate EMA for trend estimation
    ema_value = ema(prices, alpha=0.25)
    
    # Calculate trend direction
    if len(prices) >= 2:
        recent_trend = (prices[-1] - prices[-2]) / prices[-2] if prices[-2] > 0 else 0
    else:
        recent_trend = 0
    
    # Generate forecast
    forecast = []
    last_price = prices[-1] if prices else 0
    base_date = datetime.now()
    
    # Determine last date from history
    if price_history and "date" in price_history[-1]:
        try:
            base_date = datetime.strptime(price_history[-1]["date"], "%Y-%m-%d")
        except:
            pass
    
    for i in range(1, horizon + 1):
        # Simple deterministic forecast: blend EMA with trend
        # Weight towards EMA as we go further out
        ema_weight = 0.5 + (i * 0.05)  # Increases with horizon
        trend_weight = 1 - ema_weight
        
        # Project price
        trend_adjustment = last_price * (1 + recent_trend * trend_weight * i * 0.3)
        ema_projection = ema_value * (1 + recent_trend * 0.1 * i)
        
        predicted_price = ema_weight * ema_projection + (1 - ema_weight) * trend_adjustment
        predicted_price = max(0, predicted_price)  # Ensure non-negative
        
        forecast_date = base_date + timedelta(days=i)
        
        forecast.append({
            "date": forecast_date.strftime("%Y-%m-%d"),
            "predicted_price": round(predicted_price, 2)
        })
    
    return forecast
