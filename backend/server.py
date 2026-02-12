from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load base data
DATA_PATH = ROOT_DIR / 'data' / 'mandiData.json'
with open(DATA_PATH, 'r') as f:
    BASE_DATA = json.load(f)

# Create the main app
app = FastAPI(title="Food System Early Warning API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Constants for Stress Engine
VOLATILITY_THRESHOLD = 10.0
ELASTICITY = 0.4

# ============================================================
# STRESS SCORE ENGINE - Deterministic Calculation
# ============================================================
def calculate_price_volatility(price_history: List[Dict]) -> float:
    """Calculate standard deviation of prices"""
    if len(price_history) < 2:
        return 0.0
    prices = [p["price"] for p in price_history]
    mean = sum(prices) / len(prices)
    variance = sum((p - mean) ** 2 for p in prices) / len(prices)
    return math.sqrt(variance)

def calculate_stress_score(mandi: Dict) -> Dict:
    """
    Calculate stress score using deterministic rules:
    - Price stress: based on price_change_%
    - Supply stress: based on arrival_change_%
    - Instability stress: based on volatility
    - External stress: rain_flag and festival_flag
    """
    stress = 0
    stress_breakdown = {}
    
    # Calculate derived metrics
    current_price = mandi["currentPrice"]
    previous_price = mandi["previousPrice"]
    current_arrivals = mandi["arrivals"]
    previous_arrivals = mandi["previousArrivals"]
    
    # Price change %
    price_change_pct = ((current_price - previous_price) / previous_price) * 100 if previous_price > 0 else 0
    
    # Arrival change %
    arrival_change_pct = ((current_arrivals - previous_arrivals) / previous_arrivals) * 100 if previous_arrivals > 0 else 0
    
    # Price volatility (std deviation)
    volatility = calculate_price_volatility(mandi.get("priceHistory", []))
    
    # === PRICE STRESS ===
    price_stress = 0
    if price_change_pct > 8:
        price_stress = 35
    elif price_change_pct > 4:
        price_stress = 20
    stress += price_stress
    stress_breakdown["priceStress"] = price_stress
    
    # === SUPPLY STRESS ===
    supply_stress = 0
    if arrival_change_pct < -10:
        supply_stress = 30
    elif arrival_change_pct < -5:
        supply_stress = 15
    stress += supply_stress
    stress_breakdown["supplyStress"] = supply_stress
    
    # === INSTABILITY STRESS ===
    instability_stress = 0
    if volatility > VOLATILITY_THRESHOLD:
        instability_stress = 20
    stress += instability_stress
    stress_breakdown["instabilityStress"] = instability_stress
    
    # === EXTERNAL STRESS ===
    external_stress = 0
    if mandi.get("rainFlag", False):
        external_stress += 10
    if mandi.get("festivalFlag", False):
        external_stress += 10
    stress += external_stress
    stress_breakdown["externalStress"] = external_stress
    
    # Clamp stress score between 0 and 100
    stress = max(0, min(100, stress))
    
    # Determine status classification
    if stress > 65:
        status = "high_risk"
    elif stress > 35:
        status = "watch"
    else:
        status = "normal"
    
    return {
        "stressScore": stress,
        "status": status,
        "volatility": round(volatility, 2),
        "priceChangePct": round(price_change_pct, 2),
        "arrivalChangePct": round(arrival_change_pct, 2),
        "stressBreakdown": stress_breakdown
    }

def enrich_mandi_with_stress(mandi: Dict) -> Dict:
    """Add computed stress metrics to a mandi"""
    stress_data = calculate_stress_score(mandi)
    enriched = {**mandi}
    enriched["stressScore"] = stress_data["stressScore"]
    enriched["status"] = stress_data["status"]
    enriched["volatility"] = stress_data["volatility"]
    enriched["priceChangePct"] = stress_data["priceChangePct"]
    enriched["arrivalChangePct"] = stress_data["arrivalChangePct"]
    enriched["stressBreakdown"] = stress_data["stressBreakdown"]
    return enriched

# ============================================================
# SHOCK SIMULATION ENGINE - Deterministic Mathematical Propagation
# ============================================================
def simulate_shock(target_mandi: Dict, shock_type: str, intensity: int, duration: int, all_mandis: List[Dict]) -> Dict:
    """
    Run deterministic shock simulation:
    - Supply shocks (rain, supply_drop): Supply ↓ → arrivals ↓ → price ↑
    - Demand shocks (demand_spike, festival): Demand ↑ → price ↑
    - Price calculation using elasticity: price_new = price_old * (Demand/Supply)^elasticity
    - Ripple effect: 60% for immediate neighbors, 30% for next level
    """
    intensity_factor = intensity / 100
    duration_factor = duration / 7  # Normalize to 7 days
    
    # Get base values
    base_supply = target_mandi.get("baseSupply", target_mandi["arrivals"])
    base_demand = target_mandi.get("baseDemand", target_mandi["arrivals"])
    current_price = target_mandi["currentPrice"]
    current_arrivals = target_mandi["arrivals"]
    
    # Initialize simulated values
    new_supply = base_supply
    new_demand = base_demand
    
    # Apply shock based on type
    if shock_type in ["rain", "supply_drop", "transport"]:
        # Supply shock: reduce supply
        supply_reduction = intensity_factor * duration_factor * 0.4  # Up to 40% reduction
        new_supply = base_supply * (1 - supply_reduction)
        new_arrivals = int(current_arrivals * (1 - supply_reduction))
    elif shock_type == "demand_spike":
        # Demand shock: increase demand
        demand_increase = intensity_factor * duration_factor * 0.35  # Up to 35% increase
        new_demand = base_demand * (1 + demand_increase)
        new_arrivals = current_arrivals  # Arrivals unchanged for demand shock
    else:
        new_arrivals = current_arrivals
    
    # Calculate new price using elasticity formula
    # price_new = price_old * (Demand / Supply) ^ elasticity
    if new_supply > 0:
        demand_supply_ratio = new_demand / new_supply
        price_multiplier = pow(demand_supply_ratio, ELASTICITY)
        new_price = current_price * price_multiplier
    else:
        new_price = current_price * 2  # Cap at 2x if supply is zero
    
    price_impact_pct = ((new_price - current_price) / current_price) * 100
    
    # Calculate new stress score for target mandi
    simulated_mandi = {**target_mandi}
    simulated_mandi["currentPrice"] = new_price
    simulated_mandi["arrivals"] = new_arrivals
    if shock_type == "rain":
        simulated_mandi["rainFlag"] = True
    if shock_type == "demand_spike":
        simulated_mandi["festivalFlag"] = True
    new_stress_data = calculate_stress_score(simulated_mandi)
    
    # Generate simulated price history (project forward)
    simulated_history = []
    base_history = target_mandi.get("priceHistory", [])
    for i, ph in enumerate(base_history):
        if i < len(base_history) - 2:
            simulated_history.append({"date": ph["date"], "price": ph["price"]})
        else:
            # Apply gradual shock effect
            progress = (i - (len(base_history) - 3)) / 3
            shock_price = ph["price"] + (new_price - current_price) * progress
            simulated_history.append({"date": ph["date"], "price": round(shock_price, 2)})
    
    # Calculate ripple effects on connected mandis
    affected_mandis = []
    connected_ids = target_mandi.get("connectedMandis", [])
    
    # First level neighbors: 60% effect
    first_level_mandis = []
    second_level_ids = set()
    
    for connected_id in connected_ids:
        for m in all_mandis:
            if m["id"] == connected_id:
                first_level_mandis.append(m)
                # Collect second level connections
                for second_id in m.get("connectedMandis", []):
                    if second_id != target_mandi["id"] and second_id not in connected_ids:
                        second_level_ids.add(second_id)
    
    # Process first level (60% effect)
    for neighbor in first_level_mandis:
        ripple_price_impact = price_impact_pct * 0.6
        neighbor_new_price = neighbor["currentPrice"] * (1 + ripple_price_impact / 100)
        
        # Simulate stress for neighbor
        simulated_neighbor = {**neighbor}
        simulated_neighbor["currentPrice"] = neighbor_new_price
        if shock_type in ["rain", "supply_drop", "transport"]:
            simulated_neighbor["arrivals"] = int(neighbor["arrivals"] * (1 - intensity_factor * 0.3 * 0.6))
        neighbor_stress = calculate_stress_score(simulated_neighbor)
        
        affected_mandis.append({
            "mandiId": neighbor["id"],
            "mandiName": neighbor["name"],
            "priceChange": round(ripple_price_impact, 2),
            "newPrice": round(neighbor_new_price, 2),
            "originalPrice": neighbor["currentPrice"],
            "newStressScore": neighbor_stress["stressScore"],
            "previousStressScore": calculate_stress_score(neighbor)["stressScore"],
            "rippleLevel": 1
        })
    
    # Process second level (30% effect)
    for second_id in second_level_ids:
        for m in all_mandis:
            if m["id"] == second_id:
                ripple_price_impact = price_impact_pct * 0.3
                second_new_price = m["currentPrice"] * (1 + ripple_price_impact / 100)
                
                simulated_second = {**m}
                simulated_second["currentPrice"] = second_new_price
                second_stress = calculate_stress_score(simulated_second)
                
                affected_mandis.append({
                    "mandiId": m["id"],
                    "mandiName": m["name"],
                    "priceChange": round(ripple_price_impact, 2),
                    "newPrice": round(second_new_price, 2),
                    "originalPrice": m["currentPrice"],
                    "newStressScore": second_stress["stressScore"],
                    "previousStressScore": calculate_stress_score(m)["stressScore"],
                    "rippleLevel": 2
                })
    
    return {
        "originalMandi": target_mandi["name"],
        "originalMandiId": target_mandi["id"],
        "shockType": shock_type,
        "intensity": intensity,
        "duration": duration,
        "priceImpact": round(price_impact_pct, 2),
        "predictedPrice": round(new_price, 2),
        "originalPrice": current_price,
        "predictedArrivals": new_arrivals,
        "originalArrivals": current_arrivals,
        "newStressScore": new_stress_data["stressScore"],
        "previousStressScore": calculate_stress_score(target_mandi)["stressScore"],
        "newStatus": new_stress_data["status"],
        "affectedMandis": affected_mandis,
        "simulatedPriceHistory": simulated_history,
        "simulationParameters": {
            "elasticity": ELASTICITY,
            "supplyBefore": base_supply,
            "supplyAfter": round(new_supply, 0),
            "demandBefore": base_demand,
            "demandAfter": round(new_demand, 0)
        }
    }

# ============================================================
# INTERVENTION RECOMMENDATION ENGINE - Rule-Based
# ============================================================
def generate_recommendations(target_mandi: Dict, all_mandis: List[Dict]) -> List[Dict]:
    """
    Generate deterministic recommendations based on:
    - Stress score
    - Supply state
    - Neighbor states
    
    Rules:
    1. High Risk + Supply Stress → Pull Stock from Surplus Neighbor
    2. Surplus + Falling Prices → Push Stock / Recommend Storage
    3. Festival + Normal Supply → Pre-buffer Creation
    4. Price Rise Without Supply Stress → Monitor / Speculation Alert
    """
    recommendations = []
    stress_data = calculate_stress_score(target_mandi)
    stress_score = stress_data["stressScore"]
    breakdown = stress_data["stressBreakdown"]
    
    # Get enriched data for all mandis
    enriched_mandis = [enrich_mandi_with_stress(m) for m in all_mandis]
    
    # Find neighbors
    connected_ids = target_mandi.get("connectedMandis", [])
    neighbors = [m for m in enriched_mandis if m["id"] in connected_ids]
    
    # Find surplus neighbors (stress < 35 and high arrivals)
    surplus_neighbors = [
        n for n in neighbors 
        if n["stressScore"] < 35 and n["arrivalChangePct"] >= 0
    ]
    
    # Rule 1: High Risk + Supply Stress → Pull Stock from Surplus Neighbor
    if stress_score > 65 and breakdown.get("supplyStress", 0) > 0:
        if surplus_neighbors:
            best_source = max(surplus_neighbors, key=lambda x: x["arrivals"])
            recommendations.append({
                "id": str(uuid.uuid4()),
                "action": "Pull Stock from Surplus Neighbor",
                "priority": "high",
                "sourceMandi": best_source["name"],
                "sourceMandiId": best_source["id"],
                "destinationMandi": target_mandi["name"],
                "destinationMandiId": target_mandi["id"],
                "reasoning": f"Supply stress detected ({breakdown['supplyStress']} points). {best_source['name']} has surplus stock (stress: {best_source['stressScore']}, arrivals: {best_source['arrivals']} quintals) and can supply to stabilize prices.",
                "estimatedCost": f"₹{round(target_mandi['currentPrice'] * 50 / 100000, 1)} Lakh",
                "stabilityGain": "+20% stability",
                "metrics": {
                    "sourceStress": best_source["stressScore"],
                    "sourceArrivals": best_source["arrivals"],
                    "targetStress": stress_score,
                    "supplyStressContribution": breakdown["supplyStress"]
                }
            })
        else:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "action": "Emergency Stock Release",
                "priority": "high",
                "sourceMandi": "Central Buffer Stock",
                "destinationMandi": target_mandi["name"],
                "destinationMandiId": target_mandi["id"],
                "reasoning": f"High supply stress ({breakdown['supplyStress']} points) with no surplus neighbors available. Central buffer release recommended to prevent price spiral.",
                "estimatedCost": "₹2.5 Cr",
                "stabilityGain": "+25% stability",
                "metrics": {
                    "targetStress": stress_score,
                    "supplyStressContribution": breakdown["supplyStress"]
                }
            })
    
    # Rule 2: Surplus + Falling Prices → Push Stock / Recommend Storage
    if stress_score < 35 and stress_data["priceChangePct"] < -4:
        # Find high-stress neighbors to push stock to
        high_stress_neighbors = [n for n in neighbors if n["stressScore"] > 50]
        
        if high_stress_neighbors:
            best_dest = max(high_stress_neighbors, key=lambda x: x["stressScore"])
            recommendations.append({
                "id": str(uuid.uuid4()),
                "action": "Push Stock to High Demand Nodes",
                "priority": "medium",
                "sourceMandi": target_mandi["name"],
                "sourceMandiId": target_mandi["id"],
                "destinationMandi": best_dest["name"],
                "destinationMandiId": best_dest["id"],
                "reasoning": f"Surplus detected with falling prices ({stress_data['priceChangePct']:.1f}%). {best_dest['name']} has high stress ({best_dest['stressScore']}) and can absorb excess supply.",
                "estimatedCost": f"₹{round(target_mandi['currentPrice'] * 30 / 100000, 1)} Lakh",
                "stabilityGain": "+15% regional balance",
                "metrics": {
                    "priceChange": stress_data["priceChangePct"],
                    "destStress": best_dest["stressScore"]
                }
            })
        
        recommendations.append({
            "id": str(uuid.uuid4()),
            "action": "Recommend Cold Storage",
            "priority": "medium",
            "sourceMandi": target_mandi["name"],
            "reasoning": f"Falling prices ({stress_data['priceChangePct']:.1f}%) indicate oversupply. Storing {int(target_mandi['arrivals'] * 0.2)} quintals can prevent price crash and preserve farmer income.",
            "estimatedCost": f"₹{round(target_mandi['arrivals'] * 0.2 * 50 / 100000, 1)} Lakh",
            "stabilityGain": "+10% price floor",
            "metrics": {
                "priceChange": stress_data["priceChangePct"],
                "suggestedStorage": int(target_mandi["arrivals"] * 0.2)
            }
        })
    
    # Rule 3: Festival + Normal Supply → Pre-buffer Creation
    if target_mandi.get("festivalFlag", False) and breakdown.get("supplyStress", 0) == 0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "action": "Pre-buffer Creation",
            "priority": "medium",
            "destinationMandi": target_mandi["name"],
            "destinationMandiId": target_mandi["id"],
            "reasoning": f"Festival period detected with normal supply. Creating buffer of {int(target_mandi['arrivals'] * 0.15)} quintals will prevent price spikes during peak demand.",
            "estimatedCost": f"₹{round(target_mandi['arrivals'] * 0.15 * target_mandi['currentPrice'] / 100000, 1)} Lakh",
            "stabilityGain": "+15% demand resilience",
            "metrics": {
                "festivalActive": True,
                "currentSupplyStress": breakdown.get("supplyStress", 0),
                "suggestedBuffer": int(target_mandi["arrivals"] * 0.15)
            }
        })
    
    # Rule 4: Price Rise Without Supply Stress → Monitor / Speculation Alert
    if stress_data["priceChangePct"] > 6 and breakdown.get("supplyStress", 0) == 0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "action": "Speculation Alert - Enhanced Monitoring",
            "priority": "high",
            "destinationMandi": target_mandi["name"],
            "destinationMandiId": target_mandi["id"],
            "reasoning": f"Price increase of {stress_data['priceChangePct']:.1f}% detected WITHOUT supply stress. This pattern indicates potential hoarding or speculative behavior. Recommend market surveillance.",
            "estimatedCost": "₹0",
            "stabilityGain": "+10% early detection",
            "metrics": {
                "priceChange": stress_data["priceChangePct"],
                "supplyStress": breakdown.get("supplyStress", 0),
                "arrivalChange": stress_data["arrivalChangePct"]
            }
        })
    
    # Always add a monitoring recommendation
    recommendations.append({
        "id": str(uuid.uuid4()),
        "action": "Continue Standard Monitoring",
        "priority": "low",
        "destinationMandi": target_mandi["name"],
        "reasoning": f"Current stress level: {stress_score}/100. Volatility: {stress_data['volatility']:.1f}%. Continue standard monitoring protocols.",
        "estimatedCost": "₹0",
        "stabilityGain": "Baseline",
        "metrics": {
            "currentStress": stress_score,
            "volatility": stress_data["volatility"],
            "status": stress_data["status"]
        }
    })
    
    return recommendations

