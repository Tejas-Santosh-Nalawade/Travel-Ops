# TravelOps AI Orchestrator

🤖 **AI-Powered Multi-City Travel Planning and Orchestration System**

An intelligent travel planning system that uses AI to orchestrate complex multi-city journeys, optimizing for budget, preferences, and travel efficiency.

---

## 🌟 Features

### Core AI Capabilities
- **Intelligent Transport Selection**: Automatically chooses between flights, trains, buses, and cabs based on distance, budget, and preferences
- **Budget Optimization**: Dynamically allocates budget across transport, accommodation, food, and activities
- **Multi-City Routing**: Plans optimal routes for 2+ city journeys
- **Smart Accommodation Matching**: Selects hotels based on budget tier and location
- **Real-Time Simulation**: Shows step-by-step AI decision-making process

### Travel Preferences
- **Cheapest**: Budget-focused options with maximum savings
- **Fastest**: Prioritizes speed and minimal travel time
- **Balanced**: Optimal mix of cost and comfort
- **Comfort**: Premium accommodations and transport

### API Features
- RESTful API with comprehensive endpoints
- Real-time simulation for demonstrations
- Mobile app integration ready
- Detailed budget breakdowns
- Carbon footprint tracking
- Confidence scoring for plans

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip (Python package manager)

### Installation

1. **Navigate to the AI Orchestrator directory:**
```bash
cd Backend/ai_orchestrator
```

2. **Create a virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Create environment file:**
```bash
cp .env.example .env
# Edit .env with your configuration (optional for basic usage)
```

6. **Run the server:**
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at: **http://localhost:8000**

---

## 📚 API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### 1. Create Travel Plan
```http
POST /api/v1/plan
```

Creates an optimized multi-city travel plan.

**Example Request:**
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

**Response:**
```json
{
  "success": true,
  "message": "Travel plan created successfully",
  "travel_plan": {
    "plan_id": "123e4567-e89b-12d3-a456-426614174000",
    "customer_name": "Rahul Sharma",
    "total_travelers": 2,
    "preference": "balanced",
    "itinerary": [...],
    "budget_breakdown": {
      "total_budget": 50000,
      "transport_cost": 15000,
      "accommodation_cost": 13200,
      "local_transport_cost": 3200,
      "food_estimated": 7500,
      "activities_estimated": 5000,
      "buffer_amount": 2500,
      "remaining_budget": 3600,
      "budget_utilization_percent": 92.8
    },
    "confidence_score": 0.95,
    "reasoning": "Created optimized 3-city itinerary..."
  }
}
```

#### 2. Simulate Travel Planning (Demo)
```http
POST /api/v1/plan/simulate
```

Creates a plan with step-by-step simulation - **perfect for judge demonstrations!**

Shows real-time AI decision-making process with detailed steps.

#### 3. Calculate Distance
```http
GET /api/v1/distance/{city1}/{city2}
```

Calculate distance between two cities.

Example: `GET /api/v1/distance/pune/mumbai`

#### 4. Get Supported Cities
```http
GET /api/v1/cities
```

Returns all supported cities with coordinates.

---

## 🎯 Example Use Cases

### Use Case 1: Budget Trip (Pune → Mumbai → Bangalore)
```python
import requests

url = "http://localhost:8000/api/v1/plan"

data = {
    "customer_name": "Student Group",
    "customer_email": "students@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 30000,
    "cities": [
        {"city": "Pune", "duration_days": 1, "arrival_date": "2026-03-01", "departure_date": "2026-03-02"},
        {"city": "Mumbai", "duration_days": 2, "arrival_date": "2026-03-02", "departure_date": "2026-03-04"},
        {"city": "Bangalore", "duration_days": 2, "arrival_date": "2026-03-04", "departure_date": "2026-03-06"}
    ],
    "preference": "cheapest",
    "number_of_travelers": 3,
    "accommodation_type": "budget"
}

response = requests.post(url, json=data)
print(response.json())
```

**AI will select:**
- ✅ Buses/trains for transport (cheaper)
- ✅ Budget hotels (OYO, etc.)
- ✅ Minimal local transport
- ✅ Maximum budget savings

