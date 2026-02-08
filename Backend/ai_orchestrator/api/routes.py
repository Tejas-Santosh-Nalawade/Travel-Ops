from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List
import uuid
import asyncio
from datetime import datetime

from models.schemas import (
    TravelRequest, OrchestrationResponse, TravelPlan,
    SimulationResponse, SimulationStep
)
from agents.orchestrator import TravelOrchestratorAgent
from services.groq_service import groq_service
from api.simulation import router as simulation_router
from api.budget import router as budget_router


# Initialize FastAPI app
app = FastAPI(
    title="TravelOps AI Orchestrator",
    description="AI-powered multi-city travel planning and orchestration system",
    version="1.0.0"
)

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your mobile app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include simulation router for transaction rollback demonstrations
app.include_router(
    simulation_router,
    prefix="/api/v1/transactions",
    tags=["Transaction Simulation"]
)

# Include budget router for AI-powered budget recommendations
app.include_router(
    budget_router,
    prefix="/api/v1/budget",
    tags=["Budget Recommendations"]
)

# In-memory storage for simulations (use Redis in production)
active_simulations: Dict[str, SimulationResponse] = {}

# Initialize orchestrator agent
orchestrator = TravelOrchestratorAgent()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "TravelOps AI Orchestrator",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "orchestrator": "ready",
        "active_simulations": len(active_simulations),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v1/plan", response_model=OrchestrationResponse)
async def create_travel_plan(request: TravelRequest):
    """
    Create an optimized travel plan based on budget and preferences.

    This endpoint uses AI to orchestrate multi-city travel by:
    - Analyzing budget constraints
    - Selecting optimal transport modes (flights, trains, buses, cabs)
    - Choosing appropriate accommodations
    - Planning local transportation
    - Generating detailed itinerary

    **Example Request (Pune → Mumbai → Bangalore):**
    ```json
    {
      "customer_name": "Rahul Sharma",
      "customer_email": "rahul@example.com",
      "customer_phone": "+919876543210",
      "total_budget": 50000,
      "cities": [
        {
          "city": "Pune",
          "duration_days": 1,
          "arrival_date": "2026-03-01",
          "departure_date": "2026-03-02"
        },
        {
          "city": "Mumbai",
          "duration_days": 2,
          "arrival_date": "2026-03-02",
          "departure_date": "2026-03-04"
        },
        {
          "city": "Bangalore",
          "duration_days": 3,
          "arrival_date": "2026-03-04",
          "departure_date": "2026-03-07"
        }
      ],
      "preference": "balanced",
      "number_of_travelers": 2,
      "accommodation_type": "mid_range"
    }
    ```
    """
    try:
        # Validate request
        if len(request.cities) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 cities are required for multi-city travel"
            )

        # Check basic budget feasibility
        min_budget_required = len(request.cities) * 3000 * request.number_of_travelers
        if request.total_budget < min_budget_required:
            raise HTTPException(
                status_code=400,
                detail=f"Budget too low. Minimum required: ₹{min_budget_required}"
            )

        # Create travel plan using AI orchestrator
        travel_plan = await orchestrator.orchestrate_travel_plan(request)

        # Check if plan exceeds budget
        if travel_plan.budget_breakdown.remaining_budget < 0:
            return OrchestrationResponse(
                success=False,
                message="Unable to create plan within budget. Please increase budget or adjust preferences.",
                travel_plan=travel_plan,
                alternative_plans=[],
                error_details=f"Budget exceeded by ₹{abs(travel_plan.budget_breakdown.remaining_budget):.2f}"
            )

        return OrchestrationResponse(
            success=True,
            message="Travel plan created successfully",
            travel_plan=travel_plan,
            alternative_plans=[],
            error_details=None
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating travel plan: {str(e)}"
        )


@app.post("/api/v1/plan/simulate", response_model=SimulationResponse)
async def simulate_travel_planning(request: TravelRequest, background_tasks: BackgroundTasks):
    """
    Create a travel plan with real-time simulation for demonstration purposes.

    This endpoint shows the step-by-step AI decision-making process:
    - Request analysis
    - Budget allocation
    - Transport mode selection for each leg
    - Accommodation selection
    - Local transport planning
    - Final plan generation

    Perfect for demonstrating to judges how the AI orchestrator works!
    """
    try:
        simulation_id = str(uuid.uuid4())

        # Create new orchestrator instance for this simulation
        sim_orchestrator = TravelOrchestratorAgent()

        # Start timing
        start_time = datetime.now()

        # Run orchestration with simulation tracking
        travel_plan = await sim_orchestrator.orchestrate_travel_plan(request)

        # Calculate duration
        duration = (datetime.now() - start_time).total_seconds()

        # Create simulation response
        simulation = SimulationResponse(
            simulation_id=simulation_id,
            request=request,
            steps=sim_orchestrator.simulation_steps,
            final_plan=travel_plan,
            status="completed",
            total_time_seconds=duration
        )

        # Store simulation
        active_simulations[simulation_id] = simulation

        return simulation

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running simulation: {str(e)}"
        )


