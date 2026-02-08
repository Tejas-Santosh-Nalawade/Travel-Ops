-- =====================================================
-- LIFECYCLE CHANGE & CANCELLATION MANAGEMENT SCHEMA
-- =====================================================
-- Purpose: Support post-confirmation modifications with business rules,
-- dynamic policy enforcement, and complete audit trails
-- Created: 2026-02-08
-- =====================================================

-- ============================================
-- 1. CANCELLATION POLICIES TABLE
-- ============================================
-- Defines time-based cancellation rules with refund percentages
CREATE TABLE IF NOT EXISTS cancellation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL, -- 'standard', 'premium', 'flexible', 'non_refundable'
    description TEXT,

    -- Time-based rules (hours before journey start)
    hours_before_min INTEGER NOT NULL, -- Minimum hours before trip (e.g., 0 for day-of)
    hours_before_max INTEGER, -- Maximum hours before trip (e.g., 24, 48, 168)

    -- Financial rules
    refund_percentage DECIMAL(5,2) NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    processing_fee_percentage DECIMAL(5,2) DEFAULT 0,

    -- Modification rules
    allow_date_change BOOLEAN DEFAULT TRUE,
    date_change_fee DECIMAL(10,2) DEFAULT 0,
    allow_passenger_change BOOLEAN DEFAULT TRUE,
    passenger_change_fee DECIMAL(10,2) DEFAULT 0,
    allow_destination_change BOOLEAN DEFAULT FALSE,
    destination_change_fee DECIMAL(10,2) DEFAULT 500,

    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher priority rules are checked first
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_time_range UNIQUE (hours_before_min, hours_before_max, policy_type)
);

-- Sample policies
INSERT INTO cancellation_policies (policy_name, policy_type, description, hours_before_min, hours_before_max, refund_percentage, cancellation_fee, priority) VALUES
('Flexible - 7+ days before', 'flexible', 'Full refund minus processing fee', 168, NULL, 95.00, 500, 1),
('Flexible - 3-7 days before', 'flexible', 'Partial refund', 72, 168, 75.00, 1000, 2),
('Flexible - 1-3 days before', 'flexible', 'Minimal refund', 24, 72, 50.00, 1500, 3),
('Flexible - Within 24 hours', 'flexible', 'No refund', 0, 24, 0.00, 2000, 4),
('Standard - 15+ days before', 'standard', '80% refund', 360, NULL, 80.00, 1000, 5),
('Standard - 7-15 days before', 'standard', '50% refund', 168, 360, 50.00, 1500, 6),
('Standard - Within 7 days', 'standard', 'No refund', 0, 168, 0.00, 2000, 7),
('Premium - Anytime', 'premium', 'Full refund anytime', 0, NULL, 100.00, 0, 8),
('Non-refundable', 'non_refundable', 'No refunds allowed', 0, NULL, 0.00, 0, 9);

-- ============================================
-- 2. MODIFICATION REQUEST TYPES
-- ============================================
CREATE TYPE modification_type AS ENUM (
    'cancellation',
    'date_change',
    'passenger_change',
    'destination_change',
    'package_upgrade',
    'package_downgrade',
    'add_service',
    'remove_service',
    'payment_plan_change'
);

CREATE TYPE modification_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'processing',
    'completed',
    'cancelled'
);

-- ============================================
-- 3. MODIFICATION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS modification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL, -- MOD-2026-00001

    -- Journey reference
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Request details
    modification_type modification_type NOT NULL,
    status modification_status DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

    -- Original and requested changes
    original_data JSONB NOT NULL, -- Snapshot of original journey details
    requested_changes JSONB NOT NULL, -- What the customer wants to change
    approved_changes JSONB, -- What was actually approved (may differ)

    -- Business rules applied
    applicable_policy_id UUID REFERENCES cancellation_policies(id),
    policy_snapshot JSONB, -- Snapshot of policy at time of request

    -- Financial impact
    original_amount DECIMAL(10,2) NOT NULL,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    additional_charge DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2), -- original - refund + additional
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,

    -- Request metadata
    reason TEXT,
    customer_notes TEXT,
    requested_by VARCHAR(100),
    requested_at TIMESTAMPTZ DEFAULT NOW(),

    -- Approval workflow
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    approved_at TIMESTAMPTZ,
    rejected_reason TEXT,

    -- Processing
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    completion_notes TEXT,

    -- SLA tracking
    expected_resolution_at TIMESTAMPTZ,
    actual_resolution_at TIMESTAMPTZ,
    is_sla_breached BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate request number
