# AGRO INTEL - Decision Intelligence Platform - PRD

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
- Market Stress Index as dominant visual element
- Shock Propagation capability
- Stabilization Strategy recommendations

---

## What's Been Implemented

### Phase 1: UI/UX Foundation (Completed)
- Modern dark theme dashboard with 6 mandi cards
- Price and arrivals charts using Recharts
- Stress gauges and status badges
- Shock simulation interface with intensity/duration sliders
- Responsive design with smooth animations

### Phase 2: Backend Logic Engines (Completed)

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
- **Purpose**: Generate human-readable AI Intelligence Analysis

### Phase 3: UI/UX Refinement (Completed Dec 2025)

#### Terminology & Branding Updates
- "Stress Score" → **Market Stress Index (MSI)**
- "Simulator" → **Shock Propagation Engine**
- "Recommendations" → **Stabilization Strategy Engine**
- "Alerts" → **System Risk Monitor**
- App name: "AGRO ALERT" → **AGRO INTEL - Decision Intelligence Platform**

#### New Components
1. **System Stability Overview Panel** - Premium header metrics
   - System Stability Score (%)
   - Volatility Dampening (%)
   - Supply Stress Level (Critical/Moderate/Low)
   - Avg Market Stress Index

2. **Enhanced Risk Monitor** - Operational Intelligence Center
   - Critical Risk section with pulsing indicators
   - Elevated Watch section
   - Individual stress gauges per alert
   - Real-time threat assessment header

3. **Restructured Recommendation Panel**
   - Detected Signals cards
   - System Interpretation section
   - Expected Impact (Cost vs Stability Gain)
   - Tradeoff Visualization Bar (Cost ←→ Stability)
   - AI Intelligence Analysis section

#### Premium Styling
- `.system-overview-panel` - Gradient backgrounds with subtle glow
- `.metric-card-premium` - Hover animations with shimmer effect
- `.intelligence-panel` - Decision-science styling
- `.risk-card` - Left-border severity indicators
- `.tradeoff-bar` - Gradient slider visualization
- `.critical-indicator` - Pulsing animation for high-risk items
- `.score-glow-animation` - Glow effect for critical scores

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
- `aiInsight`: LLM-generated AI Intelligence Analysis

---

## Key Technical Constraints
- ❌ NO randomness in calculations
- ❌ NO ML models
- ❌ NO probabilistic outputs
- ❌ NO LLM decision-making
- ✅ Deterministic logic ONLY

---

## P0/P1/P2 Features Remaining

### P0 (Critical) - ALL DONE ✅
- [x] Dashboard with stress scores
- [x] Mandi detail view with charts
- [x] Shock simulation panel
- [x] Intervention recommendations
- [x] Stress Score Engine
- [x] Shock Simulation Engine
- [x] Recommendation Engine
- [x] LLM Integration for explanations
- [x] UI/UX Refinement & Polish

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
│   ├── server.py (Stress Engine, Simulation Engine, Recommendation Engine, LLM Integration)
│   └── .env (EMERGENT_LLM_KEY)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SystemOverview.jsx (NEW - System stability metrics)
    │   │   ├── DiagnosticsPanel.jsx (stress breakdown, external flags)
    │   │   ├── SimulationResults.jsx (elasticity model, ripple effects)
    │   │   ├── RecommendationPanel.jsx (AI insights, tradeoff viz)
    │   │   ├── MandiCard.jsx (rain/festival icons, MSI label)
    │   │   ├── StressGauge.jsx (enhanced with glow animation)
    │   │   └── Navbar.jsx (new branding, nav tabs)
    │   ├── App.js (routing, AlertsView as Risk Monitor)
    │   ├── App.css
    │   └── index.css (premium animations)
    └── .env
```

---

## Testing Status
- **Backend**: 100% (24/24 tests passed)
- **Frontend**: 100%
- **Test Report**: `/app/test_reports/iteration_2.json`

---

## Design Philosophy
**Target Feel**: Funded SaaS startup, Decision Intelligence Platform, NOT student hackathon UI

**Design Tone**:
- Minimal
- Premium
- Confident
- Analytical
- High-signal