# ============================================================
# LLM EXPLANATION GENERATOR
# ============================================================
async def generate_ai_explanation(decision: str, metrics: Dict, mandi_context: Dict) -> str:
    """Generate human-readable explanation using LLM (for explanation only, not decision-making)"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            return None
        
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"explanation-{uuid.uuid4()}",
            system_message="You are an agricultural market analyst. Your role is to explain pre-computed market decisions in simple, actionable language for mandi operators. Be concise (under 100 words), professional, and focus on practical implications. Do not make any new decisions - only explain the given decision and metrics."
        ).with_model("openai", "gpt-4o")
        
        context = f"""
        Decision: {decision}
        
        Mandi Context:
        - Name: {mandi_context.get('name', 'Unknown')}
        - Location: {mandi_context.get('location', 'Unknown')}
        - Commodity: {mandi_context.get('commodity', 'Unknown')}
        - Current Price: ₹{mandi_context.get('currentPrice', 0)}/quintal
        - Current Arrivals: {mandi_context.get('arrivals', 0)} quintals
        
        Computed Metrics:
        - Stress Score: {metrics.get('currentStress', metrics.get('targetStress', 'N/A'))}/100
        - Price Change: {metrics.get('priceChange', 'N/A')}%
        - Supply Stress Contribution: {metrics.get('supplyStressContribution', 'N/A')} points
        - Volatility: {metrics.get('volatility', 'N/A')}%
        
        Explain this decision simply for the mandi operator. What should they understand and do?
        """
        
        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)
        return response
        
    except Exception as e:
        logger.error(f"AI explanation generation failed: {e}")
        return None

# ============================================================
# Pydantic Models
# ============================================================
class StressBreakdown(BaseModel):
    priceStress: int
    supplyStress: int
    instabilityStress: int
    externalStress: int

class MandiSummary(BaseModel):
    id: str
    name: str
    location: str
    commodity: str
    currentPrice: float
    previousPrice: float
    arrivals: int
    previousArrivals: int
    stressScore: int
    status: str
    volatility: float
    priceChangePct: float
    arrivalChangePct: float
    image: str
    rainFlag: bool = False
    festivalFlag: bool = False

class PricePoint(BaseModel):
    date: str
    price: float

class ArrivalsPoint(BaseModel):
    date: str
    arrivals: int

class MandiDetail(BaseModel):
    id: str
    name: str
    location: str
    commodity: str
    currentPrice: float
    previousPrice: float
    arrivals: int
    previousArrivals: int
    stressScore: int
    status: str
    volatility: float
    priceChangePct: float
    arrivalChangePct: float
    image: str
    rainFlag: bool = False
    festivalFlag: bool = False
    priceHistory: List[PricePoint]
    arrivalsHistory: List[ArrivalsPoint]
    connectedMandis: List[str]
    stressBreakdown: StressBreakdown

class StressResponse(BaseModel):
    mandis: List[MandiSummary]
    totalMandis: int
    highRiskCount: int
    watchCount: int
    normalCount: int

class SimulationRequest(BaseModel):
    mandiId: str
    shockType: str
    intensity: int = Field(ge=1, le=100, default=50)
    duration: int = Field(ge=1, le=30, default=7)

class AffectedMandiDetail(BaseModel):
    mandiId: str
    mandiName: str
    priceChange: float
    newPrice: float
    originalPrice: float
    newStressScore: int
    previousStressScore: int
    rippleLevel: int

class SimulationParameters(BaseModel):
    elasticity: float
    supplyBefore: float
    supplyAfter: float
    demandBefore: float
    demandAfter: float

class SimulationResponse(BaseModel):
    originalMandi: str
    originalMandiId: str
    shockType: str
    intensity: int
    duration: int
    priceImpact: float
    predictedPrice: float
    originalPrice: float
    predictedArrivals: int
    originalArrivals: int
    newStressScore: int
    previousStressScore: int
    newStatus: str
    affectedMandis: List[AffectedMandiDetail]
    simulatedPriceHistory: List[PricePoint]
    simulationParameters: SimulationParameters

class RecommendationRequest(BaseModel):
    mandiId: str
    includeAiInsights: bool = True

class Recommendation(BaseModel):
    id: str
    action: str
    priority: str
    sourceMandi: Optional[str] = None
    sourceMandiId: Optional[str] = None
    destinationMandi: Optional[str] = None
    destinationMandiId: Optional[str] = None
    reasoning: str
    estimatedCost: str
    stabilityGain: str
    aiInsight: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    mandiId: str
    mandiName: str
    currentStressScore: int
    stressStatus: str
    stressBreakdown: StressBreakdown
    recommendations: List[Recommendation]

# ============================================================
# API Endpoints
# ============================================================
@api_router.get("/")
async def root():
    return {"message": "Food System Early Warning API", "version": "2.0.0", "engines": ["stress", "simulation", "recommendation"]}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/stress", response_model=StressResponse)
async def get_stress_data():
    """Get stress overview for all mandis with computed stress scores"""
    mandis = BASE_DATA["mandis"]
    
    summaries = []
    high_risk = 0
    watch = 0
    normal = 0
    
    for m in mandis:
        enriched = enrich_mandi_with_stress(m)
        summaries.append(MandiSummary(
            id=enriched["id"],
            name=enriched["name"],
            location=enriched["location"],
            commodity=enriched["commodity"],
            currentPrice=enriched["currentPrice"],
            previousPrice=enriched["previousPrice"],
            arrivals=enriched["arrivals"],
            previousArrivals=enriched["previousArrivals"],
            stressScore=enriched["stressScore"],
            status=enriched["status"],
            volatility=enriched["volatility"],
            priceChangePct=enriched["priceChangePct"],
            arrivalChangePct=enriched["arrivalChangePct"],
            image=enriched["image"],
            rainFlag=enriched.get("rainFlag", False),
            festivalFlag=enriched.get("festivalFlag", False)
        ))
        
        if enriched["status"] == "high_risk":
            high_risk += 1
        elif enriched["status"] == "watch":
            watch += 1
        else:
            normal += 1
    
    return StressResponse(
        mandis=summaries,
        totalMandis=len(mandis),
        highRiskCount=high_risk,
        watchCount=watch,
        normalCount=normal
    )

@api_router.get("/mandi/{mandi_id}", response_model=MandiDetail)
async def get_mandi_detail(mandi_id: str):
    """Get detailed information for a specific mandi with computed stress"""
    for m in BASE_DATA["mandis"]:
        if m["id"] == mandi_id:
            enriched = enrich_mandi_with_stress(m)
            return MandiDetail(
                id=enriched["id"],
                name=enriched["name"],
                location=enriched["location"],
                commodity=enriched["commodity"],
                currentPrice=enriched["currentPrice"],
                previousPrice=enriched["previousPrice"],
                arrivals=enriched["arrivals"],
                previousArrivals=enriched["previousArrivals"],
                stressScore=enriched["stressScore"],
                status=enriched["status"],
                volatility=enriched["volatility"],
                priceChangePct=enriched["priceChangePct"],
                arrivalChangePct=enriched["arrivalChangePct"],
                image=enriched["image"],
                rainFlag=enriched.get("rainFlag", False),
                festivalFlag=enriched.get("festivalFlag", False),
                priceHistory=[PricePoint(**p) for p in enriched.get("priceHistory", [])],
                arrivalsHistory=[ArrivalsPoint(**a) for a in enriched.get("arrivalsHistory", [])],
                connectedMandis=enriched.get("connectedMandis", []),
                stressBreakdown=StressBreakdown(**enriched["stressBreakdown"])
            )
    
    raise HTTPException(status_code=404, detail="Mandi not found")

@api_router.get("/shock-types")
async def get_shock_types():
    """Get available shock types for simulation"""
    return {"shockTypes": BASE_DATA["shockTypes"]}

@api_router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """Run deterministic shock simulation with elasticity-based price propagation"""
    target_mandi = None
    for m in BASE_DATA["mandis"]:
        if m["id"] == request.mandiId:
            target_mandi = m
            break
    
    if not target_mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")
    
    result = simulate_shock(
        target_mandi=target_mandi,
        shock_type=request.shockType,
        intensity=request.intensity,
        duration=request.duration,
        all_mandis=BASE_DATA["mandis"]
    )
    
    return SimulationResponse(**result)

@api_router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get rule-based intervention recommendations with optional AI explanations"""
    target_mandi = None
    for m in BASE_DATA["mandis"]:
        if m["id"] == request.mandiId:
            target_mandi = m
            break
    
    if not target_mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")
    
    # Generate recommendations
    recommendations = generate_recommendations(target_mandi, BASE_DATA["mandis"])
    
    # Get stress data
    stress_data = calculate_stress_score(target_mandi)
    
    # Generate AI explanations if requested
    if request.includeAiInsights:
        for rec in recommendations:
            if rec["priority"] in ["high", "medium"]:
                try:
                    ai_insight = await generate_ai_explanation(
                        decision=rec["action"],
                        metrics=rec.get("metrics", {}),
                        mandi_context={
                            "name": target_mandi["name"],
                            "location": target_mandi["location"],
                            "commodity": target_mandi["commodity"],
                            "currentPrice": target_mandi["currentPrice"],
                            "arrivals": target_mandi["arrivals"]
                        }
                    )
                    rec["aiInsight"] = ai_insight
                except Exception as e:
                    logger.error(f"Failed to generate AI insight: {e}")
    
    return RecommendationResponse(
        mandiId=target_mandi["id"],
        mandiName=target_mandi["name"],
        currentStressScore=stress_data["stressScore"],
        stressStatus=stress_data["status"],
        stressBreakdown=StressBreakdown(**stress_data["stressBreakdown"]),
        recommendations=[Recommendation(**r) for r in recommendations]
    )

