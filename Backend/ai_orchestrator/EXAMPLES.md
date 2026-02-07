# Example API Requests

Collection of example requests for testing the AI Orchestrator API.

---

## 1. Health Check

### Request
```bash
curl http://localhost:8000/health
```

### Response
```json
{
  "status": "healthy",
  "orchestrator": "ready",
  "active_simulations": 0,
  "timestamp": "2026-02-07T22:30:00"
}
```

---

## 2. Get Supported Cities

### Request
```bash
curl http://localhost:8000/api/v1/cities
```

### Response
```json
{
  "cities": [
    "pune", "mumbai", "bangalore", "delhi", "hyderabad",
    "chennai", "kolkata", "ahmedabad", "jaipur", "lucknow",
    "goa", "kochi", "chandigarh", "indore", "nagpur"
  ],
  "total_count": 15
}
```

---

## 3. Calculate Distance

### Request
```bash
curl http://localhost:8000/api/v1/distance/pune/mumbai
```

### Response
```json
{
  "from_city": "pune",
  "to_city": "mumbai",
  "distance_km": 149.35
}
```

---

## 4. Create Travel Plan - Budget Trip

### Request
```bash
curl -X POST http://localhost:8000/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Budget Traveler",
    "customer_email": "budget@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 30000,
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
      }
    ],
    "preference": "cheapest",
    "number_of_travelers": 2,
    "accommodation_type": "budget"
  }'
```

### Expected Behavior
- ✅ Selects buses/trains (cheaper)
- ✅ Budget hotels (OYO, etc.)
- ✅ Minimal local transport
- ✅ High budget utilization

---

## 5. Create Travel Plan - Business Trip

### Request
```bash
curl -X POST http://localhost:8000/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Business Executive",
    "customer_email": "exec@company.com",
    "customer_phone": "+919876543210",
    "total_budget": 80000,
    "cities": [
      {
        "city": "Delhi",
        "duration_days": 1,
        "arrival_date": "2026-03-01",
        "departure_date": "2026-03-02"
      },
      {
        "city": "Mumbai",
        "duration_days": 1,
        "arrival_date": "2026-03-02",
        "departure_date": "2026-03-03"
      },
      {
        "city": "Bangalore",
        "duration_days": 1,
        "arrival_date": "2026-03-03",
        "departure_date": "2026-03-04"
      }
    ],
    "preference": "fastest",
    "number_of_travelers": 1,
    "accommodation_type": "luxury"
  }'
```

### Expected Behavior
- ✈️ Flights for all legs
- 🏨 Luxury hotels (4-5 star)
- 🚕 Airport transfers
- ⚡ Fastest routing

---

## 6. Multi-City Tour (3+ Cities)

### Request - Pune → Mumbai → Bangalore

```bash
curl -X POST http://localhost:8000/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Tourist Group",
    "customer_email": "tourists@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 60000,
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
    "number_of_travelers": 3,
    "accommodation_type": "mid_range"
  }'
```

### Expected Response Structure
```json
{
  "success": true,
  "message": "Travel plan created successfully",
  "travel_plan": {
    "plan_id": "uuid-here",
    "customer_name": "Tourist Group",
    "total_travelers": 3,
    "preference": "balanced",
    "itinerary": [
      {
        "leg_number": 1,
        "from_city": "Pune",
        "to_city": "Mumbai",
        "transport": {
          "mode": "train",
          "provider": "Indian Railways",
          "cost_per_person": 1200,
          "duration_minutes": 180
        },
        "accommodation": {
          "hotel_name": "Treebo Pune Central",
          "cost_per_night": 2200,
          "total_cost": 2200,
          "nights": 1
        }
      },
      {
        "leg_number": 2,
        "from_city": "Mumbai",
        "to_city": "Bangalore",
        "transport": {
          "mode": "flight",
          "provider": "IndiGo/Air India",
          "cost_per_person": 4500,
          "duration_minutes": 120
        },
        "accommodation": {
          "hotel_name": "Treebo Mumbai Central",
          "cost_per_night": 2200,
          "total_cost": 4400,
          "nights": 2
        }
      }
    ],
    "budget_breakdown": {
      "total_budget": 60000,
      "transport_cost": 17100,
      "accommodation_cost": 13200,
      "local_transport_cost": 4800,
      "food_estimated": 9000,
      "activities_estimated": 6000,
      "buffer_amount": 3000,
      "remaining_budget": 6900,
      "budget_utilization_percent": 88.5
    },
    "confidence_score": 0.92,
    "reasoning": "Created optimized 3-city itinerary covering 1800km over 6 days..."
  }
}
```

