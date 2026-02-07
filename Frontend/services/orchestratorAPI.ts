/**
 * API Integration Service for TravelOps Frontend
 * Connects React Native app with AI Orchestrator backend
 */
import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Types matching Frontend interfaces
export interface Package {
  id: string;
  package_code: string;
  name: string;
  destination_name: string;
  duration_days: number;
  duration_nights: number;
  description: string;
  price_per_person: number;
  package_type: string;
  is_trending: boolean;
  images: string[];
  tags: string[];
}

export interface AITravelPlan {
  plan_id: string;
  customer_name: string;
  total_travelers: number;
  preference: string;
  total_duration_days: number;
  confidence_score: number;
  itinerary: TravelLeg[];
  budget_breakdown: BudgetBreakdown;
  reasoning: string;
  insights?: TravelInsights;
  ui_summary?: UISummary;
}

export interface TravelLeg {
  leg_number: number;
  from_city: string;
  to_city: string;
  transport: TransportOption;
  accommodation?: AccommodationOption;
  local_transport: LocalTransportOption[];
}

export interface TransportOption {
  mode: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  cost_per_person: number;
  provider: string;
  comfort_score: number;
}

export interface AccommodationOption {
  city: string;
  hotel_name: string;
  accommodation_type: string;
  check_in: string;
  check_out: string;
  nights: number;
  cost_per_night: number;
  total_cost: number;
  amenities: string[];
  rating: number;
}

export interface LocalTransportOption {
  city: string;
  type: string;
  description: string;
  cost: number;
}

export interface BudgetBreakdown {
  total_budget: number;
  transport_cost: number;
  accommodation_cost: number;
  local_transport_cost: number;
  food_estimated: number;
  activities_estimated: number;
  buffer_amount: number;
  remaining_budget: number;
  cost_per_person: number;
  budget_utilization_percent: number;
}

export interface TravelInsights {
  trip_summary: string;
  budget_insight: string;
  best_time_to_visit?: string;
  insider_tips: string[];
  must_see_attractions: string[];
  food_recommendations: string[];
  packing_suggestions: string[];
  overall_sentiment: string;
}

export interface UISummary {
  title: string;
  summary: string;
  highlights: string[];
  money_saved?: string;
  comfort_level: string;
  recommended_actions: string[];
}

// City information
export interface CityRequest {
  city: string;
  duration_days: number;
  arrival_date: string;
  departure_date: string;
}

// API Request payload
export interface CreatePlanRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_budget: number;
  cities: CityRequest[];
  preference: 'cheapest' | 'fastest' | 'balanced' | 'comfort';
  number_of_travelers: number;
  accommodation_type: 'budget' | 'mid_range' | 'premium' | 'luxury';
}

// Service class
export class TravelOrchestratorService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Check if API is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get LLM status
   */
  async getLLMStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/llm/status`);
      return response.data;
    } catch (error) {
      console.error('LLM status check failed:', error);
      throw error;
    }
  }

  /**
   * Get supported cities
   */
  async getSupportedCities(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/cities`);
      return response.data.cities;
    } catch (error) {
      console.error('Failed to get cities:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between cities
   */
  async calculateDistance(city1: string, city2: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/distance/${city1}/${city2}`
      );
      return response.data.distance_km;
    } catch (error) {
      console.error('Failed to calculate distance:', error);
      throw error;
    }
  }

  /**
   * Create travel plan (basic)
   */
  async createTravelPlan(request: CreatePlanRequest): Promise<AITravelPlan> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/plan`,
        request,
        { timeout: 30000 } // 30 seconds
      );

      if (response.data.success) {
        return response.data.travel_plan;
      } else {
        throw new Error(response.data.message || 'Failed to create plan');
      }
    } catch (error: any) {
      console.error('Failed to create travel plan:', error.message);
      throw error;
    }
  }

  /**
   * Create enhanced travel plan with AI insights and UI summary
   * RECOMMENDED: Use this for mobile app!
   */
  async createEnhancedPlan(request: CreatePlanRequest) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/plan/enhanced`,
        request,
        { timeout: 30000 }
      );

      return {
        success: response.data.success,
        travel_plan: response.data.travel_plan,
        insights: response.data.insights,
        ui_summary: response.data.ui_summary,
        powered_by: response.data.powered_by
      };
    } catch (error: any) {
      console.error('Failed to create enhanced plan:', error.message);
      throw error;
    }
  }

  /**
   * Get AI travel insights for destination
   */
  async getTravelInsights(
    cities: string[],
    budget: number,
    durationDays: number,
    travelers: number = 2,
    preference: string = 'balanced'
  ): Promise<TravelInsights> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/insights`,
        {
          cities,
          total_budget: budget,
          duration_days: durationDays,
          travelers,
          preference
        },
        { timeout: 15000 }
      );

      return response.data.insights;
    } catch (error: any) {
      console.error('Failed to get travel insights:', error.message);
      throw error;
    }
  }

  /**
   * Run simulation (for demo purposes)
   */
  async runSimulation(request: CreatePlanRequest) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/plan/simulate`,
        request,
        { timeout: 30000 }
      );

      return {
        simulation_id: response.data.simulation_id,
        status: response.data.status,
        steps: response.data.steps,
        final_plan: response.data.final_plan,
        total_time_seconds: response.data.total_time_seconds
      };
    } catch (error: any) {
      console.error('Failed to run simulation:', error.message);
      throw error;
    }
  }

  /**
   * Convert AI plan to Package format for UI compatibility
   */
  convertPlanToPackage(plan: AITravelPlan): Package {
    const cities = [...new Set(plan.itinerary.map(leg => leg.to_city))];
    const destination = cities.join(' → ');

    return {
      id: plan.plan_id,
      package_code: `AI-${plan.plan_id.substr(0, 8).toUpperCase()}`,
      name: `${cities[0]} to ${cities[cities.length - 1]} Adventure`,
      destination_name: destination,
      duration_days: plan.total_duration_days,
      duration_nights: Math.max(0, plan.total_duration_days - 1),
      description: plan.reasoning,
      price_per_person: plan.budget_breakdown.cost_per_person,
      package_type: plan.preference.toLowerCase(),
      is_trending: plan.confidence_score > 0.9,
      images: [], // Placeholder - can be populated with city images
      tags: ['AI-Optimized', 'Multi-City', `${plan.total_travelers} Travelers`]
    };
  }
}

// Export singleton instance
export const travelOrchestrator = new TravelOrchestratorService();

// Export default
export default travelOrchestrator;
