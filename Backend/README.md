# TravelOps Backend Architecture

## 📁 Backend Structure

```
Backend/
├── database/
│   ├── schemas/
│   │   └── complete-schema.sql  # Complete database schema
│   ├── migrations/              # Database migration scripts
│   └── README.md               # Database documentation
├── functions/                   # Supabase Edge Functions
├── triggers/                    # Database triggers
├── policies/                    # RLS policies
└── README.md                   # This file
```

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native + Expo)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Agent      │  │   Operations │  │    Admin     │     │
│  │  Dashboard   │  │   Dashboard  │  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend as a Service)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth        │  │  PostgreSQL  │  │  REST API    │     │
│  │  (JWT)       │  │  Database    │  │  (Auto)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Travel Agent Flow:
──────────────────
Agent → Creates Journey (DRAFT)
     → System generates bundle options
     → Agent selects bundle
     → Booking initiated (PENDING)
     → Sequential booking: Flight → Hotel → Cab
     → Success: Journey (CONFIRMED) ✓
     → Failure: Journey (FAILED) → Ops Team alerted

Operations Flow:
────────────────
Ops → Views failed/on-hold journeys
    → Checks money exposure & risk level
    → Makes decision (RETRY/REPLACE/ROLLBACK/HOLD)
    → Logs action
    → Updates journey status
    → Agent notified

Admin Flow:
───────────
Admin → System-wide incident monitoring
      → Supplier management
      → Policy configuration
      → Analytics & reports
```

## 🗄️ Database Schema

### Core Tables

#### 1. **journeys** (Main Journey Records)
```sql
- id: UUID (PK)
- customer_name: TEXT
- created_by: UUID (FK → auth.users)
- status: ENUM (DRAFT, PENDING, CONFIRMED, FAILED, ON_HOLD, CANCELLED)
- total_cost: NUMERIC
- cities: JSONB (multi-city data)
- dates: JSONB
- preferences: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. **journey_items** (Booking Components)
```sql
- id: UUID (PK)
- journey_id: UUID (FK → journeys)
- type: ENUM (FLIGHT, HOTEL, TRANSFER)
- status: ENUM (PENDING, CONFIRMED, FAILED)
- cost: NUMERIC
- supplier_id: TEXT
- details: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. **money_exposure** (Financial Risk)
```sql
- id: UUID (PK)
- journey_id: UUID (FK → journeys, UNIQUE)
- confirmed_amount: NUMERIC (already paid)
- pending_amount: NUMERIC (not yet confirmed)
- customer_budget: NUMERIC
- risk_level: ENUM (LOW, MEDIUM, HIGH)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. **ops_alerts** (Operational Alerts)
```sql
- id: UUID (PK)
- journey_id: UUID (FK → journeys)
- alert_type: ENUM (BOOKING_FAILURE, PRICE_SPIKE, SUPPLIER_OUTAGE)
- status: ENUM (OPEN, IN_PROGRESS, RESOLVED)
- message: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- resolved_at: TIMESTAMP
```

#### 5. **ops_decisions** (Decision Log)
```sql
- id: UUID (PK)
- journey_id: UUID (FK → journeys)
- decision: ENUM (RETRY, REPLACE, ROLLBACK, HOLD)
- decided_by: UUID (FK → auth.users)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 6. **ops_actions** (Action History)
```sql
- id: UUID (PK)
- journey_id: UUID (FK → journeys)
- action: TEXT
- status: ENUM (SUCCESS, FAILED)
- executed_at: TIMESTAMP
- executed_by: UUID (FK → auth.users)
```

#### 7. **incidents** (System-Wide Incidents)
```sql
- id: UUID (PK)
- incident_type: ENUM (SUPPLIER_OUTAGE, PAYMENT_FAILURE, PRICE_SPIKE, SYSTEM_DEGRADATION)
- status: ENUM (OPEN, MITIGATING, RESOLVED)
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- resolved_at: TIMESTAMP
```

#### 8. **admin_notifications** (Admin Notifications)
```sql
- id: UUID (PK)
- incident_id: UUID (FK → incidents)
- message: TEXT
- status: ENUM (SENT, ACKNOWLEDGED)
- created_at: TIMESTAMP
- acknowledged_at: TIMESTAMP
```

## 🔐 Security Architecture

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

```sql
-- Authenticated users can access all data
CREATE POLICY "authenticated_access" 
ON [table_name] 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

