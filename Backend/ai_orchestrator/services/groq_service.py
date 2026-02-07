"""
Groq LLM Service for Intelligent AI Orchestration

This service uses Groq's fast LLM inference to make intelligent decisions
about travel planning, transport selection, and budget optimization.
"""
from typing import Dict, Any, List, Optional
import json
from groq import Groq
from config import settings


class GroqLLMService:
    """
    Intelligent LLM service using Groq for travel orchestration decisions.

    Uses Mixtral-8x7b for:
    - Intelligent transport mode selection
    - Budget allocation recommendations
    - Hotel recommendations
    - Itinerary optimization
    - Natural language responses for UI
    """

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL
        self.enabled = settings.USE_GROQ_LLM

    async def get_transport_recommendation(
        self,
        from_city: str,
        to_city: str,
        distance_km: float,
        budget_available: float,
        travelers: int,
        preference: str
    ) -> Dict[str, Any]:
        """
        Use LLM to intelligently recommend transport mode with reasoning.
        """
        if not self.enabled:
            return self._fallback_transport_decision(distance_km, preference)

        prompt = f"""You are an expert travel planner AI. Analyze this journey and recommend the best transport mode.

Journey Details:
- From: {from_city}
- To: {to_city}
- Distance: {distance_km:.1f} km
- Budget Available: ₹{budget_available:.0f}
- Number of Travelers: {travelers}
- Preference: {preference}

Available Options:
1. FLIGHT - Fast but expensive (₹3500-5000 base + distance)
2. TRAIN - Balanced speed and cost (₹800-1500 base)
3. BUS - Cheapest option (₹400-800 base)
4. CAB - Convenient for short distances (₹800-1500 base)
5. RENTAL_CAR - Good for groups (₹1500-2500 base)

Analyze and respond in JSON format:
{{
    "recommended_mode": "FLIGHT/TRAIN/BUS/CAB/RENTAL_CAR",
    "estimated_cost_per_person": 3500,
    "estimated_duration_minutes": 120,
    "reasoning": "Brief explanation of why this is optimal",
    "provider_suggested": "IndiGo/Indian Railways/etc",
    "confidence": 0.95
}}

Response:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert travel planning AI. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )

            result_text = response.choices[0].message.content.strip()

            # Extract JSON from response
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            return result

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return self._fallback_transport_decision(distance_km, preference)

    async def get_accommodation_recommendation(
        self,
        city: str,
        budget_per_night: float,
        duration_days: int,
        travelers: int,
        accommodation_type: str
    ) -> Dict[str, Any]:
        """
        Use LLM to recommend accommodation with intelligent reasoning.
        """
        if not self.enabled:
            return self._fallback_accommodation_decision(budget_per_night)

        prompt = f"""You are an expert travel accommodation advisor. Recommend the best hotel option.

Accommodation Search:
- City: {city}
- Budget per Night: ₹{budget_per_night:.0f}
- Duration: {duration_days} nights
- Travelers: {travelers}
- Preference: {accommodation_type}

Budget Tiers:
- Budget (< ₹1500): OYO, basic hotels
- Mid-range (₹1500-3000): Treebo, FabHotel
- Premium (₹3000-5000): Lemon Tree, Ginger Hotel
- Luxury (> ₹5000): Taj, Marriott, 5-star

Respond in JSON format:
{{
    "hotel_name": "Specific hotel name for {city}",
    "hotel_category": "Budget/Mid-range/Premium/Luxury",
    "cost_per_night": 2200,
    "rating": 4.2,
    "amenities": ["WiFi", "AC", "Breakfast"],
    "location_quality": "Near city center/Airport accessible/Tourist area",
    "reasoning": "Why this hotel is optimal for the budget and requirements",
    "confidence": 0.90
}}

