"""
Budget Recommendations API - AI-Powered Package Suggestions
Uses Groq LLM to generate intelligent travel package recommendations based on budget
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import uuid
import random
from datetime import datetime, timedelta

from services.groq_service import groq_service

router = APIRouter()


class BudgetRequest(BaseModel):
    budget_min: float
    budget_max: float
    num_travelers: int = 2
    preferences: Optional[Dict[str, Any]] = None
    duration_days: Optional[int] = None


class Package(BaseModel):
    package_id: str
    package_name: str
    destination: str
    price_per_person: float
    total_cost: float
    savings_percent: float
    match_score: int
    recommendation_reason: str
    duration_days: int
    included_items: List[str]
    highlights: List[str]


class BudgetRecommendationResponse(BaseModel):
    success: bool
    packages: List[Package]
    total_found: int
    budget_analysis: str
    ai_insights: str
    powered_by: str = "Groq LLM (Mixtral-8x7b)"


@router.post("/recommendations", response_model=BudgetRecommendationResponse)
async def get_budget_recommendations(request: BudgetRequest):
    """
    Get AI-powered travel package recommendations based on budget.

    Uses Groq LLM to:
    1. Analyze budget range and traveler count
    2. Generate intelligent destination suggestions
    3. Create personalized package recommendations
    4. Provide insights on budget optimization

    Perfect for the Budget Smart feature in mobile app!
    """
    try:
        # Validate budget
        if request.budget_min <= 0 or request.budget_max <= 0:
            raise HTTPException(status_code=400, detail="Budget must be positive")

        if request.budget_min >= request.budget_max:
            raise HTTPException(
                status_code=400,
                detail="Minimum budget must be less than maximum budget"
            )

        if request.num_travelers <= 0:
            raise HTTPException(status_code=400, detail="Number of travelers must be positive")

        # Calculate budget per person
        budget_per_person = request.budget_max / request.num_travelers

        # Use Groq LLM to generate intelligent recommendations
        packages = await generate_ai_packages(
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            num_travelers=request.num_travelers,
            budget_per_person=budget_per_person,
            preferences=request.preferences or {},
            duration_days=request.duration_days or 5
        )

        # Generate budget analysis using Groq
        budget_analysis = await analyze_budget_with_ai(
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            num_travelers=request.num_travelers,
            packages_found=len(packages)
        )

        # Generate AI insights
        ai_insights = await generate_travel_insights(
            packages=packages,
            budget_range=(request.budget_min, request.budget_max),
            num_travelers=request.num_travelers
        )

        return BudgetRecommendationResponse(
            success=True,
            packages=packages,
            total_found=len(packages),
            budget_analysis=budget_analysis,
            ai_insights=ai_insights
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )


async def generate_ai_packages(
    budget_min: float,
    budget_max: float,
    num_travelers: int,
    budget_per_person: float,
    preferences: Dict,
    duration_days: int
) -> List[Package]:
    """
    Generate intelligent package recommendations using Groq LLM.
    """

    # Build prompt for Groq
    prompt = f"""You are a travel package expert. Generate 5-8 diverse travel package recommendations based on these parameters:

Budget Range: ₹{budget_min:,.0f} - ₹{budget_max:,.0f}
Number of Travelers: {num_travelers}
Budget Per Person: ₹{budget_per_person:,.0f}
Trip Duration: {duration_days} days

Requirements:
1. Create packages across different price points within the budget range
2. Include both popular and offbeat destinations in India
3. Consider different travel styles (adventure, relaxation, cultural, beach, mountains)
4. At least 2 packages should be significantly under budget (show savings)
5. Each package should have a unique selling point

For EACH package, provide:
- Package Name (creative and descriptive)
- Destination (specific city/region in India)
- Price Per Person
- Why it's a great match (recommendation reason - be specific and persuasive)
- Match Score (0-100 based on value for money)
- 4-5 included items (flights, hotels, meals, activities)
- 3-4 highlights (unique experiences or attractions)

