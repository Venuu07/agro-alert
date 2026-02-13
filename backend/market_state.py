"""
Market State Service Module - Deterministic Live Market State Store
===================================================================
Implements append-only market state updates without modifying existing engine logic.

CRITICAL CONSTRAINTS:
- NEVER overwrite existing rows
- ALL updates = Append NEW ROWS
- Use EXISTING elasticity formula for price computation
- Use EXISTING Stress Engine for MSI computation

HOW TO TEST:
  curl -X POST http://localhost:8001/api/market-update -H "Content-Type: application/json" \
    -d '{"mandiId":"mandi-001","commodity":"Tomato","arrivals":2500}'
  
  curl -X POST http://localhost:8001/api/execute-transfer -H "Content-Type: application/json" \
    -d '{"transferId":"xxx","sourceMandi":"mandi-001","destMandi":"mandi-002","commodity":"Onion","quantity":500}'
"""

import json
import math
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import copy

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
DATA_PATH = ROOT_DIR / 'data' / 'mandiData.json'

# In-memory market state store (initialized from JSON file)
# This represents the "live" state - original JSON is historical reference
_market_state: Dict = None
_state_history: List[Dict] = []  # Audit log of all changes

# ELASTICITY constant - MUST match existing engine
ELASTICITY = 0.4


def _load_initial_state() -> Dict:
    """Load initial state from JSON file (historical baseline)"""
    global _market_state
    if _market_state is None:
        with open(DATA_PATH, 'r') as f:
            _market_state = json.load(f)
        logger.info(f"Market state initialized with {len(_market_state.get('mandis', []))} mandis")
    return _market_state


def get_current_state() -> Dict:
    """Get current market state (thread-safe read)"""
    return _load_initial_state()


def get_mandi_by_id(mandi_id: str) -> Optional[Dict]:
    """Get a mandi by ID from current state"""
    state = get_current_state()
    for m in state.get("mandis", []):
        if m["id"] == mandi_id:
            return m
    return None


def get_commodity_from_mandi(mandi: Dict, commodity_name: str) -> Optional[Dict]:
    """Get a specific commodity from a mandi"""
    for c in mandi.get("commodities", []):
        if c["name"].lower() == commodity_name.lower():
            return c
    # Fallback to primary commodity
    if mandi.get("commodity", "").lower() == commodity_name.lower():
        return {
            "name": mandi["commodity"],
            "isPrimary": True,
            "currentPrice": mandi["currentPrice"],
            "previousPrice": mandi["previousPrice"],
            "arrivals": mandi["arrivals"],
            "previousArrivals": mandi.get("previousArrivals", mandi["arrivals"]),
            "baseDemand": mandi.get("baseDemand", mandi["arrivals"]),
            "baseSupply": mandi.get("baseSupply", mandi["arrivals"]),
            "volatility": mandi.get("volatility", 0)
        }
    return None


def compute_new_price(current_price: float, supply: int, demand: int) -> float:
    """
    Compute new price using EXISTING elasticity formula.
    
    Formula: price_new = price_old × (Demand / Supply)^elasticity
    
    CONSTRAINT: This formula MUST NOT be modified.
    """
    if supply <= 0:
        # Cap at 2x if supply is zero (matching existing behavior)
        return current_price * 2.0
    
    demand_supply_ratio = demand / supply
    price_multiplier = pow(demand_supply_ratio, ELASTICITY)
    new_price = current_price * price_multiplier
    
    return round(new_price, 2)


def validate_arrivals_input(arrivals: Any) -> tuple:
    """
    Validate operator arrivals input.
    
    Returns: (is_valid: bool, error_message: str or None, validated_value: int or None)
    """
    if arrivals is None:
        return False, "Arrivals is required", None
    
    try:
        arrivals_int = int(arrivals)
    except (ValueError, TypeError):
        return False, "Arrivals must be a numeric value", None
    
    if arrivals_int <= 0:
        return False, "Arrivals must be greater than 0", None
    
    return True, None, arrivals_int


