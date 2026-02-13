"""
Test suite for Food System Early Warning & Shock Simulator - New Features
Tests: Multi-Commodity, Surplus/Deficit, Transfer Recommendations, Context Interpretation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cropmonitor-14.preview.emergentagent.com').rstrip('/')

class TestHealthAndBasics:
    """Basic health and API availability tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "2.0.0"
        assert "stress" in data["engines"]
        assert "simulation" in data["engines"]
        assert "recommendation" in data["engines"]


class TestMultiCommodityEndpoint:
    """Tests for /api/mandi/{id}/commodities endpoint"""
    
    def test_get_commodities_for_mandi(self):
        """Test fetching commodities for a mandi"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001/commodities")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["mandiId"] == "mandi-001"
        assert data["mandiName"] == "Azadpur Mandi"
        assert data["dataAvailable"] == True
        assert "commodities" in data
        assert len(data["commodities"]) >= 1
    
    def test_commodities_have_required_fields(self):
        """Test that commodities have all required fields"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001/commodities")
        assert response.status_code == 200
        data = response.json()
        
        for commodity in data["commodities"]:
            assert "name" in commodity
            assert "currentPrice" in commodity
            assert "previousPrice" in commodity
            assert "arrivals" in commodity
            assert "stressIndex" in commodity
            assert "priceChangePct" in commodity
            assert "arrivalChangePct" in commodity
    
    def test_primary_commodity_marked(self):
        """Test that primary commodity is marked correctly"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001/commodities")
        assert response.status_code == 200
        data = response.json()
        
        primary_commodities = [c for c in data["commodities"] if c.get("isPrimary")]
        assert len(primary_commodities) >= 1
        assert primary_commodities[0]["name"] == "Tomato"
    
    def test_commodities_stress_index_calculated(self):
        """Test that stress index is calculated for each commodity"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001/commodities")
        assert response.status_code == 200
        data = response.json()
        
        for commodity in data["commodities"]:
            assert "stressIndex" in commodity
            assert 0 <= commodity["stressIndex"] <= 100
    
    def test_commodities_for_nonexistent_mandi(self):
        """Test 404 for non-existent mandi"""
        response = requests.get(f"{BASE_URL}/api/mandi/nonexistent-mandi/commodities")
        assert response.status_code == 404


class TestSurplusDeficitEndpoint:
    """Tests for /api/surplus-deficit/{mandi_id} endpoint"""
    
    def test_get_surplus_deficit_for_mandi(self):
        """Test fetching surplus/deficit data for a mandi"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["mandiId"] == "mandi-001"
        assert data["mandiName"] == "Azadpur Mandi"
        assert "overallStatus" in data
        assert "commodityAnalyses" in data
        assert "deficitCommodities" in data
        assert "surplusCommodities" in data
    
    def test_surplus_deficit_analysis_fields(self):
        """Test that commodity analyses have all required fields"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        for analysis in data["commodityAnalyses"]:
            assert "commodity" in analysis
            assert "supply" in analysis
            assert "baseDemand" in analysis
            assert "balance" in analysis
            assert "balancePct" in analysis
            assert "status" in analysis
            assert "suggestedAction" in analysis
            assert "stabilizationSignal" in analysis
    
    def test_surplus_deficit_status_values(self):
        """Test that status values are valid"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        valid_statuses = ["surplus", "deficit", "balanced"]
        for analysis in data["commodityAnalyses"]:
            assert analysis["status"] in valid_statuses
    
    def test_surplus_deficit_overall_status(self):
        """Test overall status calculation"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        valid_overall = ["net_surplus", "net_deficit", "balanced"]
        assert data["overallStatus"] in valid_overall
    
    def test_stabilization_signals(self):
        """Test that stabilization signals are valid"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        valid_signals = ["PULL_STOCK_URGENT", "PUSH_STOCK_RECOMMENDED", "MONITOR_STABILITY", "STANDARD_OPERATIONS"]
        for analysis in data["commodityAnalyses"]:
            assert analysis["stabilizationSignal"] in valid_signals
    
    def test_surplus_deficit_for_nonexistent_mandi(self):
        """Test 404 for non-existent mandi"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit/nonexistent-mandi")
        assert response.status_code == 404
    
    def test_get_all_surplus_deficit(self):
        """Test fetching surplus/deficit for all mandis"""
        response = requests.get(f"{BASE_URL}/api/surplus-deficit")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandis" in data
        assert len(data["mandis"]) >= 1