@api_router.get("/mandis")
async def get_all_mandis():
    """Get list of all mandis for dropdowns"""
    return {
        "mandis": [
            {
                "id": m["id"], 
                "name": m["name"], 
                "location": m["location"],
                "commodity": m["commodity"],
                "connectedMandis": m.get("connectedMandis", [])
            }
            for m in BASE_DATA["mandis"]
        ]
    }

# ============================================================
# CONTEXT INTERPRETER - Deterministic Keyword Mapping
# ============================================================
CONTEXT_KEYWORD_MAPPING = {
    "logistics_stress": ["strike", "protest", "blockade", "road block", "highway"],
    "arrival_friction": ["traffic", "delay", "congestion", "slow", "jam"],
    "demand_pressure": ["festival", "surge", "celebration", "wedding", "diwali", "holi", "eid"],
    "supply_stress": ["flood", "rain", "hail", "storm", "cyclone", "drought", "crop failure"]
}

def interpret_shock_context(description: str) -> Dict:
    """Deterministic keyword-based context interpretation"""
    if not description:
        return {"signals": [], "interpretation": None}
    
    description_lower = description.lower()
    detected_signals = []
    
    for signal_type, keywords in CONTEXT_KEYWORD_MAPPING.items():
        for keyword in keywords:
            if keyword in description_lower:
                detected_signals.append({
                    "type": signal_type,
                    "keyword": keyword,
                    "impact": get_signal_impact(signal_type)
                })
                break  # One match per signal type is enough
    
    return {
        "signals": detected_signals,
        "interpretation": generate_context_interpretation(detected_signals) if detected_signals else None
    }

