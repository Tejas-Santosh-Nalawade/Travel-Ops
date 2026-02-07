# TravelOps Frontend - AI Orchestrator Integration

## Quick Setup (2 minutes)

### 1. Configure API URL

Create `.env` in Frontend folder:

```bash
# For local development
EXPO_PUBLIC_API_URL=http://192.168.1.X:8000

# Replace 192.168.1.X with your computer's IP address
# Find it with:
# Windows: ipconfig
# Mac/Linux: ifconfig
```

### 2. Install Dependencies

```bash
cd Frontend
npm install axios
```

### 3. Test Connection

```typescript
// In your app
import { travelOrchestrator } from './services/orchestratorAPI';

const testAPI = async () => {
  try {
    const health = await travelOrchestrator.healthCheck();
    console.log('API Status:', health);
  } catch (error) {
    console.error('API not reachable:', error);
  }
};
```

---

## Integration Points

### 1. AI Recommendations (New!)

Replace Supabase RPC calls with AI Orchestrator:

#### Before (Supabase):
```typescript
const { data, error } = await supabase.rpc('get_budget_recommendations', {
  p_budget_min: 20000,
  p_budget_max: 50000
});
```

#### After (AI Orchestrator):
```typescript
import { travelOrchestrator } from '../../../services/orchestratorAPI';

const result = await travelOrchestrator.createEnhancedPlan({
  customer_name: "User",
  customer_email: "user@example.com",
  customer_phone: "+919876543210",
  total_budget: 35000, // average of min/max
  cities: [
    { city: "Pune", duration_days: 2, arrival_date: "2026-03-01", departure_date: "2026-03-03" },
    { city: "Mumbai", duration_days: 3, arrival_date: "2026-03-03", departure_date: "2026-03-06" }
  ],
  preference: "balanced",
  number_of_travelers: 2,
  accommodation_type: "mid_range"
});

// result contains:
// - travel_plan: Complete itinerary
// - insights: AI-generated tips
// - ui_summary: Friendly message for UI
```

### 2. Search/Browse Integration

Convert AI plans to Package format for compatibility:

```typescript
const plan = await travelOrchestrator.createEnhancedPlan({...});

// Convert to Package format for UI
const package = travelOrchestrator.convertPlanToPackage(plan.travel_plan);

// Now compatible with existing Package interface
setPackages([...packages, package]);
```

### 3. Budget Recommendations

New AI-powered budget screen:

```typescript
// Use ai-recommendations.tsx instead of recommendations.tsx
import AIRecommendations from './(agent)/Home/ai-recommendations';

// Navigate to it:
<TouchableOpacity onPress={() => router.push('/ai-recommendations')}>
  <Text>Get AI Recommendations</Text>
</TouchableOpacity>
```

---

## API Endpoints Available

### Core Planning

```typescript
// 1. Create basic plan
const plan = await travelOrchestrator.createTravelPlan(request);

// 2. Create enhanced plan (RECOMMENDED)
const enhanced = await travelOrchestrator.createEnhancedPlan(request);
// Returns: { travel_plan, insights, ui_summary, powered_by }

// 3. Get travel insights only
const insights = await travelOrchestrator.getTravelInsights(
  ['Pune', 'Mumbai'],
  50000,
  5,
  2,
  'balanced'
);
```

### Utility Functions

```typescript
// Get supported cities
const cities = await travelOrchestrator.getSupportedCities();
// Returns: ['pune', 'mumbai', 'bangalore', ...]

// Calculate distance
const distance = await travelOrchestrator.calculateDistance('pune', 'mumbai');
// Returns: 149.35 (km)

// Health check
const health = await travelOrchestrator.healthCheck();
// Returns: { status: 'healthy', orchestrator: 'ready', ... }

// LLM status
const llmStatus = await travelOrchestrator.getLLMStatus();
// Returns: { llm_enabled: true, llm_model: 'mixtral-8x7b-32768', ... }
```

---

## Usage Examples

### Example 1: Budget Travel Planning

```typescript
// In your component
import { travelOrchestrator } from '../../../services/orchestratorAPI';

const planBudgetTrip = async () => {
  try {
    const result = await travelOrchestrator.createEnhancedPlan({
      customer_name: user.name,
      customer_email: user.email,
      customer_phone: user.phone,
      total_budget: 30000,
      cities: [
        {
          city: 'Pune',
          duration_days: 2,
          arrival_date: '2026-03-15',
          departure_date: '2026-03-17'
        },
        {
          city: 'Mumbai',
          duration_days: 3,
          arrival_date: '2026-03-17',
          departure_date: '2026-03-20'
        }
      ],
      preference: 'cheapest',
      number_of_travelers: 2,
      accommodation_type: 'budget'
    });

    // Show friendly AI summary
    Alert.alert(
      result.ui_summary.title,
      result.ui_summary.summary
    );

    // Display plan
    setTravelPlan(result.travel_plan);

    // Show insights
    setInsights(result.insights);

  } catch (error) {
    Alert.alert('Error', 'Failed to create plan');
  }
};
```

