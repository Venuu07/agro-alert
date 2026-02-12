"""
Food System Early Warning & Shock Simulator API Tests
Tests for: Stress Score Engine, Shock Simulation Engine, Intervention Recommendation Engine
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and endpoint tests"""
    
    def test_health_check(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
        assert "engines" in data
        assert "stress" in data["engines"]
        assert "simulation" in data["engines"]
        assert "recommendation" in data["engines"]


class TestStressScoreEngine:
    """Tests for GET /api/stress - Stress Score Engine with deterministic calculation"""
    
    def test_stress_endpoint_returns_data(self):
        """Test stress endpoint returns computed stress scores"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "mandis" in data
        assert "totalMandis" in data
        assert "highRiskCount" in data
        assert "watchCount" in data
        assert "normalCount" in data
        
        # Verify counts add up
        assert data["totalMandis"] == len(data["mandis"])
        assert data["highRiskCount"] + data["watchCount"] + data["normalCount"] == data["totalMandis"]
    
    def test_stress_mandi_has_computed_fields(self):
        """Test each mandi has computed stress fields"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            # Required computed fields
            assert "stressScore" in mandi
            assert "status" in mandi
            assert "volatility" in mandi
            assert "priceChangePct" in mandi
            assert "arrivalChangePct" in mandi
            
            # Verify stress score is within bounds
            assert 0 <= mandi["stressScore"] <= 100
            
            # Verify status is valid
            assert mandi["status"] in ["high_risk", "watch", "normal"]
            
            # Verify external flags
            assert "rainFlag" in mandi
            assert "festivalFlag" in mandi
    
    def test_stress_score_classification(self):
        """Test stress score classification rules: >65 = high_risk, >35 = watch, else normal"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            score = mandi["stressScore"]
            status = mandi["status"]
            
            if score > 65:
                assert status == "high_risk", f"Score {score} should be high_risk, got {status}"
            elif score > 35:
                assert status == "watch", f"Score {score} should be watch, got {status}"
            else:
                assert status == "normal", f"Score {score} should be normal, got {status}"


class TestMandiDetailEndpoint:
    """Tests for GET /api/mandi/{id} - Mandi detail with stress breakdown"""
    
    def test_mandi_detail_returns_stress_breakdown(self):
        """Test mandi detail includes stress breakdown components"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stress breakdown exists
        assert "stressBreakdown" in data
        breakdown = data["stressBreakdown"]
        
        # Verify all breakdown components
        assert "priceStress" in breakdown
        assert "supplyStress" in breakdown
        assert "instabilityStress" in breakdown
        assert "externalStress" in breakdown
        
        # Verify breakdown values are non-negative
        assert breakdown["priceStress"] >= 0
        assert breakdown["supplyStress"] >= 0
        assert breakdown["instabilityStress"] >= 0
        assert breakdown["externalStress"] >= 0
    
    def test_mandi_detail_has_external_flags(self):
        """Test mandi detail includes rainFlag and festivalFlag"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        assert "rainFlag" in data
        assert "festivalFlag" in data
        assert isinstance(data["rainFlag"], bool)
        assert isinstance(data["festivalFlag"], bool)
    
    def test_mandi_detail_has_history(self):
        """Test mandi detail includes price and arrivals history"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        assert "priceHistory" in data
        assert "arrivalsHistory" in data
        assert len(data["priceHistory"]) > 0
        assert len(data["arrivalsHistory"]) > 0
        
        # Verify history structure
        for ph in data["priceHistory"]:
            assert "date" in ph
            assert "price" in ph
    
    def test_mandi_not_found(self):
        """Test 404 for non-existent mandi"""
        response = requests.get(f"{BASE_URL}/api/mandi/invalid-mandi-id")
        assert response.status_code == 404


class TestShockSimulationEngine:
    """Tests for POST /api/simulate - Shock Simulation with elasticity-based pricing"""
    
    def test_rain_shock_simulation(self):
        """Test rain shock returns correct elasticity-based price impact"""
        payload = {
            "mandiId": "mandi-001",
            "shockType": "rain",
            "intensity": 70,
            "duration": 7
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["originalMandi"] == "Azadpur Mandi"
        assert data["shockType"] == "rain"
        assert data["intensity"] == 70
        assert data["duration"] == 7
        
        # Verify price impact calculation
        assert "priceImpact" in data
        assert "predictedPrice" in data
        assert "originalPrice" in data
        assert data["predictedPrice"] > data["originalPrice"]  # Rain should increase price
        
        # Verify arrivals impact (rain reduces supply)
        assert "predictedArrivals" in data
        assert "originalArrivals" in data
        assert data["predictedArrivals"] < data["originalArrivals"]
        
        # Verify stress score change
        assert "newStressScore" in data
        assert "previousStressScore" in data
        assert data["newStressScore"] >= data["previousStressScore"]
    
    def test_demand_spike_simulation(self):
        """Test demand_spike shock calculates demand increase correctly"""
        payload = {
            "mandiId": "mandi-001",
            "shockType": "demand_spike",
            "intensity": 80,
            "duration": 7
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify demand spike increases price
        assert data["predictedPrice"] > data["originalPrice"]
        
        # Verify arrivals unchanged for demand shock
        assert data["predictedArrivals"] == data["originalArrivals"]
        
        # Verify simulation parameters show demand increase
        assert "simulationParameters" in data
        params = data["simulationParameters"]
        assert params["demandAfter"] > params["demandBefore"]
        assert params["supplyAfter"] == params["supplyBefore"]  # Supply unchanged
    
    def test_simulation_elasticity_parameters(self):
        """Test simulation returns elasticity model parameters"""
        payload = {
            "mandiId": "mandi-001",
            "shockType": "rain",
            "intensity": 50,
            "duration": 7
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify elasticity parameters
        assert "simulationParameters" in data
        params = data["simulationParameters"]
        assert params["elasticity"] == 0.4  # Expected elasticity value
        assert "supplyBefore" in params
        assert "supplyAfter" in params
        assert "demandBefore" in params
        assert "demandAfter" in params
    
    def test_simulation_ripple_effects(self):
        """Test simulation returns ripple effects with correct decay (60% level 1, 30% level 2)"""
        payload = {
            "mandiId": "mandi-001",
            "shockType": "rain",
            "intensity": 70,
            "duration": 7
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify affected mandis exist
        assert "affectedMandis" in data
        assert len(data["affectedMandis"]) > 0
        
        # Verify ripple level structure
        level_1_mandis = [m for m in data["affectedMandis"] if m["rippleLevel"] == 1]
        level_2_mandis = [m for m in data["affectedMandis"] if m["rippleLevel"] == 2]
        
        assert len(level_1_mandis) > 0, "Should have level 1 affected mandis"
        
        # Verify ripple decay: level 1 should have ~60% of original impact
        original_impact = data["priceImpact"]
        for m in level_1_mandis:
            expected_impact = original_impact * 0.6
            assert abs(m["priceChange"] - expected_impact) < 1.0, f"Level 1 impact should be ~60% of {original_impact}"
        
        # Verify level 2 has ~30% impact
        for m in level_2_mandis:
            expected_impact = original_impact * 0.3
            assert abs(m["priceChange"] - expected_impact) < 1.0, f"Level 2 impact should be ~30% of {original_impact}"
    
    def test_simulation_invalid_mandi(self):
        """Test simulation returns 404 for invalid mandi"""
        payload = {
            "mandiId": "invalid-mandi",
            "shockType": "rain",
            "intensity": 50,
            "duration": 7
        }
        response = requests.post(f"{BASE_URL}/api/simulate", json=payload)
        assert response.status_code == 404


class TestRecommendationEngine:
    """Tests for POST /api/recommend - Rule-based intervention recommendations"""
    
    def test_recommendation_returns_structure(self):
        """Test recommendation endpoint returns proper structure"""
        payload = {
            "mandiId": "mandi-001",
            "includeAiInsights": False
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "mandiId" in data
        assert "mandiName" in data
        assert "currentStressScore" in data
        assert "stressStatus" in data
        assert "stressBreakdown" in data
        assert "recommendations" in data
        
        # Verify at least one recommendation
        assert len(data["recommendations"]) > 0
    
    def test_recommendation_has_source_destination(self):
        """Test recommendations include sourceMandi and destinationMandi"""
        # Test with high-risk mandi that should trigger stock transfer recommendation
        payload = {
            "mandiId": "mandi-002",  # High risk mandi
            "includeAiInsights": False
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Find high priority recommendation
        high_priority_recs = [r for r in data["recommendations"] if r["priority"] == "high"]
        
        if high_priority_recs:
            rec = high_priority_recs[0]
            # Should have either sourceMandi or destinationMandi
            assert rec.get("sourceMandi") is not None or rec.get("destinationMandi") is not None
    
    def test_recommendation_with_ai_insights(self):
        """Test recommendations with AI insights enabled"""
        payload = {
            "mandiId": "mandi-002",  # High risk mandi
            "includeAiInsights": True
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Find high/medium priority recommendations
        priority_recs = [r for r in data["recommendations"] if r["priority"] in ["high", "medium"]]
        
        # At least one should have AI insight
        ai_insights = [r for r in priority_recs if r.get("aiInsight") is not None]
        assert len(ai_insights) > 0, "High/medium priority recommendations should have AI insights"
    
    def test_recommendation_without_ai_insights(self):
        """Test recommendations without AI insights"""
        payload = {
            "mandiId": "mandi-001",
            "includeAiInsights": False
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # All recommendations should have null aiInsight
        for rec in data["recommendations"]:
            assert rec.get("aiInsight") is None
    
    def test_recommendation_invalid_mandi(self):
        """Test recommendation returns 404 for invalid mandi"""
        payload = {
            "mandiId": "invalid-mandi",
            "includeAiInsights": False
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        assert response.status_code == 404


class TestShockTypesEndpoint:
    """Tests for GET /api/shock-types"""
    
    def test_shock_types_returns_list(self):
        """Test shock types endpoint returns available shock types"""
        response = requests.get(f"{BASE_URL}/api/shock-types")
        assert response.status_code == 200
        data = response.json()
        
        assert "shockTypes" in data
        assert len(data["shockTypes"]) > 0
        
        # Verify shock type structure
        for shock in data["shockTypes"]:
            assert "id" in shock
            assert "name" in shock
            assert "description" in shock


class TestMandisListEndpoint:
    """Tests for GET /api/mandis"""
    
    def test_mandis_list_returns_all(self):
        """Test mandis list endpoint returns all mandis"""
        response = requests.get(f"{BASE_URL}/api/mandis")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandis" in data
        assert len(data["mandis"]) > 0
        
        # Verify mandi structure
        for mandi in data["mandis"]:
            assert "id" in mandi
            assert "name" in mandi
            assert "location" in mandi
            assert "commodity" in mandi


class TestStressCalculationRules:
    """Tests to verify stress calculation rules are correctly implemented"""
    
    def test_price_stress_rules(self):
        """Verify price stress rules: >8% = +35, >4% = +20"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            # Get detailed breakdown
            detail_response = requests.get(f"{BASE_URL}/api/mandi/{mandi['id']}")
            detail = detail_response.json()
            
            price_change = detail["priceChangePct"]
            price_stress = detail["stressBreakdown"]["priceStress"]
            
            if price_change > 8:
                assert price_stress == 35, f"Price change {price_change}% should give 35 stress, got {price_stress}"
            elif price_change > 4:
                assert price_stress == 20, f"Price change {price_change}% should give 20 stress, got {price_stress}"
            else:
                assert price_stress == 0, f"Price change {price_change}% should give 0 stress, got {price_stress}"
    
    def test_supply_stress_rules(self):
        """Verify supply stress rules: <-10% = +30, <-5% = +15"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            detail_response = requests.get(f"{BASE_URL}/api/mandi/{mandi['id']}")
            detail = detail_response.json()
            
            arrival_change = detail["arrivalChangePct"]
            supply_stress = detail["stressBreakdown"]["supplyStress"]
            
            if arrival_change < -10:
                assert supply_stress == 30, f"Arrival change {arrival_change}% should give 30 stress, got {supply_stress}"
            elif arrival_change < -5:
                assert supply_stress == 15, f"Arrival change {arrival_change}% should give 15 stress, got {supply_stress}"
            else:
                assert supply_stress == 0, f"Arrival change {arrival_change}% should give 0 stress, got {supply_stress}"
    
    def test_external_stress_rules(self):
        """Verify external stress rules: rain_flag = +10, festival_flag = +10"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            detail_response = requests.get(f"{BASE_URL}/api/mandi/{mandi['id']}")
            detail = detail_response.json()
            
            rain_flag = detail["rainFlag"]
            festival_flag = detail["festivalFlag"]
            external_stress = detail["stressBreakdown"]["externalStress"]
            
            expected_external = 0
            if rain_flag:
                expected_external += 10
            if festival_flag:
                expected_external += 10
            
            assert external_stress == expected_external, f"External stress should be {expected_external}, got {external_stress}"


class TestJarvisAIAssistant:
    """Tests for POST /api/jarvis/chat - Jarvis Decision Intelligence Assistant"""
    
    def test_jarvis_chat_basic(self):
        """Test Jarvis chat endpoint returns response"""
        payload = {
            "message": "What is market stress?",
            "systemContext": "",
            "conversationHistory": []
        }
        response = requests.post(f"{BASE_URL}/api/jarvis/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert len(data["response"]) > 0
    
    def test_jarvis_chat_with_context(self):
        """Test Jarvis chat with system context"""
        payload = {
            "message": "Why is this mandi high risk?",
            "systemContext": "**Current Mandi Analysis (Azadpur Mandi):**\n- Stress Score: 65/100 (watch)\n- Price Change: +6.8%\n- Arrival Change: -8.6%",
            "conversationHistory": []
        }
        response = requests.post(f"{BASE_URL}/api/jarvis/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert len(data["response"]) > 0
    
    def test_jarvis_chat_with_history(self):
        """Test Jarvis chat with conversation history"""
        payload = {
            "message": "What should I do about it?",
            "systemContext": "",
            "conversationHistory": [
                {"role": "user", "content": "What is market stress?"},
                {"role": "assistant", "content": "Market stress is a measure of instability in agricultural markets."}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/jarvis/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert len(data["response"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
