# Food System Early Warning & Shock Simulator - PRD

## Original Problem Statement
Build a modern, visually impressive, production-quality full stack web application called: "Food System Early Warning & Shock Simulator". This is an AI-powered decision support dashboard for agricultural market operators.

## Product Overview
An Enterprise-Grade AI Decision Intelligence Platform that helps mandi operators:
- Detect systemic stress signals in agricultural markets
- Understand supply-demand instability 
- Simulate disruptions and view ripple effects
- Receive operational recommendations for market stabilization

## Design Philosophy
- **Tone**: Minimal, Confident, Analytical, Premium
- **Style**: Dark premium theme, Glassmorphism, Gradient grid background, Futuristic glow, Clean modern typography
- **Avoid**: Flashy gimmicks, Overloaded UI, Visual clutter

---

## What's Been Implemented

### Phase 1: Core Backend Logic (Completed - Dec 2025)
- ✅ **Stress Score Engine**: Deterministic calculation based on price change, supply change, volatility, external factors
- ✅ **Shock Simulation Engine**: Elasticity-based price propagation (0.4 elasticity factor)
- ✅ **Intervention Recommendation Engine**: Rule-based strategy generation
- ✅ **LLM Integration**: AI-generated explanations for recommendations (using Emergent LLM Key)

### Phase 2: Frontend Dashboard (Completed - Dec 2025)
- ✅ System Stability Overview panel
- ✅ Summary statistics (Total Mandis, High Risk, Watch, Stable)
- ✅ Mandi cards grid with stress gauges
- ✅ Price and Arrivals history charts
- ✅ Diagnostics panel with stress breakdown
- ✅ Linked Markets section
- ✅ Stabilization Strategy recommendations

### Phase 3: Enterprise UI/UX Transformation (Completed - Dec 2025)
- ✅ Landing Page with glassmorphism header, gradient grid background
- ✅ Hero section with 3D tilted dashboard preview
- ✅ Jarvis Decision Intelligence Assistant
- ✅ Network Graph Visualization
- ✅ Global visual refinements (Inter font, 12-16px rounded corners, soft shadows)

### Phase 4: Intelligence Extensions (Completed - Dec 2025)

#### Feature 1: Shock Description Input
- ✅ Optional text area in Simulation Panel for additional context
- ✅ **Deterministic keyword mapping**:
  - `strike/protest/blockade` → Logistics Stress ↑
  - `traffic/delay` → Arrival Friction ↑
  - `festival/surge` → Demand Pressure ↑
  - `flood/rain/hail` → Supply Stress ↑
- ✅ Color-coded detected signals displayed in UI
- ✅ Context passed to Jarvis for enhanced explanations

#### Feature 2: Multi-Commodity Support
- ✅ Each mandi now supports multiple commodities
- ✅ Each commodity has: price, arrivals, volatility, stress index
- ✅ **Commodity Intelligence Panel** on mandi detail page
- ✅ Dashboard shows PRIMARY commodity only (UI stability preserved)
- ✅ API: `GET /api/mandi/{id}/commodities`

#### Feature 3: Surplus/Deficit Intelligence Engine
- ✅ Deterministic logic: `Surplus = Supply - BaseDemand`
- ✅ **Stabilization Signals**:
  - Deficit + High Stress → `PULL_STOCK_URGENT`
  - Surplus + Falling Prices → `PUSH_STOCK_RECOMMENDED`
  - Balanced → `MONITOR_STABILITY`
- ✅ **Supply-Demand Intelligence Panel** on mandi detail page
- ✅ API: `GET /api/surplus-deficit/{mandi_id}`

#### Feature 4: Transfer Recommendations
- ✅ Suggests commodity transfers between surplus→deficit mandis
- ✅ **Displays**: Source, Destination, Commodity, Quantity, Transport Cost, Price Arbitrage, Stability Impact
- ✅ **Transfer Intelligence Panel** on Shock Engine page
- ✅ Deterministic calculations only (no ML)
- ✅ API: `GET /api/transfer-recommendations`

#### Feature 5: Enhanced Ripple Effect Visualizer
- ✅ Network Propagation section in simulation results
- ✅ Level 1: 60% impact on direct neighbors
- ✅ Level 2: 30% impact on secondary neighbors
- ✅ Animated ripple effects in Network Graph
- ✅ SHOCK ORIGIN indicator for simulation target

#### Jarvis AI Upgrades
- ✅ Welcome message mentions Surplus/Deficit and Transfer features
- ✅ New suggested queries: "Explain surplus/deficit status", "Best transfer strategy?"
- ✅ Enhanced context interpretation for shock descriptions
- ✅ Response format includes "Expected System Impact" section

### Phase 5: Network Graph & Forecast System (Completed - Dec 2025)

