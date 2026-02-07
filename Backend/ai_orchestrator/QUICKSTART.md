# Quick Start Guide

## ✅ Bug Fix Applied!

The import error has been fixed! All imports now use absolute paths instead of relative imports.

---

## 🚀 Start the Server (30 seconds)

### Method 1: Using Python directly

```bash
# 1. Navigate to directory
cd Backend/ai_orchestrator

# 2. Create virtual environment (first time only)
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies (first time only)
pip install -r requirements.txt

# 5. Run the server
python main.py
```

### Method 2: Using start scripts

**Windows:**
```bash
cd Backend/ai_orchestrator
start.bat
```

**Linux/Mac:**
```bash
cd Backend/ai_orchestrator
chmod +x start.sh
./start.sh
```

---

## 🧪 Test It Works

### Quick Test
```bash
# Open new terminal
curl http://localhost:8000/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "orchestrator": "ready",
  "active_simulations": 0,
  "timestamp": "2026-02-07T23:00:00"
}
```

### Full Test Suite
```bash
python test_api.py
```

### Interactive Docs
Open in browser: **http://localhost:8000/docs**

---

## 🎬 Demo for Judges

### Show Real-Time AI Simulation

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

This shows step-by-step AI decision-making!

---

## 📱 Connect Mobile App

### 1. Find Your Computer's IP

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
# Look for IP like 192.168.1.100
```

### 2. Update Mobile App

In your React Native app's API config:
```typescript
// Don't use localhost on physical device!
const API_BASE_URL = 'http://192.168.1.100:8000'; // Use your IP
```

### 3. Test Connection

```bash
# From mobile app or browser on phone
http://YOUR_IP:8000/health
```

See **MOBILE_INTEGRATION.md** for complete guide.

---

## 🐛 Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Port already in use"
```bash
# Use different port
uvicorn main:app --port 8001
```

### Can't connect from phone
- Ensure phone and computer on same WiFi
- Use computer's IP, not localhost
- Check firewall settings

### Import errors
✅ Already fixed! If you still see errors, ensure you're running from `Backend/ai_orchestrator` directory.

**See TROUBLESHOOTING.md for more solutions.**

---

## 📊 Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/plan` | POST | Create travel plan ⭐ |
| `/api/v1/plan/simulate` | POST | Simulation demo ⭐⭐⭐ |
| `/api/v1/cities` | GET | Get supported cities |
| `/api/v1/distance/{city1}/{city2}` | GET | Calculate distance |

**Full docs:** http://localhost:8000/docs

---

## 📚 Documentation

- **README.md** - Complete documentation
- **SETUP_GUIDE.md** - Detailed setup
- **MOBILE_INTEGRATION.md** - Mobile app integration
- **EXAMPLES.md** - API request examples
- **TROUBLESHOOTING.md** - Fix common issues

---

## ✅ Success Checklist

- [x] ✅ Import bug fixed
- [ ] Server starts successfully
- [ ] Health check returns "healthy"
- [ ] Test script passes
- [ ] Can access Swagger docs
- [ ] Mobile app can connect

---

**You're ready to go! Start the server and demo your AI orchestrator! 🚀**
