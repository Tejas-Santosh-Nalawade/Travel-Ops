# Transaction Simulation Demo Guide

## Overview
The Transaction Simulation feature demonstrates the Saga Pattern-based rollback engine with realistic distributed transaction scenarios. This is perfect for showcasing the system's resilience and automatic compensation capabilities to judges and stakeholders.

## Architecture

### Backend Components
1. **TransactionSimulator Class** (`api/simulation.py`)
   - Simulates multi-step distributed transactions
   - Realistic timing with asyncio delays (0.3-0.5s per step)
   - Five predefined scenarios with different failure points
   - Automatic compensation with occasional DLQ scenarios

2. **API Endpoints** (Integrated in `api/routes.py`)
   - `POST /api/v1/transactions/simulate` - Run single simulation
   - `POST /api/v1/transactions/simulate/batch` - Run batch simulations (up to 20)
   - `GET /api/v1/transactions/scenarios` - List available scenarios

### Frontend Components
1. **Operator Dashboard** (`Frontend/app/(ops)/Home/dashboard.tsx`)
   - New "Simulation" tab with scenario buttons
   - Real-time event timeline visualization
   - Progress bars showing step completion
   - Compensation action tracking
   - DLQ item display

## Available Scenarios

### 1. Success Scenario ✓
**What happens:**
- All 5 steps complete successfully (Flight → Hotel → Transport → Payment → Confirmation)
- No failures or compensations
- Transaction status: `completed`

**Use case:** Show the happy path with all bookings confirmed

### 2. Payment Failure 💳
**What happens:**
- First 3 steps complete (Flight, Hotel, Transport reserved)
- Payment processing fails (Insufficient funds)
- Automatic rollback starts
- All previous bookings are cancelled
- Transaction status: `compensated` or `partial_failure` (if compensation fails)

**Use case:** Demonstrate automatic rollback when payment gateway declines

### 3. Hotel Unavailable 🏨
**What happens:**
- Flight booking succeeds
- Hotel booking fails (No rooms available)
- Flight reservation is auto-cancelled
- 70% chance of compensation failure → DLQ item
- Transaction status: `partial_failure`

**Use case:** Show DLQ mechanism when compensation fails

### 4. Flight Cancelled ✈️
**What happens:**
- Flight booking fails immediately (Airline cancelled)
- Transaction fails before progress
- No compensations needed
- Transaction status: `failed`

**Use case:** Show early failure detection

### 5. Partial Failure 🚫
**What happens:**
- Flight and Hotel bookings succeed
- Transport booking fails (No availability)
- Previous bookings are rolled back
- Transaction status: `compensated`

**Use case:** Show mid-transaction failure handling

### 6. Random Scenario 🎲
**What happens:**
- Randomly selects one of the above scenarios
- Unpredictable outcome for realistic demo

**Use case:** Show variety and system's ability to handle any scenario

## How to Use in Demo

### Step 1: Start the Backend
```bash
cd Backend/ai_orchestrator
python main.py
```

Server should start at `http://localhost:8000`

### Step 2: Open Operator Dashboard
1. Launch the mobile app
2. Navigate to Operator role
3. Go to Dashboard
4. Click on the "Simulation" tab (play-circle icon)

### Step 3: Run Simulations

#### For Judges - Quick Demo (2 minutes)
1. Click **"✓ Success Scenario"** to show happy path
2. Click **"💳 Payment Failure"** to show automatic rollback
3. Click **"🏨 Hotel Unavailable"** to demonstrate DLQ
4. View the event timeline showing real-time compensation

#### For Deep Dive (5 minutes)
1. Run **"🔥 Batch Simulation (5x)"** to stress test the system
2. Navigate to "Transactions" tab to see all generated transactions
3. Navigate to "DLQ" tab to see failed compensations
4. Show how operations team can escalate DLQ items

### Step 4: Explain What's Happening

**Transaction Flow:**
```
┌─────────────────────────────────────────────────────┐
│ 1. Reserve Flight   → Success                        │
│ 2. Reserve Hotel    → Success                        │
│ 3. Book Transport   → Success                        │
│ 4. Process Payment  → FAILED (Insufficient Funds)   │
│                                                       │
│ 🔄 Starting Compensation (Rollback)                 │
│                                                       │
│ 1. Cancel Transport  → Success                       │
│ 2. Cancel Hotel      → Success                       │
│ 3. Cancel Flight     → Failed (Airline system down) │
│                       ⚠️  Added to DLQ for manual   │
└─────────────────────────────────────────────────────┘
```

**Key Features to Highlight:**
1. **Atomicity** - Either all steps succeed or all are rolled back
2. **Automatic Compensation** - System auto-cancels bookings on failure
3. **Dead Letter Queue** - Failed compensations are tracked for manual intervention
4. **Real-time Events** - Full audit trail of all transaction steps
5. **Operator Visibility** - Ops team sees all failures and can take action

## Simulation Results Explained

### Transaction Card
- **Transaction ID**: Unique identifier (e.g., `SIM-A3B2C1D4`)
- **Scenario**: Which test scenario was run
- **Customer**: Demo customer name
- **Amount**: Simulated transaction amount (₹30,000-80,000)
- **Status Badge**: Current state (Completed/Failed/Compensated/Partial Failure)

### Progress Bars
- **Steps Completed**: Green bar showing successfully executed steps
- **Steps Failed**: Red bar showing failed steps

### Error Panel (Red)
- Shows which step failed
- Displays error message from the service
- Indicates the failure reason

