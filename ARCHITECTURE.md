# TravelOps System Architecture Documentation

## Project Overview
TravelOps is an end-to-end multi-city travel management platform designed to handle complex booking workflows, failure resilience, and operational oversight.

---

## System Architecture Diagrams

### 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  MOBILE APPLICATION LAYER                       │
│                  (React Native + Expo SDK 54)                   │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   AGENT      │    │  OPERATIONS  │    │    ADMIN     │     │
│  │  Dashboard   │    │   Dashboard  │    │   Dashboard  │     │
│  │              │    │              │    │              │     │
│  │ • Create     │    │ • Alerts     │    │ • Incidents  │     │
│  │ • Track      │    │ • Decisions  │    │ • Analytics  │     │
│  │ • Manage     │    │ • Exposure   │    │ • Reports    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND LAYER                        │
│                   (Backend as a Service)                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │     AUTH     │    │ PostgreSQL   │    │   REST API   │     │
│  │   Service    │    │  Database    │    │ Auto-generated│    │
│  │              │    │              │    │              │     │
│  │ • JWT Tokens │    │ • 8 Tables   │    │ • CRUD Ops   │     │
│  │ • Sessions   │    │ • RLS        │    │ • Real-time  │     │
│  │ • Roles      │    │ • Triggers   │    │ • Security   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Agent Workflow (Journey Booking Flow)

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ Agent fills     │
│ requirement     │
│ form            │
│ • Customer name │
│ • Cities        │
│ • Dates         │
│ • Preferences   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ System generates│
│ bundle options  │
│ • Flights       │
│ • Hotels        │
│ • Transfers     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Agent selects   │
│ preferred bundle│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ START BOOKING   │
│ (Sequential)    │
└────┬────────────┘
     │
     ├─────────────────────────────────┐
     │                                 │
     ▼                                 ▼
┌──────────┐                    ┌─────────────┐
│ Book     │──SUCCESS──▶        │ Book        │
│ FLIGHT   │                    │ HOTEL       │
└────┬─────┘                    └──────┬──────┘
     │                                 │
     │FAILURE                          │SUCCESS
     │                                 ▼
     │                          ┌─────────────┐
     │                          │ Book        │
     │                          │ TRANSFER    │
     │                          └──────┬──────┘
     │                                 │
     │                                 │SUCCESS
     │                                 ▼
     │                          ┌─────────────┐
     │                          │  JOURNEY    │
     │                          │ CONFIRMED   │
     │                          └─────────────┘
     │
     ▼
┌──────────────────┐
│ Create Alert     │
│ • BOOKING_FAILURE│
│ • Journey ID     │
│ • Failure details│
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Notify Ops Team  │
│ • SMS/Email      │
│ • Dashboard alert│
└──────────────────┘
```

### 3. Operations Workflow (Failure Handling)

```
┌─────────────────┐
│ Ops Team alerted│
│ via dashboard   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Check journey   │
│ details         │
│ • Customer info │
│ • Failure reason│
│ • Partial items │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Check money     │
│ exposure        │
│ • Confirmed amt │
│ • Pending amt   │
│ • Risk level    │
└────┬────────────┘
     │
     ▼
╔═════════════════╗
║  MAKE DECISION  ║
╚════┬════════════╝
     │
     ├──────┬──────┬──────┬──────┐
     │      │      │      │      │
     ▼      ▼      ▼      ▼      ▼
┌─────┐ ┌──────┐ ┌────┐ ┌────┐ ┌────┐
│RETRY│ │REPLACE│ROLL │ │HOLD│ │NEW │
│     │ │SUPPLIER│BACK│ │    │ │    │
└──┬──┘ └───┬──┘ └─┬──┘ └─┬──┘ └─┬──┘
   │        │      │      │      │
   └────────┴──────┴──────┴──────┘
                  │
                  ▼
           ┌─────────────┐
           │ Log decision│
           │ to database │
           └──────┬──────┘
                  │
                  ▼
           ┌─────────────┐
           │Execute action│
           │• Update      │
           │  journey     │
           │• Notify agent│
           └─────────────┘
```

### 4. Database Schema (Entity Relationship)

```
┌─────────────────┐
│    JOURNEYS     │◄─────────┐
│─────────────────│          │
│ PK: id          │          │
│ customer_name   │          │
│ created_by (FK) │          │
│ status          │          │
│ total_cost      │          │
│ cities (JSONB)  │          │
│ dates (JSONB)   │          │
│ preferences     │          │
└────┬────────────┘          │
     │                       │
     │ 1:N                   │ N:1
     ▼                       │
┌─────────────────┐          │
│  JOURNEY_ITEMS  │          │
│─────────────────│          │
│ PK: id          │          │
│ journey_id (FK) ├──────────┘
│ type (ENUM)     │
│ status (ENUM)   │
│ cost            │
│ supplier_id     │
│ details (JSONB) │
└─────────────────┘

┌─────────────────┐
│ MONEY_EXPOSURE  │
│─────────────────│
│ PK: id          │
│ journey_id (FK) ├──────┐
│ confirmed_amt   │      │ 1:1
│ pending_amt     │      │
│ customer_budget │      │
│ risk_level      │      │
└─────────────────┘      │
                         │
       ┌─────────────────┘
       │
       │
┌──────▼──────────┐
│   OPS_ALERTS    │
│─────────────────│
│ PK: id          │
│ journey_id (FK) │
│ alert_type      │
│ status          │
│ message         │
│ resolved_at     │
└─────────────────┘

