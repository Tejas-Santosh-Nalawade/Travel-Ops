# Quick Start - Transaction Simulation Demo

## ✅ Fixed Network Issue
The frontend was trying to connect to `localhost:8000`, but in React Native/Expo, localhost refers to the mobile device, not your computer.

**Solution:** Updated the API URL to use your machine's IP address: `http://10.243.165.242:8000`

## 🚀 Start the Backend

1. **Open a new terminal** (keep Expo Metro bundler running in the current one)

2. **Navigate to backend directory:**
```bash
cd d:\HACKATHON\HACK_FUSION_HACKATHON\Melt_Down\Backend\ai_orchestrator
```

3. **Start the FastAPI server:**
```bash
python main.py
```

You should see:
```
==============================================================

     TravelOps AI Orchestrator
     AI-Powered Multi-City Travel Planning

   Server starting at: http://localhost:8000
   API Docs: http://localhost:8000/docs
   ReDoc: http://localhost:8000/redoc

==============================================================

INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

4. **Verify it's working:**
```bash
# Test main endpoint
curl http://10.243.165.242:8000/

# Test simulation scenarios
curl http://10.243.165.242:8000/api/v1/transactions/scenarios
```

## 📱 Test the Simulation in Mobile App

1. **Reload the app:** Press `r` in the Metro bundler terminal

2. **Navigate to:** Operator Dashboard → Simulation tab

3. **Click any scenario button** (e.g., "✓ Success Scenario")

4. **Watch the magic happen:**
   - Real-time event timeline
   - Progress bars
   - Compensation actions
   - DLQ items (on failures)

## 🐛 Troubleshooting

### "Network request failed" still appearing?

**Option 1: Check if backend is running**
```bash
curl http://10.243.165.242:8000/
```

**Option 2: Update IP if your machine's IP changed**
1. Check Metro bundler output for current IP: `› Metro waiting on exp://YOUR_IP:8081`
2. Update `API_BASE_URL` in `Frontend/app/(ops)/Home/dashboard.tsx` line 1095

**Option 3: Make sure devices are on same network**
- Your computer and phone/emulator must be on the same WiFi network
- Check firewall isn't blocking port 8000

### Backend Changes Not Reflecting?

**Restart the backend server:**
1. Press `Ctrl+C` in backend terminal
2. Run `python main.py` again

### Expo App Not Updating?

**Reload the app:**
- Press `r` in Metro bundler terminal
- Or shake your phone and select "Reload"

## 🎯 Quick Demo Flow (30 seconds)

1. **Success Scenario** → Shows happy path, all steps complete
2. **Payment Failure** → Shows automatic rollback of 3 completed steps
3. **Hotel Unavailable** → Shows DLQ when compensation fails
4. **Batch Simulation** → Runs 5 scenarios, shows variety of outcomes

Each simulation takes ~3-5 seconds with realistic delays.

## 📊 What You'll See

### Transaction Card
- Transaction ID (e.g., `SIM-A3B2C1D4`)
- Scenario type
- Status badge (Completed/Failed/Compensated)
- Progress bars showing steps completed/failed

### Event Timeline
- Chronological list of all events
- Color-coded severity (Blue/Orange/Red)
- Step names and durations
- Timestamps

### Compensation Actions (Orange panel)
- Shows rollback operations
- Success/failure indicators
- Step numbers being rolled back

### DLQ Items (Red panel with border)
- Failed compensations
- Requires manual intervention
- DLQ ID, failure reason, retry attempts

## 🔥 Advanced: Batch Testing

Run **"🔥 Batch Simulation (5x)"** to:
- Create 5 transactions simultaneously
- Test all 5 scenarios at once
- Generate realistic load
- See summary statistics

Results:
```
Completed 5 transactions:
✓ Successful: 1
✗ Failed: 4
🔄 Compensated: 2
⚠️  DLQ Items: 2
```

Navigate to **Transactions** and **DLQ** tabs to see all generated data.

## 🎬 For Judges

This demonstrates:
1. **Saga Pattern** - Distributed transactions with compensation
2. **Atomicity** - All-or-nothing transaction semantics
3. **Resilience** - Automatic rollback on failures
4. **Observability** - Complete audit trail
5. **Operational Control** - DLQ for manual intervention

## 💡 Pro Tips

- Run simulations in sequence to build up transaction history
- Use "Random Scenario" for unpredictable demos
- Check other tabs (Transactions, DLQ) to see integration
- Scroll down in timeline to see all compensation events
- Each simulation has unique transaction ID and amount

## 🎨 Customization

Want to change failure rates or add scenarios? See `SIMULATION_DEMO_GUIDE.md` for details.

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Can access http://10.243.165.242:8000/ from browser
- [ ] Expo app loaded and showing Operator Dashboard
- [ ] Simulation tab visible with scenario buttons
- [ ] Clicking scenario button doesn't show "Network request failed"
- [ ] Event timeline populates after ~3-5 seconds
- [ ] Alert shows "Simulation Complete"

All checked? You're ready to demo! 🚀