---

## 7. Simulation Request (Demo for Judges)

### Request
```bash
curl -X POST http://localhost:8000/api/v1/plan/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Demo User",
    "customer_email": "demo@example.com",
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
  }'
```

### Response with Simulation Steps
```json
{
  "simulation_id": "abc-123-def-456",
  "status": "completed",
  "total_time_seconds": 2.45,
  "steps": [
    {
      "step_number": 1,
      "action": "analyze_request",
      "description": "Analyzing travel request for 3 cities",
      "status": "completed",
      "details": {
        "cities": ["Pune", "Mumbai", "Bangalore"],
        "budget": 50000,
        "travelers": 2,
        "total_distance_km": 1800
      }
    },
    {
      "step_number": 2,
      "action": "allocate_budget",
      "description": "Allocating budget across categories",
      "status": "completed",
      "details": {
        "transport_budget": 17500,
        "accommodation_budget": 17500
      }
    },
    {
      "step_number": 3,
      "action": "select_transport",
      "description": "Selecting transport from Pune to Mumbai",
      "status": "completed",
      "details": {
        "distance_km": 149,
        "selected_mode": "train",
        "cost": 2400
      }
    }
  ],
  "final_plan": {
    // Full travel plan here
  }
}
```

---

## 8. Edge Cases

### A. Budget Too Low
```bash
curl -X POST http://localhost:8000/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Low Budget",
    "customer_email": "low@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 5000,
    "cities": [
      {"city": "Delhi", "duration_days": 1, "arrival_date": "2026-03-01", "departure_date": "2026-03-02"},
      {"city": "Mumbai", "duration_days": 1, "arrival_date": "2026-03-02", "departure_date": "2026-03-03"}
    ],
    "preference": "cheapest",
    "number_of_travelers": 2,
    "accommodation_type": "budget"
  }'
```

**Expected:** 400 Bad Request - "Budget too low. Minimum required: ₹12,000"

---

### B. Single City (Invalid)
```bash
curl -X POST http://localhost:8000/api/v1/plan \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Single City",
    "customer_email": "single@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 10000,
    "cities": [
      {"city": "Mumbai", "duration_days": 3, "arrival_date": "2026-03-01", "departure_date": "2026-03-04"}
    ],
    "preference": "balanced",
    "number_of_travelers": 1,
    "accommodation_type": "mid_range"
  }'
```

**Expected:** 400 Bad Request - "At least 2 cities are required"

---

## 9. Using Python Requests

```python
import requests

url = "http://localhost:8000/api/v1/plan"

data = {
    "customer_name": "Python User",
    "customer_email": "python@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 50000,
    "cities": [
        {"city": "Pune", "duration_days": 1, "arrival_date": "2026-03-01", "departure_date": "2026-03-02"},
        {"city": "Mumbai", "duration_days": 2, "arrival_date": "2026-03-02", "departure_date": "2026-03-04"}
    ],
    "preference": "balanced",
    "number_of_travelers": 2,
    "accommodation_type": "mid_range"
}

response = requests.post(url, json=data)
result = response.json()

if result['success']:
    plan = result['travel_plan']
    print(f"Plan ID: {plan['plan_id']}")
    print(f"Confidence: {plan['confidence_score'] * 100}%")
    print(f"Budget Utilization: {plan['budget_breakdown']['budget_utilization_percent']}%")
```

---

## 10. Using JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:8000/api/v1/plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer_name: "JS User",
    customer_email: "js@example.com",
    customer_phone: "+919876543210",
    total_budget: 50000,
    cities: [
      { city: "Pune", duration_days: 1, arrival_date: "2026-03-01", departure_date: "2026-03-02" },
      { city: "Mumbai", duration_days: 2, arrival_date: "2026-03-02", departure_date: "2026-03-04" }
    ],
    preference: "balanced",
    number_of_travelers: 2,
    accommodation_type: "mid_range"
  })
});

const result = await response.json();
console.log('Success:', result.success);
console.log('Plan:', result.travel_plan);
```

---

## Testing Tips

1. **Start the server first:**
   ```bash
   cd Backend/ai_orchestrator
   python main.py
   ```

2. **Use the test script:**
   ```bash
   python test_api.py
   ```

3. **Check API docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

4. **Monitor simulation:**
   - Use `/plan/simulate` for step-by-step demo
   - Perfect for showing judges the AI decision-making process

---

**Happy Testing! 🚀**