@app.get("/api/v1/simulation/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(simulation_id: str):
    """
    Retrieve a completed simulation by ID.

    Use this to fetch the results of a previous simulation.
    """
    if simulation_id not in active_simulations:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation {simulation_id} not found"
        )

    return active_simulations[simulation_id]


@app.get("/api/v1/simulations", response_model=List[str])
async def list_simulations():
    """
    List all active simulation IDs.

    Useful for debugging and tracking multiple simulations.
    """
    return list(active_simulations.keys())


@app.delete("/api/v1/simulation/{simulation_id}")
async def delete_simulation(simulation_id: str):
    """Delete a simulation from memory"""
    if simulation_id in active_simulations:
        del active_simulations[simulation_id]
        return {"message": f"Simulation {simulation_id} deleted"}
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation {simulation_id} not found"
        )


@app.post("/api/v1/plan/optimize")
async def optimize_existing_plan(
    plan_id: str,
    new_budget: float = None,
    new_preference: str = None
):
    """
    Optimize an existing travel plan with new constraints.

    Use this to re-optimize a plan when budget or preferences change.
    """
    # TODO: Implement plan optimization logic
    raise HTTPException(
        status_code=501,
        detail="Plan optimization feature coming soon"
    )


@app.get("/api/v1/cities")
async def get_supported_cities():
    """
    Get list of supported cities with coordinates.

    Returns all cities that the AI orchestrator can plan routes for.
    """
    return {
        "cities": list(orchestrator.city_coordinates.keys()),
        "total_count": len(orchestrator.city_coordinates)
    }


@app.get("/api/v1/distance/{city1}/{city2}")
async def calculate_distance(city1: str, city2: str):
    """
    Calculate distance between two cities.

    Useful for mobile app to show distances before planning.
    """
    try:
        distance = orchestrator.calculate_distance(city1, city2)
        return {
            "from_city": city1,
            "to_city": city2,
            "distance_km": round(distance, 2)
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error calculating distance: {str(e)}"
        )


# 🤖 GROQ LLM-POWERED ENDPOINTS
@app.post("/api/v1/insights")
async def get_travel_insights(request: Dict):
    """
    🤖 Get AI-generated travel insights using Groq LLM.

    Returns:
    - Personalized trip summary
    - Insider tips and recommendations
    - Must-see attractions
    - Food recommendations
    - Packing suggestions

    Perfect for enhancing the Mobile App UI with intelligent suggestions!
    """
    try:
        cities = request.get("cities", [])
        total_budget = request.get("total_budget", 50000)
        duration_days = request.get("duration_days", 5)
        travelers = request.get("travelers", 2)
        preference = request.get("preference", "balanced")

        insights = await groq_service.generate_travel_insights(
            cities=cities,
            total_budget=total_budget,
            duration_days=duration_days,
            travelers=travelers,
            preference=preference
        )

        return {
            "success": True,
            "insights": insights,
            "powered_by": "Groq LLM (Mixtral-8x7b)",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating insights: {str(e)}"
        )


@app.post("/api/v1/plan/enhanced")
async def create_enhanced_plan_with_insights(request: TravelRequest):
    """
    🚀 Create travel plan WITH LLM-powered insights in ONE call!

    This endpoint combines:
    1. Complete travel plan (transport + hotels + budget)
    2. AI-generated insights and tips
    3. UI-friendly summary for mobile app

    Perfect for mobile apps that want everything in one API call!
    """
    try:
       # Generate travel plan
        travel_plan = await orchestrator.orchestrate_travel_plan(request)

        # Generate LLM insights
        cities = [city.city for city in request.cities]
        insights = await groq_service.generate_travel_insights(
            cities=cities,
            total_budget=request.total_budget,
            duration_days=sum(city.duration_days for city in request.cities),
            travelers=request.number_of_travelers,
            preference=request.preference.value
        )

        # Generate UI-friendly summary
        plan_data = {
            "cities": cities,
            "budget": request.total_budget,
            "confidence": travel_plan.confidence_score
        }
        ui_summary = await groq_service.generate_ui_friendly_plan_summary(plan_data)

        return OrchestrationResponse(
            success=True,
            message="Enhanced travel plan created successfully with AI insights!",
            travel_plan=travel_plan,
            insights=insights,
            ui_summary=ui_summary,
            powered_by="Groq LLM (Mixtral-8x7b)"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating enhanced plan: {str(e)}"
        )


@app.get("/api/v1/llm/status")
async def get_llm_status():
    """
    Check if Groq LLM is enabled and working.

    Useful for debugging and monitoring.
    """
    return {
        "llm_enabled": groq_service.enabled,
        "llm_model": groq_service.model,
        "provider": "Groq",
        "status": "operational" if groq_service.enabled else "disabled",
        "fallback_available": True
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "success": False,
        "message": exc.detail,
        "status_code": exc.status_code
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return {
        "success": False,
        "message": "An unexpected error occurred",
        "error": str(exc),
        "status_code": 500
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