### Compensation Actions Panel (Orange)
- Lists all rollback operations attempted
- Shows which compensations succeeded vs. failed
- Each step is rolled back in reverse order

### DLQ Items Panel (Red with border)
- Critical failures requiring manual intervention
- Shows DLQ ID, step number, failure reason
- Displays retry attempts made (usually 3-5)
- Status: Pending/Escalated/Resolved

### Event Timeline
- Chronological list of all transaction events
- Color-coded by severity (Blue=Info, Orange=Warning, Red=Error)
- Shows exact timestamps
- Includes step duration in milliseconds

## Integration with Existing Dashboard

The simulation data seamlessly integrates with existing tabs:

### Transactions Tab
- All simulated transactions appear here
- Shows real-time status updates
- Filterable by status (Completed/Failed/In Progress)

### DLQ Tab
- Failed compensations from simulations appear here
- Operators can escalate items to admin
- Shows age of pending items (e.g., ">24h Old")

### Overview Tab
- Statistics update to include simulated transactions
- Success rate calculation includes simulation data
- DLQ count reflects simulation failures

## Technical Details

### Transaction Steps Structure
```javascript
{
  "name": "Reserve Flight",
  "type": "flight_booking",
  "amount": 32000,
  "will_fail": false,
  "error": null
}
```

### Event Structure
```javascript
{
  "timestamp": "2026-02-08T14:32:45.123Z",
  "event": "step_completed",
  "step": "Reserve Flight",
  "message": "✓ Reserve Flight completed successfully",
  "severity": "info",
  "duration_ms": 2341
}
```

### Compensation Action Structure
```javascript
{
  "step_number": 2,
  "status": "completed",
  "timestamp": "2026-02-08T14:32:47.456Z",
  "duration_ms": 1523
}
```

### DLQ Item Structure
```javascript
{
  "dlq_id": "DLQ-A7B8C9D0",
  "step_number": 1,
  "failure_reason": "Compensation system timeout. Manual intervention required.",
  "attempts_made": 3,
  "resolution_status": "pending",
  "escalated": false,
  "created_at": "2026-02-08T14:32:50.789Z"
}
```

## Customization Options

### Modify Failure Rates
Edit `api/simulation.py` line 197-201:
```python
# Current: 30% chance of compensation failure for hotel scenario
compensation_fails = (
    scenario == "hotel_unavailable" and step_num == 2 and random.random() < 0.7
)

# Change to 50% chance:
compensation_fails = (
    scenario == "hotel_unavailable" and step_num == 2 and random.random() < 0.5
)
```

### Add New Scenarios
1. Add scenario to `TransactionSimulator.scenarios` list
2. Add failure condition in `_get_steps_for_scenario()`
3. Update frontend button in `dashboard.tsx`

### Adjust Timing
Edit delays in `api/simulation.py`:
```python
# Line 69: Step execution delay
await asyncio.sleep(0.5)  # Change to 1.0 for slower demo

# Line 194: Compensation delay
await asyncio.sleep(0.3)  # Change to 0.5 for slower rollback
```

## Production Considerations

⚠️ **Important:** This is a DEMO feature. For production:

1. **Remove or disable** simulation endpoints
2. **Separate database** for test transactions
3. **Add authentication** to simulation endpoints
4. **Rate limiting** on batch simulations
5. **Logging and monitoring** of simulation usage
6. **Clear indicators** in UI that data is simulated

## Troubleshooting

### Simulation Not Appearing
- Check backend is running at `http://localhost:8000`
- Verify API endpoints: `http://localhost:8000/docs`
- Check browser console for CORS errors

### "Failed to run simulation" Error
- Ensure backend server is accessible
- Check network connectivity
- Verify API endpoint URL in dashboard.tsx (line 1100)

### Events Not Showing Timeline
- Check that simulation returns events array
- Verify event structure matches frontend expectations
- Look for JavaScript console errors

### DLQ Items Not in DLQ Tab
- Ensure DEMO_DATA_SETUP.sql has been run
- Check Supabase RPC functions exist
- Verify database permissions

## Demo Script for Judges

**"Let me show you our distributed transaction rollback engine in action."**

1. **[Click Success Scenario]**
   "This shows the happy path - all 5 steps complete successfully. Notice the event timeline showing each step."

2. **[Click Payment Failure]**
   "Now watch what happens when payment fails after we've already reserved flight, hotel, and transport. The system automatically rolls back all previous bookings. See the compensation actions panel showing each rollback."

3. **[Point to DLQ Item]**
   "Sometimes external systems are offline and compensations can fail. These go into our Dead Letter Queue for manual intervention by the operations team. This ensures nothing falls through the cracks."

4. **[Navigate to Transactions Tab]**
   "All transactions are tracked here with full audit trails. Operations can see exactly what happened and when."

5. **[Navigate to DLQ Tab]**
   "The ops team has a dedicated view for failed compensations. They can escalate critical items and track resolution progress."

**"This demonstrates transactional integrity across distributed systems - a critical requirement for financial applications in travel."**

## Next Steps

- Add real-time WebSocket updates for live simulation progress
- Integrate with actual booking systems for production
- Add simulation replay feature
- Export simulation results as PDF reports
- Add performance metrics dashboard

## Support

For questions or issues:
- Check API docs at `http://localhost:8000/docs`
- Review code comments in `api/simulation.py` and `dashboard.tsx`
- Test individual scenarios first before batch simulations
