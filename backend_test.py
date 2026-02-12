import requests
import sys
import json
from datetime import datetime

class FoodSystemAPITester:
    def __init__(self, base_url="https://cropwatch-14.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, expected_fields=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check response structure if expected_fields provided
                if expected_fields and response.status_code == 200:
                    try:
                        response_data = response.json()
                        for field in expected_fields:
                            if field not in response_data:
                                print(f"⚠️  Warning: Missing expected field '{field}' in response")
                            else:
                                print(f"   ✓ Field '{field}' present")
                    except json.JSONDecodeError:
                        print(f"⚠️  Warning: Response is not valid JSON")
                
                return True, response.json() if response.content else {}
            else:
                self.tests_passed += 1 if response.status_code in [200, 201] else 0
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Error: {response.text}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            self.failed_tests.append(f"{name}: Network error - {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test(
            "API Root",
            "GET",
            "",
            200,
            expected_fields=["message", "version"]
        )

    def test_stress_data(self):
        """Test stress data endpoint"""
        success, response = self.run_test(
            "Stress Data",
            "GET",
            "stress",
            200,
            expected_fields=["mandis", "totalMandis", "highRiskCount", "watchCount", "normalCount"]
        )
        
        if success and response:
            # Validate data structure
            mandis = response.get("mandis", [])
            print(f"   📊 Found {len(mandis)} mandis")
            print(f"   📊 Total: {response.get('totalMandis')}, High Risk: {response.get('highRiskCount')}, Watch: {response.get('watchCount')}, Normal: {response.get('normalCount')}")
            
            # Check if we have expected 6 mandis
            if len(mandis) == 6:
                print("   ✓ Expected 6 mandis found")
            else:
                print(f"   ⚠️  Expected 6 mandis, found {len(mandis)}")
                
            # Check summary stats
            expected_high_risk = 2
            expected_watch = 3
            expected_normal = 1
            
            if response.get('highRiskCount') == expected_high_risk:
                print(f"   ✓ High risk count correct: {expected_high_risk}")
            else:
                print(f"   ⚠️  High risk count: expected {expected_high_risk}, got {response.get('highRiskCount')}")
                
            if response.get('watchCount') == expected_watch:
                print(f"   ✓ Watch count correct: {expected_watch}")
            else:
                print(f"   ⚠️  Watch count: expected {expected_watch}, got {response.get('watchCount')}")
                
            if response.get('normalCount') == expected_normal:
                print(f"   ✓ Normal count correct: {expected_normal}")
            else:
                print(f"   ⚠️  Normal count: expected {expected_normal}, got {response.get('normalCount')}")
        
        return success, response

    def test_mandi_detail(self, mandi_id="mandi-001"):
        """Test mandi detail endpoint"""
        return self.run_test(
            f"Mandi Detail ({mandi_id})",
            "GET",
            f"mandi/{mandi_id}",
            200,
            expected_fields=["id", "name", "location", "commodity", "currentPrice", "stressScore", "priceHistory", "arrivalsHistory"]
        )

    def test_mandi_not_found(self):
        """Test mandi detail with invalid ID"""
        return self.run_test(
            "Mandi Not Found",
            "GET",
            "mandi/invalid-id",
            404
        )

    def test_shock_types(self):
        """Test shock types endpoint"""
        success, response = self.run_test(
            "Shock Types",
            "GET",
            "shock-types",
            200,
            expected_fields=["shockTypes"]
        )
        
        if success and response:
            shock_types = response.get("shockTypes", [])
            print(f"   📊 Found {len(shock_types)} shock types")
            expected_types = ["rain", "demand_spike", "supply_drop", "transport"]
            for shock_type in shock_types:
                if shock_type.get("id") in expected_types:
                    print(f"   ✓ Shock type '{shock_type.get('id')}' found")
        
        return success, response

    def test_simulation(self):
        """Test simulation endpoint"""
        simulation_data = {
            "mandiId": "mandi-001",
            "shockType": "rain",
            "intensity": 75,
            "duration": 10
        }
        
        success, response = self.run_test(
            "Run Simulation",
            "POST",
            "simulate",
            200,
            data=simulation_data,
            expected_fields=["originalMandi", "shockType", "intensity", "duration", "priceImpact", "predictedPrice", "originalPrice", "affectedMandis", "simulatedPriceHistory"]
        )
        
        if success and response:
            print(f"   📊 Original Mandi: {response.get('originalMandi')}")
            print(f"   📊 Price Impact: {response.get('priceImpact')}%")
            print(f"   📊 Predicted Price: ₹{response.get('predictedPrice')}")
            print(f"   📊 Affected Mandis: {len(response.get('affectedMandis', []))}")
        
        return success, response

    def test_simulation_invalid_mandi(self):
        """Test simulation with invalid mandi ID"""
        simulation_data = {
            "mandiId": "invalid-mandi",
            "shockType": "rain",
            "intensity": 50,
            "duration": 7
        }
        
        return self.run_test(
            "Simulation Invalid Mandi",
            "POST",
            "simulate",
            404,
            data=simulation_data
        )

    def test_recommendations(self):
        """Test recommendations endpoint"""
        recommendation_data = {
            "mandiId": "mandi-001",
            "includeAiInsights": True
        }
        
        success, response = self.run_test(
            "Get Recommendations",
            "POST",
            "recommend",
            200,
            data=recommendation_data,
            expected_fields=["mandiId", "mandiName", "currentStressScore", "recommendations"]
        )
        
        if success and response:
            recommendations = response.get("recommendations", [])
            print(f"   📊 Found {len(recommendations)} recommendations")
            for i, rec in enumerate(recommendations[:3]):  # Show first 3
                print(f"   📋 {i+1}. {rec.get('action')} (Priority: {rec.get('priority')})")
                if rec.get('aiInsight'):
                    print(f"      🤖 AI Insight available")
        
        return success, response

    def test_recommendations_invalid_mandi(self):
        """Test recommendations with invalid mandi ID"""
        recommendation_data = {
            "mandiId": "invalid-mandi",
            "includeAiInsights": False
        }
        
        return self.run_test(
            "Recommendations Invalid Mandi",
            "POST",
            "recommend",
            404,
            data=recommendation_data
        )

    def test_mandis_list(self):
        """Test mandis list endpoint"""
        success, response = self.run_test(
            "Mandis List",
            "GET",
            "mandis",
            200,
            expected_fields=["mandis"]
        )
        
        if success and response:
            mandis = response.get("mandis", [])
            print(f"   📊 Found {len(mandis)} mandis in list")
            for mandi in mandis[:3]:  # Show first 3
                print(f"   📍 {mandi.get('name')} - {mandi.get('location')}")
        
        return success, response

def main():
    print("🚀 Starting Food System Early Warning API Tests")
    print("=" * 60)
    
    # Setup
    tester = FoodSystemAPITester()
    
    # Run all tests
    print("\n📡 Testing API Endpoints...")
    
    # Basic endpoints
    tester.test_root_endpoint()
    tester.test_stress_data()
    tester.test_mandis_list()
    tester.test_shock_types()
    
    # Mandi detail tests
    tester.test_mandi_detail("mandi-001")  # Azadpur Mandi
    tester.test_mandi_detail("mandi-003")  # Indore Mandi (normal status)
    tester.test_mandi_not_found()
    
    # Simulation tests
    tester.test_simulation()
    tester.test_simulation_invalid_mandi()
    
    # Recommendation tests
    tester.test_recommendations()
    tester.test_recommendations_invalid_mandi()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   • {failure}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())