Response:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert hotel recommendation AI. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.4,
                max_tokens=500
            )

            result_text = response.choices[0].message.content.strip()

            # Extract JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            return result

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return self._fallback_accommodation_decision(budget_per_night)

    async def generate_travel_insights(
        self,
        cities: List[str],
        total_budget: float,
        duration_days: int,
        travelers: int,
        preference: str
    ) -> Dict[str, Any]:
        """
        Generate intelligent travel insights and recommendations for the UI.
        """
        if not self.enabled:
            return {"insights": ["Plan created successfully"], "tips": []}

        prompt = f"""You are a travel expert AI. Provide insights and tips for this trip.

Trip Overview:
- Cities: {', '.join(cities)}
- Total Budget: ₹{total_budget:.0f}
- Duration: {duration_days} days
- Travelers: {travelers}
- Preference: {preference}

Generate helpful insights and tips. Respond in JSON:
{{
    "trip_summary": "Brief engaging summary of the trip",
    "budget_insight": "Analysis of the budget (tight/comfortable/generous)",
    "best_time_to_visit": "Recommendation for these cities",
    "insider_tips": ["Tip 1", "Tip 2", "Tip 3"],
    "must_see_attractions": ["Attraction 1 in City X", "Attraction 2 in City Y"],
    "food_recommendations": ["Food recommendation 1", "Food recommendation 2"],
    "packing_suggestions": ["Item 1", "Item 2", "Item 3"],
    "overall_sentiment": "exciting/adventurous/relaxing"
}}

Response:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a friendly travel expert. Always respond with valid JSON only. Be enthusiastic and helpful."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=800
            )

            result_text = response.choices[0].message.content.strip()

            # Extract JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            return result

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return {
                "trip_summary": f"Amazing {duration_days}-day journey across {len(cities)} cities!",
                "budget_insight": "Budget allocation looks good",
                "insider_tips": ["Book in advance", "Try local food", "Use public transport"],
                "overall_sentiment": "exciting"
            }

    async def generate_ui_friendly_plan_summary(
        self,
        plan_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate a UI-friendly summary with natural language for mobile app.
        """
        if not self.enabled:
            return {
                "title": "Your Travel Plan is Ready!",
                "summary": "We've created an optimized travel plan for you.",
                "highlights": []
            }

        prompt = f"""You are a travel concierge AI. Create a friendly, engaging summary for the user's mobile app.

Travel Plan Data:
{json.dumps(plan_data, indent=2)}

Generate a warm, friendly summary that the user will see in their mobile app. Respond in JSON:
{{
    "title": "Exciting engaging title",
    "summary": "2-3 sentence friendly overview",
    "highlights": [
        "Highlight 1 (e.g., 'Save ₹5,000 with smart train choices')",
        "Highlight 2 (e.g., 'Stay in comfortable 4-star hotels')",
        "Highlight 3 (e.g., 'Perfect balance of budget and comfort')"
    ],
    "money_saved": "Estimated savings compared to alternatives",
    "comfort_level": "Budget-friendly/Balanced/Premium/Luxury",
    "recommended_actions": ["Action 1", "Action 2"]
}}

Response:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a friendly travel concierge. Create warm, engaging messages. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.6,
                max_tokens=600
            )

            result_text = response.choices[0].message.content.strip()

            # Extract JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)
            return result

        except Exception as e:
            print(f"Groq LLM error: {e}")
            return {
                "title": "Your Travel Plan is Ready!",
                "summary": "We've optimized your journey for the best experience.",
                "highlights": ["Smart route planning", "Budget optimized", "Excellent accommodations"]
            }

    def _fallback_transport_decision(self, distance_km: float, preference: str) -> Dict[str, Any]:
        """Fallback logic if LLM fails."""
        if distance_km > 800:
            return {
                "recommended_mode": "FLIGHT",
                "estimated_cost_per_person": 4000,
                "estimated_duration_minutes": 120,
                "reasoning": "Long distance - flight is most efficient",
                "confidence": 0.85
            }
        elif distance_km > 400:
            return {
                "recommended_mode": "TRAIN",
                "estimated_cost_per_person": 1200,
                "estimated_duration_minutes": 300,
                "reasoning": "Medium distance - train offers good balance",
                "confidence": 0.85
            }
        else:
            return {
                "recommended_mode": "BUS",
                "estimated_cost_per_person": 600,
                "estimated_duration_minutes": 240,
                "reasoning": "Short distance - bus is economical",
                "confidence": 0.85
            }

    def _fallback_accommodation_decision(self, budget_per_night: float) -> Dict[str, Any]:
        """Fallback logic if LLM fails."""
        if budget_per_night < 1500:
            return {
                "hotel_category": "Budget",
                "cost_per_night": 1200,
                "rating": 3.5,
                "amenities": ["WiFi", "AC"],
                "confidence": 0.80
            }
        elif budget_per_night < 3000:
            return {
                "hotel_category": "Mid-range",
                "cost_per_night": 2200,
                "rating": 4.0,
                "amenities": ["WiFi", "AC", "Breakfast"],
                "confidence": 0.80
            }
        else:
            return {
                "hotel_category": "Premium",
                "cost_per_night": 3800,
                "rating": 4.5,
                "amenities": ["WiFi", "AC", "Breakfast", "Gym", "Pool"],
                "confidence": 0.80
            }


# Global instance
groq_service = GroqLLMService()
