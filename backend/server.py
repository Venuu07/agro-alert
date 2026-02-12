from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load mock data
DATA_PATH = ROOT_DIR / 'data' / 'mandiData.json'
with open(DATA_PATH, 'r') as f:
    MOCK_DATA = json.load(f)

# Create the main app
app = FastAPI(title="Food System Early Warning API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
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
    image: str

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
    image: str
    priceHistory: List[PricePoint]
    arrivalsHistory: List[ArrivalsPoint]
    connectedMandis: List[str]

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

class SimulatedImpact(BaseModel):
    mandiId: str
    mandiName: str
    priceChange: float
    newStressScore: int
    previousStressScore: int

class SimulationResponse(BaseModel):
    originalMandi: str
    shockType: str
    intensity: int
    duration: int
    priceImpact: float
    predictedPrice: float
    originalPrice: float
    affectedMandis: List[SimulatedImpact]
    simulatedPriceHistory: List[PricePoint]

class RecommendationRequest(BaseModel):
    mandiId: str
    includeAiInsights: bool = True

class Recommendation(BaseModel):
    id: str
    action: str
    priority: str
    sourceMandi: Optional[str] = None
    destinationMandi: Optional[str] = None
    reasoning: str
    estimatedCost: str
    stabilityGain: str
    aiInsight: Optional[str] = None

class RecommendationResponse(BaseModel):
    mandiId: str
    mandiName: str
    currentStressScore: int
    recommendations: List[Recommendation]

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Food System Early Warning API", "version": "1.0.0"}

@api_router.get("/stress", response_model=StressResponse)
async def get_stress_data():
    """Get stress overview for all mandis"""
    mandis = MOCK_DATA["mandis"]
    
    summaries = []
    high_risk = 0
    watch = 0
    normal = 0
    
    for m in mandis:
        summaries.append(MandiSummary(
            id=m["id"],
            name=m["name"],
            location=m["location"],
            commodity=m["commodity"],
            currentPrice=m["currentPrice"],
            previousPrice=m["previousPrice"],
            arrivals=m["arrivals"],
            previousArrivals=m["previousArrivals"],
            stressScore=m["stressScore"],
            status=m["status"],
            volatility=m["volatility"],
            image=m["image"]
        ))
        
        if m["status"] == "high_risk":
            high_risk += 1
        elif m["status"] == "watch":
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
    """Get detailed information for a specific mandi"""
    for m in MOCK_DATA["mandis"]:
        if m["id"] == mandi_id:
            return MandiDetail(**m)
    
    raise HTTPException(status_code=404, detail="Mandi not found")

@api_router.get("/shock-types")
async def get_shock_types():
    """Get available shock types for simulation"""
    return {"shockTypes": MOCK_DATA["shockTypes"]}

@api_router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """Run a shock simulation - returns mock simulated data"""
    # Find the target mandi
    target_mandi = None
    for m in MOCK_DATA["mandis"]:
        if m["id"] == request.mandiId:
            target_mandi = m
            break
    
    if not target_mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")
    
    # Mock simulation logic - calculate price impact based on intensity
    intensity_factor = request.intensity / 100
    duration_factor = request.duration / 7
    
    # Different shock types have different impacts
    shock_multipliers = {
        "rain": 1.3,
        "demand_spike": 1.2,
        "supply_drop": 1.5,
        "transport": 1.25
    }
    
    multiplier = shock_multipliers.get(request.shockType, 1.2)
    price_impact_percent = intensity_factor * duration_factor * (multiplier - 1) * 100
    predicted_price = target_mandi["currentPrice"] * (1 + price_impact_percent / 100)
    
    # Generate simulated price history
    base_prices = [p["price"] for p in target_mandi["priceHistory"]]
    simulated_history = []
    for i, ph in enumerate(target_mandi["priceHistory"]):
        if i < len(base_prices) - 2:
            simulated_history.append(PricePoint(date=ph["date"], price=ph["price"]))
        else:
            shock_effect = (i - (len(base_prices) - 3)) / 3 * price_impact_percent / 100
            new_price = ph["price"] * (1 + shock_effect)
            simulated_history.append(PricePoint(date=ph["date"], price=round(new_price, 2)))
    
    # Calculate affected mandis (connected mandis with reduced impact)
    affected = []
    for connected_id in target_mandi.get("connectedMandis", []):
        for m in MOCK_DATA["mandis"]:
            if m["id"] == connected_id:
                ripple_impact = price_impact_percent * 0.6  # 60% ripple effect
                new_stress = min(100, int(m["stressScore"] + ripple_impact / 2))
                affected.append(SimulatedImpact(
                    mandiId=m["id"],
                    mandiName=m["name"],
                    priceChange=round(ripple_impact, 1),
                    newStressScore=new_stress,
                    previousStressScore=m["stressScore"]
                ))
    
    return SimulationResponse(
        originalMandi=target_mandi["name"],
        shockType=request.shockType,
        intensity=request.intensity,
        duration=request.duration,
        priceImpact=round(price_impact_percent, 1),
        predictedPrice=round(predicted_price, 2),
        originalPrice=target_mandi["currentPrice"],
        affectedMandis=affected,
        simulatedPriceHistory=simulated_history
    )

@api_router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get intervention recommendations for a mandi"""
    # Find the target mandi
    target_mandi = None
    for m in MOCK_DATA["mandis"]:
        if m["id"] == request.mandiId:
            target_mandi = m
            break
    
    if not target_mandi:
        raise HTTPException(status_code=404, detail="Mandi not found")
    
    # Generate mock recommendations based on stress level
    recommendations = []
    
    if target_mandi["stressScore"] >= 60:
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            action="Emergency Stock Release",
            priority="high",
            sourceMandi="Central Buffer Stock",
            destinationMandi=target_mandi["name"],
            reasoning="High stress score indicates supply shortage. Releasing buffer stock can stabilize prices within 3-5 days.",
            estimatedCost="₹2.5 Cr",
            stabilityGain="+25% stability",
            aiInsight=None
        ))
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            action="Price Monitoring Alert",
            priority="high",
            reasoning="Activate enhanced price monitoring to detect further anomalies early.",
            estimatedCost="₹0",
            stabilityGain="+10% early detection",
            aiInsight=None
        ))
    
    if target_mandi["stressScore"] >= 40:
        # Find a connected mandi with lower stress
        for connected_id in target_mandi.get("connectedMandis", []):
            for m in MOCK_DATA["mandis"]:
                if m["id"] == connected_id and m["stressScore"] < target_mandi["stressScore"]:
                    recommendations.append(Recommendation(
                        id=str(uuid.uuid4()),
                        action="Inter-Mandi Transfer",
                        priority="medium",
                        sourceMandi=m["name"],
                        destinationMandi=target_mandi["name"],
                        reasoning=f"Transfer surplus from {m['name']} (stress: {m['stressScore']}) to balance supply-demand.",
                        estimatedCost="₹45 Lakh",
                        stabilityGain="+15% stability",
                        aiInsight=None
                    ))
                    break
    
    recommendations.append(Recommendation(
        id=str(uuid.uuid4()),
        action="Demand Forecasting Update",
        priority="low",
        reasoning="Update demand forecasting models with latest market signals for improved predictions.",
        estimatedCost="₹5 Lakh",
        stabilityGain="+5% accuracy",
        aiInsight=None
    ))
    
    # Generate AI insights if requested
    if request.includeAiInsights:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            llm_key = os.environ.get('EMERGENT_LLM_KEY')
            if llm_key:
                chat = LlmChat(
                    api_key=llm_key,
                    session_id=f"mandi-{request.mandiId}-{uuid.uuid4()}",
                    system_message="You are an agricultural market analyst AI. Provide brief, actionable insights for mandi operators. Keep responses under 100 words, professional and data-driven."
                ).with_model("openai", "gpt-4o")
                
                context = f"""
                Mandi: {target_mandi['name']} ({target_mandi['location']})
                Commodity: {target_mandi['commodity']}
                Current Price: ₹{target_mandi['currentPrice']}/quintal
                Previous Price: ₹{target_mandi['previousPrice']}/quintal
                Stress Score: {target_mandi['stressScore']}/100
                Status: {target_mandi['status']}
                Volatility: {target_mandi['volatility']}%
                Current Arrivals: {target_mandi['arrivals']} quintals
                Previous Arrivals: {target_mandi['previousArrivals']} quintals
                """
                
                user_message = UserMessage(
                    text=f"Based on this mandi data, provide a brief strategic insight for the operator:\n{context}"
                )
                
                import asyncio
                insight = asyncio.get_event_loop().run_until_complete(chat.send_message(user_message))
                
                if recommendations:
                    recommendations[0].aiInsight = insight
        except Exception as e:
            logging.error(f"AI insight generation failed: {e}")
            # Continue without AI insights
    
    return RecommendationResponse(
        mandiId=target_mandi["id"],
        mandiName=target_mandi["name"],
        currentStressScore=target_mandi["stressScore"],
        recommendations=recommendations
    )

@api_router.get("/mandis")
async def get_all_mandis():
    """Get list of all mandis for dropdowns"""
    return {
        "mandis": [
            {"id": m["id"], "name": m["name"], "location": m["location"]}
            for m in MOCK_DATA["mandis"]
        ]
    }

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
