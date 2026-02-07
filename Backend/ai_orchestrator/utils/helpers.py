"""
Utility functions for the AI Orchestrator
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json


def format_currency(amount: float) -> str:
    """Format amount in Indian Rupees"""
    return f"₹{amount:,.2f}"


def format_duration(minutes: int) -> str:
    """Format duration in human-readable format"""
    hours = minutes // 60
    mins = minutes % 60

    if hours == 0:
        return f"{mins}m"
    elif mins == 0:
        return f"{hours}h"
    else:
        return f"{hours}h {mins}m"


def calculate_travel_time_hours(distance_km: float, speed_kmh: float) -> float:
    """Calculate travel time in hours"""
    return distance_km / speed_kmh


def get_transport_speed(mode: str) -> float:
    """Get average speed for transport mode in km/h"""
    speeds = {
        "flight": 600,
        "train": 70,
        "bus": 50,
        "cab": 60,
        "rental_car": 60
    }
    return speeds.get(mode.lower(), 50)


def validate_date_range(start_date: datetime, end_date: datetime) -> bool:
    """Validate that end date is after start date"""
    return end_date > start_date


def calculate_nights(check_in: datetime, check_out: datetime) -> int:
    """Calculate number of nights between check-in and check-out"""
    return (check_out.date() - check_in.date()).days


def estimate_food_cost_per_day(city: str, accommodation_type: str) -> float:
    """Estimate daily food cost based on city and accommodation type"""
    base_costs = {
        "budget": 800,
        "mid_range": 1200,
        "luxury": 2000
    }

    # Tier 1 cities cost more
    tier1_cities = ["mumbai", "bangalore", "delhi", "hyderabad", "pune", "chennai"]

    base = base_costs.get(accommodation_type.lower(), 1000)

    if city.lower() in tier1_cities:
        return base * 1.2
    else:
        return base


def generate_plan_summary(plan: Dict[str, Any]) -> str:
    """Generate a human-readable summary of the travel plan"""
    summary_parts = []

    cities = [leg.get("to_city") for leg in plan.get("itinerary", [])]
    summary_parts.append(f"Multi-city trip covering {', '.join(cities)}")

    budget = plan.get("budget_breakdown", {})
    summary_parts.append(
        f"Total cost: {format_currency(budget.get('total_budget', 0) - budget.get('remaining_budget', 0))}"
    )

    return ". ".join(summary_parts)


def get_city_tier(city: str) -> str:
    """Get tier classification of city"""
    tier1 = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "kolkata", "pune", "ahmedabad"]
    tier2 = ["jaipur", "lucknow", "kochi", "chandigarh", "indore", "nagpur", "goa"]

    city_lower = city.lower()
    if city_lower in tier1:
        return "tier1"
    elif city_lower in tier2:
        return "tier2"
    else:
        return "tier3"


def calculate_carbon_footprint(mode: str, distance_km: float, passengers: int) -> float:
    """
    Calculate carbon footprint in kg CO2

    Emission factors (kg CO2 per km per passenger):
    - Flight: 0.12
    - Train: 0.04
    - Bus: 0.05
    - Car/Cab: 0.15
    """
    emission_factors = {
        "flight": 0.12,
        "train": 0.04,
        "bus": 0.05,
        "cab": 0.15,
        "rental_car": 0.15
    }

    factor = emission_factors.get(mode.lower(), 0.1)
    return factor * distance_km * passengers


def suggest_activities(city: str, duration_days: int, budget: float) -> List[str]:
    """Suggest activities based on city and available budget"""
    city_activities = {
        "mumbai": ["Gateway of India", "Marine Drive", "Elephanta Caves", "Bollywood Tour"],
        "bangalore": ["Lalbagh Garden", "Bangalore Palace", "Cubbon Park", "ISRO Space Museum"],
        "pune": ["Shaniwar Wada", "Aga Khan Palace", "Sinhagad Fort", "Osho Ashram"],
        "delhi": ["Red Fort", "Qutub Minar", "India Gate", "Lotus Temple"],
        "goa": ["Beaches", "Fort Aguada", "Dudhsagar Falls", "Water Sports"],
        "jaipur": ["Amber Fort", "City Palace", "Hawa Mahal", "Jantar Mantar"]
    }

    activities = city_activities.get(city.lower(), ["Local sightseeing", "Food tour", "Shopping"])

    # Return activities based on duration
    return activities[:min(duration_days * 2, len(activities))]


def validate_budget_feasibility(
    total_budget: float,
    num_travelers: int,
    num_cities: int,
    duration_days: int
) -> tuple[bool, str]:
    """
    Validate if budget is feasible for the trip

    Returns: (is_feasible, message)
    """
    min_per_person_per_day = 1500
    min_required = min_per_person_per_day * num_travelers * duration_days

    if total_budget < min_required:
        return False, f"Budget too low. Minimum required: ₹{min_required:,.0f} for {num_travelers} traveler(s) for {duration_days} days"

    # Check if budget is reasonable
    avg_per_person_per_day = total_budget / num_travelers / duration_days

    if avg_per_person_per_day < 2000:
        return True, "Budget is tight. Expect budget accommodations and transport options."
    elif avg_per_person_per_day < 5000:
        return True, "Budget is good for comfortable mid-range travel."
    else:
        return True, "Budget allows for comfortable or luxury options."


def get_best_time_to_book(departure_date: datetime) -> Dict[str, Any]:
    """Suggest best time to book based on departure date"""
    days_until_departure = (departure_date.date() - datetime.now().date()).days

    if days_until_departure < 7:
        return {
            "urgency": "high",
            "message": "Book immediately! Prices increase closer to departure.",
            "expected_savings": 0
        }
    elif days_until_departure < 30:
        return {
            "urgency": "medium",
            "message": "Book soon for better prices.",
            "expected_savings": 10
        }
    else:
        return {
            "urgency": "low",
            "message": "You have time to find deals and compare options.",
            "expected_savings": 25
        }