CREATE OR REPLACE FUNCTION generate_modification_request_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.request_number := 'MOD-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                          LPAD(NEXTVAL('modification_request_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS modification_request_seq START 1;

CREATE TRIGGER set_modification_request_number
    BEFORE INSERT ON modification_requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_modification_request_number();

-- ============================================
-- 4. JOURNEY AUDIT LOG TABLE (Immutable)
-- ============================================
-- Complete, immutable history of all changes
CREATE TABLE IF NOT EXISTS journey_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_number VARCHAR(50) UNIQUE NOT NULL, -- AUDIT-2026-00001

    -- Journey reference
    journey_id UUID NOT NULL REFERENCES journeys(id),
    customer_id UUID NOT NULL REFERENCES customers(id),

    -- Change tracking
    action_type VARCHAR(50) NOT NULL, -- 'created', 'modified', 'cancelled', 'restored'
    entity_type VARCHAR(50) NOT NULL, -- 'journey', 'booking', 'payment', 'package'
    entity_id UUID,

    -- Version control
    version_number INTEGER NOT NULL,
    previous_version INTEGER,

    -- Data snapshots (complete state before and after)
    state_before JSONB, -- Full snapshot before change
    state_after JSONB, -- Full snapshot after change
    changes_summary JSONB, -- Specific fields that changed

    -- Change metadata
    changed_by_user_id UUID REFERENCES auth.users(id),
    changed_by_name VARCHAR(100),
    changed_by_role VARCHAR(50),
    change_reason TEXT,
    modification_request_id UUID REFERENCES modification_requests(id),

    -- System tracking
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),

    -- Immutable timestamp (cannot be updated)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent updates to ensure immutability
    CONSTRAINT no_updates CHECK (created_at = created_at)
);

-- Prevent ANY updates to audit log
CREATE OR REPLACE FUNCTION prevent_audit_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries are immutable and cannot be modified';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_updates
    BEFORE UPDATE ON journey_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_updates();

CREATE TRIGGER prevent_audit_log_deletes
    BEFORE DELETE ON journey_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_updates();

-- Generate audit number
CREATE OR REPLACE FUNCTION generate_audit_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.audit_number := 'AUDIT-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(NEXTVAL('audit_log_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS audit_log_seq START 1;

CREATE TRIGGER set_audit_number
    BEFORE INSERT ON journey_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION generate_audit_number();

-- ============================================
-- 5. REFUND CALCULATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refund_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_number VARCHAR(50) UNIQUE NOT NULL,

    -- References
    modification_request_id UUID NOT NULL REFERENCES modification_requests(id),
    journey_id UUID NOT NULL REFERENCES journeys(id),
    policy_id UUID REFERENCES cancellation_policies(id),

    -- Calculation inputs
    original_amount DECIMAL(10,2) NOT NULL,
    hours_before_journey INTEGER NOT NULL,
    journey_start_date TIMESTAMPTZ NOT NULL,
    request_date TIMESTAMPTZ NOT NULL,

    -- Policy applied
    policy_type VARCHAR(50),
    refund_percentage DECIMAL(5,2),

    -- Breakdown
    base_refund DECIMAL(10,2),
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    additional_charges DECIMAL(10,2) DEFAULT 0,

    -- Final amounts
    total_refund DECIMAL(10,2) NOT NULL,
    net_payable DECIMAL(10,2), -- If additional charges exceed refund

    -- Calculation details
    calculation_notes TEXT,
    breakdown JSONB, -- Detailed line items

    -- Metadata
    calculated_by UUID REFERENCES auth.users(id),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    is_final BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS refund_calc_seq START 1;