#### Feature 1: Backend Graph Service Module (`/app/backend/graph_service.py`)
- ✅ `circular_layout(names, cx, cy, radius)`: Deterministic circular positioning for nodes
- ✅ `propagate_shock(origin_mandi, base_impacts, conn, decay_level1, decay_level2)`: Shock propagation via network edges
- ✅ `ema(series, alpha)`: Exponential Moving Average for price forecasting
- ✅ `apply_agent_behaviour(supply, demand, price_change_pct)`: Deterministic agent behavior rules
- ✅ `build_graph_payload(origin_mandi, shock_result)`: Constructs complete graph payload for visualization

#### Feature 2: New API Endpoints
- ✅ **GET /api/graph**: Returns nodes with x,y coordinates and edges for SVG rendering
- ✅ **GET /api/graph?origin=mandi-id**: Returns nodes with shock propagation impacts
- ✅ **GET /api/forecast**: Returns EMA-based price predictions (7-30 day horizon)
- ✅ **POST /api/simulate-with-graph**: Returns combined simulation + graph payload

#### Feature 3: NetworkGraph.jsx SVG Visualizer
- ✅ Backend-provided coordinates (NO force layout)
- ✅ Circular node arrangement using viewBox "0 0 1000 640"
- ✅ Color scale: green (≤0.33), amber (0.33-0.66), red (>0.66)
- ✅ Node radius scaled by impact: r = 16 + impact * 12
- ✅ MSI score displayed inside each node
- ✅ Pulse radial overlay for nodes with impact > 0.15
- ✅ Animated ripple effect for shock origin
- ✅ Hover info panel showing mandi details
- ✅ Reload Graph button for data refresh
- ✅ Legend with HIGH/MEDIUM/LOW indicators

#### Feature 4: Connectivity Data (`/app/backend/data/connectivity.json`)
- ✅ 7 connections between 6 mandis
- ✅ Edge properties: from, to, edge_strength, cost_per_qt, travel_time

### Phase 6: Market State Persistence & Live Updates (Completed - Dec 2025)

**CRITICAL DESIGN PRINCIPLE**: All updates = APPEND NEW ROWS (never overwrite historical data)

#### Feature 1: Operator Market Input (`POST /api/market-update`)
- ✅ Operator inputs ONLY arrivals (mandatory, numeric > 0)
- ✅ Optional contextual notes text
- ✅ **Price is SYSTEM-COMPUTED** using existing elasticity formula: `price_new = price_old × (Demand/Supply)^0.4`
- ✅ **MSI is SYSTEM-COMPUTED** using existing Stress Engine
- ✅ New row appended to state history (append-only audit trail)
- ✅ Validation: arrivals must be numeric > 0

#### Feature 2: Transfer Execution (`POST /api/execute-transfer`)
- ✅ Validates: quantity <= source supply
- ✅ Validates: source != destination
- ✅ Deducts quantity from SOURCE mandi
- ✅ Adds quantity to DESTINATION mandi
- ✅ Recomputes prices for BOTH mandis using EXISTING elasticity model
- ✅ Appends NEW ROWS for both mandis to state history

#### Feature 3: Live State API (`GET /api/live-state`)
- ✅ Returns current market state for all mandis
- ✅ Includes updated prices, arrivals, stressScore, status
- ✅ Reflects recent market updates and transfers

#### Feature 4: State History API (`GET /api/state-history`)
- ✅ Append-only audit log of all changes
- ✅ Entries include timestamp, type (market_update/transfer_execution)
- ✅ Before/after values for price and arrivals

#### Feature 5: MarketUpdatePanel Component (`/app/frontend/src/components/MarketUpdatePanel.jsx`)
- ✅ Renders on Mandi Detail page
- ✅ Arrivals input field (numeric, required)
- ✅ Optional notes textarea
- ✅ Info note: "Price and MSI will be automatically computed"
- ✅ Displays update result with price/arrivals change percentages
- ✅ Success toast notification

#### Feature 6: Transfer Execution UI
- ✅ "Invoke Transfer" button on Transfer Intelligence panel
- ✅ Executes transfer via POST /api/execute-transfer
- ✅ Shows success toast with price impact
- ✅ Dashboard auto-refreshes after transfer

### Phase 7: Feature Tiering / Business Model Layer (Completed - Dec 2025)

**CRITICAL CONSTRAINTS**: No authentication, no payment systems, only feature gating & tier simulation.

#### Tier Structure

**🟢 FREE TIER** - Accessible Features:
- ✅ Dashboard Overview
- ✅ Market Stress Index
- ✅ Basic Shock Simulation
- ✅ Ripple Visualizer / Network Graph
- ✅ Mandi Details
- ✅ Basic Jarvis Explanations
- ✅ Price History (7 days)