def get_signal_impact(signal_type: str) -> str:
    """Get deterministic impact description for a signal type"""
    impacts = {
        "logistics_stress": "Transport disruption → Arrival delays → Supply pressure ↑",
        "arrival_friction": "Delivery slowdown → Stock uncertainty → Price volatility ↑",
        "demand_pressure": "Consumption spike → Demand surge → Price pressure ↑",
        "supply_stress": "Production/transport impact → Supply reduction → Price increase ↑"
    }
    return impacts.get(signal_type, "Unknown impact")

def generate_context_interpretation(signals: List[Dict]) -> str:
    """Generate deterministic interpretation from detected signals"""
    if not signals:
        return None
    
    signal_names = [s["type"].replace("_", " ").title() for s in signals]
    return f"Detected contextual factors: {', '.join(signal_names)}. These signals may amplify shock impact on the target mandi and connected markets."

class ContextInterpretRequest(BaseModel):
    description: str

@api_router.post("/interpret-context")
async def interpret_context(request: ContextInterpretRequest):
    """Interpret shock description using deterministic keyword mapping"""
    result = interpret_shock_context(request.description)
    return result

# ============================================================
# SURPLUS/DEFICIT INTELLIGENCE ENGINE - Deterministic
# ============================================================
def calculate_commodity_surplus_deficit(commodity: Dict) -> Dict:
    """Calculate surplus/deficit for a commodity using deterministic rules"""
    supply = commodity.get("arrivals", 0)
    base_demand = commodity.get("baseDemand", supply)
    
    balance = supply - base_demand
    balance_pct = (balance / base_demand * 100) if base_demand > 0 else 0
    
    # Determine status
    if balance_pct > 10:
        status = "surplus"
        action = "push_stock"
    elif balance_pct < -10:
        status = "deficit"
        action = "pull_stock"
    else:
        status = "balanced"
        action = "monitor"
    
    # Calculate stress contribution from imbalance
    price_change_pct = ((commodity.get("currentPrice", 0) - commodity.get("previousPrice", 0)) / 
                        commodity.get("previousPrice", 1)) * 100 if commodity.get("previousPrice", 0) > 0 else 0
    
    # Deterministic stabilization rule
    stabilization_signal = None
    if status == "deficit" and price_change_pct > 5:
        stabilization_signal = "PULL_STOCK_URGENT"
    elif status == "surplus" and price_change_pct < -3:
        stabilization_signal = "PUSH_STOCK_RECOMMENDED"
    elif status == "balanced":
        stabilization_signal = "MONITOR_STABILITY"
    else:
        stabilization_signal = "STANDARD_OPERATIONS"
    
    return {
        "commodity": commodity.get("name", "Unknown"),
        "supply": supply,
        "baseDemand": base_demand,
        "balance": balance,
        "balancePct": round(balance_pct, 1),
        "status": status,
        "suggestedAction": action,
        "priceChangePct": round(price_change_pct, 1),
        "stabilizationSignal": stabilization_signal,
        "volatility": commodity.get("volatility", 0)
    }

