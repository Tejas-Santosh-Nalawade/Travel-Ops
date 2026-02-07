"""
Credit Card Rewards & Offers API
FastAPI backend for credit card management and travel benefits
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
from enum import Enum

# Initialize FastAPI
app = FastAPI(
    title="Credit Card API",
    description="API for credit card rewards, offers, and travel benefits",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ENUMS ====================

class CardType(str, Enum):
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMEX = "amex"
    RUPAY = "rupay"

class CardTier(str, Enum):
    BASIC = "basic"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    SIGNATURE = "signature"

class RewardCategory(str, Enum):
    TRAVEL = "travel"
    DINING = "dining"
    SHOPPING = "shopping"
    FUEL = "fuel"
    GROCERIES = "groceries"

# ==================== MODELS ====================

class CreditCard(BaseModel):
    card_id: str
    card_name: str
    card_type: CardType
    card_tier: CardTier
    annual_fee: float
    joining_bonus: int = 0
    reward_rate: float  # Points per ₹100 spent
    travel_multiplier: float = 1.0  # Extra points for travel
    airport_lounge_access: bool = False
    free_lounge_visits: int = 0
    cashback_percent: float = 0.0
    fuel_surcharge_waiver: bool = False
    travel_benefits: List[str] = []
    partner_airlines: List[str] = []
    partner_hotels: List[str] = []
    minimum_spend: float = 0.0
    spending_milestone: Optional[float] = None
    milestone_bonus: int = 0

class CardOffer(BaseModel):
    offer_id: str
    card_id: str
    merchant: str
    discount_percent: float
    max_discount: float
    category: RewardCategory
    valid_until: str
    terms: str

class RewardPoints(BaseModel):
    total_points: int
    value_in_rupees: float
    redemption_options: List[Dict[str, Any]]

class CardRecommendationRequest(BaseModel):
    monthly_spend: float = Field(..., gt=0, description="Monthly spending in ₹")
    spend_categories: Dict[str, float]  # Category-wise spending (string keys for JSON compatibility)
    travel_frequency: int = Field(0, ge=0, description="Trips per year")
    preferred_airlines: List[str] = []
    preferred_hotels: List[str] = []

class TripRecommendationRequest(BaseModel):
    trip_cost: float = Field(..., gt=0, description="Total trip cost in ₹")
    cities: List[str] = Field(..., min_items=1, description="List of cities")
    duration_days: int = Field(..., gt=0, description="Trip duration in days")
    travelers: int = Field(1, gt=0, description="Number of travelers")

class TravelBenefit(BaseModel):
    benefit_type: str
    description: str
    value_estimate: float
    usage_terms: str

# ==================== DATA STORE ====================

# Sample credit cards database
CREDIT_CARDS = {
    "hdfc_diners_black": CreditCard(
        card_id="hdfc_diners_black",
        card_name="HDFC Diners Club Black",
        card_type=CardType.AMEX,
        card_tier=CardTier.PLATINUM,
        annual_fee=10000,
        joining_bonus=2000,
        reward_rate=3.3,
        travel_multiplier=2.0,
        airport_lounge_access=True,
        free_lounge_visits=12,
        travel_benefits=["₹10,000 online travel voucher", "Buy 1 Get 1 movie tickets", "Golf privileges"],
        partner_airlines=["Air India", "Vistara"],
        partner_hotels=["Taj", "ITC", "Oberoi"],
        minimum_spend=0,
        spending_milestone=800000,
        milestone_bonus=10000
    ),
    "axis_magnus": CreditCard(
        card_id="axis_magnus",
        card_name="Axis Bank Magnus",
        card_type=CardType.VISA,
        card_tier=CardTier.SIGNATURE,
        annual_fee=12500,
        joining_bonus=2500,
        reward_rate=12.0,
        travel_multiplier=3.0,
        airport_lounge_access=True,
        free_lounge_visits=8,
        travel_benefits=["Complimentary Taj Stays", "Golf privileges", "Priority Pass membership"],
        partner_airlines=["Indigo", "Air India", "Vistara"],
        partner_hotels=["Accor", "IHG", "Marriott"],
        minimum_spend=0,
        spending_milestone=150000,
        milestone_bonus=25000
    ),
    "sbi_cashback": CreditCard(
        card_id="sbi_cashback",
        card_name="SBI Cashback Card",
        card_type=CardType.VISA,
        card_tier=CardTier.BASIC,
        annual_fee=999,
        joining_bonus=0,
        reward_rate=0,
        cashback_percent=5.0,
        fuel_surcharge_waiver=True,
        travel_benefits=["1% fuel cashback"],
        minimum_spend=2000
    ),
    "icici_amazon_pay": CreditCard(
        card_id="icici_amazon_pay",
        card_name="ICICI Amazon Pay",
        card_type=CardType.VISA,
        card_tier=CardTier.BASIC,
        annual_fee=0,
        joining_bonus=500,
        reward_rate=0,
        cashback_percent=2.0,
        travel_benefits=["Unlimited 5% cashback on Amazon", "2% on other online shopping"]
    ),
    "indusind_pinnacle": CreditCard(
        card_id="indusind_pinnacle",
        card_name="IndusInd Pinnacle",
        card_type=CardType.VISA,
        card_tier=CardTier.PLATINUM,
        annual_fee=3500,
        joining_bonus=3000,
        reward_rate=1.5,
        travel_multiplier=2.0,
        airport_lounge_access=True,
        free_lounge_visits=6,
        travel_benefits=["Movie vouchers", "Golf rounds", "Spa vouchers"],
        partner_airlines=["Indigo"],
        partner_hotels=["IHG"],
        minimum_spend=30000
    )
}

CARD_OFFERS = [
    CardOffer(
        offer_id="off_001",
        card_id="hdfc_diners_black",
        merchant="MakeMyTrip",
        discount_percent=15,
        max_discount=10000,
        category=RewardCategory.TRAVEL,
        valid_until="2026-12-31",
        terms="Min booking ₹20,000"
    ),
    CardOffer(
        offer_id="off_002",
        card_id="axis_magnus",
        merchant="Goibibo",
        discount_percent=20,
        max_discount=7500,
        category=RewardCategory.TRAVEL,
        valid_until="2026-12-31",
        terms="Min booking ₹15,000"
    ),
    CardOffer(
        offer_id="off_003",
        card_id="sbi_cashback",
        merchant="Cleartrip",
        discount_percent=10,
        max_discount=1500,
        category=RewardCategory.TRAVEL,
        valid_until="2026-12-31",
        terms="Min booking ₹5,000"
    )
]

# ==================== HELPER FUNCTIONS ====================

def calculate_annual_value(card: CreditCard, monthly_spend: float, travel_spend: float) -> float:
    """Calculate annual value from a credit card"""
    annual_spend = monthly_spend * 12
    travel_annual_spend = travel_spend * 12

    # Calculate reward points
    base_points = (annual_spend / 100) * card.reward_rate
    travel_points = (travel_annual_spend / 100) * card.reward_rate * card.travel_multiplier
    total_points = base_points + travel_points

    # Points value (typically 1 point = ₹0.25 to ₹1)
    points_value = total_points * 0.5  # Conservative estimate

    # Cashback value
    cashback_value = (annual_spend * card.cashback_percent) / 100

    total_value = points_value + cashback_value + card.joining_bonus - card.annual_fee

    return total_value

def get_travel_benefits_for_card(card: CreditCard) -> List[TravelBenefit]:
    """Get all travel benefits for a card"""
    benefits = []

    if card.airport_lounge_access:
        benefits.append(TravelBenefit(
            benefit_type="Airport Lounge",
            description=f"{card.free_lounge_visits} complimentary lounge visits per year",
            value_estimate=card.free_lounge_visits * 2000,
            usage_terms="Valid at Priority Pass lounges worldwide"
        ))

    if card.partner_airlines:
        benefits.append(TravelBenefit(
            benefit_type="Airline Partnerships",
            description=f"Extra miles on {', '.join(card.partner_airlines)}",
            value_estimate=5000,
            usage_terms="Extra reward points on partner airline bookings"
        ))

    if card.partner_hotels:
        benefits.append(TravelBenefit(
            benefit_type="Hotel Partnerships",
            description=f"Special rates at {', '.join(card.partner_hotels)}",
            value_estimate=3000,
            usage_terms="Up to 20% off + late checkout at partner hotels"
        ))

    return benefits

# ==================== API ROUTES ====================

@app.get("/")
async def root():
    """API Root endpoint"""
    return {
        "service": "Credit Card API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "total_cards": len(CREDIT_CARDS),
        "total_offers": len(CARD_OFFERS)
    }

@app.get("/api/v1/cards")
async def get_all_cards():
    """Get all available credit cards"""
    return {
        "success": True,
        "cards": list(CREDIT_CARDS.values()),
        "total": len(CREDIT_CARDS)
    }

@app.get("/api/v1/cards/{card_id}")
async def get_card_details(card_id: str):
    """Get details of a specific credit card"""
    if card_id not in CREDIT_CARDS:
        raise HTTPException(status_code=404, detail="Card not found")

    card = CREDIT_CARDS[card_id]
    offers = [offer for offer in CARD_OFFERS if offer.card_id == card_id]
    benefits = get_travel_benefits_for_card(card)

    return {
        "success": True,
        "card": card,
        "active_offers": offers,
        "travel_benefits": benefits
    }

@app.post("/api/v1/recommendations")
async def get_card_recommendations(request: CardRecommendationRequest):
    """Get personalized credit card recommendations"""
    travel_spend = request.spend_categories.get("travel", 0)

    recommendations = []

    for card_id, card in CREDIT_CARDS.items():
        # Calculate annual value
        annual_value = calculate_annual_value(card, request.monthly_spend, travel_spend)

        # Skip if negative value
        if annual_value < 0:
            continue

        # Calculate travel score
        travel_score = 0
        if request.travel_frequency > 0:
            if card.airport_lounge_access:
                travel_score += 30
            if card.partner_airlines:
                travel_score += 20
            if card.travel_multiplier > 1:
                travel_score += 25

        # Get offers
        card_offers = [offer for offer in CARD_OFFERS if offer.card_id == card_id]

        # Get benefits
        benefits = get_travel_benefits_for_card(card)

        recommendations.append({
            "card": card,
            "estimated_annual_value": round(annual_value, 2),
            "travel_score": travel_score,
            "recommended_for": get_recommendation_reason(card, request),
            "active_offers": card_offers,
            "travel_benefits": benefits,
            "roi_percent": round((annual_value / card.annual_fee) * 100, 2) if card.annual_fee > 0 else 999.99
        })

    # Sort by annual value
    recommendations.sort(key=lambda x: x["estimated_annual_value"], reverse=True)

    return {
        "success": True,
        "recommendations": recommendations[:5],  # Top 5
        "based_on": {
            "monthly_spend": request.monthly_spend,
            "travel_frequency": request.travel_frequency
        }
    }

def get_recommendation_reason(card: CreditCard, request: CardRecommendationRequest) -> str:
    """Generate recommendation reason"""
    reasons = []

    if card.reward_rate > 2:
        reasons.append(f"High rewards ({card.reward_rate} points per ₹100)")

    if card.cashback_percent > 0:
        reasons.append(f"{card.cashback_percent}% cashback")

    if request.travel_frequency > 6 and card.airport_lounge_access:
        reasons.append("Free airport lounge access")

    if card.travel_multiplier > 1:
        reasons.append(f"{card.travel_multiplier}x points on travel")

    if card.annual_fee == 0:
        reasons.append("No annual fee")

    return " • ".join(reasons) if reasons else "Good all-rounder card"

@app.post("/api/v1/calculate-rewards")
async def calculate_rewards(
    card_id: str,
    spending_amount: float,
    category: RewardCategory = RewardCategory.TRAVEL
):
    """Calculate reward points for a spending amount"""
    if card_id not in CREDIT_CARDS:
        raise HTTPException(status_code=404, detail="Card not found")

    card = CREDIT_CARDS[card_id]

    # Calculate points
    base_points = (spending_amount / 100) * card.reward_rate

    # Apply category multiplier
    if category == RewardCategory.TRAVEL:
        points = base_points * card.travel_multiplier
    else:
        points = base_points

    # Calculate cashback
    cashback = (spending_amount * card.cashback_percent) / 100

    # Points value
    points_value = points * 0.5  # ₹0.50 per point

    total_value = points_value + cashback

    return {
        "success": True,
        "spending_amount": spending_amount,
        "category": category,
        "rewards": {
            "points_earned": round(points, 2),
            "cashback_earned": round(cashback, 2),
            "total_value_rupees": round(total_value, 2),
            "effective_discount_percent": round((total_value / spending_amount) * 100, 2)
        },
        "redemption_options": [
            {"option": "Travel Bookings", "value_per_point": 1.0},
            {"option": "Statement Credit", "value_per_point": 0.5},
            {"option": "Gift Vouchers", "value_per_point": 0.4},
            {"option": "Merchandise", "value_per_point": 0.25}
        ]
    }

@app.get("/api/v1/offers")
async def get_all_offers(category: Optional[RewardCategory] = None):
    """Get all active credit card offers"""
    offers = CARD_OFFERS

    if category:
        offers = [offer for offer in offers if offer.category == category]

    return {
        "success": True,
        "offers": offers,
        "total": len(offers)
    }

@app.post("/api/v1/recommend-for-trip")
async def recommend_cards_for_trip(request: TripRecommendationRequest):
    """Get best credit cards for a specific trip"""

    recommendations = []

    for card_id, card in CREDIT_CARDS.items():
        # Calculate rewards for this trip
        base_points = (request.trip_cost / 100) * card.reward_rate
        travel_points = base_points * card.travel_multiplier
        points_value = travel_points * 0.5  # ₹0.50 per point

        # Calculate cashback
        cashback = (request.trip_cost * card.cashback_percent) / 100

        total_savings = points_value + cashback

        # Get applicable offers
        card_offers = [offer for offer in CARD_OFFERS if offer.card_id == card_id]
        offer_savings = 0
        if card_offers:
            # Calculate potential offer savings
            for offer in card_offers:
                potential_discount = (request.trip_cost * offer.discount_percent) / 100
                offer_savings += min(potential_discount, offer.max_discount)

        # Total value including offers
        total_value_with_offers = total_savings + offer_savings

        # Effective discount
        effective_discount = (total_value_with_offers / request.trip_cost) * 100

        # Skip if less than 0.5% return
        if effective_discount < 0.5:
            continue

        recommendations.append({
            "card": card,
            "for_this_trip": {
                "trip_cost": request.trip_cost,
                "points_earned": round(travel_points, 2),
                "cashback_earned": round(cashback, 2),
                "offer_savings": round(offer_savings, 2),
                "total_savings": round(total_value_with_offers, 2),
                "effective_discount_percent": round(effective_discount, 2),
                "net_cost": round(request.trip_cost - total_value_with_offers, 2)
            },
            "why_best": get_trip_recommendation_reason(card, request.trip_cost, request.duration_days),
            "active_offers": card_offers,
            "terms": get_card_terms(card, request.trip_cost)
        })

    # Sort by total savings
    recommendations.sort(key=lambda x: x["for_this_trip"]["total_savings"], reverse=True)

    return {
        "success": True,
        "trip_details": {
            "cost": request.trip_cost,
            "cities": request.cities,
            "duration": request.duration_days,
            "travelers": request.travelers
        },
        "best_cards": recommendations[:3],  # Top 3
        "max_savings": recommendations[0]["for_this_trip"]["total_savings"] if recommendations else 0
    }

def get_trip_recommendation_reason(card: CreditCard, trip_cost: float, duration: int) -> str:
    """Why this card is best for this trip"""
    reasons = []

    if card.travel_multiplier > 1:
        reasons.append(f"{card.travel_multiplier}x travel rewards")

    if card.cashback_percent > 0:
        reasons.append(f"{card.cashback_percent}% instant cashback")

    if card.airport_lounge_access and duration > 2:
        reasons.append(f"Free lounge access saves ₹{card.free_lounge_visits * 2000}")

    # Check if offers apply
    card_offers = [offer for offer in CARD_OFFERS if offer.card_id == card.card_id]
    if card_offers:
        reasons.append(f"Active {card_offers[0].discount_percent}% off offer")

    return " • ".join(reasons) if reasons else "Good value for travel"

def get_card_terms(card: CreditCard, trip_cost: float) -> List[str]:
    """Important terms for using this card"""
    terms = []

    if card.minimum_spend > 0:
        terms.append(f"Min spend: ₹{card.minimum_spend:,.0f}/month")

    if card.annual_fee > 0:
        terms.append(f"Annual fee: ₹{card.annual_fee:,.0f}")
    else:
        terms.append("No annual fee")

    if card.spending_milestone:
        terms.append(f"Milestone bonus: ₹{card.milestone_bonus:,.0f} at ₹{card.spending_milestone:,.0f}")

    return terms

@app.get("/api/v1/travel-benefits/{card_id}")
async def get_card_travel_benefits(card_id: str):
    """Get all travel benefits for a specific card"""
    if card_id not in CREDIT_CARDS:
        raise HTTPException(status_code=404, detail="Card not found")

    card = CREDIT_CARDS[card_id]
    benefits = get_travel_benefits_for_card(card)

    return {
        "success": True,
        "card_name": card.card_name,
        "benefits": benefits,
        "total_value_estimate": sum(b.value_estimate for b in benefits)
    }

@app.post("/api/v1/add-card")
async def add_new_card(card: CreditCard):
    """Add a new credit card to the database"""
    if card.card_id in CREDIT_CARDS:
        raise HTTPException(status_code=400, detail="Card already exists")

    CREDIT_CARDS[card.card_id] = card

    return {
        "success": True,
        "message": f"Card {card.card_name} added successfully",
        "card": card
    }

# ==================== RUN SERVER ====================

if __name__ == "__main__":
    print("""
    ==============================================================
         Credit Card API Server
         Rewards, Offers & Travel Benefits

       Server: http://localhost:8001
       API Docs: http://localhost:8001/docs
    ==============================================================
    """)
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