### Example 2: Quick City-to-City

```typescript
const quickTrip = async (from: string, to: string, budget: number) => {
  const result = await travelOrchestrator.createEnhancedPlan({
    customer_name: "Quick Traveler",
    customer_email: "user@example.com",
    customer_phone: "+919876543210",
    total_budget: budget,
    cities: [
      { city: from, duration_days: 0, arrival_date: today(), departure_date: today() },
      { city: to, duration_days: 2, arrival_date: today(), departure_date: tomorrow(2) }
    ],
    preference: "fastest",
    number_of_travelers: 1,
    accommodation_type: "mid_range"
  });

  return result;
};
```

### Example 3: Multi-City Adventure

```typescript
const multiCityPlan = async () => {
  const cities = ['Pune', 'Mumbai', 'Bangalore', 'Goa'];
  const daysPerCity = 2;

  const cityRequests = cities.map((city, index) => ({
    city,
    duration_days: daysPerCity,
    arrival_date: addDays(index * daysPerCity),
    departure_date: addDays((index + 1) * daysPerCity)
  }));

  const result = await travelOrchestrator.createEnhancedPlan({
    customer_name: "Adventure Seeker",
    customer_email: "adventure@example.com",
    customer_phone: "+919876543210",
    total_budget: 100000,
    cities: cityRequests,
    preference: "balanced",
    number_of_travelers: 3,
    accommodation_type: "premium"
  });

  return result;
};
```

---

## Display AI Results in UI

### Show Budget Breakdown

```typescript
const BudgetCard = ({ breakdown }) => (
  <View className="bg-white rounded-3xl p-6 shadow-lg">
    <Text className="text-lg font-bold mb-3">Budget Breakdown</Text>

    <View className="space-y-2">
      <Row label="Transport" value={breakdown.transport_cost} />
      <Row label="Hotels" value={breakdown.accommodation_cost} />
      <Row label="Food" value={breakdown.food_estimated} />
      <Row label="Activities" value={breakdown.activities_estimated} />

      <View className="pt-2 mt-2 border-t border-gray-200">
        <Row
          label="Total"
          value={breakdown.total_budget}
          bold
        />
      </View>
    </View>

    <View className="mt-4 p-3 bg-purple-50 rounded-xl">
      <Text className="text-purple-900 font-semibold">
        Budget Used: {breakdown.budget_utilization_percent.toFixed(1)}%
      </Text>
    </View>
  </View>
);
```

### Show AI Insights

```typescript
const InsightsCard = ({ insights }) => (
  <View className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6">
    <Text className="text-lg font-bold mb-2">💡 AI Insights</Text>

    <Text className="text-gray-700 mb-4">
      {insights.trip_summary}
    </Text>

    {insights.insider_tips && (
      <>
        <Text className="font-semibold text-gray-800 mb-2">
          Insider Tips:
        </Text>
        {insights.insider_tips.map((tip, i) => (
          <View key={i} className="flex-row items-start mb-2">
            <Text className="text-purple-600 mr-2">•</Text>
            <Text className="flex-1 text-gray-600">{tip}</Text>
          </View>
        ))}
      </>
    )}

    {insights.must_see_attractions && (
      <>
        <Text className="font-semibold text-gray-800 mt-4 mb-2">
          Must-See:
        </Text>
        {insights.must_see_attractions.map((place, i) => (
          <View key={i} className="flex-row items-center mb-2">
            <Ionicons name="location" size={16} color="#6366f1" />
            <Text className="ml-2 text-gray-600">{place}</Text>
          </View>
        ))}
      </>
    )}
  </View>
);
```

### Show Itinerary

