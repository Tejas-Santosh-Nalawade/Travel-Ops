# 🚀 Operations Dashboard - Quick Start Guide

## Step-by-Step Setup

### ✅ Step 1: Database Setup (5 minutes)

1. Open your **Supabase Project Dashboard**
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `database-schema.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify all tables are created (you should see 8 tables)

**Tables Created:**
- ✓ journeys
- ✓ journey_items
- ✓ money_exposure
- ✓ ops_alerts
- ✓ ops_decisions
- ✓ ops_actions
- ✓ incidents
- ✓ admin_notifications

### ✅ Step 2: Verify Environment Variables

Make sure your `.env` file exists in the Frontend folder with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

**Where to find these values:**
1. Go to your Supabase Project
2. Click **Settings** → **API**
3. Copy **Project URL** → use as `EXPO_PUBLIC_SUPABASE_URL`
4. Copy **anon/public key** → use as `EXPO_PUBLIC_SUPABASE_KEY`

### ✅ Step 3: Install Dependencies

```bash
cd Frontend
npm install
# or
yarn install
```

### ✅ Step 4: Run the Application

```bash
npx expo start
```

Then:
- Press **`a`** for Android emulator
- Press **`i`** for iOS simulator  
- Scan QR code with Expo Go app for physical device

### ✅ Step 5: Navigate to Operations Dashboard

1. Sign in to your application
2. Navigate to the **Operations** section
3. You should see the Operations Dashboard with:
   - Overview tab
   - Journeys tab
   - Exposure tab
   - Decisions tab

---

## 🧪 Testing the Dashboard

### Test 1: View Empty Dashboard
- Launch app → Navigate to Ops Dashboard
- You should see "No active alerts" and "No active incidents"

### Test 2: Create Sample Data (via Supabase)

Run this in Supabase SQL Editor to add sample data:

```sql
-- Sample Journey
INSERT INTO journeys (customer_name, status, total_cost) 
VALUES ('John Doe', 'PENDING', 2500.00);

-- Get the journey_id (copy from result)
-- Then add journey items
INSERT INTO journey_items (journey_id, type, status, cost, details) 
VALUES 
  ('paste-journey-id-here', 'FLIGHT', 'CONFIRMED', 1200.00, '{"airline": "Delta", "flight": "DL123"}'),
  ('paste-journey-id-here', 'HOTEL', 'PENDING', 800.00, '{"hotel": "Hilton", "nights": 3}'),
  ('paste-journey-id-here', 'TRANSFER', 'CONFIRMED', 500.00, '{"type": "Private"}');

-- Add money exposure
INSERT INTO money_exposure (journey_id, confirmed_amount, pending_amount, risk_level) 
VALUES ('paste-journey-id-here', 1700.00, 800.00, 'MEDIUM');

-- Add an alert
INSERT INTO ops_alerts (journey_id, alert_type, status) 
VALUES ('paste-journey-id-here', 'BOOKING_FAILURE', 'OPEN');

