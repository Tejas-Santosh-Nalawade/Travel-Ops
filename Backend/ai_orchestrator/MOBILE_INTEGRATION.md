# Mobile App Integration Guide

## Integration with React Native / Expo App

This guide shows how to integrate the AI Orchestrator API with your React Native mobile application.

---

## 📱 Setup

### 1. Install Dependencies

In your mobile app directory (`Frontend/`):

```bash
npm install axios
```

### 2. Configure API Base URL

Create a config file:

**`Frontend/config/api.config.ts`:**
```typescript
const API_CONFIG = {
  // For local development (Android emulator)
  LOCAL_ANDROID: 'http://10.0.2.2:8000',

  // For local development (iOS simulator)
  LOCAL_IOS: 'http://localhost:8000',

  // For local development (Physical device - replace with your computer's IP)
  LOCAL_DEVICE: 'http://192.168.1.x:8000',

  // Production
  PRODUCTION: 'https://your-api-domain.com'
};

// Detect environment
const getBaseURL = () => {
  if (__DEV__) {
    // Development mode
    return Platform.OS === 'android'
      ? API_CONFIG.LOCAL_ANDROID
      : API_CONFIG.LOCAL_IOS;
  }
  return API_CONFIG.PRODUCTION;
};

export const API_BASE_URL = getBaseURL();
export const ORCHESTRATOR_API_URL = `${API_BASE_URL}/api/v1`;
```

---

## 🔧 Create API Service