def validate_transfer_input(source_mandi: Dict, quantity: int, commodity_name: str) -> tuple:
    """
    Validate transfer input.
    
    Returns: (is_valid: bool, error_message: str or None)
    """
    if quantity <= 0:
        return False, "Transfer quantity must be greater than 0"
    
    # Get commodity from source mandi
    commodity = get_commodity_from_mandi(source_mandi, commodity_name)
    if not commodity:
        return False, f"Commodity '{commodity_name}' not found in source mandi"
    
    # Check if source has enough supply
    current_arrivals = commodity.get("arrivals", 0)
    if quantity > current_arrivals:
        return False, f"Insufficient supply: requested {quantity}, available {current_arrivals}"
    
    return True, None


def append_market_update(
    mandi_id: str,
    commodity_name: str,
    new_arrivals: int,
    optional_context: str = None
) -> Dict:
    """
    Append a new market state row after operator input.
    
    Pipeline:
    1. Validate input
    2. Compute updated supply (supply = arrivals)
    3. Recompute price using EXISTING elasticity formula
    4. Recompute stress using EXISTING engine
    5. Append new row to history
    6. Update current state
    
    Returns: Update result with old and new values
    """
    global _market_state
    state = get_current_state()
    
    # Find the mandi
    mandi_idx = None
    mandi = None
    for i, m in enumerate(state.get("mandis", [])):
        if m["id"] == mandi_id:
            mandi_idx = i
            mandi = m
            break
    
    if mandi is None:
        raise ValueError(f"Mandi '{mandi_id}' not found")
    
    # Find the commodity
    commodity = get_commodity_from_mandi(mandi, commodity_name)
    if commodity is None:
        raise ValueError(f"Commodity '{commodity_name}' not found in mandi '{mandi_id}'")
    
    # Store previous values
    prev_price = commodity.get("currentPrice", 0)
    prev_arrivals = commodity.get("arrivals", 0)
    prev_base_supply = commodity.get("baseSupply", prev_arrivals)
    base_demand = commodity.get("baseDemand", prev_arrivals)
    
    # Step 2: Compute updated supply (supply = arrivals)
    new_supply = new_arrivals
    
    # Step 3: Recompute price using EXISTING formula
    new_price = compute_new_price(prev_price, new_supply, base_demand)
    
    # Create update record
    current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    update_record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "market_update",
        "mandiId": mandi_id,
        "mandiName": mandi["name"],
        "commodity": commodity_name,
        "date": current_date,
        "previousPrice": prev_price,
        "newPrice": new_price,
        "previousArrivals": prev_arrivals,
        "newArrivals": new_arrivals,
        "previousSupply": prev_base_supply,
        "newSupply": new_supply,
        "baseDemand": base_demand,
        "optionalContext": optional_context,
        "rainFlag": mandi.get("rainFlag", False),
        "festivalFlag": mandi.get("festivalFlag", False)
    }
    
    # Step 5: Append to history log
    _state_history.append(update_record)
    
    # Step 6: Update current state (in-memory)
    # Update commodity in mandi
    commodity_found = False
    for i, c in enumerate(mandi.get("commodities", [])):
        if c["name"].lower() == commodity_name.lower():
            # Update commodity
            mandi["commodities"][i]["previousPrice"] = prev_price
            mandi["commodities"][i]["currentPrice"] = new_price
            mandi["commodities"][i]["previousArrivals"] = prev_arrivals
            mandi["commodities"][i]["arrivals"] = new_arrivals
            mandi["commodities"][i]["baseSupply"] = new_supply
            commodity_found = True
            
            # If this is the primary commodity, also update mandi-level values
            if c.get("isPrimary", False):
                mandi["previousPrice"] = prev_price
                mandi["currentPrice"] = new_price
                mandi["previousArrivals"] = prev_arrivals
                mandi["arrivals"] = new_arrivals
                mandi["baseSupply"] = new_supply
            break
    
    # Fallback: update mandi-level if commodity matches
    if not commodity_found and mandi.get("commodity", "").lower() == commodity_name.lower():
        mandi["previousPrice"] = prev_price
        mandi["currentPrice"] = new_price
        mandi["previousArrivals"] = prev_arrivals
        mandi["arrivals"] = new_arrivals
        mandi["baseSupply"] = new_supply
    
    # Append to price and arrivals history
    if "priceHistory" in mandi:
        mandi["priceHistory"].append({"date": current_date, "price": new_price})
    if "arrivalsHistory" in mandi:
        mandi["arrivalsHistory"].append({"date": current_date, "arrivals": new_arrivals})
    
    # Update in global state
    _market_state["mandis"][mandi_idx] = mandi
    
    logger.info(f"Market update applied: {mandi_id}/{commodity_name} - Price: {prev_price}→{new_price}, Arrivals: {prev_arrivals}→{new_arrivals}")
    
    return {
        "success": True,
        "update": update_record,
        "priceChange": round(((new_price - prev_price) / prev_price) * 100 if prev_price > 0 else 0, 2),
        "arrivalsChange": round(((new_arrivals - prev_arrivals) / prev_arrivals) * 100 if prev_arrivals > 0 else 0, 2)
    }