-- ============================================
-- 6. MODIFICATION RULES TABLE
-- ============================================
-- Dynamic rules for what can be modified and when
CREATE TABLE IF NOT EXISTS modification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'time_based', 'amount_based', 'status_based'

    -- Conditions
    applies_to_modification_type modification_type,
    applies_to_journey_status VARCHAR(50),
    minimum_hours_before INTEGER,
    maximum_amount DECIMAL(10,2),
    minimum_amount DECIMAL(10,2),

    -- Actions
    is_allowed BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    auto_approve_threshold DECIMAL(10,2),

    -- Fees
    fixed_fee DECIMAL(10,2) DEFAULT 0,
    percentage_fee DECIMAL(5,2) DEFAULT 0,

    -- Restrictions
    max_modifications_allowed INTEGER,
    cooling_period_hours INTEGER, -- Time between modifications

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample modification rules
INSERT INTO modification_rules (rule_name, rule_type, applies_to_modification_type, minimum_hours_before, is_allowed, requires_approval, fixed_fee) VALUES
('Date change - 7+ days before', 'time_based', 'date_change', 168, TRUE, FALSE, 500),
('Date change - Within 7 days', 'time_based', 'date_change', 0, TRUE, TRUE, 1500),
('Passenger change - Anytime', 'time_based', 'passenger_change', 0, TRUE, TRUE, 1000),
('Destination change - 15+ days', 'time_based', 'destination_change', 360, TRUE, TRUE, 2500),
('Cancellation - Anytime', 'time_based', 'cancellation', 0, TRUE, TRUE, 0),
('Package upgrade - Anytime', 'time_based', 'package_upgrade', 0, TRUE, FALSE, 0),
('Package downgrade - 10+ days', 'time_based', 'package_downgrade', 240, TRUE, TRUE, 1000);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_modification_requests_journey ON modification_requests(journey_id);
CREATE INDEX idx_modification_requests_customer ON modification_requests(customer_id);
CREATE INDEX idx_modification_requests_status ON modification_requests(status);
CREATE INDEX idx_modification_requests_type ON modification_requests(modification_type);
CREATE INDEX idx_modification_requests_created ON modification_requests(created_at DESC);
CREATE INDEX idx_modification_requests_priority ON modification_requests(priority, status);

CREATE INDEX idx_audit_log_journey ON journey_audit_log(journey_id);
CREATE INDEX idx_audit_log_customer ON journey_audit_log(customer_id);
CREATE INDEX idx_audit_log_action ON journey_audit_log(action_type);
CREATE INDEX idx_audit_log_created ON journey_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_version ON journey_audit_log(journey_id, version_number);

CREATE INDEX idx_cancellation_policies_active ON cancellation_policies(is_active, priority);
CREATE INDEX idx_modification_rules_active ON modification_rules(is_active, priority);

-- ============================================
-- 8. AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cancellation_policies_updated_at
    BEFORE UPDATE ON cancellation_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modification_requests_updated_at
    BEFORE UPDATE ON modification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modification_rules_updated_at
    BEFORE UPDATE ON modification_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. AUTO-CREATE AUDIT LOG ON JOURNEY CHANGES
-- ============================================
CREATE OR REPLACE FUNCTION auto_log_journey_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_version INTEGER;
    v_action VARCHAR(50);
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_version := 1;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'modified';
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version
        FROM journey_audit_log
        WHERE journey_id = NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version
        FROM journey_audit_log
        WHERE journey_id = OLD.id;
    END IF;

    -- Insert audit log
    IF TG_OP = 'DELETE' THEN
        INSERT INTO journey_audit_log (
            journey_id,
            customer_id,
            action_type,
            entity_type,
            entity_id,
            version_number,
            state_before,
            changed_by_user_id,
            changed_by_role
        ) VALUES (
            OLD.id,
            OLD.customer_id,
            v_action,
            'journey',
            OLD.id,
            v_version,
            row_to_json(OLD)::JSONB,
            COALESCE(current_setting('app.current_user_id', TRUE)::UUID, OLD.customer_id),
            'system'
        );
        RETURN OLD;
    ELSE
        INSERT INTO journey_audit_log (
            journey_id,
            customer_id,
            action_type,
            entity_type,
            entity_id,
            version_number,
            state_before,
            state_after,
            changed_by_user_id,
            changed_by_role
        ) VALUES (
            NEW.id,
            NEW.customer_id,
            v_action,
            'journey',
            NEW.id,
            v_version,
            CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
            row_to_json(NEW)::JSONB,
            COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NEW.customer_id),
            'system'
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journey_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON journeys
    FOR EACH ROW
    EXECUTE FUNCTION auto_log_journey_changes();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_rules ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage policies" ON cancellation_policies
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage modification requests" ON modification_requests
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'operations'));

CREATE POLICY "Users can view their own modification requests" ON modification_requests
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON journey_audit_log
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'operations'));

CREATE POLICY "Users can view their own audit logs" ON journey_audit_log
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can manage refund calculations" ON refund_calculations
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'operations'));

CREATE POLICY "Admins can manage rules" ON modification_rules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this schema in Supabase SQL Editor
-- 2. Implement API functions (lifecycle-management-api.sql)
-- 3. Create admin dashboard UI components
-- =====================================================
