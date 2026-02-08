import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
from geopy.distance import geodesic
import json

from models.schemas import (
    TravelRequest, TravelPlan, TravelItinerary, TransportOption,
    AccommodationOption, LocalTransportOption, BudgetBreakdown,
    TransportMode, TravelPreference, SimulationStep
)
from services.groq_service import groq_service


class TravelOrchestratorAgent:
    """
    AI Agent that orchestrates multi-city travel planning with intelligent decision making.

    This agent analyzes travel requirements, budget constraints, and preferences to:
    1. Select optimal transport modes (flights, trains, buses, cabs)
    2. Choose accommodation based on budget and preferences
    3. Calculate routes for multi-city travel
    4. Optimize total costs while meeting requirements
    """

    def __init__(self):
        self.city_coordinates = self._load_city_coordinates()
        self.simulation_steps: List[SimulationStep] = []

    def _load_city_coordinates(self) -> Dict[str, Tuple[float, float]]:
        """Load coordinates for major Indian cities"""
        return {
            "pune": (18.5204, 73.8567),
            "mumbai": (19.0760, 72.8777),
            "bangalore": (12.9716, 77.5946),
            "delhi": (28.7041, 77.1025),
            "hyderabad": (17.3850, 78.4867),
            "chennai": (13.0827, 80.2707),
            "kolkata": (22.5726, 88.3639),
            "ahmedabad": (23.0225, 72.5714),
            "jaipur": (26.9124, 75.7873),
            "lucknow": (26.8467, 80.9462),
            "goa": (15.2993, 74.1240),
            "kochi": (9.9312, 76.2673),
            "chandigarh": (30.7333, 76.7794),
            "indore": (22.7196, 75.8577),
            "nagpur": (21.1458, 79.0882),
        }

    def _add_simulation_step(self, action: str, description: str, status: str, details: Dict[str, Any]):
        """Add a step to simulation tracking"""
        step = SimulationStep(
            step_number=len(self.simulation_steps) + 1,
            action=action,
            description=description,
            status=status,
            details=details
        )
        self.simulation_steps.append(step)
        return step

    def calculate_distance(self, city1: str, city2: str) -> float:
        """Calculate distance between two cities in kilometers"""
        city1_lower = city1.lower()
        city2_lower = city2.lower()

        if city1_lower not in self.city_coordinates or city2_lower not in self.city_coordinates:
            # Default distance if cities not found
            return 500.0

        coords1 = self.city_coordinates[city1_lower]
        coords2 = self.city_coordinates[city2_lower]

        return geodesic(coords1, coords2).kilometers

    async def extract_destinations_from_social_media(
        self,
        social_media_url: str,
        platform: str,
        total_days: int
    ) -> List[str]:
        """
        Extract travel destinations from social media content using AI.

        Args:
            social_media_url: URL of Instagram post/reel or YouTube video
            platform: 'instagram' or 'youtube'
            total_days: Total trip duration to help allocate days per city

        Returns:
            List of city names extracted from the content
        """
        self._add_simulation_step(
            action="extract_social_media",
            description=f"Extracting destinations from {platform} URL",
            status="in_progress",
            details={"url": social_media_url, "platform": platform}
        )

        # Use Groq LLM to analyze the social media content
        extraction_result = await groq_service.extract_destinations_from_url(
            url=social_media_url,
            platform=platform,
            total_days=total_days
        )

        destinations = extraction_result.get("destinations", [])

        self.simulation_steps[-1].status = "completed"
        self.simulation_steps[-1].details.update({
            "destinations_found": destinations,
            "extraction_confidence": extraction_result.get("confidence", 0.8)
        })

        return destinations

    async def analyze_travel_request(self, request: TravelRequest) -> Dict[str, Any]:
        """Initial analysis of travel request"""
        self._add_simulation_step(
            action="analyze_request",
            description=f"Analyzing travel request for {len(request.cities)} cities",
            status="in_progress",
            details={
                "cities": [city.city for city in request.cities],
                "budget": request.total_budget,
                "travelers": request.number_of_travelers
            }
        )

        total_distance = 0
        for i in range(len(request.cities) - 1):
            distance = self.calculate_distance(
                request.cities[i].city,
                request.cities[i + 1].city
            )
            total_distance += distance

        analysis = {
            "total_cities": len(request.cities),
            "total_distance_km": total_distance,
            "total_duration_days": sum(city.duration_days for city in request.cities),
            "budget_per_person": request.total_budget / request.number_of_travelers,
            "estimated_daily_budget": request.total_budget / sum(city.duration_days for city in request.cities) if sum(city.duration_days for city in request.cities) > 0 else 0
        }

        self.simulation_steps[-1].status = "completed"
        self.simulation_steps[-1].details.update(analysis)

        return analysis

    async def select_transport_mode(
        self,
        from_city: str,
        to_city: str,
        distance_km: float,
        budget_available: float,
        preference: TravelPreference,
        travelers: int
    ) -> TransportOption:
        """
        Intelligently select the best transport mode based on:
        - Distance
        - Budget
        - User preference
        - Number of travelers
        """
        self._add_simulation_step(
            action="select_transport",
            description=f"Selecting transport from {from_city} to {to_city}",
            status="in_progress",
            details={"distance_km": distance_km, "budget_available": budget_available}
        )

        # 🤖 USE GROQ LLM FOR INTELLIGENT DECISION MAKING
        llm_recommendation = await groq_service.get_transport_recommendation(
            from_city=from_city,
            to_city=to_city,
            distance_km=distance_km,
            budget_available=budget_available,
            travelers=travelers,
            preference=preference.value
        )

        # Extract LLM recommendations
        mode_str = llm_recommendation.get("recommended_mode", "TRAIN").upper()
        base_cost = llm_recommendation.get("estimated_cost_per_person", 1500)
        duration = llm_recommendation.get("estimated_duration_minutes", 180)
        provider = llm_recommendation.get("provider_suggested", "Transportation Provider")
        llm_reasoning = llm_recommendation.get("reasoning", "Optimal choice for this route")

        # Map string to TransportMode enum
        mode_mapping = {
            "FLIGHT": TransportMode.FLIGHT,
            "TRAIN": TransportMode.TRAIN,
            "BUS": TransportMode.BUS,
            "CAB": TransportMode.CAB,
            "RENTAL_CAR": TransportMode.RENTAL_CAR
        }
        mode = mode_mapping.get(mode_str, TransportMode.TRAIN)
        comfort_score = 8.0

        # Simulate AI thinking
        await asyncio.sleep(0.3)

        # FALLBACK: Rule-based logic if LLM gives unexpected results
        if base_cost <= 0 or duration <= 0:
            if distance_km > 800:
                # Long distance: prefer flights
                mode = TransportMode.FLIGHT
                base_cost = 3500 + (distance_km * 0.8)
                duration = 60 + (distance_km / 10)
                provider = "IndiGo/Air India/SpiceJet"
                comfort_score = 8.5
            elif distance_km > 400:
                # Medium distance: consider trains or flights based on preference
                if preference == TravelPreference.CHEAPEST:
                    mode = TransportMode.TRAIN
                    base_cost = 800 + (distance_km * 0.5)
                duration = distance_km / 60 * 60  # ~60 km/hr avg
                provider = "Indian Railways"
                comfort_score = 7.0
            elif preference == TravelPreference.FASTEST:
                mode = TransportMode.FLIGHT
                base_cost = 2500 + (distance_km * 0.8)
                duration = 60 + (distance_km / 10)
                provider = "IndiGo/Air India"
                comfort_score = 8.5
            else:  # BALANCED or COMFORT
                mode = TransportMode.TRAIN
                base_cost = 1200 + (distance_km * 0.6)
                duration = distance_km / 70 * 60  # ~70 km/hr for good trains
                provider = "Rajdhani/Shatabdi Express"
                comfort_score = 8.0

        elif distance_km > 150:
            # Short-medium distance: trains or buses
            if preference == TravelPreference.CHEAPEST:
                mode = TransportMode.BUS
                base_cost = 400 + (distance_km * 0.3)
                duration = distance_km / 50 * 60  # ~50 km/hr
                provider = "State Transport/Private Buses"
                comfort_score = 6.0
            else:
                mode = TransportMode.TRAIN
                base_cost = 600 + (distance_km * 0.4)
                duration = distance_km / 60 * 60
                provider = "Express Trains"
                comfort_score = 7.5
        else:
            # Very short distance: cab or rental car
            if travelers >= 3:
                mode = TransportMode.RENTAL_CAR
                base_cost = 1500 + (distance_km * 10)
                duration = distance_km / 60 * 60  # ~60 km/hr
                provider = "Zoomcar/Drivezy"
                comfort_score = 8.0
            else:
                mode = TransportMode.CAB
                base_cost = 800 + (distance_km * 12)
                duration = distance_km / 60 * 60
                provider = "Ola/Uber"
                comfort_score = 7.5

        # Adjust cost based on number of travelers
        if mode in [TransportMode.FLIGHT, TransportMode.TRAIN, TransportMode.BUS]:
            total_cost = base_cost * travelers
        else:
            total_cost = base_cost  # Cab/rental cost is same regardless

        # Budget constraint check - if over budget, downgrade
        if total_cost > budget_available * 0.7:  # Reserve 30% for other expenses
            if mode == TransportMode.FLIGHT:
                mode = TransportMode.TRAIN
                base_cost = 1000 + (distance_km * 0.5)
                total_cost = base_cost * travelers
                provider = "Indian Railways"
                comfort_score = 7.0
            elif mode == TransportMode.TRAIN:
                mode = TransportMode.BUS
                base_cost = 500 + (distance_km * 0.3)
                total_cost = base_cost * travelers
                provider = "State Transport"
                comfort_score = 6.0

        departure_time = datetime.now() + timedelta(hours=2)
        arrival_time = departure_time + timedelta(minutes=duration)

        transport = TransportOption(
            mode=mode,
            from_city=from_city,
            to_city=to_city,
            departure_time=departure_time,
            arrival_time=arrival_time,
            duration_minutes=int(duration),
            cost_per_person=base_cost,
            provider=provider,
            provider_details={
                "distance_km": distance_km,
                "total_cost": total_cost,
                "travelers": travelers
            },
            carbon_footprint=distance_km * 0.12 if mode == TransportMode.FLIGHT else distance_km * 0.04,
            comfort_score=comfort_score
        )

        self.simulation_steps[-1].status = "completed"
        self.simulation_steps[-1].details.update({
            "selected_mode": mode.value,
            "cost": total_cost,
            "duration_minutes": int(duration)
        })

        return transport

    async def select_accommodation(
        self,
        city: str,
        check_in: datetime,
        check_out: datetime,
        budget_per_night: float,
        accommodation_type: str,
        travelers: int
    ) -> AccommodationOption:
        """Select accommodation based on budget and preferences"""
        self._add_simulation_step(
            action="select_accommodation",
            description=f"Finding accommodation in {city}",
            status="in_progress",
            details={"city": city, "budget_per_night": budget_per_night}
        )

        await asyncio.sleep(0.3)

        nights = (check_out.date() - check_in.date()).days

        # Budget-based hotel selection
        if budget_per_night < 1500:
            hotel_name = f"OYO Rooms {city} Central"
            cost_per_night = 1200
            rating = 3.5
            amenities = ["WiFi", "AC", "TV"]
            distance = 5.0
        elif budget_per_night < 3000:
            hotel_name = f"Treebo/FabHotel {city}"
            cost_per_night = 2200
            rating = 4.0
            amenities = ["WiFi", "AC", "TV", "Breakfast", "Hot Water"]
            distance = 3.0
        elif budget_per_night < 5000:
            hotel_name = f"Lemon Tree/Ginger Hotel {city}"
            cost_per_night = 3800
            rating = 4.2
            amenities = ["WiFi", "AC", "TV", "Breakfast", "Gym", "Restaurant"]
            distance = 2.0
        else:
            hotel_name = f"Taj/Marriott {city}"
            cost_per_night = 6500
            rating = 4.8
            amenities = ["WiFi", "AC", "TV", "Breakfast", "Gym", "Pool", "Spa", "Restaurant", "Room Service"]
            distance = 1.5

        accommodation = AccommodationOption(
            city=city,
            hotel_name=hotel_name,
            accommodation_type=accommodation_type,
            check_in=check_in.date(),
            check_out=check_out.date(),
            nights=nights,
            cost_per_night=cost_per_night,
            total_cost=cost_per_night * nights,
            amenities=amenities,
            rating=rating,
            distance_from_center_km=distance
        )

        self.simulation_steps[-1].status = "completed"
        self.simulation_steps[-1].details.update({
            "hotel": hotel_name,
            "total_cost": accommodation.total_cost,
            "nights": nights
        })

        return accommodation

    async def plan_local_transport(
        self,
        city: str,
        duration_days: int,
        has_airport_transfer: bool
    ) -> List[LocalTransportOption]:
        """Plan local transportation within a city"""
        local_transport = []

        if has_airport_transfer:
            local_transport.append(LocalTransportOption(
                city=city,
                type="airport_transfer",
                description=f"Airport pickup/drop in {city}",
                cost=500,
                duration_minutes=45
            ))

        # Add local transport budget
        if duration_days > 1:
            local_transport.append(LocalTransportOption(
                city=city,
                type="local_cab",
                description=f"Local sightseeing and travel in {city}",
                cost=800 * duration_days,
                duration_minutes=None
            ))

        return local_transport

    async def orchestrate_travel_plan(self, request: TravelRequest) -> TravelPlan:
        """
        Main orchestration method that creates a complete travel plan.
        This is the core AI agent logic.
        """
        self.simulation_steps = []  # Reset simulation

        # Handle social media URL extraction if provided
        if request.social_media_url and request.social_platform:
            # Extract destinations from social media content
            total_days = sum(city.duration_days for city in request.cities)
            destinations = await self.extract_destinations_from_social_media(
                social_media_url=request.social_media_url,
                platform=request.social_platform.value,
                total_days=total_days
            )

            # If destinations were extracted, replace the cities in the request
            if destinations and len(destinations) >= 2:
                from datetime import date, timedelta
                from models.schemas import CityStop

                # Distribute days among cities
                days_per_city = max(1, total_days // len(destinations))
                remaining_days = total_days - (days_per_city * len(destinations))

                new_cities = []
                current_date = date.today()

                for idx, city_name in enumerate(destinations):
                    duration = days_per_city + (1 if idx < remaining_days else 0)
                    arrival_date = current_date
                    departure_date = current_date + timedelta(days=duration)

                    new_cities.append(CityStop(
                        city=city_name,
                        duration_days=duration,
                        arrival_date=arrival_date,
                        departure_date=departure_date
                    ))

                    current_date = departure_date

                # Update the request with extracted cities
                request.cities = new_cities

                self._add_simulation_step(
                    action="update_cities_from_social_media",
                    description=f"Updated itinerary with {len(destinations)} cities from social media",
                    status="completed",
                    details={"extracted_cities": destinations}
                )

        # Step 1: Analyze request
        analysis = await self.analyze_travel_request(request)

        # Step 2: Budget allocation
        self._add_simulation_step(
            action="allocate_budget",
            description="Allocating budget across transport, accommodation, and activities",
            status="in_progress",
            details={"total_budget": request.total_budget}
        )

        # Smart budget allocation based on preference
        if request.preference == TravelPreference.CHEAPEST:
            transport_allocation = 0.35
            accommodation_allocation = 0.30
            food_allocation = 0.20
            activities_allocation = 0.10
            buffer_allocation = 0.05
        elif request.preference == TravelPreference.COMFORT:
            transport_allocation = 0.30
            accommodation_allocation = 0.40
            food_allocation = 0.15
            activities_allocation = 0.10
            buffer_allocation = 0.05
        else:  # BALANCED or FASTEST
            transport_allocation = 0.35
            accommodation_allocation = 0.35
            food_allocation = 0.15
            activities_allocation = 0.10
            buffer_allocation = 0.05

        transport_budget = request.total_budget * transport_allocation
        accommodation_budget = request.total_budget * accommodation_allocation

        self.simulation_steps[-1].status = "completed"
        self.simulation_steps[-1].details.update({
            "transport_budget": transport_budget,
            "accommodation_budget": accommodation_budget
        })

        # Step 3: Plan each leg of journey
        itinerary: List[TravelItinerary] = []
        total_transport_cost = 0
        total_accommodation_cost = 0
        total_local_transport_cost = 0

        for i in range(len(request.cities)):
            current_city = request.cities[i]

            # Transport to next city (if not last city)
            if i < len(request.cities) - 1:
                next_city = request.cities[i + 1]
                distance = self.calculate_distance(current_city.city, next_city.city)

                remaining_legs = len(request.cities) - i - 1
                budget_per_leg = (transport_budget - total_transport_cost) / remaining_legs if remaining_legs > 0 else transport_budget

                transport = await self.select_transport_mode(
                    from_city=current_city.city,
                    to_city=next_city.city,
                    distance_km=distance,
                    budget_available=budget_per_leg,
                    preference=request.preference,
                    travelers=request.number_of_travelers
                )

                total_transport_cost += transport.provider_details["total_cost"]
            else:
                transport = None

            # Accommodation (if staying in city)
            accommodation = None
            if current_city.duration_days > 0:
                remaining_cities_with_stay = sum(1 for c in request.cities[i:] if c.duration_days > 0)
                budget_for_stay = (accommodation_budget - total_accommodation_cost) / remaining_cities_with_stay if remaining_cities_with_stay > 0 else accommodation_budget
                budget_per_night = budget_for_stay / current_city.duration_days if current_city.duration_days > 0 else 0

                accommodation = await self.select_accommodation(
                    city=current_city.city,
                    check_in=datetime.combine(current_city.arrival_date, datetime.min.time()),
                    check_out=datetime.combine(current_city.departure_date, datetime.min.time()),
                    budget_per_night=budget_per_night,
                    accommodation_type=request.accommodation_type,
                    travelers=request.number_of_travelers
                )

                total_accommodation_cost += accommodation.total_cost

            # Local transport
            has_airport = transport and transport.mode == TransportMode.FLIGHT if transport else False
            local_transport = await self.plan_local_transport(
                city=current_city.city,
                duration_days=current_city.duration_days,
                has_airport_transfer=has_airport
            )

            total_local_transport_cost += sum(lt.cost for lt in local_transport)

            # Create itinerary leg
            if transport:  # Only add if there's transport (not for last city)
                itinerary.append(TravelItinerary(
                    leg_number=len(itinerary) + 1,
                    from_city=current_city.city,
                    to_city=next_city.city,
                    transport=transport,
                    accommodation=accommodation,
                    local_transport=local_transport,
                    activities=[]
                ))
            elif accommodation:  # Last city with accommodation
                itinerary.append(TravelItinerary(
                    leg_number=len(itinerary) + 1,
                    from_city=current_city.city,
                    to_city=current_city.city,
                    transport=TransportOption(
                        mode=TransportMode.CAB,
                        from_city=current_city.city,
                        to_city=current_city.city,
                        departure_time=datetime.now(),
                        arrival_time=datetime.now(),
                        duration_minutes=0,
                        cost_per_person=0,
                        provider="N/A",
                        provider_details={}
                    ),
                    accommodation=accommodation,
                    local_transport=local_transport,
                    activities=[]
                ))

        # Step 4: Calculate final budget breakdown
        food_estimated = request.total_budget * food_allocation
        activities_estimated = request.total_budget * activities_allocation
        buffer_amount = request.total_budget * buffer_allocation

        total_spent = (
            total_transport_cost +
            total_accommodation_cost +
            total_local_transport_cost +
            food_estimated +
            activities_estimated
        )

        remaining = request.total_budget - total_spent

        budget_breakdown = BudgetBreakdown(
            total_budget=request.total_budget,
            transport_cost=total_transport_cost,
            accommodation_cost=total_accommodation_cost,
            local_transport_cost=total_local_transport_cost,
            food_estimated=food_estimated,
            activities_estimated=activities_estimated,
            buffer_amount=buffer_amount,
            remaining_budget=remaining,
            cost_per_person=total_spent / request.number_of_travelers,
            budget_utilization_percent=(total_spent / request.total_budget) * 100
        )

        # Step 5: Generate reasoning
        reasoning = self._generate_reasoning(request, analysis, budget_breakdown)

        # Step 6: Calculate confidence score
        confidence = self._calculate_confidence(budget_breakdown, request)

        # Create final plan
        plan = TravelPlan(
            plan_id=str(uuid.uuid4()),
            customer_name=request.customer_name,
            total_travelers=request.number_of_travelers,
            preference=request.preference,
            itinerary=itinerary,
            budget_breakdown=budget_breakdown,
            total_duration_days=analysis["total_duration_days"],
            confidence_score=confidence,
            reasoning=reasoning,
            alternatives_count=0
        )

        self._add_simulation_step(
            action="plan_complete",
            description="Travel plan generated successfully",
            status="completed",
            details={
                "plan_id": plan.plan_id,
                "confidence": confidence,
                "budget_utilization": budget_breakdown.budget_utilization_percent
            }
        )

        return plan

    def _generate_reasoning(
        self,
        request: TravelRequest,
        analysis: Dict[str, Any],
        budget: BudgetBreakdown
    ) -> str:
        """Generate AI reasoning for the travel plan"""
        reasoning_parts = []

        reasoning_parts.append(
            f"Created optimized {len(request.cities)}-city itinerary "
            f"covering {analysis['total_distance_km']:.0f}km over {analysis['total_duration_days']} days."
        )

        if budget.budget_utilization_percent > 95:
            reasoning_parts.append(
                "Budget utilization is high (>95%). Consider increasing budget or adjusting preferences."
            )
        elif budget.budget_utilization_percent < 70:
            reasoning_parts.append(
                f"Budget utilization is {budget.budget_utilization_percent:.1f}%. "
                "You have room for upgrades or additional activities."
            )
        else:
            reasoning_parts.append(
                f"Budget utilization is optimal at {budget.budget_utilization_percent:.1f}%."
            )

        if request.preference == TravelPreference.CHEAPEST:
            reasoning_parts.append(
                "Selected budget-friendly options prioritizing cost savings."
            )
        elif request.preference == TravelPreference.FASTEST:
            reasoning_parts.append(
                "Prioritized faster transport modes to minimize travel time."
            )
        elif request.preference == TravelPreference.COMFORT:
            reasoning_parts.append(
                "Selected comfortable accommodations and transport for better experience."
            )
        else:
            reasoning_parts.append(
                "Balanced cost and comfort for optimal value."
            )

        return " ".join(reasoning_parts)

    def _calculate_confidence(self, budget: BudgetBreakdown, request: TravelRequest) -> float:
        """Calculate AI confidence in the plan"""
        confidence = 1.0

        # Reduce confidence if budget is very tight
        if budget.remaining_budget < 0:
            confidence -= 0.3
        elif budget.remaining_budget < budget.total_budget * 0.05:
            confidence -= 0.15

        # Reduce confidence if budget utilization is too high or too low
        if budget.budget_utilization_percent > 98:
            confidence -= 0.1
        elif budget.budget_utilization_percent < 60:
            confidence -= 0.05

        # Increase confidence for balanced plans
        if 75 <= budget.budget_utilization_percent <= 90:
            confidence = min(1.0, confidence + 0.1)

        return max(0.0, min(1.0, confidence))