Format your response as a JSON array of packages. Use realistic Indian destinations and pricing."""

    try:
        # Call Groq LLM
        response = groq_service.client.chat.completions.create(
            model=groq_service.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert travel package curator specializing in Indian destinations. You provide detailed, accurate, and persuasive package recommendations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=2000
        )

        llm_response = response.choices[0].message.content.strip()

        # Parse LLM response and create packages
        packages = parse_llm_packages(
            llm_response,
            budget_min,
            budget_max,
            num_travelers,
            duration_days
        )

        return packages

    except Exception as e:
        print(f"LLM generation error: {e}")
        # Fallback to intelligent default packages
        return generate_fallback_packages(
            budget_min,
            budget_max,
            num_travelers,
            duration_days
        )


def parse_llm_packages(
    llm_response: str,
    budget_min: float,
    budget_max: float,
    num_travelers: int,
    duration_days: int
) -> List[Package]:
    """
    Parse LLM response and create Package objects.
    """
    import json
    import re

    packages = []

    try:
        # Try to extract JSON from response
        json_match = re.search(r'\[.*\]', llm_response, re.DOTALL)
        if json_match:
            packages_data = json.loads(json_match.group(0))

            for pkg_data in packages_data:
                price_per_person = float(pkg_data.get('price_per_person', budget_max / num_travelers))
                total_cost = price_per_person * num_travelers

                # Calculate savings if under budget
                savings_percent = 0
                if total_cost < budget_max:
                    savings_percent = ((budget_max - total_cost) / budget_max) * 100

                package = Package(
                    package_id=str(uuid.uuid4()),
                    package_name=pkg_data.get('package_name', 'Travel Package'),
                    destination=pkg_data.get('destination', 'India'),
                    price_per_person=price_per_person,
                    total_cost=total_cost,
                    savings_percent=savings_percent,
                    match_score=int(pkg_data.get('match_score', 85)),
                    recommendation_reason=pkg_data.get('recommendation_reason', 'Great value package'),
                    duration_days=duration_days,
                    included_items=pkg_data.get('included_items', []),
                    highlights=pkg_data.get('highlights', [])
                )

                # Only include packages within budget
                if budget_min <= total_cost <= budget_max:
                    packages.append(package)

        return packages if packages else generate_fallback_packages(
            budget_min, budget_max, num_travelers, duration_days
        )

    except Exception as e:
        print(f"Parse error: {e}")
        return generate_fallback_packages(
            budget_min, budget_max, num_travelers, duration_days
        )


def generate_fallback_packages(
    budget_min: float,
    budget_max: float,
    num_travelers: int,
    duration_days: int
) -> List[Package]:
    """
    Generate intelligent fallback packages when LLM fails.
    """

    destinations = [
        {
            "name": "Goa Beach Paradise",
            "destination": "Goa",
            "percent_of_max": 0.75,
            "reason": "Perfect blend of beaches, nightlife, and water sports. Includes beachfront resort stay and water activities.",
            "score": 92,
            "included": ["Round-trip flights", "4★ beachfront hotel", "Daily breakfast", "Water sports", "Airport transfers"],
            "highlights": ["Calangute Beach", "Dudhsagar Falls", "Fort Aguada", "Beach parties"]
        },
        {
            "name": "Himalayan Adventure Trek",
            "destination": "Manali, Himachal Pradesh",
            "percent_of_max": 0.85,
            "reason": "Breathtaking mountain views with adventure activities. Perfect for nature lovers and thrill seekers.",
            "score": 88,
            "included": ["Round-trip flights", "Mountain resort", "All meals", "Trekking gear", "Professional guide"],
            "highlights": ["Rohtang Pass", "Solang Valley", "Paragliding", "River rafting"]
        },
        {
            "name": "Rajasthan Royal Heritage",
            "destination": "Jaipur - Udaipur",
            "percent_of_max": 0.90,
            "reason": "Explore majestic forts and palaces. Rich cultural experience with traditional Rajasthani hospitality.",
            "score": 90,
            "included": ["Round-trip flights", "Heritage hotels", "Daily breakfast", "Palace tours", "Cultural shows"],
            "highlights": ["Amber Fort", "City Palace", "Lake Pichola", "Traditional dinner"]
        },
        {
            "name": "Kerala Backwaters Retreat",
            "destination": "Alleppey, Kerala",
            "percent_of_max": 0.70,
            "reason": "Serene houseboat experience through lush backwaters. Includes Ayurvedic spa and traditional Kerala cuisine.",
            "score": 94,
            "included": ["Round-trip flights", "Houseboat stay", "All meals", "Ayurvedic massage", "Village tours"],
            "highlights": ["Backwater cruise", "Kumarakom Bird Sanctuary", "Spice plantations", "Kathakali dance"]
        },
        {
            "name": "Mumbai & Pune City Explorer",
            "destination": "Mumbai - Pune",
            "percent_of_max": 0.65,
            "reason": "Urban exploration package with heritage sites. Great shopping, food, and nightlife experiences.",
            "score": 86,
            "included": ["Round-trip train", "4★ city hotels", "Daily breakfast", "City tours", "Local transport"],
            "highlights": ["Gateway of India", "Marine Drive", "Shaniwar Wada", "Street food tours"]
        },
        {
            "name": "Andaman Island Paradise",
            "destination": "Port Blair - Havelock",
            "percent_of_max": 0.95,
            "reason": "Pristine beaches and world-class diving. Includes water activities and beach resort stay.",
            "score": 96,
            "included": ["Round-trip flights", "Beach resorts", "All meals", "Scuba diving", "Island hopping"],
            "highlights": ["Radhanagar Beach", "Cellular Jail", "Scuba diving", "Coral reefs"]
        },
        {
            "name": "Ladakh High Altitude Adventure",
            "destination": "Leh - Ladakh",
            "percent_of_max": 0.88,
            "reason": "Ultimate mountain adventure with stunning landscapes. Includes monasteries, lakes, and high passes.",
            "score": 91,
            "included": ["Round-trip flights", "Mountain hotels", "All meals", "Bike rental", "Oxygen support"],
            "highlights": ["Pangong Lake", "Nubra Valley", "Khardung La Pass", "Monasteries"]
        },
        {
            "name": "Mysore Cultural Heritage",
            "destination": "Mysore - Coorg",
            "percent_of_max": 0.60,
            "reason": "Best value package! Royal palaces, coffee plantations, and wildlife. Perfect for families.",
            "score": 89,
            "included": ["Round-trip train", "Heritage hotels", "Daily breakfast", "Palace entry", "Plantation tour"],
            "highlights": ["Mysore Palace", "Coorg coffee estates", "Abbey Falls", "Nagarhole National Park"]
        }
    ]

    packages = []

    # Select 5-7 random destinations
    selected_destinations = random.sample(destinations, min(7, len(destinations)))

    for dest in selected_destinations:
        # Calculate price based on percentage of max budget
        price_per_person = (budget_max / num_travelers) * dest["percent_of_max"]
        total_cost = price_per_person * num_travelers

        # Only include if within budget range
        if budget_min <= total_cost <= budget_max:
            savings_percent = ((budget_max - total_cost) / budget_max) * 100

            package = Package(
                package_id=str(uuid.uuid4()),
                package_name=dest["name"],
                destination=dest["destination"],
                price_per_person=round(price_per_person, 2),
                total_cost=round(total_cost, 2),
                savings_percent=round(savings_percent, 2),
                match_score=dest["score"],
                recommendation_reason=dest["reason"],
                duration_days=duration_days,
                included_items=dest["included"],
                highlights=dest["highlights"]
            )
            packages.append(package)

    # Sort by match score
    packages.sort(key=lambda x: x.match_score, reverse=True)

    return packages


async def analyze_budget_with_ai(
    budget_min: float,
    budget_max: float,
    num_travelers: int,
    packages_found: int
) -> str:
    """
    Generate budget analysis using Groq LLM.
    """

    prompt = f"""Analyze this travel budget and provide a brief, encouraging summary (2-3 sentences max):