def get_mandi_surplus_deficit(mandi: Dict) -> Dict:
    """Get surplus/deficit analysis for all commodities in a mandi"""
    commodities = mandi.get("commodities", [])
    
    if not commodities:
        # Fallback to primary commodity data
        primary_commodity = {
            "name": mandi.get("commodity", "Unknown"),
            "arrivals": mandi.get("arrivals", 0),
            "baseDemand": mandi.get("baseDemand", mandi.get("arrivals", 0)),
            "currentPrice": mandi.get("currentPrice", 0),
            "previousPrice": mandi.get("previousPrice", 0),
            "volatility": calculate_price_volatility(mandi.get("priceHistory", []))
        }
        commodities = [primary_commodity]
    
    analyses = [calculate_commodity_surplus_deficit(c) for c in commodities]
    
    # Aggregate status
    deficit_count = sum(1 for a in analyses if a["status"] == "deficit")
    surplus_count = sum(1 for a in analyses if a["status"] == "surplus")
    
    if deficit_count > surplus_count:
        overall_status = "net_deficit"
    elif surplus_count > deficit_count:
        overall_status = "net_surplus"
    else:
        overall_status = "balanced"
    
    return {
        "mandiId": mandi["id"],
        "mandiName": mandi["name"],
        "overallStatus": overall_status,
        "commodityAnalyses": analyses,
        "deficitCommodities": [a["commodity"] for a in analyses if a["status"] == "deficit"],
        "surplusCommodities": [a["commodity"] for a in analyses if a["status"] == "surplus"]
    }