**`Frontend/services/orchestratorAPI.ts`:**
```typescript
import axios, { AxiosError } from 'axios';
import { ORCHESTRATOR_API_URL } from '../config/api.config';

// Types
export interface CityStop {
  city: string;
  state?: string;
  duration_days: number;
  arrival_date: string; // YYYY-MM-DD
  departure_date: string; // YYYY-MM-DD
  preferences?: Record<string, any>;
}

export interface TravelRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_budget: number;
  cities: CityStop[];
  preference: 'fastest' | 'cheapest' | 'balanced' | 'comfort';
  number_of_travelers: number;
  accommodation_type?: 'budget' | 'mid_range' | 'luxury';
  special_requirements?: string;
}

export interface TravelPlan {
  plan_id: string;
  customer_name: string;
  total_travelers: number;
  preference: string;
  itinerary: any[];
  budget_breakdown: {
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
  };
  total_duration_days: number;
  confidence_score: number;
  reasoning: string;
  alternatives_count: number;
  created_at: string;
}

export interface OrchestrationResponse {
  success: boolean;
  message: string;
  travel_plan?: TravelPlan;
  alternative_plans?: TravelPlan[];
  error_details?: string;
}

export interface SimulationStep {
  step_number: number;
  action: string;
  description: string;
  status: 'in_progress' | 'completed' | 'failed';
  details: Record<string, any>;
  timestamp: string;
}

export interface SimulationResponse {
  simulation_id: string;
  request: TravelRequest;
  steps: SimulationStep[];
  final_plan?: TravelPlan;
  status: string;
  total_time_seconds: number;
}

// API Client
class OrchestratorAPI {
  private client = axios.create({
    baseURL: ORCHESTRATOR_API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Create a travel plan
   */
  async createPlan(request: TravelRequest): Promise<OrchestrationResponse> {
    try {
      const response = await this.client.post<OrchestrationResponse>(
        '/plan',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a travel plan with simulation (for demo)
   */
  async simulatePlan(request: TravelRequest): Promise<SimulationResponse> {
    try {
      const response = await this.client.post<SimulationResponse>(
        '/plan/simulate',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get supported cities
   */
  async getSupportedCities(): Promise<{ cities: string[]; total_count: number }> {
    try {
      const response = await this.client.get('/cities');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate distance between two cities
   */
  async calculateDistance(
    city1: string,
    city2: string
  ): Promise<{ from_city: string; to_city: string; distance_km: number }> {
    try {
      const response = await this.client.get(`/distance/${city1}/${city2}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get simulation by ID
   */
  async getSimulation(simulationId: string): Promise<SimulationResponse> {
    try {
      const response = await this.client.get<SimulationResponse>(
        `/simulation/${simulationId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * List all simulations
   */
  async listSimulations(): Promise<string[]> {
    try {
      const response = await this.client.get<string[]>('/simulations');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        // Server responded with error
        const message = axiosError.response.data?.detail ||
                       axiosError.response.data?.message ||
                       'An error occurred';
        return new Error(message);
      } else if (axiosError.request) {
        // Request made but no response
        return new Error('Unable to connect to server. Please check your connection.');
      }
    }

    return new Error('An unexpected error occurred');
  }
}

// Export singleton instance
export const orchestratorAPI = new OrchestratorAPI();
```

---

## 🎨 Example Usage in Components

### 1. Travel Planning Screen

**`Frontend/app/screens/TravelPlanningScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { orchestratorAPI, TravelRequest, TravelPlan } from '../services/orchestratorAPI';

export default function TravelPlanningScreen() {
  const [loading, setLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);

  const createPlan = async () => {
    setLoading(true);

    const request: TravelRequest = {
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+919876543210",
      total_budget: 50000,
      cities: [
        {
          city: "Pune",
          duration_days: 1,
          arrival_date: "2026-03-01",
          departure_date: "2026-03-02"
        },
        {
          city: "Mumbai",
          duration_days: 2,
          arrival_date: "2026-03-02",
          departure_date: "2026-03-04"
        },
        {
          city: "Bangalore",
          duration_days: 3,
          arrival_date: "2026-03-04",
          departure_date: "2026-03-07"
        }
      ],
      preference: "balanced",
      number_of_travelers: 2,
      accommodation_type: "mid_range"
    };

    try {
      const response = await orchestratorAPI.createPlan(request);

      if (response.success && response.travel_plan) {
        setTravelPlan(response.travel_plan);
        Alert.alert('Success', 'Travel plan created successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to create plan');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <View>
        <Text>AI Travel Planning</Text>

        {loading && <ActivityIndicator size="large" />}

        {travelPlan && (
          <View>
            <Text>Plan ID: {travelPlan.plan_id}</Text>
            <Text>Total Cost: ₹{travelPlan.budget_breakdown.total_budget - travelPlan.budget_breakdown.remaining_budget}</Text>
            <Text>Confidence: {(travelPlan.confidence_score * 100).toFixed(0)}%</Text>
            <Text>Reasoning: {travelPlan.reasoning}</Text>

            {/* Display itinerary */}
            {travelPlan.itinerary.map((leg, index) => (
              <View key={index}>
                <Text>Leg {leg.leg_number}: {leg.from_city} → {leg.to_city}</Text>
                <Text>Transport: {leg.transport.mode}</Text>
                <Text>Cost: ₹{leg.transport.cost_per_person}</Text>
              </View>
            ))}
          </View>
        )}

        <Button title="Create Plan" onPress={createPlan} disabled={loading} />
      </View>
    </ScrollView>
  );
}
```

### 2. Simulation Demo Screen (For Judges)

**`Frontend/app/screens/SimulationDemoScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { orchestratorAPI, SimulationStep } from '../services/orchestratorAPI';

export default function SimulationDemoScreen() {
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    setSteps([]);

    const request = {
      customer_name: "Demo User",
      customer_email: "demo@example.com",
      customer_phone: "+919876543210",
      total_budget: 50000,
      cities: [
        { city: "Pune", duration_days: 1, arrival_date: "2026-03-01", departure_date: "2026-03-02" },
        { city: "Mumbai", duration_days: 2, arrival_date: "2026-03-02", departure_date: "2026-03-04" },
        { city: "Bangalore", duration_days: 3, arrival_date: "2026-03-04", departure_date: "2026-03-07" }
      ],
      preference: "balanced" as const,
      number_of_travelers: 2,
      accommodation_type: "mid_range" as const
    };

    try {
      const simulation = await orchestratorAPI.simulatePlan(request);
      setSteps(simulation.steps);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = ({ item }: { item: SimulationStep }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text>Step {item.step_number}: {item.description}</Text>
      <Text>Status: {item.status}</Text>
      <Text style={{ fontSize: 12, color: 'gray' }}>
        {JSON.stringify(item.details, null, 2)}
      </Text>
    </View>
  );

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>AI Simulation Demo</Text>

      {loading && <ActivityIndicator size="large" />}

      <FlatList
        data={steps}
        renderItem={renderStep}
        keyExtractor={(item) => `step-${item.step_number}`}
      />

      <Button title="Run Simulation" onPress={runSimulation} disabled={loading} />
    </View>
  );
}
```

### 3. City Distance Calculator

**`Frontend/app/components/DistanceCalculator.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { orchestratorAPI } from '../services/orchestratorAPI';

export default function DistanceCalculator() {
  const [city1, setCity1] = useState('');
  const [city2, setCity2] = useState('');
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = async () => {
    try {
      const result = await orchestratorAPI.calculateDistance(city1, city2);
      setDistance(result.distance_km);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="From City"
        value={city1}
        onChangeText={setCity1}
      />
      <TextInput
        placeholder="To City"
        value={city2}
        onChangeText={setCity2}
      />
      <Button title="Calculate Distance" onPress={calculateDistance} />

      {distance !== null && (
        <Text>Distance: {distance.toFixed(2)} km</Text>
      )}
    </View>
  );
}
```

---

## 🔗 Integration with Existing Backend (Supabase)

You can save AI-generated plans to your Supabase database:

```typescript
import { supabase } from '../lib/supabase';
import { orchestratorAPI } from '../services/orchestratorAPI';

async function createAndSaveJourney(request: TravelRequest, userId: string) {
  // 1. Generate AI plan
  const response = await orchestratorAPI.createPlan(request);

  if (!response.success || !response.travel_plan) {
    throw new Error('Failed to create plan');
  }

  const plan = response.travel_plan;

  // 2. Save to Supabase journeys table
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .insert({
      customer_name: request.customer_name,
      created_by: userId,
      status: 'DRAFT',
      total_cost: plan.budget_breakdown.total_budget - plan.budget_breakdown.remaining_budget,
      cities: request.cities.map(c => c.city),
      dates: {
        start: request.cities[0].arrival_date,
        end: request.cities[request.cities.length - 1].departure_date
      },
      preferences: {
        preference: request.preference,
        accommodation_type: request.accommodation_type,
        travelers: request.number_of_travelers
      },
      ai_plan: plan // Store full AI plan as JSONB
    })
    .select()
    .single();

  if (journeyError) throw journeyError;

  // 3. Save journey items (transport, hotels, etc.)
  const items = [];

  for (const leg of plan.itinerary) {
    // Transport
    items.push({
      journey_id: journey.id,
      type: 'TRANSPORT',
      status: 'PENDING',
      cost: leg.transport.cost_per_person * request.number_of_travelers,
      supplier_id: leg.transport.provider,
      details: leg.transport
    });

    // Accommodation
    if (leg.accommodation) {
      items.push({
        journey_id: journey.id,
        type: 'HOTEL',
        status: 'PENDING',
        cost: leg.accommodation.total_cost,
        supplier_id: leg.accommodation.hotel_name,
        details: leg.accommodation
      });
    }
  }

  const { error: itemsError } = await supabase
    .from('journey_items')
    .insert(items);

  if (itemsError) throw itemsError;

  return journey;
}
```

---

## 🧪 Testing API Connection

**`Frontend/app/screens/APITestScreen.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { orchestratorAPI } from '../services/orchestratorAPI';

export default function APITestScreen() {
  const [status, setStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const health = await orchestratorAPI.healthCheck();
      setStatus(`Connected! Status: ${health.status}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>API Connection Test</Text>
      <Text>Status: {status}</Text>
      {loading && <ActivityIndicator />}
      <Button title="Test Connection" onPress={testConnection} />
    </View>
  );
}
```

---

## 📋 Checklist for Integration

- [ ] Install `axios` in mobile app
- [ ] Configure API base URL with your server IP
- [ ] Copy `orchestratorAPI.ts` service to your project
- [ ] Test API connection with health check
- [ ] Implement travel planning screen
- [ ] Add simulation demo for judges
- [ ] Integrate with Supabase backend
- [ ] Handle errors gracefully
- [ ] Add loading states
- [ ] Test on physical device

---

## 🐛 Common Issues

### Issue 1: Cannot connect to localhost
**Solution:** Use your computer's IP address instead of `localhost` when testing on a physical device.

```typescript
// Find your IP:
// Windows: ipconfig
// Mac/Linux: ifconfig

const API_BASE_URL = 'http://192.168.1.100:8000'; // Your IP
```

### Issue 2: Network request failed on Android
**Solution:** Allow cleartext traffic for development.

**`android/app/src/main/AndroidManifest.xml`:**
```xml
<application
  android:usesCleartextTraffic="true"
  ...
>
```

### Issue 3: CORS errors
**Solution:** Ensure the FastAPI server has CORS enabled (already configured in `api/routes.py`).

---

## 🎯 Next Steps

1. Start the AI Orchestrator server
2. Copy the API service to your mobile app
3. Test the connection
4. Build your travel planning UI
5. Demo the simulation to judges!

---

**Happy Coding! 🚀**
