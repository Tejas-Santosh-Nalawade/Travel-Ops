-- ============================================
-- TRAVELOPS - COMPLETE DATABASE SCHEMA
-- ============================================
-- Full database schema for TravelOps Platform
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. JOURNEYS TABLE
-- Main table for customer journey bookings
-- ============================================
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (
    status IN ('DRAFT','PENDING','CONFIRMED','FAILED','ON_HOLD','CANCELLED')
  ) DEFAULT 'DRAFT',
  total_cost NUMERIC DEFAULT 0,
  cities JSONB DEFAULT '[]',
 dates JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_created_by ON journeys(created_by);
CREATE INDEX idx_journeys_created_at ON journeys(created_at DESC);

-- ============================================
-- 2. JOURNEY ITEMS TABLE
-- Individual booking components (flights, hotels, transfers)
-- ============================================
CREATE TABLE IF NOT EXISTS journey_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('FLIGHT','HOTEL','TRANSFER')),
  status TEXT NOT NULL CHECK (status IN ('PENDING','CONFIRMED','FAILED')) DEFAULT 'PENDING',
  cost NUMERIC DEFAULT 0,
  supplier_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_journey_items_journey_id ON journey_items(journey_id);
CREATE INDEX idx_journey_items_type ON journey_items(type);
CREATE INDEX idx_journey_items_status ON journey_items(status);
CREATE INDEX idx_journey_items_supplier ON journey_items(supplier_id);

-- ============================================
-- 3. MONEY EXPOSURE TABLE
-- Financial risk tracking per journey
-- ============================================
CREATE TABLE IF NOT EXISTS money_exposure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  confirmed_amount NUMERIC DEFAULT 0,
  pending_amount NUMERIC DEFAULT 0,
  customer_budget NUMERIC DEFAULT 0,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')) DEFAULT 'LOW',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(journey_id)
);

CREATE INDEX idx_money_exposure_journey_id ON money_exposure(journey_id);
CREATE INDEX idx_money_exposure_risk_level ON money_exposure(risk_level);

-- ============================================
-- 4. OPS ALERTS TABLE
-- Operational alerts for booking issues
-- ============================================
CREATE TABLE IF NOT EXISTS ops_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('BOOKING_FAILURE','PRICE_SPIKE','SUPPLIER_OUTAGE')
  ),
  status TEXT NOT NULL CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')) DEFAULT 'OPEN',
  message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_ops_alerts_journey_id ON ops_alerts(journey_id);
CREATE INDEX idx_ops_alerts_status ON ops_alerts(status);
CREATE INDEX idx_ops_alerts_type ON ops_alerts(alert_type);
CREATE INDEX idx_ops_alerts_created_at ON ops_alerts(created_at DESC);

-- ============================================
-- 5. OPS DECISIONS TABLE
-- Record of operational decisions made
-- ============================================
CREATE TABLE IF NOT EXISTS ops_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (
    decision IN ('RETRY','REPLACE','ROLLBACK','HOLD')
  ),
  decided_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_ops_decisions_journey_id ON ops_decisions(journey_id);
CREATE INDEX idx_ops_decisions_decided_by ON ops_decisions(decided_by);
CREATE INDEX idx_ops_decisions_created_at ON ops_decisions(created_at DESC);

-- ============================================
-- 6. OPS ACTIONS TABLE
-- Log of all actions taken
-- ============================================
CREATE TABLE IF NOT EXISTS ops_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILED')) DEFAULT 'SUCCESS',
  executed_at TIMESTAMP DEFAULT now(),
  executed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_ops_actions_journey_id ON ops_actions(journey_id);
CREATE INDEX idx_ops_actions_executed_at ON ops_actions(executed_at DESC);

-- ============================================
-- 7. INCIDENTS TABLE
-- System-wide incidents
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL CHECK (
    incident_type IN (
      'SUPPLIER_OUTAGE',
      'PAYMENT_FAILURE',
      'PRICE_SPIKE',
      'SYSTEM_DEGRADATION'
    )
  ),
  status TEXT NOT NULL CHECK (status IN ('OPEN','MITIGATING','RESOLVED')) DEFAULT 'OPEN',
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);

-- ============================================
-- 8. ADMIN NOTIFICATIONS TABLE
-- Notifications for administrators
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SENT','ACKNOWLEDGED')) DEFAULT 'SENT',
  created_at TIMESTAMP DEFAULT now(),
  acknowledged_at TIMESTAMP
);

CREATE INDEX idx_admin_notifications_incident_id ON admin_notifications(incident_id);
CREATE INDEX idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE money_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users full access to journeys" 
ON journeys FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to journey_items" 
ON journey_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to money_exposure" 
ON money_exposure FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to ops_alerts" 
ON ops_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to ops_decisions" 
ON ops_decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to ops_actions" 
ON ops_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to incidents" 
ON incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to admin_notifications" 
ON admin_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATING updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON journeys
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_items_updated_at BEFORE UPDATE ON journey_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_money_exposure_updated_at BEFORE UPDATE ON money_exposure
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ops_alerts_updated_at BEFORE UPDATE ON ops_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