-- Create an incident
INSERT INTO incidents (incident_type, status) 
VALUES ('SUPPLIER_OUTAGE', 'OPEN');
```

### Test 3: Verify Dashboard Shows Data
- Pull to refresh
- You should now see:
  - 1 Journey
  - 1 Active Alert
  - 1 Open Incident
  - Money exposure displayed

### Test 4: Test Interactions
1. **Resolve an Alert:**
   - Tap on an alert
   - Tap "Resolve"
   - Verify status changes

2. **Make a Decision:**
   - Go to Journeys tab
   - Tap "Make Decision" on a journey
   - Select decision type
   - Add notes
   - Submit

3. **View Journey Details:**
   - Tap on a journey card
   - Verify all details load
   - Try recording an action

4. **Manage Incidents:**
   - Tap "View All" in Incidents section
   - Try creating a new incident
   - Update incident status

---

## 📱 Feature Checklist

After setup, verify these features work:

- [ ] Dashboard loads without errors
- [ ] Can view all journeys
- [ ] Can filter journeys by status
- [ ] Journey details page opens
- [ ] Can see journey items (flights, hotels, transfers)
- [ ] Money exposure displays correctly
- [ ] Alerts show up and can be resolved
- [ ] Can make decisions on journeys
- [ ] Can record actions on journeys
- [ ] Incidents can be created and managed
- [ ] Notifications display properly
- [ ] Pull-to-refresh works
- [ ] All tabs switch correctly
- [ ] Status badges show correct colors

---

## 🎨 What You Should See

### Dashboard Overview:
```
┌─────────────────────────────────────┐
│  Operations Dashboard               │
├─────────────────────────────────────┤
│  [Journeys]  [Alerts]  [Incidents]  │
│     4          2          1          │
│                                      │
│  ⚠️ 2 High Risk Journeys Detected   │
│                                      │
│  Recent Alerts                       │
│  • Booking Failure - John Doe       │
│    [Start Work] [Resolve]            │
│                                      │
│  Active Incidents                    │
│  • Supplier Outage                   │
│    [Start Mitigation] [Resolve]      │
└─────────────────────────────────────┘
```

### Journeys Tab:
```
┌─────────────────────────────────────┐
│  Journeys                            │
├─────────────────────────────────────┤
│  John Doe                PENDING     │
│  ID: abc12345...        $2,500.00   │
│  Feb 7, 2026                         │
│  👁️ Tap to view details             │
│  [Make Decision]                     │
├─────────────────────────────────────┤
│  Jane Smith             CONFIRMED    │
│  ID: def67890...        $3,200.00   │
│  Feb 6, 2026                         │
└─────────────────────────────────────┘
```

---

## ⚙️ Troubleshooting

### Problem: "Cannot connect to Supabase"
**Solution:**
- Check `.env` file exists and has correct values
- Verify Supabase project is not paused
- Restart Expo server: `Ctrl+C` then `npx expo start`

### Problem: "No data showing"
**Solution:**
- Run sample data SQL queries
- Pull to refresh in the app
- Check Supabase table viewer to confirm data exists

### Problem: "Cannot update status"
**Solution:**
- Verify RLS policies are enabled (see database-schema.sql)
- Ensure user is authenticated
- Check Supabase logs for errors

### Problem: "App crashes on operations screen"
**Solution:**
- Clear Expo cache: `npx expo start -c`
- Reinstall node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: Run the app in development mode

### Problem: "Journey details page doesn't open"
**Solution:**
- Check console for navigation errors
- Verify journey ID exists in database
- Ensure expo-router is properly configured

---

## 🎯 Next Steps

After verifying everything works:

1. **Customize the UI:**
   - Modify colors in `UIComponents.tsx`
   - Adjust layout in dashboard files
   - Add your branding

2. **Add More Features:**
   - Real-time subscriptions with Supabase
   - Push notifications
   - Export reports
   - Advanced filtering

3. **Integrate with Your Backend:**
   - Connect to real booking APIs
   - Add payment processing
   - Implement actual supplier integrations

4. **Deploy:**
   - Build for production: `eas build`
   - Submit to app stores
   - Set up staging environment

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `app/(ops)/dashboard.tsx` | Main operations dashboard |
| `app/(ops)/journey-details.tsx` | Detailed journey view |
| `app/(ops)/incidents.tsx` | Incident management |
| `component/ops/UIComponents.tsx` | Reusable UI components |
| `types/operations.ts` | TypeScript type definitions |
| `lib/opsUtils.ts` | Utility functions |
| `lib/supabase.ts` | Supabase client configuration |
| `database-schema.sql` | Complete database schema |

---

## 💡 Pro Tips

1. **Use Pull-to-Refresh frequently** to get latest data
2. **Add notes to all decisions** for audit trail
3. **Resolve alerts promptly** to keep dashboard clean
4. **Create incidents for system-wide issues** not journey-specific
5. **Monitor high-risk journeys** in the Exposure tab daily
6. **Use the journey details page** for in-depth analysis

---

## ✅ You're Ready!

If all the steps above are complete and tests pass, your Operations Dashboard is ready to use! 🎉

**Need Help?**
- Check `OPS_DASHBOARD_README.md` for detailed documentation
- Review error logs in the console
- Verify Supabase table structures
- Check RLS policies are set correctly

---

**Version:** 1.0.0  
**Last Updated:** February 2026