@api_router.get("/surplus-deficit/{mandi_id}")
async def get_surplus_deficit(mandi_id: str):
    """Get surplus/deficit intelligence for a mandi"""
    for m in BASE_DATA["mandis"]:
        if m["id"] == mandi_id:
            return get_mandi_surplus_deficit(m)
    raise HTTPException(status_code=404, detail="Mandi not found")

@api_router.get("/surplus-deficit")
async def get_all_surplus_deficit():
    """Get surplus/deficit intelligence for all mandis"""
    return {
        "mandis": [get_mandi_surplus_deficit(m) for m in BASE_DATA["mandis"]]
    }

# ============================================================
# TRANSFER RECOMMENDATION ENGINE - Deterministic
# ============================================================
def calculate_transport_cost(source_id: str, dest_id: str, quantity: int) -> float:
    """Calculate deterministic transport cost based on distance and quantity"""
    cost_per_km = BASE_DATA.get("transportCostPerKm", 2.5)
    distances = BASE_DATA.get("baseTransportDistance", {})
    
    # Try both key combinations
    key1 = f"{source_id}-{dest_id}"
    key2 = f"{dest_id}-{source_id}"
    
    distance = distances.get(key1, distances.get(key2, 200))  # Default 200km
    
    # Cost = distance * cost_per_km * (quantity/100) for quintals
    return round(distance * cost_per_km * (quantity / 100), 2)