class TestTransferRecommendationsEndpoint:
    """Tests for /api/transfer-recommendations endpoint"""
    
    def test_get_transfer_recommendations(self):
        """Test fetching transfer recommendations"""
        response = requests.get(f"{BASE_URL}/api/transfer-recommendations")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "recommendations" in data
        assert "totalRecommendations" in data
        assert "generatedAt" in data
    
    def test_transfer_recommendation_fields(self):
        """Test that recommendations have all required fields"""
        response = requests.get(f"{BASE_URL}/api/transfer-recommendations")
        assert response.status_code == 200
        data = response.json()
        
        if data["totalRecommendations"] > 0:
            rec = data["recommendations"][0]
            assert "id" in rec
            assert "type" in rec
            assert "sourceMandi" in rec
            assert "destinationMandi" in rec
            assert "commodity" in rec
            assert "suggestedQuantity" in rec
            assert "transportCost" in rec
            assert "priceArbitrage" in rec
            assert "expectedStabilityImpact" in rec
            assert "priority" in rec
            assert "reasoning" in rec
            assert "metrics" in rec
    
    def test_transfer_recommendation_metrics(self):
        """Test that recommendation metrics are present"""
        response = requests.get(f"{BASE_URL}/api/transfer-recommendations")
        assert response.status_code == 200
        data = response.json()
        
        if data["totalRecommendations"] > 0:
            metrics = data["recommendations"][0]["metrics"]
            assert "sourceSurplus" in metrics
            assert "destDeficit" in metrics
            assert "sourcePrice" in metrics
            assert "destPrice" in metrics
            assert "priceDifferential" in metrics


class TestContextInterpretationEndpoint:
    """Tests for /api/interpret-context endpoint"""
    
    def test_interpret_strike_context(self):
        """Test interpretation of strike-related context"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": "Transport strike blocking highway"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) >= 1
        
        # Should detect logistics_stress
        signal_types = [s["type"] for s in data["signals"]]
        assert "logistics_stress" in signal_types
    
    def test_interpret_flood_context(self):
        """Test interpretation of flood-related context"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": "Heavy flooding in the region"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) >= 1
        
        # Should detect supply_stress
        signal_types = [s["type"] for s in data["signals"]]
        assert "supply_stress" in signal_types
    
    def test_interpret_festival_context(self):
        """Test interpretation of festival-related context"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": "Diwali festival causing demand surge"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) >= 1
        
        # Should detect demand_pressure
        signal_types = [s["type"] for s in data["signals"]]
        assert "demand_pressure" in signal_types
    
    def test_interpret_multiple_signals(self):
        """Test interpretation of context with multiple signals"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": "Heavy rainfall causing flooding and transport delays due to highway blockade"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) >= 2  # Should detect multiple signals
        assert "interpretation" in data
        assert data["interpretation"] is not None
    
    def test_interpret_empty_context(self):
        """Test interpretation of empty context"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": ""}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) == 0
        assert data["interpretation"] is None
    
    def test_interpret_no_keywords_context(self):
        """Test interpretation of context with no matching keywords"""
        response = requests.post(
            f"{BASE_URL}/api/interpret-context",
            json={"description": "Normal market operations today"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "signals" in data
        assert len(data["signals"]) == 0


class TestExistingEndpointsStillWork:
    """Tests to ensure existing endpoints still work"""
    
    def test_stress_endpoint(self):
        """Test stress endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandis" in data
        assert "totalMandis" in data
        assert "highRiskCount" in data
        assert "watchCount" in data
        assert "normalCount" in data
    
    def test_mandi_detail_endpoint(self):
        """Test mandi detail endpoint"""
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "mandi-001"
        assert "stressScore" in data
        assert "stressBreakdown" in data
    
    def test_simulation_endpoint(self):
        """Test simulation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/simulate",
            json={
                "mandiId": "mandi-001",
                "shockType": "rain",
                "intensity": 50,
                "duration": 7
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "priceImpact" in data
        assert "predictedPrice" in data
        assert "affectedMandis" in data
    
    def test_recommend_endpoint(self):
        """Test recommend endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/recommend",
            json={
                "mandiId": "mandi-001",
                "includeAiInsights": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert "currentStressScore" in data
    
    def test_mandis_list_endpoint(self):
        """Test mandis list endpoint"""
        response = requests.get(f"{BASE_URL}/api/mandis")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandis" in data
        assert len(data["mandis"]) >= 1
    
    def test_shock_types_endpoint(self):
        """Test shock types endpoint"""
        response = requests.get(f"{BASE_URL}/api/shock-types")
        assert response.status_code == 200
        data = response.json()
        
        assert "shockTypes" in data
        assert len(data["shockTypes"]) >= 1


class TestJarvisEndpoint:
    """Tests for Jarvis AI endpoint"""
    
    def test_jarvis_chat_basic(self):
        """Test basic Jarvis chat"""
        response = requests.post(
            f"{BASE_URL}/api/jarvis/chat",
            json={
                "message": "What is the current market status?",
                "systemContext": "Total Mandis: 6, High Risk: 2"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert len(data["response"]) > 0
    
    def test_jarvis_with_shock_context(self):
        """Test Jarvis with shock context"""
        response = requests.post(
            f"{BASE_URL}/api/jarvis/chat",
            json={
                "message": "Explain the impact of this situation",
                "systemContext": "Mandi: Azadpur, Stress: 65",
                "shockContext": "Heavy rainfall causing flooding"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