```typescript
const ItineraryCard = ({ itinerary }) => (
  <View>
    {itinerary.map((leg, index) => (
      <View key={index} className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-bold">
            Day {leg.leg_number}
          </Text>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-600 font-semibold text-xs">
              {leg.from_city} → {leg.to_city}
            </Text>
          </View>
        </View>

        {/* Transport */}
        <View className="mb-4">
          <Text className="font-semibold text-gray-800 mb-2">
            🚂 Transport
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 capitalize">
              {leg.transport.mode}
            </Text>
            <Text className="font-bold text-gray-900">
              ₹{leg.transport.cost_per_person}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            {leg.transport.provider}
          </Text>
        </View>

        {/* Accommodation */}
        {leg.accommodation && (
          <View>
            <Text className="font-semibold text-gray-800 mb-2">
              🏨 Hotel
            </Text>
            <Text className="text-gray-900 font-medium">
              {leg.accommodation.hotel_name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-gray-500">
                {leg.accommodation.nights} nights
              </Text>
              <Text className="mx-2 text-gray-300">•</Text>
              <Text className="font-bold text-gray-900 text-sm">
                ₹{leg.accommodation.total_cost}
              </Text>
            </View>
          </View>
        )}
      </View>
    ))}
  </View>
);
```

---

## Error Handling

```typescript
const createPlanWithErrorHandling = async () => {
  try {
    // Check API health first
    const health = await travelOrchestrator.healthCheck();
    if (health.status !== 'healthy') {
      Alert.alert('API Error', 'Orchestrator service is not available');
      return;
    }

    // Create plan
    const result = await travelOrchestrator.createEnhancedPlan({...});

    if (result.success) {
      // Handle success
      setTravelPlan(result.travel_plan);
    }

  } catch (error: any) {
    console.error('Plan creation error:', error);

    if (error.code === 'ECONNREFUSED') {
      Alert.alert(
        'Connection Error',
        'Cannot connect to AI service. Please check if the server is running.'
      );
    } else if (error.response?.status === 400) {
      Alert.alert(
        'Invalid Request',
        error.response.data.message || 'Please check your input'
      );
    } else {
      Alert.alert(
        'Error',
        'Failed to create travel plan. Please try again.'
      );
    }
  }
};
```

---

## Performance Tips

1. **Cache city lists**:
```typescript
let cachedCities: string[] | null = null;

const getCities = async () => {
  if (cachedCities) return cachedCities;
  cachedCities = await travelOrchestrator.getSupportedCities();
  return cachedCities;
};
```

2. **Show loading states**:
```typescript
<TouchableOpacity
  onPress={createPlan}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text>Create Plan</Text>
  )}
</TouchableOpacity>
```

3. **Timeout handling**:
```typescript
// Already configured in service with 30s timeout
// Plans should return in 1-3 seconds
```

---

## Testing

### Test 1: Health Check
```typescript
travelOrchestrator.healthCheck()
  .then(data => console.log('✅ API is healthy:', data))
  .catch(err => console.error('❌ API error:', err));
```

### Test 2: Get Cities
```typescript
travelOrchestrator.getSupportedCities()
  .then(cities => console.log('✅ Cities:', cities))
  .catch(err => console.error('❌ Error:', err));
```

### Test 3: Create Plan
```typescript
travelOrchestrator.createEnhancedPlan({
  customer_name: "Test User",
  customer_email: "test@example.com",
  customer_phone: "+919876543210",
  total_budget: 30000,
  cities: [
    { city: "Pune", duration_days: 2, arrival_date: "2026-03-01", departure_date: "2026-03-03" }
  ],
  preference: "balanced",
  number_of_travelers: 2,
  accommodation_type: "mid_range"
})
  .then(result => console.log('✅ Plan created:', result))
  .catch(err => console.error('❌ Error:', err));
```

---

## Migration Guide

### Step 1: Keep Supabase for User Data
```typescript
// Still use Supabase for:
- User authentication
- User profiles
- Bookings history
- Package browsing
```

### Step 2: Use AI Orchestrator for Planning
```typescript
// Use AI Orchestrator for:
- Dynamic travel planning
- Budget recommendations
- Multi-city routing
- AI insights
```

### Step 3: Hybrid Approach
```typescript
// Combine both:
1. Browse pre-made packages (Supabase)
2. Get AI recommendations (Orchestrator)
3. Save bookings (Supabase)
```

---

## Files Created

✅ `Frontend/services/orchestratorAPI.ts` - API integration service
✅ `Frontend/app/(agent)/Home/ai-recommendations.tsx` - AI-powered UI
✅ `Frontend/MOBILE_INTEGRATION_README.md` - This guide

---

## Next Steps

1. **Configure `.env`** with your API URL
2. **Install axios**: `npm install axios`
3. **Test connection**: Run health check
4. **Update navigation**: Add AI recommendations screen
5. **Test with real data**: Create a plan!

---

## Support

Server not responding?
- Check if Backend server is running: `cd Backend/ai_orchestrator && python main.py`
- Verify IP address in `.env`
- Test with: `curl http://YOUR_IP:8000/health`

---

**Your Frontend is now connected to the AI Orchestrator! 🚀**
