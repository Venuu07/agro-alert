# Food System Early Warning & Shock Simulator - PRD

## Original Problem Statement
Build a modern, visually impressive, production-quality full stack web application for mandi/agricultural market operators to monitor price stability, detect stress signals, simulate disruptions, and receive intervention recommendations.

## User Personas
1. **Mandi Operators** - Monitor daily market conditions, stress scores, price volatility
2. **Government Officials** - Track regional market stability, intervention planning
3. **Policy Makers** - Simulate disruption scenarios, understand ripple effects

## Core Requirements (Static)
- Decision intelligence dashboard (NOT CRUD app)
- Modern fintech-style UI (Stripe/Vercel inspiration)
- Dark theme with green accent
- Stress score as dominant visual element
- Shock simulation capability
- Intervention recommendations

---

## What's Been Implemented

### Phase 1: UI/UX Foundation (Completed Jan 2026)
- Modern dark theme dashboard with 6 mandi cards
- Price and arrivals charts using Recharts
- Stress gauges and status badges
- Shock simulation interface with intensity/duration sliders
- Responsive design with smooth animations

### Phase 2: Backend Logic Engines (Completed Dec 2025)

#### 1. Stress Score Engine ✅
Deterministic calculation using exact rules:
- **Price Stress**: price_change > 8% = +35, > 4% = +20
- **Supply Stress**: arrival_change < -10% = +30, < -5% = +15
- **Instability Stress**: volatility > threshold = +20
- **External Stress**: rain_flag = +10, festival_flag = +10
- **Classification**: > 65 = High Risk, > 35 = Watch, else Normal
- **Clamped**: 0-100 range

#### 2. Shock Simulation Engine ✅
Elasticity-based mathematical propagation:
- **Formula**: `price_new = price_old × (Demand/Supply)^elasticity`
- **Elasticity constant**: 0.4
- **Supply shocks** (rain, supply_drop, transport): Reduce supply → arrivals ↓ → price ↑
- **Demand shocks** (demand_spike, festival): Increase demand → price ↑
- **Ripple Effects**: Level 1 = 60% impact, Level 2 = 30% impact

#### 3. Intervention Recommendation Engine ✅
Rule-based recommendations:
1. **High Risk + Supply Stress** → Pull Stock from Surplus Neighbor
2. **Surplus + Falling Prices** → Push Stock to High Demand Nodes / Recommend Storage
3. **Festival + Normal Supply** → Pre-buffer Creation
4. **Price Rise Without Supply Stress** → Speculation Alert / Monitor

#### 4. LLM Integration ✅
- **Provider**: Emergent LLM Key (OpenAI GPT-4o)
- **Usage**: Explanation text only (NOT decision-making)
- **Purpose**: Generate human-readable insights for recommendations

---

## API Endpoints

### Core APIs
- `GET /api/stress` - Returns all mandis with computed stress scores and breakdown
- `GET /api/mandi/{id}` - Detailed mandi info with stress breakdown
- `GET /api/mandis` - List of mandis for dropdowns
- `GET /api/shock-types` - Available shock scenarios
- `POST /api/simulate` - Run shock simulation with elasticity-based pricing
- `POST /api/recommend` - Get rule-based recommendations with AI explanations

### Response Schema Highlights
- `stressBreakdown`: { priceStress, supplyStress, instabilityStress, externalStress }
- `simulationParameters`: { elasticity, supplyBefore, supplyAfter, demandBefore, demandAfter }
- `rippleLevel`: 1 (60%) or 2 (30%)
- `aiInsight`: LLM-generated explanation text

---

## Key Technical Constraints
- ❌ NO randomness in calculations
- ❌ NO ML models
- ❌ NO probabilistic outputs
- ❌ NO LLM decision-making
- ✅ Deterministic logic ONLY

---

## P0/P1/P2 Features Remaining

### P0 (Critical) - DONE ✅
- [x] Dashboard with stress scores
- [x] Mandi detail view with charts
- [x] Shock simulation panel
- [x] Intervention recommendations
- [x] **Stress Score Engine**
- [x] **Shock Simulation Engine**
- [x] **Recommendation Engine**
- [x] **LLM Integration for explanations**

### P1 (Important) - NOT STARTED
- [ ] Real-time data integration (WebSocket/SSE)
- [ ] User authentication for operators
- [ ] Historical simulation comparisons
- [ ] Export simulation reports (PDF/CSV)
- [ ] Database integration (replace static JSON with MongoDB)

### P2 (Nice to Have)
- [ ] Force-directed network graph for ripple effect
- [ ] Multiple mandi comparison view
- [ ] Custom alert thresholds
- [ ] Mobile responsive optimization

---

## Architecture

```
/app/
├── backend/
│   ├── data/
│   │   └── mandiData.json (6 mandis with rainFlag, festivalFlag, baseSupply, baseDemand)
│   ├── tests/
│   │   └── test_food_system_api.py
│   ├── server.py (Stress Engine, Simulation Engine, Recommendation Engine, LLM Integration)
│   └── .env (EMERGENT_LLM_KEY)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DiagnosticsPanel.jsx (stress breakdown, external flags)
    │   │   ├── SimulationResults.jsx (elasticity model, ripple effects)
    │   │   ├── RecommendationPanel.jsx (AI insights)
    │   │   └── MandiCard.jsx (rain/festival icons)
    │   └── App.js (routing)
    └── .env
```

---

## Testing Status
- **Backend**: 100% (24/24 tests passed)
- **Frontend**: 100%
- **Test Report**: `/app/test_reports/iteration_2.json`
