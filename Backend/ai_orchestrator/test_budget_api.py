"""
Quick test script for Budget Recommendations API
"""
import requests
import json

API_BASE = "http://10.243.165.242:8000"

def test_budget_api():
    print("=" * 60)
    print("Testing Budget Recommendations API")
    print("=" * 60)

    # Test 1: Get recommendations
    print("\n1. Testing budget recommendations endpoint...")
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/budget/recommendations",
            json={
                "budget_min": 30000,
                "budget_max": 60000,
                "num_travelers": 2,
                "preferences": {},
                "duration_days": 5
            },
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS!")
            print(f"  - Found {data['total_found']} packages")
            print(f"  - Budget Analysis: {data['budget_analysis'][:80]}...")
            print(f"  - AI Insight: {data['ai_insights'][:80]}...")
            print(f"  - Powered by: {data['powered_by']}")

            if data['packages']:
                pkg = data['packages'][0]
                print(f"\n  First Package:")
                print(f"  - Name: {pkg['package_name']}")
                print(f"  - Destination: {pkg['destination']}")
                print(f"  - Match Score: {pkg['match_score']}")
                print(f"  - Total Cost: ₹{pkg['total_cost']:,.0f}")
                print(f"  - Savings: {pkg['savings_percent']:.0f}%")
        else:
            print(f"✗ FAILED: Status {response.status_code}")
            print(f"  Response: {response.text}")
    except Exception as e:
        print(f"✗ ERROR: {e}")

    # Test 2: Get destinations
    print("\n2. Testing destinations endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/v1/budget/destinations", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS! Found {len(data['destinations'])} destinations")
            print(f"  Examples: {', '.join([d['name'] for d in data['destinations'][:3]])}")
        else:
            print(f"✗ FAILED: Status {response.status_code}")
    except Exception as e:
        print(f"✗ ERROR: {e}")

    # Test 3: Get budget tips
    print("\n3. Testing budget tips endpoint...")
    try:
        response = requests.get(f"{API_BASE}/api/v1/budget/budget-tips", timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS!")
            print(f"  Tips preview: {data['tips'][:100]}...")
        else:
            print(f"✗ FAILED: Status {response.status_code}")
    except Exception as e:
        print(f"✗ ERROR: {e}")

    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_budget_api()
