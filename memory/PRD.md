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

## What's Been Implemented (Jan 2026)

### Backend API
- GET /api/stress - Returns all mandi stress data with summary stats
- GET /api/mandi/{id} - Detailed mandi information with history
- GET /api/mandis - List of mandis for dropdowns
- GET /api/shock-types - Available shock scenarios
- POST /api/simulate - Run shock simulation with ripple effect
- POST /api/recommend - Get intervention recommendations (with AI insights via Emergent LLM)

### Frontend Pages
1. **Dashboard** - 6 mandi cards with stress gauges, summary stats
2. **Mandi Detail** - Price/arrivals charts, diagnostics panel, recommendations
3. **Simulate** - Shock type selector, intensity/duration sliders, before/after charts
4. **Alerts** - High risk and watch mandis listing

### Design System
- Barlow Condensed (headings), Manrope (body), JetBrains Mono (data)
- Color-coded stress indicators (green/orange/red)
- Grid border card style with hover effects
- Recharts for all visualizations

## P0/P1/P2 Features Remaining

### P0 (Critical) - DONE ✅
- [x] Dashboard with stress scores
- [x] Mandi detail view with charts
- [x] Shock simulation panel
- [x] Intervention recommendations

### P1 (Important)
- [ ] Real-time data integration (WebSocket/SSE)
- [ ] User authentication for operators
- [ ] Historical simulation comparisons
- [ ] Export simulation reports (PDF/CSV)

### P2 (Nice to Have)
- [ ] Force-directed network graph for ripple effect
- [ ] Multiple mandi comparison view
- [ ] Custom alert thresholds
- [ ] Mobile responsive optimization

## Next Tasks
1. Add real data source integration (replace mock data)
2. Implement actual stress calculation logic
3. Add simulation math/business rules
4. User authentication for mandi operators
5. Historical data storage and trends