**🔵 PREMIUM TIER** - Locked Features (gated for free users):
- ❌ Surplus/Deficit Intelligence
- ❌ Transfer Intelligence
- ❌ Price Forecast Engine
- ❌ Advanced Analytics
- ❌ Market Update Panel
- ❌ Multi-Commodity Analysis
- ❌ Full Historical Data

#### Implementation

**TierContext** (`/app/frontend/src/context/TierContext.jsx`):
- ✅ Global tier state: `USER_TIER = "free" | "premium"`
- ✅ `hasAccess(feature)` function for tier checking
- ✅ `promptUpgrade(feature)` to show upgrade modal
- ✅ `toggleTier()` for demo tier switching

**LockedFeature Component** (`/app/frontend/src/components/LockedFeature.jsx`):
- ✅ Blurred content preview with lock overlay
- ✅ Lock icon with feature name
- ✅ "PREMIUM INTELLIGENCE" badge
- ✅ "Unlock Feature" CTA button
- ✅ Click-to-upgrade interaction

**UpgradeModal Component** (`/app/frontend/src/components/UpgradeModal.jsx`):
- ✅ Premium benefits grid (6 features)
- ✅ $49/month pricing display (simulated)
- ✅ Feature checklist
- ✅ "Upgrade to Premium" CTA
- ✅ Highlighted feature that triggered modal

**TierToggle Component** (`/app/frontend/src/components/TierToggle.jsx`):
- ✅ Navbar tier indicator (FREE/PREMIUM)
- ✅ Toggle switch for demo tier switching
- ✅ Crown icon for premium, User icon for free

---

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Lucide React
- **Backend**: FastAPI (Python)
- **Data**: Static JSON file with in-memory live state persistence
- **AI**: Emergent LLM (GPT-4o) via emergentintegrations library

### File Structure
```
/app/
├── backend/
│   ├── data/
│   │   ├── mandiData.json          # 6 mandis with multi-commodity data
│   │   └── connectivity.json       # Network connections for graph
│   ├── tests/
│   │   ├── test_new_features.py    # Tests for intelligence features
│   │   ├── test_graph_forecast_endpoints.py  # Graph & forecast tests
│   │   └── test_market_state_features.py     # Market state tests
│   ├── graph_service.py            # Graph computation module
│   ├── market_state.py             # Market state persistence
│   ├── server.py                   # API endpoints + all engines
│   └── .env                        # EMERGENT_LLM_KEY
└── frontend/
    └── src/
        ├── context/
        │   └── TierContext.jsx         # NEW: Feature tier state management
        ├── components/
        │   ├── LandingPage.jsx
        │   ├── JarvisAssistant.jsx
        │   ├── NetworkGraph.jsx         # Full SVG visualizer
        │   ├── CommodityPanel.jsx       # Multi-commodity display
        │   ├── SurplusDeficitPanel.jsx  # Supply-demand intel
        │   ├── TransferRecommendations.jsx # Invoke Transfer button
        │   ├── MarketUpdatePanel.jsx    # Operator input panel
        │   ├── SimulationPanel.jsx      # Shock description input
        │   ├── Navbar.jsx               # UPDATED: TierToggle integration
        │   ├── LockedFeature.jsx        # NEW: Feature lock overlay
        │   ├── UpgradeModal.jsx         # NEW: Premium upgrade modal
        │   ├── TierToggle.jsx           # NEW: Tier switch control
        │   ├── MandiCard.jsx
        │   ├── SystemOverview.jsx
        │   ├── SummaryStats.jsx
        │   ├── StressGauge.jsx
        │   ├── DiagnosticsPanel.jsx
        │   ├── SimulationResults.jsx
        │   ├── RecommendationPanel.jsx
        │   ├── LinkedMandis.jsx
        │   ├── PriceChart.jsx
        │   ├── ArrivalsChart.jsx
        │   └── StatusBadge.jsx
        ├── App.js                   # Main routing + TierProvider
        └── index.css                # Global styles + animations
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stress` | GET | Get stress overview for all mandis |
| `/api/mandi/{id}` | GET | Get detailed info for specific mandi |
| `/api/mandi/{id}/commodities` | GET | Get multi-commodity data with stress |
| `/api/mandis` | GET | Get list of all mandis for dropdowns |
| `/api/shock-types` | GET | Get available shock types |
| `/api/simulate` | POST | Run shock simulation |
| `/api/recommend` | POST | Get intervention recommendations |
| `/api/interpret-context` | POST | Interpret shock description keywords |
| `/api/surplus-deficit/{id}` | GET | Get surplus/deficit analysis |
| `/api/surplus-deficit` | GET | Get all mandis surplus/deficit |
| `/api/transfer-recommendations` | GET | Get transfer recommendations |
| `/api/jarvis/chat` | POST | Jarvis AI assistant chat |
| `/api/graph` | GET | Get network graph nodes & edges |
| `/api/graph?origin=<id>` | GET | Graph with shock propagation impacts |
| `/api/forecast` | GET | EMA-based price forecast |
| `/api/simulate-with-graph` | POST | Simulation with graph payload |
| `/api/market-update` | POST | **NEW**: Operator market input (arrivals) |
| `/api/execute-transfer` | POST | **NEW**: Execute commodity transfer |
| `/api/live-state` | GET | **NEW**: Current market state |
| `/api/state-history` | GET | **NEW**: Append-only audit log |