┌─────────────────┐
│ OPS_DECISIONS   │
│─────────────────│
│ PK: id          │
│ journey_id (FK) │
│ decision (ENUM) │
│ decided_by (FK) │
│ notes           │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│   OPS_ACTIONS   │
│─────────────────│
│ PK: id          │
│ journey_id (FK) │
│ action          │
│ status          │
│ executed_at     │
│ executed_by (FK)│
└─────────────────┘

┌─────────────────┐
│    INCIDENTS    │
│─────────────────│
│ PK: id          │
│ incident_type   │
│ status          │
│ description     │
│ resolved_at     │
└────┬────────────┘
     │
     │ 1:N
     ▼
┌─────────────────┐
│ ADMIN_          │
│ NOTIFICATIONS   │
│─────────────────│
│ PK: id          │
│ incident_id (FK)│
│ message         │
│ status          │
│ acknowledged_at │
└─────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React Native 0.81.5
- **Runtime**: Expo SDK 54
- **Navigation**: Expo Router 6 (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Language**: TypeScript 5.9
- **UI Components**: 
  - Custom UIKit (11 professional components)
  - Ionicons
  - LinearGradient

### Backend
- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (JWT)
- **API**: Auto-generated REST + GraphQL
- **Security**: Row Level Security (RLS)
- **Storage**: Supabase Storage

### Development Tools
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint, TypeScript
- **Version Control**: Git

---

## Key Features

### Role-Based Access
1. **Agent Role**
   - Create new journeys
   - View own journeys
   - Track booking status

2. **Operations Role**
   - View all journeys
   - Handle failures
   - Make recovery decisions
   - Monitor money exposure

3. **Admin Role**
   - System-wide incident management
   - Analytics and reporting
   - Supplier management (future)

### Booking Flow
- Multi-city travel support
- Sequential booking (Flight → Hotel → Transfer)
- Failure detection at each step
- Automatic alert generation

### Operations Management
- Real-time alerts dashboard
- Money exposure tracking
- Risk level indicators (LOW/MEDIUM/HIGH)
- Decision logging (RETRY/REPLACE/ROLLBACK/HOLD)
- Action history tracking

### Financial Tracking
- Confirmed amount (already paid)
- Pending amount (not yet confirmed)
- Customer budget monitoring
- Risk level calculation

---

## Security Architecture

### Authentication Flow
```
User Login
    ↓
Supabase Auth validates
    ↓
JWT token generated
    ↓
Token stored securely (expo-secure-store)
    ↓
All API calls include JWT in headers
    ↓
RLS validates access per request
```

### Row Level Security (RLS)
- Every table has RLS enabled
- Authenticated users policy active
- Future: Role-specific policies

---

## Deployment Architecture

### Frontend Deployment
```
Development
    ↓
Expo Dev Client (local testing)
    ↓
EAS Build (production builds)
    ↓
App Stores (iOS App Store, Google Play)
```

### Backend Deployment
```
Supabase Cloud (fully managed)
    ├── Database (PostgreSQL)
    ├── Authentication
    ├── Storage
    ├── Edge Functions (future)
    └── Realtime (websockets)
```

---

## Performance Optimizations

### Database
- Indexes on foreign keys
- Indexes on status fields
- Indexes on created_at for sorting
- JSONB fields for flexible data

### Frontend
- Lazy loading with Expo Router
- Pull-to-refresh for live data
- Optimistic UI updates
- Image optimization with Expo

---

## Future Enhancements

### Phase 2
- [ ] Real-time subscriptions (Supabase Realtime)
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Supplier management UI

### Phase 3
- [ ] Edge Functions for complex logic
- [ ] Scheduled jobs (cron)
- [ ] Multi-tenancy support
- [ ] Revenue analytics

### Phase 4
- [ ] AI-powered recommendations
- [ ] Predictive failure detection
- [ ] Dynamic pricing
- [ ] Customer portal

---

## API Patterns

### Create Journey
```typescript
const { data, error } = await supabase
  .from('journeys')
  .insert({
    customer_name: 'John Doe',
    created_by: userId,
    status: 'DRAFT',
    cities: ['NYC', 'LA', 'SF'],
    dates: { start: '2024-01-01', end: '2024-01-10' }
  })
  .select()
  .single();
```

### Get Journeys with Alerts
```typescript
const { data, error } = await supabase
  .from('journeys')
  .select(`
    *,
    journey_items(*),
    money_exposure(*),
    ops_alerts(*)
  `)
  .eq('status', 'FAILED');
```

### Make Operations Decision
```typescript
const { error } = await supabase
  .from('ops_decisions')
  .insert({
    journey_id: journeyId,
    decision: 'RETRY',
    decided_by: opsUserId,
    notes: 'Supplier availability confirmed'
  });
```

---

## Error Handling Strategy

### Frontend
- Try-catch blocks for all async operations
- User-friendly error messages
- Fallback UI components
- Loading states

### Backend
- Database constraints
- RLS for security
- Triggers for data integrity
- Error logging (future)

---

## Monitoring & Analytics

### Key Metrics
- Journey conversion rate
- Booking success rate by supplier
- Average resolution time for failures
- Money exposure trends
- Agent performance metrics

### Alerting
- Real-time ops alerts
- High-risk journey notifications
- System incident alerts
- Admin notifications

---

## Development Guidelines

### Code Organization
```
Frontend/
  app/           # Screens (file-based routing)
  component/     # Reusable UI components
  lib/           # Utilities (Supabase client, helpers)
  types/         # TypeScript definitions

Backend/
  database/      # Schemas, migrations
  functions/     # Edge Functions
  triggers/      # Database triggers
  policies/      # RLS policies
```

### Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Database tables: snake_case
- Constants: UPPER_SNAKE_CASE

---

**Documentation Version**: 1.0.0  
**Last Updated**: February 7, 2026  
**Status**: ✅ Complete