Budget Range: ₹{budget_min:,.0f} - ₹{budget_max:,.0f}
Travelers: {num_travelers}
Packages Found: {packages_found}

Provide a friendly analysis mentioning:
1. What type of trips this budget is suitable for
2. Value assessment (good/excellent budget range)
3. Quick tip to maximize value

Keep it conversational and positive."""

    try:
        response = groq_service.client.chat.completions.create(
            model=groq_service.model,
            messages=[
                {"role": "system", "content": "You are a helpful travel budget advisor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=150
        )

        return response.choices[0].message.content.strip()

    except:
        # Fallback analysis
        budget_per_person = budget_max / num_travelers
        if budget_per_person < 10000:
            return f"Great budget for exploring nearby destinations! Your ₹{budget_max:,.0f} budget is perfect for weekend getaways and short trips. {packages_found} packages are ready for you to explore."
        elif budget_per_person < 30000:
            return f"Excellent budget range! With ₹{budget_max:,.0f}, you can enjoy comfortable stays and diverse experiences. We've found {packages_found} amazing packages tailored to your preferences."
        else:
            return f"Premium budget detected! Your ₹{budget_max:,.0f} budget opens doors to luxury experiences. {packages_found} handpicked packages await, each offering exceptional value and memorable experiences."


async def generate_travel_insights(
    packages: List[Package],
    budget_range: tuple,
    num_travelers: int
) -> str:
    """
    Generate AI insights about the recommended packages.
    """

    if not packages:
        return "Adjust your budget range to discover more amazing packages!"

    destinations = [p.destination for p in packages]
    avg_match_score = sum(p.match_score for p in packages) / len(packages)

    prompt = f"""Based on these travel packages, provide ONE quick insider tip (1 sentence):

