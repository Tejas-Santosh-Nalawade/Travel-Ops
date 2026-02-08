# Budget Smart - AI-Powered Package Recommendations

## ✨ What's New

The Budget Smart page now uses **Groq LLM (Mixtral-8x7b)** to generate intelligent, personalized travel package recommendations based on your budget!

## 🤖 AI Features

### 1. **Intelligent Package Generation**
- AI analyzes your budget range and generates 5-8 diverse packages
- Considers different travel styles (adventure, beach, culture, mountains)
- Balances popular and offbeat destinations
- Shows realistic pricing and savings

### 2. **Smart Budget Analysis**
- AI evaluates your budget and provides insights
- Suggests optimal destinations for your budget range
- Gives personalized tips to maximize value

### 3. **Travel Insights**
- AI provides actionable insider tips
- Best time to visit recommendations
- Money-saving suggestions
- Hidden gems to explore

## 🚀 How to Use

### 1. Start the Backend Server

**Option A: Double-click the batch file**
```
d:\HACKATHON\HACK_FUSION_HACKATHON\Melt_Down\Backend\ai_orchestrator\start_server.bat
```

**Option B: Command line**
```bash
cd d:\HACKATHON\HACK_FUSION_HACKATHON\Melt_Down\Backend\ai_orchestrator
python main.py
```

Wait for: "Application startup complete"

### 2. Test the API

Open browser: `http://10.243.165.242:8000/docs`

You should see new endpoints under **"Budget Recommendations"**:
- `POST /api/v1/budget/recommendations` - Get AI-powered package recommendations
- `GET /api/v1/budget/destinations` - Popular destinations list
- `GET /api/v1/budget/budget-tips` - AI-generated budget tips

### 3. Use the Mobile App

1. **Reload the app**: Press `r` in Expo terminal
2. **Navigate**: Go to Budget Smart page
3. **Enter details**:
   - Budget Min: `30000`
   - Budget Max: `60000`
   - Number of Travelers: `2`
4. **Click**: "Find Packages"

### 4. See the Magic! ✨

After 3-5 seconds, you'll see:
- **AI Alert**: "✨ AI Recommendations Ready!" with budget analysis
- **Purple Insight Banner**: AI travel tip (best time, savings advice, etc.)
- **5-8 Package Cards**: Each with:
  - Package name (e.g., "Goa Beach Paradise")
  - Destination
  - Match Score (0-100)
  - AI Recommendation Reason
  - Price breakdown (per person & total)
  - Savings percentage (if under budget)
  - Duration (5 days)

## 📊 Example API Response

```json
{
  "success": true,
  "packages": [
    {
      "package_id": "abc-123",
      "package_name": "Kerala Backwaters Retreat",
      "destination": "Alleppey, Kerala",
      "price_per_person": 17500,
      "total_cost": 35000,
      "savings_percent": 41.67,
      "match_score": 94,
      "recommendation_reason": "Serene houseboat experience through lush backwaters. Includes Ayurvedic spa and traditional Kerala cuisine.",
      "duration_days": 5,
      "included_items": [
        "Round-trip flights",
        "Houseboat stay",
        "All meals",
        "Ayurvedic massage",
        "Village tours"
      ],
      "highlights": [
        "Backwater cruise",
        "Kumarakom Bird Sanctuary",
        "Spice plantations",
        "Kathakali dance"
      ]
    }
  ],
  "total_found": 7,
  "budget_analysis": "Excellent budget range! With ₹60,000, you can enjoy comfortable stays and diverse experiences. We've found 7 amazing packages tailored to your preferences.",
  "ai_insights": "💡 Pro tip: Kerala offers the best value this season. Book 2-3 months in advance for additional savings!",
  "powered_by": "Groq LLM (Mixtral-8x7b)"
}
```

## 🎯 API Endpoints

### Main Endpoint

**POST** `/api/v1/budget/recommendations`

**Request Body:**
```json
{
  "budget_min": 30000,
  "budget_max": 60000,
  "num_travelers": 2,
  "preferences": {},
  "duration_days": 5
}
```

**Response:** Full package recommendations with AI insights

### Helper Endpoints

**GET** `/api/v1/budget/destinations`
- Popular destinations with price ranges
- Icons and categories (Beach, Mountains, Heritage, etc.)

**GET** `/api/v1/budget/budget-tips`
- AI-generated budget optimization tips
- 5 actionable tips for Indian travelers

## 🧠 How It Works

### Step 1: User Enters Budget
- Example: ₹30,000 - ₹60,000 for 2 travelers

### Step 2: AI Analysis
- Groq LLM analyzes budget per person (₹30,000 each)
- Considers budget range, traveler count, duration

### Step 3: Package Generation
- **Primary**: AI generates creative package names and recommendations
- **Fallback**: If AI fails, uses intelligent default packages
- Ensures all packages are within budget range

