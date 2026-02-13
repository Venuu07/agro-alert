"""
Test suite for Market Memory + Live State Updates + Transfer Execution
Tests: POST /api/market-update, POST /api/execute-transfer, GET /api/live-state, GET /api/state-history
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cropmonitor-14.preview.emergentagent.com').rstrip('/')


class TestMarketUpdateEndpoint:
    """Tests for POST /api/market-update endpoint"""
    
    def test_market_update_valid_input(self):
        """Test market update with valid arrivals input"""
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": 2500
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert data["mandiId"] == "mandi-001"
        assert data["mandiName"] == "Azadpur Mandi"
        assert data["commodity"] == "Tomato"
        assert data["newArrivals"] == 2500
        assert "previousPrice" in data
        assert "newPrice" in data
        assert "priceChange" in data
        assert "arrivalsChange" in data
        assert "timestamp" in data
        assert "message" in data
    
    def test_market_update_price_recomputation(self):
        """Test that price is automatically recomputed using elasticity formula"""
        # First get current state
        mandi_response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert mandi_response.status_code == 200
        initial_data = mandi_response.json()
        initial_arrivals = initial_data["arrivals"]
        initial_price = initial_data["currentPrice"]
        
        # Update with lower arrivals (should increase price)
        new_arrivals = max(100, initial_arrivals - 500)
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": new_arrivals
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Price should be recomputed (not same as input since we don't input price)
        assert "newPrice" in data
        assert isinstance(data["newPrice"], (int, float))
        assert data["priceChange"] is not None
    
    def test_market_update_msi_recomputation(self):
        """Test that MSI is automatically recomputed after update"""
        # Get initial stress score
        mandi_response = requests.get(f"{BASE_URL}/api/mandi/mandi-004")
        assert mandi_response.status_code == 200
        initial_stress = mandi_response.json()["stressScore"]
        
        # Update arrivals significantly
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-004",
                "commodity": "Rice",
                "arrivals": 3000  # Significant change
            }
        )
        assert response.status_code == 200
        
        # Check updated stress score
        mandi_response = requests.get(f"{BASE_URL}/api/mandi/mandi-004")
        assert mandi_response.status_code == 200
        new_stress = mandi_response.json()["stressScore"]
        
        # Stress score should be recalculated (may or may not change based on formula)
        assert 0 <= new_stress <= 100
    
    def test_market_update_appends_to_history(self):
        """Test that market update appends new row to state history"""
        # Get initial history count
        history_response = requests.get(f"{BASE_URL}/api/state-history")
        assert history_response.status_code == 200
        initial_count = history_response.json()["totalUpdates"]
        
        # Make an update
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-006",
                "commodity": "Onion",
                "arrivals": 4500
            }
        )
        assert response.status_code == 200
        
        # Check history count increased
        history_response = requests.get(f"{BASE_URL}/api/state-history")
        assert history_response.status_code == 200
        new_count = history_response.json()["totalUpdates"]
        assert new_count == initial_count + 1
        
        # Verify the new entry is a market_update type
        history = history_response.json()["history"]
        latest_entry = history[-1]
        assert latest_entry["type"] == "market_update"
        assert latest_entry["mandiId"] == "mandi-006"
    
    def test_market_update_validation_zero_arrivals(self):
        """Test validation rejects zero arrivals"""
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": 0
            }
        )
        assert response.status_code == 422  # Pydantic validation error
    
    def test_market_update_validation_negative_arrivals(self):
        """Test validation rejects negative arrivals"""
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": -100
            }
        )
        assert response.status_code == 422  # Pydantic validation error
    
    def test_market_update_nonexistent_mandi(self):
        """Test 400 for non-existent mandi"""
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-999",
                "commodity": "Tomato",
                "arrivals": 1000
            }
        )
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
    
    def test_market_update_with_optional_context(self):
        """Test market update with optional context notes"""
        response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": 2800,
                "optionalContext": "Heavy rains delayed shipments"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True


class TestExecuteTransferEndpoint:
    """Tests for POST /api/execute-transfer endpoint"""
    
    def test_execute_transfer_valid(self):
        """Test valid transfer execution"""
        # First ensure source has enough supply
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-002", "commodity": "Onion", "arrivals": 6000}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-003",
                "commodity": "Onion",
                "quantity": 300
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert data["sourceMandiId"] == "mandi-002"
        assert data["destMandiId"] == "mandi-003"
        assert data["commodity"] == "Onion"
        assert data["quantity"] == 300
        assert "sourceUpdate" in data
        assert "destUpdate" in data
        assert "sourcePriceChange" in data
        assert "destPriceChange" in data
        assert "timestamp" in data
        assert "message" in data
    
    def test_transfer_deducts_from_source(self):
        """Test that transfer deducts quantity from source mandi"""
        # Set up source with known arrivals
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-002", "commodity": "Onion", "arrivals": 5000}
        )
        
        # Get source arrivals before transfer
        source_before = requests.get(f"{BASE_URL}/api/mandi/mandi-002").json()
        arrivals_before = source_before["arrivals"]
        
        # Execute transfer
        transfer_qty = 200
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-004",
                "commodity": "Onion",
                "quantity": transfer_qty
            }
        )
        assert response.status_code == 200
        
        # Verify source arrivals decreased
        source_after = requests.get(f"{BASE_URL}/api/mandi/mandi-002").json()
        # Note: The transfer updates the commodity-level arrivals, not necessarily mandi-level
        # Check the response data for source update
        data = response.json()
        assert data["sourceUpdate"]["newArrivals"] < data["sourceUpdate"]["previousArrivals"]
    
    def test_transfer_adds_to_destination(self):
        """Test that transfer adds quantity to destination mandi"""
        # Set up source with enough supply
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-002", "commodity": "Onion", "arrivals": 5000}
        )
        
        # Execute transfer
        transfer_qty = 200
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-004",
                "commodity": "Onion",
                "quantity": transfer_qty
            }
        )
        assert response.status_code == 200
        
        # Verify destination arrivals increased
        data = response.json()
        assert data["destUpdate"]["newArrivals"] > data["destUpdate"]["previousArrivals"]
    
    def test_transfer_recomputes_prices_both_mandis(self):
        """Test that prices are recomputed for BOTH mandis after transfer"""
        # Set up source
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-002", "commodity": "Onion", "arrivals": 5000}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-004",
                "commodity": "Onion",
                "quantity": 400
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Both mandis should have price updates
        assert "previousPrice" in data["sourceUpdate"]
        assert "newPrice" in data["sourceUpdate"]
        assert "previousPrice" in data["destUpdate"]
        assert "newPrice" in data["destUpdate"]
        
        # Price changes should be calculated
        assert "sourcePriceChange" in data
        assert "destPriceChange" in data
    
    def test_transfer_validation_quantity_exceeds_supply(self):
        """Test validation: quantity must be <= source supply"""
        # Set source to known low supply
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-006", "commodity": "Onion", "arrivals": 100}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-006",
                "destMandiId": "mandi-003",
                "commodity": "Onion",
                "quantity": 99999  # Way more than available
            }
        )
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    def test_transfer_validation_same_source_dest(self):
        """Test validation: source and destination cannot be same"""
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-001",
                "destMandiId": "mandi-001",
                "commodity": "Tomato",
                "quantity": 100
            }
        )
        assert response.status_code == 400
        assert "same" in response.json()["detail"].lower()
    
    def test_transfer_validation_zero_quantity(self):
        """Test validation: quantity must be > 0"""
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-003",
                "commodity": "Onion",
                "quantity": 0
            }
        )
        assert response.status_code == 422  # Pydantic validation
    
    def test_transfer_appends_to_history(self):
        """Test that transfer appends to state history"""
        # Get initial history count
        history_response = requests.get(f"{BASE_URL}/api/state-history")
        initial_count = history_response.json()["totalUpdates"]
        
        # Set up source
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-002", "commodity": "Onion", "arrivals": 5000}
        )
        
        # Execute transfer
        response = requests.post(
            f"{BASE_URL}/api/execute-transfer",
            json={
                "sourceMandiId": "mandi-002",
                "destMandiId": "mandi-003",
                "commodity": "Onion",
                "quantity": 100
            }
        )
        assert response.status_code == 200
        
        # Check history increased
        history_response = requests.get(f"{BASE_URL}/api/state-history")
        # +2 because market-update also adds to history
        assert history_response.json()["totalUpdates"] > initial_count
        
        # Verify transfer entry exists
        history = history_response.json()["history"]
        transfer_entries = [h for h in history if h["type"] == "transfer_execution"]
        assert len(transfer_entries) > 0


class TestLiveStateEndpoint:
    """Tests for GET /api/live-state endpoint"""
    
    def test_live_state_returns_updated_data(self):
        """Test that live-state returns updated prices and MSI"""
        response = requests.get(f"{BASE_URL}/api/live-state")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "mandis" in data
        assert "totalMandis" in data
        assert "timestamp" in data
        assert len(data["mandis"]) >= 1
    
    def test_live_state_mandi_fields(self):
        """Test that each mandi in live-state has required fields"""
        response = requests.get(f"{BASE_URL}/api/live-state")
        assert response.status_code == 200
        data = response.json()
        
        for mandi in data["mandis"]:
            assert "id" in mandi
            assert "name" in mandi
            assert "currentPrice" in mandi
            assert "arrivals" in mandi
            assert "stressScore" in mandi
            assert "status" in mandi
            assert "priceChangePct" in mandi
            assert "arrivalChangePct" in mandi
    
    def test_live_state_reflects_market_update(self):
        """Test that live-state reflects recent market updates"""
        # Make a market update
        update_response = requests.post(
            f"{BASE_URL}/api/market-update",
            json={
                "mandiId": "mandi-001",
                "commodity": "Tomato",
                "arrivals": 2222
            }
        )
        assert update_response.status_code == 200
        
        # Check live-state
        live_response = requests.get(f"{BASE_URL}/api/live-state")
        assert live_response.status_code == 200
        
        # Find mandi-001 in live state
        mandi_001 = None
        for m in live_response.json()["mandis"]:
            if m["id"] == "mandi-001":
                mandi_001 = m
                break
        
        assert mandi_001 is not None
        assert mandi_001["arrivals"] == 2222


class TestStateHistoryEndpoint:
    """Tests for GET /api/state-history endpoint"""
    
    def test_state_history_structure(self):
        """Test state history endpoint returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/state-history")
        assert response.status_code == 200
        data = response.json()
        
        assert "history" in data
        assert "totalUpdates" in data
        assert "lastUpdate" in data
        assert isinstance(data["history"], list)
    
    def test_state_history_entry_fields(self):
        """Test that history entries have required fields"""
        # Make an update to ensure history has entries
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-001", "commodity": "Tomato", "arrivals": 2600}
        )
        
        response = requests.get(f"{BASE_URL}/api/state-history")
        assert response.status_code == 200
        data = response.json()
        
        if data["totalUpdates"] > 0:
            entry = data["history"][-1]
            assert "timestamp" in entry
            assert "type" in entry
            assert entry["type"] in ["market_update", "transfer_execution"]
    
    def test_state_history_append_only(self):
        """Test that history is append-only (entries are never removed)"""
        # Get initial count
        response1 = requests.get(f"{BASE_URL}/api/state-history")
        count1 = response1.json()["totalUpdates"]
        
        # Make multiple updates
        for i in range(3):
            requests.post(
                f"{BASE_URL}/api/market-update",
                json={"mandiId": "mandi-001", "commodity": "Tomato", "arrivals": 2500 + i * 100}
            )
        
        # Get new count
        response2 = requests.get(f"{BASE_URL}/api/state-history")
        count2 = response2.json()["totalUpdates"]
        
        # Count should have increased by 3
        assert count2 == count1 + 3


