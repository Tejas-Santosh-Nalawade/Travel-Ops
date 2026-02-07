"""
Test script for AI Orchestrator API

Run this script to test the API endpoints:
    python test_api.py
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"


def print_response(title: str, response: dict):
    """Pretty print response"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")
    print(json.dumps(response, indent=2))
    print()


def test_health_check():
    """Test health check endpoint"""
    print("\n🔍 Testing Health Check...")
    response = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", response.json())


def test_get_cities():
    """Test get supported cities"""
    print("\n🌍 Testing Get Supported Cities...")
    response = requests.get(f"{API_URL}/cities")
    print_response("Supported Cities", response.json())


def test_calculate_distance():
    """Test distance calculation"""
    print("\n📏 Testing Distance Calculation...")
    city1 = "pune"
    city2 = "mumbai"
    response = requests.get(f"{API_URL}/distance/{city1}/{city2}")
    print_response(f"Distance: {city1} → {city2}", response.json())


def test_create_plan():
    """Test creating a travel plan"""
    print("\n✈️ Testing Create Travel Plan...")

    # Calculate dates
    start_date = (datetime.now() + timedelta(days=30)).date()

    request_data = {
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "customer_phone": "+919876543210",
        "total_budget": 50000,
        "cities": [
            {
                "city": "Pune",
                "duration_days": 1,
                "arrival_date": str(start_date),
                "departure_date": str(start_date + timedelta(days=1))
            },
            {
                "city": "Mumbai",
                "duration_days": 2,
                "arrival_date": str(start_date + timedelta(days=1)),
                "departure_date": str(start_date + timedelta(days=3))
            },
            {
                "city": "Bangalore",
                "duration_days": 3,
                "arrival_date": str(start_date + timedelta(days=3)),
                "departure_date": str(start_date + timedelta(days=6))
            }
        ],
        "preference": "balanced",
        "number_of_travelers": 2,
        "accommodation_type": "mid_range"
    }

    print("Request:")
    print(json.dumps(request_data, indent=2))

    response = requests.post(
        f"{API_URL}/plan",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        result = response.json()
        print_response("Travel Plan Created", result)

        # Print summary
        if result.get("success") and result.get("travel_plan"):
            plan = result["travel_plan"]
            print("\n📊 PLAN SUMMARY:")
            print(f"  Plan ID: {plan['plan_id']}")
            print(f"  Confidence: {plan['confidence_score'] * 100:.1f}%")
            print(f"  Total Duration: {plan['total_duration_days']} days")
            print(f"  Budget Utilization: {plan['budget_breakdown']['budget_utilization_percent']:.1f}%")
            print(f"  Remaining Budget: ₹{plan['budget_breakdown']['remaining_budget']:.2f}")
            print(f"\n  Reasoning: {plan['reasoning']}\n")

            print("  💰 BUDGET BREAKDOWN:")
            budget = plan['budget_breakdown']
            print(f"    Transport: ₹{budget['transport_cost']:.2f}")
            print(f"    Accommodation: ₹{budget['accommodation_cost']:.2f}")
            print(f"    Local Transport: ₹{budget['local_transport_cost']:.2f}")
            print(f"    Food (est): ₹{budget['food_estimated']:.2f}")
            print(f"    Activities (est): ₹{budget['activities_estimated']:.2f}")

            print("\n  🗺️ ITINERARY:")
            for leg in plan['itinerary']:
                print(f"\n    Leg {leg['leg_number']}: {leg['from_city']} → {leg['to_city']}")
                print(f"      Transport: {leg['transport']['mode']} ({leg['transport']['provider']})")
                print(f"      Cost: ₹{leg['transport']['cost_per_person']} per person")
                print(f"      Duration: {leg['transport']['duration_minutes']} minutes")

                if leg.get('accommodation'):
                    acc = leg['accommodation']
                    print(f"      Hotel: {acc['hotel_name']}")
                    print(f"      Cost: ₹{acc['total_cost']} ({acc['nights']} nights)")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)