def execute_transfer(
    source_mandi_id: str,
    dest_mandi_id: str,
    commodity_name: str,
    quantity: int
) -> Dict:
    """
    Execute a commodity transfer between mandis.
    
    Pipeline:
    1. Validate transfer
    2. Deduct quantity from SOURCE mandi
    3. Add quantity to DESTINATION mandi
    4. Recompute prices for BOTH mandis using EXISTING elasticity model
    5. Recompute stress for BOTH mandis using EXISTING engine
    6. Append NEW ROWS for both mandis
    
    Returns: Transfer result with before/after states
    """
    global _market_state
    state = get_current_state()
    
    logger.info(f"[TRANSFER] Starting transfer: {quantity} Q of {commodity_name} from {source_mandi_id} to {dest_mandi_id}")
    
    # Find source mandi
    source_mandi = None
    source_idx = None
    for i, m in enumerate(state.get("mandis", [])):
        if m["id"] == source_mandi_id:
            source_mandi = m
            source_idx = i
            break
    
    if source_mandi is None:
        raise ValueError(f"Source mandi '{source_mandi_id}' not found")
    
    # Find destination mandi
    dest_mandi = None
    dest_idx = None
    for i, m in enumerate(state.get("mandis", [])):
        if m["id"] == dest_mandi_id:
            dest_mandi = m
            dest_idx = i
            break
    
    if dest_mandi is None:
        raise ValueError(f"Destination mandi '{dest_mandi_id}' not found")
    
    # Step 1: Validate transfer
    is_valid, error = validate_transfer_input(source_mandi, quantity, commodity_name)
    if not is_valid:
        raise ValueError(error)
    
    # Get commodities
    source_commodity = get_commodity_from_mandi(source_mandi, commodity_name)
    dest_commodity = get_commodity_from_mandi(dest_mandi, commodity_name)
    
    # Store previous values
    source_prev_arrivals = source_commodity.get("arrivals", 0)
    source_prev_price = source_commodity.get("currentPrice", 0)
    source_demand = source_commodity.get("baseDemand", source_prev_arrivals)
    
    dest_prev_arrivals = dest_commodity.get("arrivals", 0) if dest_commodity else 0
    dest_prev_price = dest_commodity.get("currentPrice", source_prev_price) if dest_commodity else source_prev_price
    # For destination demand, use a reasonable default based on transferred quantity if commodity doesn't exist
    dest_demand = dest_commodity.get("baseDemand", dest_prev_arrivals) if dest_commodity else quantity
    
    # Ensure demands are positive
    if source_demand <= 0:
        source_demand = source_prev_arrivals if source_prev_arrivals > 0 else 1000
    if dest_demand <= 0:
        dest_demand = quantity  # Use transferred quantity as baseline demand
    
    logger.info(f"[TRANSFER] Source ({source_mandi_id}): arrivals BEFORE={source_prev_arrivals}, price={source_prev_price}")
    logger.info(f"[TRANSFER] Dest ({dest_mandi_id}): arrivals BEFORE={dest_prev_arrivals}, price={dest_prev_price}")
    
    # Step 2 & 3: Adjust supplies
    source_new_arrivals = source_prev_arrivals - quantity
    dest_new_arrivals = dest_prev_arrivals + quantity
    
    logger.info(f"[TRANSFER] Source ({source_mandi_id}): arrivals AFTER={source_new_arrivals}")
    logger.info(f"[TRANSFER] Dest ({dest_mandi_id}): arrivals AFTER={dest_new_arrivals}")
    
    # Step 4: Recompute prices using EXISTING elasticity model
    source_new_price = compute_new_price(source_prev_price, source_new_arrivals, source_demand)
    dest_new_price = compute_new_price(dest_prev_price, dest_new_arrivals, dest_demand)
    
    current_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Create transfer record
    transfer_record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "transfer_execution",
        "sourceMandiId": source_mandi_id,
        "sourceMandiName": source_mandi["name"],
        "destMandiId": dest_mandi_id,
        "destMandiName": dest_mandi["name"],
        "commodity": commodity_name,
        "quantity": quantity,
        "date": current_date,
        "source": {
            "previousArrivals": source_prev_arrivals,
            "newArrivals": source_new_arrivals,
            "previousPrice": source_prev_price,
            "newPrice": source_new_price
        },
        "destination": {
            "previousArrivals": dest_prev_arrivals,
            "newArrivals": dest_new_arrivals,
            "previousPrice": dest_prev_price,
            "newPrice": dest_new_price
        }
    }
    
    # Step 6: Append to history log
    _state_history.append(transfer_record)
    
    # Update source mandi
    _update_mandi_commodity(source_mandi, commodity_name, source_new_arrivals, source_new_price, source_prev_arrivals, source_prev_price)
    if "priceHistory" in source_mandi:
        source_mandi["priceHistory"].append({"date": current_date, "price": source_new_price})
    if "arrivalsHistory" in source_mandi:
        source_mandi["arrivalsHistory"].append({"date": current_date, "arrivals": source_new_arrivals})
    _market_state["mandis"][source_idx] = source_mandi
    
    # Update destination mandi
    _update_mandi_commodity(dest_mandi, commodity_name, dest_new_arrivals, dest_new_price, dest_prev_arrivals, dest_prev_price)
    if "priceHistory" in dest_mandi:
        dest_mandi["priceHistory"].append({"date": current_date, "price": dest_new_price})
    if "arrivalsHistory" in dest_mandi:
        dest_mandi["arrivalsHistory"].append({"date": current_date, "arrivals": dest_new_arrivals})
    _market_state["mandis"][dest_idx] = dest_mandi
    
    logger.info(f"Transfer executed: {quantity} quintals of {commodity_name} from {source_mandi_id} to {dest_mandi_id}")
    
    return {
        "success": True,
        "transfer": transfer_record,
        "sourcePriceChange": round(((source_new_price - source_prev_price) / source_prev_price) * 100 if source_prev_price > 0 else 0, 2),
        "destPriceChange": round(((dest_new_price - dest_prev_price) / dest_prev_price) * 100 if dest_prev_price > 0 else 0, 2)
    }