---

## Bug Fixes

### Transfer Execution State Inconsistency (Fixed - Dec 2025)
**Problem**: After executing a transfer, surplus supply was NOT reduced, deficit supply was NOT increased, and dashboard reflected stale values.

**Root Cause**: Multiple API endpoints were reading from `BASE_DATA["mandis"]` (static data loaded at server startup) instead of `get_current_state()["mandis"]` (the live market state that gets updated after transfers).

**Affected Endpoints (Fixed)**:
- `/api/transfer-recommendations` - Now reads from live state
- `/api/surplus-deficit/{mandi_id}` - Now reads from live state
- `/api/surplus-deficit` - Now reads from live state
- `/api/simulate` - Now reads from live state
- `/api/recommend` - Now reads from live state
- `/api/mandis` - Now reads from live state
- `/api/mandi/{mandi_id}/commodities` - Now reads from live state
- `/api/forecast` - Now reads from live state
- `/api/simulate-with-graph` - Now reads from live state

**Verification**: After fix, transfers correctly:
- ✅ Reduce source supply
- ✅ Increase destination supply
- ✅ Recompute prices using elasticity formula
- ✅ Update dashboard values in real-time
- ✅ Update surplus/deficit intelligence
- ✅ Update transfer recommendations

---

## Prioritized Backlog

### P0 (Critical - Next) 
*None - All requested features implemented*

### P1 (High Priority)
1. **Database Integration**
   - Replace in-memory state with MongoDB
   - Persist state history to database
   - Historical data storage

2. **User Authentication**
   - JWT-based auth system
   - Role-based access control (Operator vs Admin)

### P2 (Medium Priority)
1. **Enhanced Network Graph**
   - Force-directed layout option
   - Zoom and pan capabilities
   - Click to navigate to mandi detail

2. **Real-time Data Updates**
   - WebSocket integration
   - Live price feeds
   - Automatic stress recalculation

3. **Export & Reporting**
   - PDF report generation
   - CSV data export
   - Scheduled alerts

### P3 (Lower Priority)
1. Mobile responsive optimization
2. Dark/Light theme toggle
3. Multi-language support
4. Historical simulation comparison

---

## Testing Status
- Backend: 31/31 tests passing (100%)
- Frontend: All features verified working
- Test reports: `/app/test_reports/iteration_6.json`
- Bug Fix Verified: Transfer execution state consistency confirmed working

## Data Model (mandiData.json)
```javascript
{
  "mandis": [{
    "id": "mandi-001",
    "name": "Azadpur Mandi",
    "location": "Delhi",
    "commodity": "Tomato",          // Primary commodity
    "currentPrice": 4250,
    "previousPrice": 3980,
    "arrivals": 2450,
    "previousArrivals": 2680,
    "rainFlag": true,
    "festivalFlag": false,
    "baseSupply": 2800,
    "baseDemand": 3000,
    "priceHistory": [...],
    "arrivalsHistory": [...],
    "connectedMandis": ["mandi-002", "mandi-003"],
    "commodities": [                 // Multi-commodity support
      {
        "name": "Tomato",
        "isPrimary": true,
        "currentPrice": 4250,
        "previousPrice": 3980,
        "arrivals": 2450,
        "previousArrivals": 2680,
        "baseDemand": 3000,
        "baseSupply": 2800,
        "volatility": 12.5
      },
      { "name": "Potato", ... },
      { "name": "Onion", ... }
    ]
  }],
  "shockTypes": [...],
  "transportCostPerKm": 2.5,
  "baseTransportDistance": {...}     // For transfer cost calculation
}
```

## Key Formulas (All Deterministic)

### Stress Score
```
Stress = Price Stress + Supply Stress + Instability Stress + External Stress

Status: >65 = HIGH_RISK, >35 = WATCH, <=35 = NORMAL
```

### Shock Propagation
```
price_new = price_old × (Demand/Supply)^elasticity
elasticity = 0.4

Ripple: L1 neighbors = 60%, L2 neighbors = 30%
```

### Surplus/Deficit
```
Balance = Supply (arrivals) - BaseDemand
BalancePct = Balance / BaseDemand × 100

Status: >10% = Surplus, <-10% = Deficit, else = Balanced
```

### Transfer Cost
```
Cost = Distance × CostPerKm × (Quantity / 100)
CostPerKm = 2.5
```

---

*Last Updated: December 2025*
