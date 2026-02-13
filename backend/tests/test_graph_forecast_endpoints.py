"""
Test suite for Network Graph & Forecast Endpoints
Tests: GET /api/graph, GET /api/forecast, POST /api/simulate-with-graph
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cropmonitor-14.preview.emergentagent.com').rstrip('/')


class TestGraphEndpoint:
    """Tests for GET /api/graph endpoint"""
    
    def test_graph_returns_nodes_and_edges(self):
        """Test that graph endpoint returns nodes and edges"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) >= 1
        assert len(data["edges"]) >= 1
    
    def test_graph_nodes_have_coordinates(self):
        """Test that all nodes have x, y coordinates"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        for node in data["nodes"]:
            assert "x" in node, f"Node {node.get('id')} missing x coordinate"
            assert "y" in node, f"Node {node.get('id')} missing y coordinate"
            assert isinstance(node["x"], (int, float)), f"Node {node.get('id')} x is not numeric"
            assert isinstance(node["y"], (int, float)), f"Node {node.get('id')} y is not numeric"
            assert node["x"] > 0, f"Node {node.get('id')} x should be positive"
            assert node["y"] > 0, f"Node {node.get('id')} y should be positive"
    
    def test_graph_nodes_have_required_fields(self):
        """Test that nodes have all required fields"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "name", "x", "y", "impact", "msi", "status", "primary", "price"]
        for node in data["nodes"]:
            for field in required_fields:
                assert field in node, f"Node {node.get('id')} missing field: {field}"
    
    def test_graph_edges_have_required_fields(self):
        """Test that edges have all required fields"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["from", "to", "strength", "cost_per_qt", "travel_time"]
        for edge in data["edges"]:
            for field in required_fields:
                assert field in edge, f"Edge missing field: {field}"
    
    def test_graph_with_origin_parameter(self):
        """Test graph with origin parameter for shock propagation"""
        response = requests.get(f"{BASE_URL}/api/graph?origin=mandi-002")
        assert response.status_code == 200
        data = response.json()
        
        # Origin node should have impact = 1.0
        origin_node = next((n for n in data["nodes"] if n["id"] == "mandi-002"), None)
        assert origin_node is not None, "Origin node not found"
        assert origin_node["impact"] == 1.0, f"Origin node impact should be 1.0, got {origin_node['impact']}"
        
        # Other nodes should have reduced impacts
        other_nodes = [n for n in data["nodes"] if n["id"] != "mandi-002"]
        for node in other_nodes:
            assert node["impact"] < 1.0, f"Non-origin node {node['id']} should have impact < 1.0"
    
    def test_graph_msi_values_valid(self):
        """Test that MSI values are within valid range"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        for node in data["nodes"]:
            assert 0 <= node["msi"] <= 100, f"Node {node['id']} MSI {node['msi']} out of range"
    
    def test_graph_status_values_valid(self):
        """Test that status values are valid"""
        response = requests.get(f"{BASE_URL}/api/graph")
        assert response.status_code == 200
        data = response.json()
        
        valid_statuses = ["normal", "watch", "high"]
        for node in data["nodes"]:
            assert node["status"] in valid_statuses, f"Node {node['id']} has invalid status: {node['status']}"


class TestForecastEndpoint:
    """Tests for GET /api/forecast endpoint"""
    
    def test_forecast_returns_data(self):
        """Test that forecast endpoint returns forecast data"""
        response = requests.get(f"{BASE_URL}/api/forecast?mandi=mandi-001&commodity=Tomato&horizon=7")
        assert response.status_code == 200
        data = response.json()
        
        assert "mandi" in data
        assert "commodity" in data
        assert "forecast" in data
    
    def test_forecast_returns_correct_horizon(self):
        """Test that forecast returns correct number of days"""
        response = requests.get(f"{BASE_URL}/api/forecast?mandi=mandi-001&commodity=Tomato&horizon=7")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["forecast"]) == 7, f"Expected 7 forecast points, got {len(data['forecast'])}"
    
    def test_forecast_points_have_required_fields(self):
        """Test that forecast points have date and predicted_price"""
        response = requests.get(f"{BASE_URL}/api/forecast?mandi=mandi-001&commodity=Tomato&horizon=7")
        assert response.status_code == 200
        data = response.json()
        
        for point in data["forecast"]:
            assert "date" in point, "Forecast point missing date"
            assert "predicted_price" in point, "Forecast point missing predicted_price"
            assert isinstance(point["predicted_price"], (int, float)), "predicted_price should be numeric"
    
    def test_forecast_different_horizons(self):
        """Test forecast with different horizon values"""
        for horizon in [3, 7, 14]:
            response = requests.get(f"{BASE_URL}/api/forecast?mandi=mandi-001&commodity=Tomato&horizon={horizon}")
            assert response.status_code == 200
            data = response.json()
            assert len(data["forecast"]) == horizon, f"Expected {horizon} points, got {len(data['forecast'])}"
    
    def test_forecast_nonexistent_mandi(self):
        """Test forecast for non-existent mandi returns 404"""
        response = requests.get(f"{BASE_URL}/api/forecast?mandi=nonexistent&commodity=Tomato&horizon=7")
        assert response.status_code == 404
    
    def test_forecast_prices_are_positive(self):
        """Test that forecast prices are positive"""
        response = requests.get(f"{BASE_URL}/api/forecast?mandi=mandi-001&commodity=Tomato&horizon=7")
        assert response.status_code == 200
        data = response.json()
        
        for point in data["forecast"]:
            assert point["predicted_price"] >= 0, f"Forecast price should be non-negative"


