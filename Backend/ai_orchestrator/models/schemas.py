from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, date


class TransportMode(str, Enum):
    FLIGHT = "flight"
    TRAIN = "train"
    BUS = "bus"
    CAB = "cab"
    RENTAL_CAR = "rental_car"


class AccommodationType(str, Enum):
    BUDGET = "budget"
    MID_RANGE = "mid_range"
    LUXURY = "luxury"


class TravelPreference(str, Enum):
    FASTEST = "fastest"
    CHEAPEST = "cheapest"
    BALANCED = "balanced"
    COMFORT = "comfort"


class SocialPlatform(str, Enum):
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"


class CityStop(BaseModel):
    city: str
    state: Optional[str] = None
    duration_days: int = Field(..., ge=0, description="Number of days to stay")
    arrival_date: date
    departure_date: date
    preferences: Optional[Dict[str, Any]] = {}


class TravelRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    total_budget: float = Field(..., gt=0, description="Total available budget")
    cities: List[CityStop] = Field(..., min_length=2, description="Minimum 2 cities required")
    preference: TravelPreference = TravelPreference.BALANCED
    number_of_travelers: int = Field(default=1, ge=1, le=10)
    accommodation_type: Optional[AccommodationType] = AccommodationType.MID_RANGE
    special_requirements: Optional[str] = None
    social_media_url: Optional[str] = Field(None, description="Social media URL for AI to extract destinations from")
    social_platform: Optional[SocialPlatform] = Field(None, description="Social media platform type")


class TransportOption(BaseModel):
    mode: TransportMode
    from_city: str
    to_city: str
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    cost_per_person: float
    provider: str
    provider_details: Dict[str, Any]
    carbon_footprint: Optional[float] = None
    comfort_score: Optional[float] = None


class AccommodationOption(BaseModel):
    city: str
    hotel_name: str
    accommodation_type: AccommodationType
    check_in: date
    check_out: date
    nights: int
    cost_per_night: float
    total_cost: float
    amenities: List[str]
    rating: Optional[float] = None
    distance_from_center_km: Optional[float] = None


class LocalTransportOption(BaseModel):
    city: str
    type: str  # "airport_transfer", "local_cab", "rental"
    description: str
    cost: float
    duration_minutes: Optional[int] = None


class TravelItinerary(BaseModel):
    leg_number: int
    from_city: str
    to_city: str
    transport: TransportOption
    accommodation: Optional[AccommodationOption] = None
    local_transport: List[LocalTransportOption] = []
    activities: Optional[List[str]] = []


class BudgetBreakdown(BaseModel):
    total_budget: float
    transport_cost: float
    accommodation_cost: float
    local_transport_cost: float
    food_estimated: float
    activities_estimated: float
    buffer_amount: float
    remaining_budget: float
    cost_per_person: float
    budget_utilization_percent: float


class TravelPlan(BaseModel):
    plan_id: str
    customer_name: str
    total_travelers: int
    preference: TravelPreference
    itinerary: List[TravelItinerary]
    budget_breakdown: BudgetBreakdown
    total_duration_days: int
    confidence_score: float = Field(..., ge=0, le=1, description="AI confidence in this plan")
    reasoning: str
    alternatives_count: int = 0
    created_at: datetime = Field(default_factory=datetime.now)


class OrchestrationResponse(BaseModel):
    success: bool
    message: str
    travel_plan: Optional[TravelPlan] = None
    alternative_plans: Optional[List[TravelPlan]] = []
    error_details: Optional[str] = None


class SimulationStep(BaseModel):
    step_number: int
    action: str
    description: str
    status: str  # "in_progress", "completed", "failed"
    details: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)


class SimulationResponse(BaseModel):
    simulation_id: str
    request: TravelRequest
    steps: List[SimulationStep]
    final_plan: Optional[TravelPlan] = None
    status: str
    total_time_seconds: float
