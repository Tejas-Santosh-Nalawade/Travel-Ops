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

    async def extract_destinations_from_url(
        self,
        url: str,
        platform: str,
        total_days: int
    ) -> Dict[str, Any]:
        """
        Extract travel destinations from social media content using AI.

        Args:
            url: Instagram or YouTube URL
            platform: 'instagram' or 'youtube'
            total_days: Total trip duration to suggest proper number of cities

        Returns:
            Dict with destinations list and confidence score
        """
        # Import here to avoid circular dependency
        from services.social_media_fetcher import social_media_fetcher

        if not self.enabled:
            # Fallback destinations if LLM is disabled
            return {
                "destinations": ["Mumbai", "Goa"],
                "confidence": 0.5,
                "reasoning": "LLM disabled - using default destinations"
            }

        # Fetch actual content from social media
        print(f"Fetching content from {platform}: {url}")
        content_data = social_media_fetcher.fetch_content(url, platform)

        # Build context from actual content
        content_context = self._build_content_context(content_data, url, platform)

        prompt = f"""You are a travel content analyzer AI. Analyze this {platform} travel content and extract the destinations mentioned.

{content_context}

Expected trip duration: {total_days} days

IMPORTANT GUIDELINES:
1. Extract 2-5 major Indian cities that travelers would realistically visit
2. Suggest destinations that make sense geographically (connected routes)
3. If the content mentions specific locations, prioritize those
4. Popular combinations: Mumbai-Goa, Delhi-Jaipur-Agra, Bangalore-Mysore-Coorg, Chennai-Pondicherry

Respond in JSON format ONLY:
{{
    "destinations": ["City1", "City2", "City3"],
    "confidence": 0.85,
    "reasoning": "Brief explanation of why these destinations were selected",
    "travel_style": "adventure/relaxed/cultural/beach/mountains",
    "suggested_activities": ["Activity 1", "Activity 2"]
}}

Response:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing travel content and extracting destination information. Always respond with valid JSON only. Focus on realistic, popular Indian travel destinations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.5,
                max_tokens=600
            )

            result_text = response.choices[0].message.content.strip()

            # Extract JSON
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)

            # Validate we have at least 2 destinations
            if not result.get("destinations") or len(result["destinations"]) < 2:
                # Fallback destinations based on content or URL patterns
                result["destinations"] = self._get_fallback_destinations(content_data, url)
                result["confidence"] = 0.6
                result["reasoning"] = "Suggested popular destinations based on content analysis"

            return result

        except Exception as e:
            print(f"Groq LLM error in destination extraction: {e}")
            # Intelligent fallback based on content or URL
            return {
                "destinations": self._get_fallback_destinations(content_data, url),
                "confidence": 0.5,
                "reasoning": "Fallback destinations due to extraction error",
                "travel_style": "mixed",
                "suggested_activities": ["Sightseeing", "Local cuisine", "Photography"]
            }

    def _build_content_context(self, content_data: Dict[str, Any], url: str, platform: str) -> str:
        """
        Build context string from fetched content data.
        """
        context_parts = []

        if content_data.get('success'):
            # Real content was fetched
            if platform == 'youtube':
                context_parts.append(f"VIDEO TITLE: {content_data.get('title', 'N/A')}")
                context_parts.append(f"CHANNEL: {content_data.get('channel_name', 'N/A')}")

                description = content_data.get('description', '')
                if description:
                    # Limit description to first 500 chars for context
                    context_parts.append(f"DESCRIPTION: {description[:500]}...")

                tags = content_data.get('tags', [])
                if tags:
                    context_parts.append(f"TAGS: {', '.join(tags[:15])}")

                if content_data.get('limited'):
                    context_parts.append("NOTE: Limited metadata available (using oEmbed)")

            elif platform == 'instagram':
                context_parts.append(f"POST TITLE: {content_data.get('title', 'N/A')}")
                context_parts.append(f"AUTHOR: {content_data.get('author_name', 'N/A')}")

                location_hints = content_data.get('location_hints', [])
                if location_hints:
                    context_parts.append(f"LOCATION HINTS: {', '.join(location_hints)}")

        else:
            # Fallback data
            context_parts.append(f"URL: {url}")
            context_parts.append(f"Platform: {platform}")

            keywords = content_data.get('keywords', [])
            if keywords:
                context_parts.append(f"URL Keywords: {', '.join(keywords)}")
            else:
                context_parts.append("NOTE: Could not fetch content - analyzing URL structure")

        return "\n".join(context_parts)

    def _get_fallback_destinations(self, content_data: Dict[str, Any], url: str) -> List[str]:
        """
        Get fallback destinations based on content or URL analysis.
        """
        url_lower = url.lower()
        title = content_data.get('title', '').lower()
        description = content_data.get('description', '').lower()
        tags = [tag.lower() for tag in content_data.get('tags', [])]
        keywords = content_data.get('keywords', [])

        # Combine all text for analysis
        all_text = ' '.join([url_lower, title, description] + tags)

        # Check for specific regions/destinations
        if 'goa' in all_text or 'beach' in all_text:
            return ["Mumbai", "Goa", "Mangalore"]
        elif 'rajasthan' in all_text or 'desert' in all_text or 'jaipur' in all_text:
            return ["Delhi", "Jaipur", "Jodhpur"]
        elif 'kerala' in all_text or 'backwater' in all_text:
            return ["Kochi", "Munnar", "Alleppey"]
        elif 'himalaya' in all_text or 'mountain' in all_text or 'ladakh' in all_text:
            return ["Delhi", "Manali", "Leh"]
        elif 'south' in all_text or 'bangalore' in all_text or 'mysore' in all_text:
            return ["Bangalore", "Mysore", "Coorg"]
        elif 'mumbai' in all_text:
            return ["Mumbai", "Pune", "Lonavala"]
        elif 'delhi' in all_text or 'agra' in all_text:
            return ["Delhi", "Agra", "Jaipur"]
        else:
            # Generic popular route
            return ["Mumbai", "Pune", "Goa"]

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