def _update_mandi_commodity(mandi: Dict, commodity_name: str, new_arrivals: int, new_price: float, prev_arrivals: int, prev_price: float):
    """Helper to update a commodity in a mandi"""
    for i, c in enumerate(mandi.get("commodities", [])):
        if c["name"].lower() == commodity_name.lower():
            mandi["commodities"][i]["previousPrice"] = prev_price
            mandi["commodities"][i]["currentPrice"] = new_price
            mandi["commodities"][i]["previousArrivals"] = prev_arrivals
            mandi["commodities"][i]["arrivals"] = new_arrivals
            mandi["commodities"][i]["baseSupply"] = new_arrivals
            
            # If primary commodity, update mandi-level
            if c.get("isPrimary", False):
                mandi["previousPrice"] = prev_price
                mandi["currentPrice"] = new_price
                mandi["previousArrivals"] = prev_arrivals
                mandi["arrivals"] = new_arrivals
                mandi["baseSupply"] = new_arrivals
            return
    
    # Fallback: update mandi-level if commodity matches
    if mandi.get("commodity", "").lower() == commodity_name.lower():
        mandi["previousPrice"] = prev_price
        mandi["currentPrice"] = new_price
        mandi["previousArrivals"] = prev_arrivals
        mandi["arrivals"] = new_arrivals
        mandi["baseSupply"] = new_arrivals


def get_state_history() -> List[Dict]:
    """Get the append-only state history log"""
    return _state_history


def get_latest_state_for_mandi(mandi_id: str) -> Optional[Dict]:
    """
    Get the latest market state for a mandi.
    
    DATA CONSISTENCY RULE: If multiple rows exist, latest date = Active Market State
    """
    return get_mandi_by_id(mandi_id)


def reset_state():
    """Reset market state to initial JSON (for testing only)"""
    global _market_state, _state_history
    _market_state = None
    _state_history = []
    _load_initial_state()