Destinations: {', '.join(destinations[:3])}
Budget: ₹{budget_range[0]:,.0f} - ₹{budget_range[1]:,.0f}
Travelers: {num_travelers}
Average Match Score: {avg_match_score:.0f}%

Give ONE actionable tip about:
- Best time to visit these destinations
- How to save more money
- Hidden gems to explore

Be specific and helpful."""

    try:
        response = groq_service.client.chat.completions.create(
            model=groq_service.model,
            messages=[
                {"role": "system", "content": "You are a knowledgeable travel advisor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=100
        )

        return response.choices[0].message.content.strip()

    except:
        # Fallback insight
        best_package = max(packages, key=lambda x: x.match_score)
        return f"💡 Pro tip: {best_package.destination} offers the best value this season. Book 2-3 months in advance for additional savings!"


@router.get("/destinations")
async def get_popular_destinations():
    """
    Get list of popular travel destinations with price ranges.
    Useful for UI suggestions.
    """
    return {
        "destinations": [
            {
                "name": "Goa",
                "type": "Beach",
                "price_range": "₹15,000 - ₹40,000",
                "best_for": "Beaches, nightlife, water sports",
                "icon": "🏖️"
            },
            {
                "name": "Manali",
                "type": "Mountains",
                "price_range": "₹20,000 - ₹50,000",
                "best_for": "Adventure, trekking, snow",
                "icon": "🏔️"
            },
            {
                "name": "Jaipur",
                "type": "Heritage",
                "price_range": "₹18,000 - ₹45,000",
                "best_for": "Forts, palaces, culture",
                "icon": "🏰"
            },
            {
                "name": "Kerala",
                "type": "Nature",
                "price_range": "₹22,000 - ₹55,000",
                "best_for": "Backwaters, houseboats, Ayurveda",
                "icon": "🌴"
            },
            {
                "name": "Andaman",
                "type": "Island",
                "price_range": "₹35,000 - ₹80,000",
                "best_for": "Beaches, diving, coral reefs",
                "icon": "🏝️"
            },
            {
                "name": "Ladakh",
                "type": "Adventure",
                "price_range": "₹30,000 - ₹70,000",
                "best_for": "High altitude, biking, lakes",
                "icon": "⛰️"
            }
        ]
    }


@router.get("/budget-tips")
async def get_budget_tips():
    """
    Get general budget optimization tips using AI.
    """

    prompt = """Provide 5 concise travel budget tips for Indian travelers. Each tip should be:
- Actionable and specific
- Focus on saving money without compromising experience
- Relevant to domestic travel in India

Format: Just list the 5 tips, numbered 1-5."""

    try:
        response = groq_service.client.chat.completions.create(
            model=groq_service.model,
            messages=[
                {"role": "system", "content": "You are a budget travel expert for India."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        tips_text = response.choices[0].message.content.strip()

        return {
            "success": True,
            "tips": tips_text,
            "powered_by": "Groq LLM"
        }

    except:
        return {
            "success": True,
            "tips": """1. Book flights 2-3 months in advance for up to 40% savings
2. Travel during off-season (July-Sept, Dec-Jan) for better deals
3. Use local transport instead of taxis to cut costs by 60%
4. Choose homestays or budget hotels over luxury properties
5. Book packages instead of individual services for 20-30% discounts""",
            "powered_by": "TravelOps Insights"
        }