### Use Case 2: Business Trip (Fast & Comfortable)
```python
data = {
    "customer_name": "Business Executive",
    "customer_email": "exec@company.com",
    "customer_phone": "+919876543210",
    "total_budget": 80000,
    "cities": [
        {"city": "Delhi", "duration_days": 1, "arrival_date": "2026-03-01", "departure_date": "2026-03-02"},
        {"city": "Mumbai", "duration_days": 1, "arrival_date": "2026-03-02", "departure_date": "2026-03-03"},
        {"city": "Bangalore", "duration_days": 1, "arrival_date": "2026-03-03", "departure_date": "2026-03-04"}
    ],
    "preference": "fastest",
    "number_of_travelers": 1,
    "accommodation_type": "luxury"
}
```

**AI will select:**
- ✈️ Flights for all long-distance travel
- 🏨 Premium hotels (4-5 star)
- 🚕 Airport transfers and cabs
- ⚡ Fastest possible routing

---

## 🧠 How the AI Works

### Decision-Making Process

1. **Request Analysis**
   - Calculate total distance
   - Analyze budget per person
   - Determine trip complexity

2. **Budget Allocation**
   ```
   Cheapest Preference:
   - Transport: 35%
   - Accommodation: 30%
   - Food: 20%
   - Activities: 10%
   - Buffer: 5%

   Comfort Preference:
   - Transport: 30%
   - Accommodation: 40%
   - Food: 15%
   - Activities: 10%
   - Buffer: 5%
   ```

3. **Transport Mode Selection**
   ```
   Distance > 800km → Flight (unless budget constrained)
   Distance 400-800km → Train/Flight (based on preference)
   Distance 150-400km → Train/Bus
   Distance < 150km → Cab/Rental Car
   ```

4. **Accommodation Matching**
   ```
   Budget per night < ₹1500 → Budget hotels (OYO)
   Budget per night < ₹3000 → Mid-range (Treebo, FabHotel)
   Budget per night < ₹5000 → Premium (Lemon Tree, Ginger)
   Budget per night > ₹5000 → Luxury (Taj, Marriott)
   ```

5. **Optimization**
   - Check budget constraints
   - Adjust selections if over budget
   - Ensure minimum buffer (5%)
   - Calculate confidence score

---

## 📱 Mobile App Integration

### React Native / Expo Integration

**1. Install axios in your mobile app:**
```bash
npm install axios
```

**2. Create API service:**
```typescript
// services/orchestratorAPI.ts
import axios from 'axios';

const API_BASE_URL = 'http://your-server:8000/api/v1';

export const orchestratorAPI = {
  createPlan: async (travelRequest: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/plan`,
      travelRequest
    );
    return response.data;
  },

  simulatePlan: async (travelRequest: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/plan/simulate`,
      travelRequest
    );
    return response.data;
  },

  getSupportedCities: async () => {
    const response = await axios.get(`${API_BASE_URL}/cities`);
    return response.data;
  },

  calculateDistance: async (city1: string, city2: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/distance/${city1}/${city2}`
    );
    return response.data;
  }
};
```

**3. Use in your components:**
```typescript
import { orchestratorAPI } from './services/orchestratorAPI';

// In your component
const planTravel = async () => {
  try {
    const travelRequest = {
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+919876543210",
      total_budget: 50000,
      cities: [...],
      preference: "balanced",
      number_of_travelers: 2,
      accommodation_type: "mid_range"
    };

    const result = await orchestratorAPI.createPlan(travelRequest);

    if (result.success) {
      console.log("Plan created:", result.travel_plan);
      // Navigate to plan details screen
    }
  } catch (error) {
    console.error("Error creating plan:", error);
  }
};
```

---

## 🎬 Demo for Judges

### Real-Time Simulation API

The `/api/v1/plan/simulate` endpoint is specifically designed for demonstrations:

```bash
# Using curl
curl -X POST "http://localhost:8000/api/v1/plan/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Demo User",
    "customer_email": "demo@example.com",
    "customer_phone": "+919876543210",
    "total_budget": 50000,
    "cities": [
      {"city": "Pune", "duration_days": 1, "arrival_date": "2026-03-01", "departure_date": "2026-03-02"},
      {"city": "Mumbai", "duration_days": 2, "arrival_date": "2026-03-02", "departure_date": "2026-03-04"},
      {"city": "Bangalore", "duration_days": 3, "arrival_date": "2026-03-04", "departure_date": "2026-03-07"}
    ],
    "preference": "balanced",
    "number_of_travelers": 2,
    "accommodation_type": "mid_range"
  }'
