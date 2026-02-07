# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: ImportError - "attempted relative import beyond top-level package"

**Error:**
```
ImportError: attempted relative import beyond top-level package
```

**Solution:**
✅ **Already Fixed!** The codebase now uses absolute imports instead of relative imports.

If you still encounter this, make sure you're running from the correct directory:
```bash
cd Backend/ai_orchestrator
python main.py
```

---

### Issue 2: Module not found errors

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Make sure virtual environment is activated
cd Backend/ai_orchestrator
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Issue 3: Port 8000 already in use

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**

**Option 1:** Use a different port
```bash
uvicorn main:app --port 8001
```

**Option 2:** Kill the process using port 8000

Windows:
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -ti:8000 | xargs kill -9
```

---

### Issue 4: Cannot connect from mobile app

**Error:** Network request failed or connection refused

**Solution:**

1. **Find your computer's IP address:**

Windows:
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

Linux/Mac:
```bash
ifconfig
# Look for inet address (e.g., 192.168.1.100)
```

2. **Update mobile app API URL:**
```typescript
// Don't use localhost on physical device!
const API_BASE_URL = 'http://192.168.1.100:8000'; // Your IP
```

3. **Check firewall:**
- Windows: Allow Python through Windows Firewall
- Mac: System Preferences → Security & Privacy → Firewall
- Linux: `sudo ufw allow 8000`

4. **Ensure same network:**
- Both computer and phone must be on same WiFi network

---

### Issue 5: geopy distance calculation errors

**Error:**
```
ValueError: Cannot calculate distance
```

**Solution:**
City not in supported list. Add city coordinates in `agents/orchestrator.py`:

```python
def _load_city_coordinates(self) -> Dict[str, Tuple[float, float]]:
    return {
        # ... existing cities
        "newcity": (latitude, longitude),  # Add your city
    }
```

---

### Issue 6: Virtual environment not activating

**Windows:**

If you get "cannot be loaded because running scripts is disabled":
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again:
```bash
venv\Scripts\activate
```

**Alternative (Windows):**
```bash
venv\Scripts\activate.bat
```

---

### Issue 7: pip install fails

**Error:**
```
ERROR: Could not build wheels for geopy
```

**Solution:**

1. **Update pip:**
```bash
python -m pip install --upgrade pip
```

2. **Install build tools:**

Windows:
- Install Microsoft C++ Build Tools
- Or use precompiled wheels: `pip install --only-binary :all: geopy`

Linux:
```bash
sudo apt-get install python3-dev
```

Mac:
```bash
xcode-select --install
```

---

### Issue 8: CORS errors in browser/mobile app

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
✅ **Already configured!** CORS is set to allow all origins in development.

If still having issues, check `api/routes.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should be "*" for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 9: Slow API responses

**Symptoms:** Plan generation takes > 5 seconds

**Solution:**

1. **Check simulation mode:**
   - Use `/api/v1/plan` (fast) for production
   - Use `/api/v1/plan/simulate` (slower) only for demos

2. **Reduce cities:**
   - API is optimized for 2-5 cities
   - More cities = longer processing time

3. **System resources:**
   - Close other applications
   - Ensure adequate RAM (4GB+ recommended)

---

### Issue 10: "Budget too low" errors

**Error:**
```
400 Bad Request: Budget too low. Minimum required: ₹12,000
```

**Solution:**

The AI enforces minimum budgets:
- Minimum: ₹3,000 per person per day
- For 2 people, 2 cities, 3 days: ~₹18,000 minimum

Either:
1. Increase budget
2. Reduce number of travelers
3. Reduce number of days
4. Select "cheapest" preference

---

### Issue 11: Dependencies conflict

**Error:**
```
ERROR: pip's dependency resolver does not currently take into account all the packages
```

**Solution:**

Use a clean virtual environment:
```bash
# Remove old venv
rm -rf venv  # Linux/Mac
rmdir /s venv  # Windows

# Create fresh venv
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

---

### Issue 12: API returns 500 Internal Server Error

**Solution:**

1. **Check server logs:**
```bash
# Look at the terminal where server is running
# Error will be printed there
```

2. **Common causes:**
   - Invalid date format (use YYYY-MM-DD)
   - Negative numbers for budget/travelers
   - Empty cities array
   - Invalid city names

3. **Validate request:**
```bash
# Use schema validation in Swagger UI
http://localhost:8000/docs
```

---

## Testing Checklist

After fixing any issue, test with:

```bash
# 1. Health check
curl http://localhost:8000/health

# 2. Get cities
curl http://localhost:8000/api/v1/cities

# 3. Run test script
python test_api.py

# 4. Open docs
# Visit: http://localhost:8000/docs
```

---

## Getting Help

1. **Check documentation:**
   - README.md - Full documentation
   - SETUP_GUIDE.md - Setup instructions
   - EXAMPLES.md - API examples

2. **Check API docs:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. **Enable debug mode:**
   Edit `.env`:
   ```env
   DEBUG=True
   ```

4. **Check Python version:**
   ```bash
   python --version
   # Requires Python 3.9+
   ```

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Import errors | Use absolute imports (already fixed) |
| Module not found | `pip install -r requirements.txt` |
| Port in use | Use `--port 8001` |
| Can't connect | Use computer's IP, not localhost |
| CORS errors | Already configured, check firewall |
| Slow responses | Use `/plan` not `/plan/simulate` |
| Budget errors | Increase budget or reduce travelers |

---

**Still having issues?** Check the server logs - they show the exact error!
