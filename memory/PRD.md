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

#### Landing Page / Hero Experience
- ✅ Glassmorphism header with logo and navigation
- ✅ Gradient grid animated background
- ✅ Hero section with headline: "Prevent Food Market Failures Before They Happen"
- ✅ CTA buttons: "Run Shock Propagation Engine", "Explore Decision Platform"
- ✅ Tilted dashboard preview with 3D perspective
- ✅ Key stats: 6 Markets, 0.4 Elasticity, 60% Ripple Factor
- ✅ Feature cards for three engines
- ✅ Technology section with network preview animation

#### Jarvis Decision Intelligence Assistant
- ✅ Floating FAB button to open assistant
- ✅ Glassmorphism panel design
- ✅ Welcome message with capabilities
- ✅ Suggested query chips
- ✅ Text input for custom queries
- ✅ Context-aware responses (integrates with current mandi, simulation results, stress data)
- ✅ Conversation history support
- ✅ Structured response format (Detected Signals, System Interpretation, Suggested Action)

#### Network Graph Visualization
- ✅ Circular layout of mandi nodes
- ✅ Color-coded by stress level (red/orange/green)
- ✅ Connection lines between linked mandis
- ✅ Legend showing status colors
- ✅ Hover interaction showing mandi details
- ✅ Shock origin indicator for simulations
- ✅ Ripple animation for affected nodes

#### Global Visual Refinements
- ✅ Modern font system (Inter + JetBrains Mono)
- ✅ Consistent rounded corners (12-16px)
- ✅ Soft shadows with depth layering
- ✅ Smooth hover transitions
- ✅ Card elevation animations
- ✅ Premium dark theme throughout

---

## Architecture

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Lucide React
- **Backend**: FastAPI (Python)
- **Data**: Static JSON file (mock data)
- **AI**: Emergent LLM (GPT-4o) via emergentintegrations library

### File Structure
```
/app/
├── backend/
│   ├── data/
│   │   └── mandiData.json          # Mock data for 6 mandis
│   ├── server.py                   # API endpoints + engines
│   └── .env                        # EMERGENT_LLM_KEY
└── frontend/
    └── src/
        ├── components/
        │   ├── LandingPage.jsx      # Hero experience
        │   ├── JarvisAssistant.jsx  # AI assistant
        │   ├── NetworkGraph.jsx     # Network visualization
        │   ├── Navbar.jsx
        │   ├── MandiCard.jsx
        │   ├── SystemOverview.jsx
        │   ├── SummaryStats.jsx
        │   ├── StressGauge.jsx
        │   ├── DiagnosticsPanel.jsx
        │   ├── SimulationPanel.jsx
        │   ├── SimulationResults.jsx
        │   ├── RecommendationPanel.jsx
        │   ├── LinkedMandis.jsx
        │   ├── PriceChart.jsx
        │   ├── ArrivalsChart.jsx
        │   └── StatusBadge.jsx
        ├── App.js                   # Main routing
        └── index.css                # Global styles
```

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stress` | GET | Get stress overview for all mandis |
| `/api/mandi/{id}` | GET | Get detailed info for specific mandi |
| `/api/mandis` | GET | Get list of all mandis for dropdowns |
| `/api/shock-types` | GET | Get available shock types |
| `/api/simulate` | POST | Run shock simulation |
| `/api/recommend` | POST | Get intervention recommendations |
| `/api/jarvis/chat` | POST | Jarvis AI assistant chat |

---

## Prioritized Backlog

### P0 (Critical - Next) 
*None - All core features complete*

### P1 (High Priority)
1. **Database Integration**
   - Replace static JSON with MongoDB
   - CRUD operations for mandis
   - Historical data storage

2. **User Authentication**
   - JWT-based auth system
   - Role-based access control

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
- Backend: 27/27 tests passing (100%)
- Frontend: All components verified working
- Test reports: `/app/test_reports/iteration_3.json`

## Data Model (mandiData.json)
```javascript
{
  "mandis": [{
    "id": "mandi-001",
    "name": "Azadpur Mandi",
    "location": "Delhi",
    "commodity": "Tomato",
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
    "connectedMandis": ["mandi-002", "mandi-003"]
  }],
  "shockTypes": [...]
}
```

## Stress Calculation Formula
```
Stress Score = Price Stress + Supply Stress + Instability Stress + External Stress

Price Stress:
- price_change > 8%: +35 points
- price_change > 4%: +20 points

Supply Stress:
- arrival_change < -10%: +30 points
- arrival_change < -5%: +15 points

Instability Stress:
- volatility > 10%: +20 points

External Stress:
- rainFlag: +10 points
- festivalFlag: +10 points

Status Classification:
- stress > 65: HIGH_RISK
- stress > 35: WATCH
- stress <= 35: NORMAL
```

## Shock Propagation Formula
```
price_new = price_old × (Demand/Supply)^elasticity

Where elasticity = 0.4

Ripple Effect:
- Level 1 neighbors: 60% of impact
- Level 2 neighbors: 30% of impact
```

---

*Last Updated: December 2025*