```

**Simulation Steps Shown:**
1. ✅ Analyzing travel request
2. ✅ Allocating budget
3. ✅ Selecting transport: Pune → Mumbai
4. ✅ Finding accommodation in Pune
5. ✅ Selecting transport: Mumbai → Bangalore
6. ✅ Finding accommodation in Mumbai
7. ✅ Finding accommodation in Bangalore
8. ✅ Plan generation complete

---

## 🏗️ Architecture

```
Backend/ai_orchestrator/
├── agents/
│   └── orchestrator.py      # Core AI orchestration logic
├── api/
│   └── routes.py            # FastAPI endpoints
├── models/
│   └── schemas.py           # Pydantic data models
├── utils/
│   └── helpers.py           # Utility functions
├── config.py                # Configuration
├── main.py                  # Application entry point
└── requirements.txt         # Dependencies
```

---

## 🔧 Configuration

Edit `.env` file:

```env
# Minimum budget per person per day
MIN_BUDGET_PER_PERSON=3000.0

# Maximum travelers allowed
MAX_TRAVELERS=10

# Server configuration
HOST=0.0.0.0
PORT=8000
```

---

## 🌐 Supported Cities

Currently supports 15+ major Indian cities:
- Mumbai, Delhi, Bangalore, Hyderabad, Chennai
- Kolkata, Pune, Ahmedabad, Jaipur, Lucknow
- Goa, Kochi, Chandigarh, Indore, Nagpur

**To add more cities:** Edit `city_coordinates` in `agents/orchestrator.py`

---

## 🐛 Troubleshooting

### Issue: Module not found errors
```bash
# Ensure you're in the virtual environment
pip install -r requirements.txt
```

### Issue: Port 8000 already in use
```bash
# Use a different port
uvicorn main:app --port 8001
```

### Issue: CORS errors from mobile app
```bash
# Edit config.py or .env
CORS_ORIGINS=["http://localhost:19006", "http://your-app-url"]
```

---

## 📊 API Response Examples

### Budget Breakdown
```json
{
  "total_budget": 50000,
  "transport_cost": 15000,
  "accommodation_cost": 13200,
  "local_transport_cost": 3200,
  "food_estimated": 7500,
  "activities_estimated": 5000,
  "buffer_amount": 2500,
  "remaining_budget": 3600,
  "cost_per_person": 23200,
  "budget_utilization_percent": 92.8
}
```

### Itinerary Leg
```json
{
  "leg_number": 1,
  "from_city": "Pune",
  "to_city": "Mumbai",
  "transport": {
    "mode": "train",
    "departure_time": "2026-03-01T10:00:00",
    "arrival_time": "2026-03-01T13:30:00",
    "duration_minutes": 210,
    "cost_per_person": 1200,
    "provider": "Indian Railways",
    "comfort_score": 7.5
  },
  "accommodation": {
    "hotel_name": "Treebo Mumbai Central",
    "cost_per_night": 2200,
    "total_cost": 4400,
    "rating": 4.0,
    "amenities": ["WiFi", "AC", "TV", "Breakfast"]
  }
}
```

---

## 🚀 Deployment

### Production Deployment

**Using Docker:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Using systemd:**
```ini
[Unit]
Description=TravelOps AI Orchestrator
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/ai_orchestrator
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

---

## 📈 Performance

- Average plan generation: **< 2 seconds**
- Simulation with steps: **< 3 seconds**
- Supports: **10+ concurrent requests**
- Memory usage: **~50MB per instance**

---

## 🤝 Contributing

This is a hackathon project. For production use:
1. Add authentication/authorization
2. Implement Redis caching
3. Connect to real booking APIs
4. Add comprehensive error handling
5. Implement rate limiting

---

## 📄 License

Created for Hack Fusion Hackathon 2026

---

## 👥 Team

**TravelOps Team**
- Advanced AI orchestration
- Multi-city travel optimization
- Real-time budget calculation

---

## 🎯 Next Steps

1. **Start the server**: `python main.py`
2. **Test API**: Visit http://localhost:8000/docs
3. **Try simulation**: POST to `/api/v1/plan/simulate`
4. **Integrate mobile app**: Use provided code examples
5. **Demo to judges**: Show real-time simulation!

---

**Need Help?** Check the API documentation at http://localhost:8000/docs

**Happy Traveling! ✈️🚂🚌**
