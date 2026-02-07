/**
 * Credit Card API Service
 * Frontend integration for credit card rewards and offers
 */
import axios from 'axios';

// Configuration
const CREDIT_API_URL = 'http://10.243.165.242:8001';  // Update with your IP

// Types
export interface CreditCard {
  card_id: string;
  card_name: string;
  card_type: 'visa' | 'mastercard' | 'amex' | 'rupay';
  card_tier: 'basic' | 'silver' | 'gold' | 'platinum' | 'signature';
  annual_fee: number;
  joining_bonus: number;
  reward_rate: number;
  travel_multiplier: number;
  airport_lounge_access: boolean;
  free_lounge_visits: number;
  cashback_percent: number;
  fuel_surcharge_waiver: boolean;
  travel_benefits: string[];
  partner_airlines: string[];
  partner_hotels: string[];
  minimum_spend: number;
  spending_milestone?: number;
  milestone_bonus: number;
}

export interface CardOffer {
  offer_id: string;
  card_id: string;
  merchant: string;
  discount_percent: number;
  max_discount: number;
  category: string;
  valid_until: string;
  terms: string;
}

export interface TravelBenefit {
  benefit_type: string;
  description: string;
  value_estimate: number;
  usage_terms: string;
}

export interface CardRecommendation {
  card: CreditCard;
  estimated_annual_value: number;
  travel_score: number;
  recommended_for: string;
  active_offers: CardOffer[];
  travel_benefits: TravelBenefit[];
  roi_percent: number;
}

export interface RecommendationRequest {
  monthly_spend: number;
  spend_categories: {
    travel?: number;
    dining?: number;
    shopping?: number;
    fuel?: number;
    groceries?: number;
  };
  travel_frequency: number;
  preferred_airlines?: string[];
  preferred_hotels?: string[];
}

export interface RewardCalculation {
  spending_amount: number;
  category: string;
  rewards: {
    points_earned: number;
    cashback_earned: number;
    total_value_rupees: number;
    effective_discount_percent: number;
  };
  redemption_options: Array<{
    option: string;
    value_per_point: number;
  }>;
}

// Service Class
class CreditCardService {
  private baseURL: string;

  constructor(baseURL: string = CREDIT_API_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get all available credit cards
   */
  async getAllCards(): Promise<CreditCard[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/cards`);
      return response.data.cards;
    } catch (error) {
      console.error('Failed to get cards:', error);
      throw error;
    }
  }

  /**
   * Get specific card details
   */
  async getCardDetails(cardId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get card details:', error);
      throw error;
    }
  }

  /**
   * Get personalized card recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<CardRecommendation[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/recommendations`,
        request,
        { timeout: 15000 }
      );
      return response.data.recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate rewards for a spending amount
   */
  async calculateRewards(
    cardId: string,
    spendingAmount: number,
    category: string = 'travel'
  ): Promise<RewardCalculation> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/calculate-rewards`,
        null,
        {
          params: {
            card_id: cardId,
            spending_amount: spendingAmount,
            category: category
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to calculate rewards:', error);
      throw error;
    }
  }

  /**
   * Get all active offers
   */
  async getAllOffers(category?: string): Promise<CardOffer[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/v1/offers`, {
        params: category ? { category } : {}
      });
      return response.data.offers;
    } catch (error) {
      console.error('Failed to get offers:', error);
      throw error;
    }
  }

  /**
   * Get travel benefits for a card
   */
  async getTravelBenefits(cardId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/v1/travel-benefits/${cardId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get travel benefits:', error);
      throw error;
    }
  }

  /**
   * Add a new credit card
   */
  async addCard(card: CreditCard) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/add-card`,
        card
      );
      return response.data;
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  }

  /**
   * Get best credit cards for a specific trip
   */
  async recommendForTrip(
    tripCost: number,
    cities: string[],
    durationDays: number,
    travelers: number = 1
  ) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/recommend-for-trip`,
        {
          trip_cost: tripCost,
          cities: cities,
          duration_days: durationDays,
          travelers: travelers
        },
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get trip card recommendations:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const creditCardService = new CreditCardService();

// Export default
export default creditCardService;