### Step 4: Smart Recommendations
- Each package gets a match score (0-100)
- AI explains WHY it's a good match
- Shows savings percentage if under budget
- Includes realistic pricing and inclusions

### Step 5: Additional Insights
- Budget analysis: "Excellent budget for luxury..."
- Travel tip: "Book 2 months ahead for 20% off"
- Destination-specific advice

## 💰 Package Details Features

Each package includes:
- ✅ **Match Score**: AI calculates value-for-money (85-96%)
- 💚 **Recommendation Reason**: Personalized explanation
- 💵 **Pricing**: Per person & total cost
- 📊 **Savings Badge**: Shows % under budget
- 🎁 **Included Items**: Flights, hotels, meals, activities (5 items)
- ⭐ **Highlights**: Top attractions/experiences (4 highlights)
- 📅 **Duration**: Trip length (default 5 days)

## 🎨 UI Highlights

### 1. **AI-Powered Header**
```
💰 Budget Smart
AI-powered package recommendations
```

### 2. **Alert After Search**
```
✨ AI Recommendations Ready!
Found 7 amazing packages for you!

Excellent budget range! With ₹60,000...
```

### 3. **Purple Insight Banner**
```
💡 AI Travel Insight
Pro tip: Kerala offers the best value this season...
```

### 4. **Package Cards**
- Header: Package name + destination + match score badge
- Green box: AI recommendation reason
- Pricing: Total cost + per person + savings badge (orange)
- Blue "Book This Package" button

## 🔧 Troubleshooting

### "Failed to get recommendations"

**Check 1: Is backend running?**
```bash
curl http://10.243.165.242:8000/
```
Should return: `{"service":"TravelOps AI Orchestrator"...}`

**Check 2: Test budget endpoint**
```bash
curl http://10.243.165.242:8000/api/v1/budget/destinations
```
Should return list of destinations (not "Not Found")

**Check 3: IP address changed?**
Update line 69 in `budget-packages.tsx`:
```typescript
const API_BASE_URL = 'http://YOUR_NEW_IP:8000'
```

### No packages returned

- Try wider budget range (e.g., ₹20,000 - ₹80,000)
- Check backend logs for errors
- Use fallback mode (automatically activates if AI fails)

### AI not generating packages

The system has intelligent fallback:
- 8 pre-designed amazing packages
- Realistic Indian destinations
- All within budget range
- Still shows match scores and recommendations

## 🎬 Demo Script for Judges

**"Let me show you our AI-powered Budget Smart feature."**

1. **[Enter Budget]**
   "I have ₹50,000 for 2 travelers..."

2. **[Click Find Packages]**
   "Our AI analyzes the budget and generates personalized recommendations..."

3. **[Show Alert]**
   "The AI found 7 packages and provides budget analysis..."

4. **[Point to Insight Banner]**
   "See this? The AI gives insider tips specific to these destinations..."

5. **[Scroll through packages]**
   "Each package has an AI match score and explanation of why it's perfect for this budget..."

6. **[Point to savings badge]**
   "This one is 42% under budget - great value! AI highlights the best deals..."

7. **[Open one package]**
   "Includes flights, hotels, meals, activities - all calculated by AI for realistic pricing..."

**"Unlike traditional search, this uses machine learning to understand travel preferences and optimize value."**

## 🚀 Advanced Features (Future)

- [ ] Save favorite packages
- [ ] Share packages with friends
- [ ] Book directly from app
- [ ] Compare packages side-by-side
- [ ] Filter by destination type
- [ ] Custom duration selection
- [ ] Multi-city packages
- [ ] Seasonal pricing adjustments

## 📱 Mobile App Integration

The Budget Smart page is fully integrated:
- **Path**: `Frontend/app/(agent)/Home/budget-packages.tsx`
- **Navigation**: Available from Agent dashboard
- **API**: `http://10.243.165.242:8000/api/v1/budget/`
- **Response Time**: 3-5 seconds (includes AI processing)

## 🔥 Key Selling Points

1. **AI-Powered**: Uses Groq Mixtral-8x7b for intelligent recommendations
2. **Personalized**: Match scores and reasons for each package
3. **Realistic**: Actual Indian destinations with accurate pricing
4. **Value-Focused**: Highlights savings and best deals
5. **Comprehensive**: Includes everything (flights, hotels, meals, activities)
6. **Insightful**: Actionable travel tips from AI
7. **Fast**: Results in 3-5 seconds
8. **Reliable**: Intelligent fallback if AI service unavailable

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Can access API docs at http://10.243.165.242:8000/docs
- [ ] Budget endpoints visible in docs
- [ ] Expo app loaded
- [ ] Budget Smart page accessible
- [ ] Entering budget and clicking "Find Packages" works
- [ ] AI alert appears after 3-5 seconds
- [ ] Packages display with all details
- [ ] Purple insight banner shows AI tip

All checked? Ready to impress the judges! 🎉