class TestSimulateWithGraphEndpoint:
    """Tests for POST /api/simulate-with-graph endpoint"""
    
    def test_simulate_with_graph_returns_both_payloads(self):
        """Test that endpoint returns both simulation and graph data"""
        response = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={
                "mandiId": "mandi-001",
                "shockType": "rain",
                "intensity": 50,
                "duration": 7
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "simulation" in data, "Response missing simulation payload"
        assert "graph" in data, "Response missing graph payload"
    
    def test_simulate_with_graph_simulation_fields(self):
        """Test that simulation payload has required fields"""
        response = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={
                "mandiId": "mandi-001",
                "shockType": "rain",
                "intensity": 50,
                "duration": 7
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        simulation = data["simulation"]
        required_fields = ["originalMandi", "originalMandiId", "shockType", "intensity", 
                          "duration", "priceImpact", "predictedPrice", "affectedMandis"]
        for field in required_fields:
            assert field in simulation, f"Simulation missing field: {field}"
    
    def test_simulate_with_graph_graph_fields(self):
        """Test that graph payload has nodes and edges"""
        response = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={
                "mandiId": "mandi-001",
                "shockType": "rain",
                "intensity": 50,
                "duration": 7
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        graph = data["graph"]
        assert "nodes" in graph, "Graph missing nodes"
        assert "edges" in graph, "Graph missing edges"
        assert len(graph["nodes"]) >= 1, "Graph should have at least one node"
    
    def test_simulate_with_graph_different_shock_types(self):
        """Test simulation with different shock types"""
        shock_types = ["rain", "supply_drop", "demand_spike", "transport"]
        
        for shock_type in shock_types:
            response = requests.post(
                f"{BASE_URL}/api/simulate-with-graph",
                json={
                    "mandiId": "mandi-001",
                    "shockType": shock_type,
                    "intensity": 50,
                    "duration": 7
                }
            )
            assert response.status_code == 200, f"Failed for shock type: {shock_type}"
            data = response.json()
            assert data["simulation"]["shockType"] == shock_type
    
    def test_simulate_with_graph_nonexistent_mandi(self):
        """Test simulation with non-existent mandi returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={
                "mandiId": "nonexistent",
                "shockType": "rain",
                "intensity": 50,
                "duration": 7
            }
        )
        assert response.status_code == 404
    
    def test_simulate_with_graph_intensity_affects_impact(self):
        """Test that higher intensity produces higher price impact"""
        low_intensity = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={"mandiId": "mandi-001", "shockType": "rain", "intensity": 20, "duration": 7}
        ).json()
        
        high_intensity = requests.post(
            f"{BASE_URL}/api/simulate-with-graph",
            json={"mandiId": "mandi-001", "shockType": "rain", "intensity": 80, "duration": 7}
        ).json()
        
        assert high_intensity["simulation"]["priceImpact"] > low_intensity["simulation"]["priceImpact"], \
            "Higher intensity should produce higher price impact"


class TestExistingEndpointsStillWork:
    """Verify existing endpoints still work after new features"""
    
    def test_mandis_endpoint(self):
        """Test /api/mandis endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/mandis")
        assert response.status_code == 200
        data = response.json()
        assert "mandis" in data
        assert len(data["mandis"]) >= 1
    
    def test_simulate_endpoint(self):
        """Test /api/simulate endpoint still works"""
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
        assert "affectedMandis" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