class TestMandiDetailAfterUpdate:
    """Tests for GET /api/mandi/{id} after market updates"""
    
    def test_mandi_detail_reflects_update(self):
        """Test that mandi detail endpoint returns updated data"""
        # Make an update
        new_arrivals = 3333
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-001", "commodity": "Tomato", "arrivals": new_arrivals}
        )
        
        # Get mandi detail
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["arrivals"] == new_arrivals
    
    def test_mandi_history_updated(self):
        """Test that mandi price/arrivals history is updated"""
        # Make an update
        requests.post(
            f"{BASE_URL}/api/market-update",
            json={"mandiId": "mandi-001", "commodity": "Tomato", "arrivals": 2700}
        )
        
        # Get mandi detail
        response = requests.get(f"{BASE_URL}/api/mandi/mandi-001")
        assert response.status_code == 200
        data = response.json()
        
        # Should have price and arrivals history
        assert "priceHistory" in data
        assert "arrivalsHistory" in data
        assert len(data["priceHistory"]) > 0
        assert len(data["arrivalsHistory"]) > 0


class TestExistingEndpointsStillWork:
    """Tests to ensure existing simulation endpoints still work"""
    
    def test_stress_endpoint_still_works(self):
        """Test stress endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/stress")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandis" in data
        assert "totalMandis" in data
        assert "highRiskCount" in data
    
    def test_simulate_endpoint_still_works(self):
        """Test simulation endpoint still works"""
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
    
    def test_recommend_endpoint_still_works(self):
        """Test recommend endpoint still works"""
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
    
    def test_graph_endpoint_still_works(self):
        """Test graph endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        assert "nodes" in data
        assert "edges" in data
    
    def test_transfer_recommendations_still_works(self):
        """Test transfer recommendations endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/transfer-recommendations")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert "totalRecommendations" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