def generate_transfer_recommendations(all_mandis: List[Dict]) -> List[Dict]:
    """Generate deterministic transfer recommendations based on surplus/deficit"""
    analyses = [get_mandi_surplus_deficit(m) for m in all_mandis]
    recommendations = []
    
    # Find surplus and deficit mandis
    surplus_mandis = []
    deficit_mandis = []
    
    for analysis in analyses:
        for commodity_analysis in analysis["commodityAnalyses"]:
            if commodity_analysis["status"] == "surplus":
                surplus_mandis.append({
                    "mandiId": analysis["mandiId"],
                    "mandiName": analysis["mandiName"],
                    "commodity": commodity_analysis["commodity"],
                    "surplus": commodity_analysis["balance"],
                    "price": get_mandi_price(analysis["mandiId"], commodity_analysis["commodity"])
                })
            elif commodity_analysis["status"] == "deficit":
                deficit_mandis.append({
                    "mandiId": analysis["mandiId"],
                    "mandiName": analysis["mandiName"],
                    "commodity": commodity_analysis["commodity"],
                    "deficit": abs(commodity_analysis["balance"]),
                    "price": get_mandi_price(analysis["mandiId"], commodity_analysis["commodity"])
                })
    
    # Match surplus to deficit for same commodity
    for deficit in deficit_mandis:
        matching_surplus = [s for s in surplus_mandis 
                          if s["commodity"] == deficit["commodity"] 
                          and s["mandiId"] != deficit["mandiId"]]
        
        if matching_surplus:
            # Pick the one with highest surplus
            best_source = max(matching_surplus, key=lambda x: x["surplus"])
            
            # Calculate transfer quantity (minimum of surplus and deficit)
            transfer_qty = min(best_source["surplus"], deficit["deficit"])
            
            # Calculate costs
            transport_cost = calculate_transport_cost(
                best_source["mandiId"], 
                deficit["mandiId"], 
                transfer_qty
            )
            
            # Calculate expected stability impact
            # Simple deterministic formula: impact = min(20, transfer_qty/deficit["deficit"] * 15)
            stability_impact = min(20, round((transfer_qty / deficit["deficit"]) * 15, 1)) if deficit["deficit"] > 0 else 0
            
            # Price arbitrage
            price_diff = deficit["price"] - best_source["price"]
            arbitrage_value = round(price_diff * transfer_qty / 100, 2)  # In lakhs
            
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "commodity_transfer",
                "sourceMandi": {
                    "id": best_source["mandiId"],
                    "name": best_source["mandiName"]
                },
                "destinationMandi": {
                    "id": deficit["mandiId"],
                    "name": deficit["mandiName"]
                },
                "commodity": deficit["commodity"],
                "suggestedQuantity": int(transfer_qty),
                "transportCost": f"₹{transport_cost:,.0f}",
                "transportCostValue": transport_cost,
                "priceArbitrage": f"₹{arbitrage_value:,.2f}L",
                "expectedStabilityImpact": f"+{stability_impact}%",
                "priority": "high" if stability_impact > 10 else "medium",
                "reasoning": f"Transfer {int(transfer_qty)} quintals of {deficit['commodity']} from {best_source['mandiName']} (surplus) to {deficit['mandiName']} (deficit) to stabilize supply-demand balance.",
                "metrics": {
                    "sourceSurplus": best_source["surplus"],
                    "destDeficit": deficit["deficit"],
                    "sourcePrice": best_source["price"],
                    "destPrice": deficit["price"],
                    "priceDifferential": price_diff
                }
            })
    
    return recommendations

def get_mandi_price(mandi_id: str, commodity_name: str) -> float:
    """Get current price for a commodity in a mandi"""
    for m in BASE_DATA["mandis"]:
        if m["id"] == mandi_id:
            for c in m.get("commodities", []):
                if c["name"] == commodity_name:
                    return c.get("currentPrice", 0)
            return m.get("currentPrice", 0)
    return 0

@api_router.get("/transfer-recommendations")
async def get_transfer_recommendations():
    """Get deterministic transfer recommendations based on surplus/deficit analysis"""
    recommendations = generate_transfer_recommendations(BASE_DATA["mandis"])
    return {
        "recommendations": recommendations,
        "totalRecommendations": len(recommendations),
        "generatedAt": datetime.now(timezone.utc).isoformat()
    }