def test_simulate_plan():
    """Test simulation endpoint"""
    print("\n🎬 Testing Simulation (Demo for Judges)...")

    start_date = (datetime.now() + timedelta(days=30)).date()

    request_data = {
        "customer_name": "Demo User",
        "customer_email": "demo@example.com",
        "customer_phone": "+919876543210",
        "total_budget": 40000,
        "cities": [
            {
                "city": "Delhi",
                "duration_days": 1,
                "arrival_date": str(start_date),
                "departure_date": str(start_date + timedelta(days=1))
            },
            {
                "city": "Jaipur",
                "duration_days": 2,
                "arrival_date": str(start_date + timedelta(days=1)),
                "departure_date": str(start_date + timedelta(days=3))
            }
        ],
        "preference": "cheapest",
        "number_of_travelers": 3,
        "accommodation_type": "budget"
    }

    response = requests.post(
        f"{API_URL}/plan/simulate",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        result = response.json()

        print(f"\n🆔 Simulation ID: {result['simulation_id']}")
        print(f"⏱️  Total Time: {result['total_time_seconds']:.2f} seconds")
        print(f"✅ Status: {result['status']}\n")

        print("📋 SIMULATION STEPS:")
        for step in result['steps']:
            status_emoji = "✅" if step['status'] == 'completed' else "⏳"
            print(f"\n  {status_emoji} Step {step['step_number']}: {step['description']}")
            print(f"     Action: {step['action']}")
            print(f"     Status: {step['status']}")

            # Print key details
            if step.get('details'):
                if 'selected_mode' in step['details']:
                    print(f"     Selected: {step['details']['selected_mode']}")
                if 'cost' in step['details']:
                    print(f"     Cost: ₹{step['details']['cost']}")
                if 'hotel' in step['details']:
                    print(f"     Hotel: {step['details']['hotel']}")

        if result.get('final_plan'):
            print(f"\n  ✅ Final plan generated successfully!")
            print(f"     Confidence: {result['final_plan']['confidence_score'] * 100:.1f}%")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)


def test_budget_scenarios():
    """Test different budget scenarios"""
    print("\n💰 Testing Multiple Budget Scenarios...\n")

    scenarios = [
        ("Low Budget", 25000, "cheapest", "budget"),
        ("Medium Budget", 50000, "balanced", "mid_range"),
        ("High Budget", 100000, "comfort", "luxury")
    ]

    start_date = (datetime.now() + timedelta(days=30)).date()

    for name, budget, preference, accommodation in scenarios:
        print(f"\n{'─' * 60}")
        print(f"  {name}: ₹{budget} ({preference})")
        print(f"{'─' * 60}")

        request_data = {
            "customer_name": f"{name} Test",
            "customer_email": "test@example.com",
            "customer_phone": "+919876543210",
            "total_budget": budget,
            "cities": [
                {
                    "city": "Pune",
                    "duration_days": 1,
                    "arrival_date": str(start_date),
                    "departure_date": str(start_date + timedelta(days=1))
                },
                {
                    "city": "Mumbai",
                    "duration_days": 2,
                    "arrival_date": str(start_date + timedelta(days=1)),
                    "departure_date": str(start_date + timedelta(days=3))
                }
            ],
            "preference": preference,
            "number_of_travelers": 2,
            "accommodation_type": accommodation
        }

        response = requests.post(f"{API_URL}/plan", json=request_data)

        if response.status_code == 200:
            result = response.json()
            if result.get("success") and result.get("travel_plan"):
                plan = result["travel_plan"]
                print(f"  ✅ Plan created successfully")
                print(f"  Budget Utilization: {plan['budget_breakdown']['budget_utilization_percent']:.1f}%")
                print(f"  Remaining: ₹{plan['budget_breakdown']['remaining_budget']:.2f}")
                print(f"  Confidence: {plan['confidence_score'] * 100:.1f}%")

                # Show transport modes used
                modes = set(leg['transport']['mode'] for leg in plan['itinerary'])
                print(f"  Transport Modes: {', '.join(modes)}")
            else:
                print(f"  ❌ {result.get('message')}")
        else:
            print(f"  ❌ Error: {response.status_code}")


def main():
    """Run all tests"""
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║         AI Orchestrator API Test Suite                      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """)

    try:
        # Basic tests
        test_health_check()
        test_get_cities()
        test_calculate_distance()

        # Main functionality
        test_create_plan()

        # Simulation (for judges demo)
        test_simulate_plan()

        # Budget scenarios
        test_budget_scenarios()

        print("\n" + "=" * 60)
        print("  ✅ ALL TESTS COMPLETED!")
        print("=" * 60 + "\n")

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API server!")
        print("   Make sure the server is running at http://localhost:8000")
        print("   Run: python main.py\n")
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")


if __name__ == "__main__":
    main()