**Future Enhancements:**
- Role-based access control (Agent, Ops, Admin)
- Journey owner restrictions
- Audit log access controls

### Authentication Flow

```
User Login
    ↓
Supabase Auth (JWT)
    ↓
Session Token Stored (expo-secure-store)
    ↓
All API calls include JWT
    ↓
RLS validates access
```

## 🚀 API Patterns

### Common Query Patterns

#### Get Journeys for Agent
```typescript
const { data, error } = await supabase
  .from('journeys')
  .select('*')
  .eq('created_by', userId)
  .order('created_at', { ascending: false });
```

#### Get Failed Journeys for Ops
```typescript
const { data, error } = await supabase
  .from('journeys')
  .select(`
    *,
    money_exposure(*),
    ops_alerts(*)
  `)
  .in('status', ['FAILED', 'ON_HOLD'])
  .order('created_at', { ascending: false });
```

#### Create Journey with Exposure Tracking
```typescript
// Transaction-like approach
const { data: journey } = await supabase
  .from('journeys')
  .insert({ customer_name, created_by, status: 'DRAFT' })
  .select()
  .single();

await supabase
  .from('money_exposure')
  .insert({
    journey_id: journey.id,
    customer_budget: budget,
    risk_level: 'LOW'
  });
```

## 📊 Performance Optimizations

### Indexes
- All foreign keys indexed
- Status fields indexed for filtering
- Created_at indexed for sorting
- Composite indexes where needed

### Query Optimization Tips
```sql
-- Use select() with specific columns
.select('id, customer_name, status')

-- Use joins instead of multiple queries
.select('*, journey_items(*), money_exposure(*)')

-- Limit results for pagination
.limit(20)

-- Use .single() for single record queries
.single()
```

## 🔄 Triggers & Automation

### Auto-Update Timestamps
```sql
CREATE TRIGGER update_[table]_updated_at 
BEFORE UPDATE ON [table]
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Future Triggers:**
- Auto-calculate risk level based on exposure
- Auto-create alerts on booking failure
- Auto-notify admins on critical incidents

## 📈 Monitoring & Analytics

### Key Metrics to Track

**Agent Performance:**
- Journey conversion rate
- Average journey value
- Customer satisfaction

**Operations Efficiency:**
- Average resolution time
- Decision success rate
- Alert response time

**System Health:**
- Booking success rate by supplier
- System uptime
- API response times

## 🛠️ Setup Instructions

### 1. Database Setup

```bash
# Copy the schema
cat Backend/database/schemas/complete-schema.sql

# Paste into Supabase SQL Editor
# Click "Run"
```

### 2. Environment Variables

```env
# Frontend/.env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

### 3. Verify Tables

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 🔮 Future Enhancements

### Phase 2
- [ ] Real-time subscriptions for live updates
- [ ] Supplier management table
- [ ] Agent performance analytics table
- [ ] Customer feedback table

### Phase 3
- [ ] Edge Functions for complex business logic
- [ ] Scheduled jobs for automated tasks
- [ ] Advanced RLS policies per role
- [ ] Audit logging table

### Phase 4
- [ ] Multi-tenancy support
- [ ] API rate limiting
- [ ] Advanced caching strategies
- [ ] Data archival policies

## 📞 Support

For backend-related issues:
1. Check Supabase logs in Dashboard
2. Verify RLS policies
3. Test SQL queries in SQL Editor
4. Check database connection from app

## 📚 Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Backend Version:** 1.0.0  
**Last Updated:** February 7, 2026  
**Status:** ✅ Production Ready