# ============================================================
# MULTI-COMMODITY ENDPOINTS
# ============================================================
@api_router.get("/mandi/{mandi_id}/commodities")
async def get_mandi_commodities(mandi_id: str):
    """Get all commodities for a mandi with stress analysis"""
    for m in BASE_DATA["mandis"]:
        if m["id"] == mandi_id:
            commodities = m.get("commodities", [])
            
            if not commodities:
                # Return primary commodity if no multi-commodity data
                return {
                    "mandiId": mandi_id,
                    "mandiName": m["name"],
                    "commodities": [{
                        "name": m.get("commodity", "Unknown"),
                        "isPrimary": True,
                        "currentPrice": m.get("currentPrice", 0),
                        "previousPrice": m.get("previousPrice", 0),
                        "arrivals": m.get("arrivals", 0),
                        "baseDemand": m.get("baseDemand", 0),
                        "volatility": calculate_price_volatility(m.get("priceHistory", [])),
                        "stressIndex": calculate_commodity_stress(m)
                    }],
                    "dataAvailable": True
                }
            
            enriched_commodities = []
            for c in commodities:
                enriched_commodities.append({
                    **c,
                    "stressIndex": calculate_commodity_stress_from_data(c),
                    "priceChangePct": round(((c.get("currentPrice", 0) - c.get("previousPrice", 0)) / 
                                            c.get("previousPrice", 1)) * 100, 1) if c.get("previousPrice", 0) > 0 else 0,
                    "arrivalChangePct": round(((c.get("arrivals", 0) - c.get("previousArrivals", 0)) / 
                                              c.get("previousArrivals", 1)) * 100, 1) if c.get("previousArrivals", 0) > 0 else 0
                })
            
            return {
                "mandiId": mandi_id,
                "mandiName": m["name"],
                "commodities": enriched_commodities,
                "dataAvailable": True
            }
    
    raise HTTPException(status_code=404, detail="Mandi not found")

def calculate_commodity_stress(mandi: Dict) -> int:
    """Calculate stress index for primary commodity"""
    stress_data = calculate_stress_score(mandi)
    return stress_data["stressScore"]

def calculate_commodity_stress_from_data(commodity: Dict) -> int:
    """Calculate stress index for a commodity from its data"""
    stress = 0
    
    # Price stress
    price_change = ((commodity.get("currentPrice", 0) - commodity.get("previousPrice", 0)) / 
                   commodity.get("previousPrice", 1)) * 100 if commodity.get("previousPrice", 0) > 0 else 0
    if price_change > 8:
        stress += 35
    elif price_change > 4:
        stress += 20
    
    # Supply stress
    arrival_change = ((commodity.get("arrivals", 0) - commodity.get("previousArrivals", 0)) / 
                     commodity.get("previousArrivals", 1)) * 100 if commodity.get("previousArrivals", 0) > 0 else 0
    if arrival_change < -10:
        stress += 30
    elif arrival_change < -5:
        stress += 15
    
    # Volatility stress
    if commodity.get("volatility", 0) > 10:
        stress += 20
    
    return min(100, stress)

# ============================================================
# JARVIS AI ASSISTANT - Decision Intelligence Chat (Enhanced)
# ============================================================
class JarvisRequest(BaseModel):
    message: str
    systemContext: str = ""
    conversationHistory: List[Dict[str, str]] = []
    shockContext: Optional[str] = None
    surplusDeficitContext: Optional[Dict] = None
    transferContext: Optional[List[Dict]] = None

class JarvisResponse(BaseModel):
    response: str

@api_router.post("/jarvis/chat", response_model=JarvisResponse)
async def jarvis_chat(request: JarvisRequest):
    """Jarvis Decision Intelligence Assistant - interprets system outputs and explains market dynamics"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            return JarvisResponse(response="Jarvis is currently unavailable. Please check API configuration.")
        
        system_message = """You are Jarvis, a Decision Intelligence Assistant for agricultural market operators. 
Your role is to interpret pre-computed system outputs and explain market dynamics in a clear, analytical manner.

IMPORTANT GUIDELINES:
1. You DO NOT compute any values - all numbers are pre-computed by deterministic engines
2. You EXPLAIN stress signals, price dynamics, shock propagation, surplus/deficit status, and transfer recommendations
3. Be analytical, calm, and expert-like in your responses
4. Reference specific metrics when available (Market Stress Index, Supply/Demand, Surplus/Deficit, etc.)
5. Keep responses structured and concise (under 200 words unless detailed analysis requested)

RESPONSE FORMAT for market queries:
**Detected Signals**
• Supply/Demand/Stress insights from system data

**System Interpretation**
• Analytical reasoning about the situation

**Suggested Stabilization Insight**
• Clear, actionable recommendation based on system outputs

**Expected System Impact**
• Stability implications if actions are taken

When shock context is provided, interpret detected keywords (strike, flood, festival, etc.) and explain their impact.
When surplus/deficit data is provided, explain the balance status and recommended actions.
When transfer recommendations are provided, explain the logistics strategy.

Avoid generic AI responses. Be specific to the agricultural market context. Never compute values yourself."""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"jarvis-{uuid.uuid4()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Build enhanced context
        context_parts = []
        
        if request.systemContext:
            context_parts.append(f"SYSTEM STATE:\n{request.systemContext}")
        
        if request.shockContext:
            # Interpret the shock context using deterministic mapping
            interpreted = interpret_shock_context(request.shockContext)
            if interpreted["signals"]:
                context_parts.append(f"\nSHOCK CONTEXT (User Described): {request.shockContext}")
                context_parts.append(f"DETECTED SIGNALS: {json.dumps(interpreted['signals'], indent=2)}")
                context_parts.append(f"INTERPRETATION: {interpreted['interpretation']}")
        
        if request.surplusDeficitContext:
            context_parts.append(f"\nSURPLUS/DEFICIT STATUS:\n{json.dumps(request.surplusDeficitContext, indent=2)}")
        
        if request.transferContext:
            context_parts.append(f"\nTRANSFER RECOMMENDATIONS:\n{json.dumps(request.transferContext, indent=2)}")
        
        full_context = "\n".join(context_parts) if context_parts else "No specific context provided."
        
        context_prompt = f"""
CURRENT SYSTEM CONTEXT:
{full_context}

USER QUERY: {request.message}

Provide a helpful, analytical response based on the system context above. Structure your response clearly."""

        user_message = UserMessage(text=context_prompt)
        response = await chat.send_message(user_message)
        
        return JarvisResponse(response=response)
        
    except Exception as e:
        logger.error(f"Jarvis chat error: {e}")
        return JarvisResponse(response="I apologize, but I encountered an issue processing your request. Please try again.")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
