# Operations Dashboard - Setup & Usage Guide

## 📋 Overview

The Operations Dashboard is a comprehensive management interface for handling journey bookings, monitoring alerts, managing incidents, and tracking financial exposure. Built with React Native, Expo Router, and Supabase.

## 🚀 Features

### 1. **Dashboard Overview**
- Real-time statistics for journeys, alerts, incidents, and financial exposure
- Quick access to high-priority alerts and incidents
- Interactive cards for immediate action

### 2. **Journey Management**
- View all customer journeys with status tracking
- Drill down into individual journey details
- View journey items (flights, hotels, transfers)
- Make operational decisions (retry, replace, rollback, hold)
- Track journey-specific alerts and actions

### 3. **Money Exposure Tracking**
- Monitor confirmed and pending amounts
- Risk level assessment (LOW, MEDIUM, HIGH)
- Real-time exposure calculations
- Per-journey financial breakdown

### 4. **Incident Management**
- Create and track system-wide incidents
- Monitor incident status (OPEN, MITIGATING, RESOLVED)
- Send and manage admin notifications
- Filter incidents by status
- Quick actions for incident resolution

### 5. **Alerts & Notifications**
- Track booking failures, price spikes, and supplier outages
- Update alert status (OPEN, IN_PROGRESS, RESOLVED)
- Associated with specific journeys for context

### 6. **Decision Logging**
- Record operational decisions for each journey
- Add detailed notes for audit trail
- View decision history with timestamps

### 7. **Action History**
- Log all actions taken on journeys
- Track success/failure status
- Complete audit trail of operations

## 🗄️ Database Schema

The dashboard uses the following Supabase tables:

### Core Tables
- **journeys** - Customer journey records
- **journey_items** - Individual booking items (flights, hotels, transfers)
- **money_exposure** - Financial risk tracking per journey
- **ops_alerts** - Booking and operational alerts
- **ops_decisions** - Operational decisions made
- **ops_actions** - Actions executed on journeys
- **incidents** - System-wide incidents
- **admin_notifications** - Notifications for incidents

### Status Values

**Journey Status:**
- DRAFT
- PENDING
- CONFIRMED
- FAILED
- ON_HOLD
- CANCELLED

**Alert Status:**
- OPEN
- IN_PROGRESS
- RESOLVED

**Incident Status:**
- OPEN
- MITIGATING
- RESOLVED

**Risk Levels:**
- LOW
- MEDIUM
- HIGH

## 🛠️ Setup Instructions

### 1. Database Setup

Run the SQL schema provided in `database-schema.sql` in your Supabase SQL editor.

### 2. Environment Configuration

Ensure your `.env` file contains:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

### 3. Supabase Policies

Set up Row Level Security (RLS) policies for each table. Example policy for journeys:

```sql
-- Enable RLS
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Allow authenticated users to view journeys" 
ON journeys FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert journeys" 
ON journeys FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update journeys" 
ON journeys FOR UPDATE 
TO authenticated 
USING (true);
```

Repeat similar policies for all tables.

### 4. Install Dependencies

```bash
cd Frontend
npm install
# or
yarn install
```

### 5. Run the Application

```bash
npx expo start
```

## 📱 Navigation Structure

```
/(ops)
  ├── dashboard.tsx          # Main operations dashboard
  ├── journey-details.tsx    # Detailed journey view
  └── incidents.tsx          # Incident management
```

## 🎨 UI Components

Custom reusable components are located in `component/ops/UIComponents.tsx`:

- **StatCard** - Display statistics with icons
- **StatusBadge** - Color-coded status indicators
- **AlertCard** - Alert display with actions
- **EmptyState** - Empty state placeholders
- **SectionHeader** - Section titles with optional actions
- **InfoRow** - Key-value information display
- **ActionButton** - Consistent action buttons

## 💡 Usage Examples

### Creating a Journey Decision

1. Navigate to Journeys tab
2. Find a journey with FAILED or ON_HOLD status
3. Tap "Make Decision"
4. Select decision type (RETRY, REPLACE, ROLLBACK, HOLD)
5. Add notes
6. Submit

### Managing Incidents

1. Navigate to Incidents screen (tap "View All" from dashboard)
2. Tap "+ Create" to create new incident
3. Select incident type
4. Optionally add notification message
5. Track status through OPEN → MITIGATING → RESOLVED

### Viewing Journey Details

1. Go to Journeys tab
2. Tap on any journey card
3. View complete journey breakdown:
   - Customer information
   - All journey items
   - Financial exposure
   - Related alerts
   - Action history
4. Take quick actions or record new actions

### Monitoring Financial Exposure

1. Navigate to Exposure tab
2. View summary cards for confirmed vs pending amounts
3. Review individual journey exposures
4. Identify high-risk journeys for immediate attention

## 🔔 Alert Types

- **BOOKING_FAILURE** - Failed booking attempts
- **PRICE_SPIKE** - Unexpected price increases
- **SUPPLIER_OUTAGE** - Supplier system unavailability

## 🚨 Incident Types

- **SUPPLIER_OUTAGE** - Third-party supplier systems down
- **PAYMENT_FAILURE** - Payment processing issues
- **PRICE_SPIKE** - Market-wide price increases
- **SYSTEM_DEGRADATION** - Internal system performance issues

## 📊 Key Metrics

The dashboard tracks:
- Total active journeys
- Active alerts requiring attention
- Open incidents
- Total financial exposure
- High-risk journey count

## 🔄 Real-time Updates

The dashboard includes:
- Pull-to-refresh on all screens
- Refresh buttons for manual updates
- Automatic data reloading after actions

## 🎯 Best Practices

1. **Regular Monitoring** - Check dashboard multiple times daily
2. **Quick Response** - Act on OPEN alerts within 15 minutes
3. **Documentation** - Always add notes to decisions
4. **Status Updates** - Keep journey statuses current
5. **Incident Tracking** - Create incidents for system-wide issues
6. **Financial Review** - Monitor high-risk exposures daily

## 🐛 Troubleshooting

### Data Not Loading
- Check Supabase connection in `.env`
- Verify RLS policies are set up correctly
- Check network connection

### Cannot Update Status
- Verify user authentication
- Check database policies allow updates
- Ensure valid status transitions

### Missing Journey Items
- Verify journey_items table has data
- Check foreign key relationships
- Ensure journey_id matches

## 📝 TypeScript Types

All types are defined in `types/operations.ts` for type safety throughout the application.

## 🔐 Security Considerations

- All API calls go through Supabase with authentication
- Row Level Security (RLS) enforces access control
- Sensitive data is stored securely with expo-secure-store
- No credentials are logged or exposed

## 📞 Support

For issues or questions:
1. Check error logs in the console
2. Verify database schema matches documentation
3. Ensure all dependencies are up to date
4. Review Supabase logs for API errors

---

**Version:** 1.0.0  
**Last Updated:** February 2026  
**License:** MIT
