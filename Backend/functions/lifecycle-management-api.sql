-- =====================================================
-- LIFECYCLE MANAGEMENT API FUNCTIONS
-- =====================================================
-- RPC functions for cancellation, modification, and audit trail
-- =====================================================

-- ============================================
-- 1. CALCULATE REFUND AMOUNT
-- ============================================
-- Automatically calculates refund based on policies and journey timing
CREATE OR REPLACE FUNCTION calculate_refund_amount(
    p_journey_id UUID,
    p_modification_type modification_type
)
RETURNS TABLE (
    refund_amount DECIMAL,
    cancellation_fee DECIMAL,
    processing_fee DECIMAL,
    net_refund DECIMAL,
    policy_applied TEXT,
    hours_before_journey INTEGER,
    refund_percentage DECIMAL,
    calculation_breakdown JSONB
) AS $$
DECLARE
    v_journey RECORD;
    v_policy RECORD;
    v_hours_before INTEGER;
    v_base_refund DECIMAL;
    v_cancellation_fee DECIMAL;
    v_processing_fee DECIMAL;
    v_total_amount DECIMAL;
BEGIN
    -- Get journey details
    SELECT j.*, j.total_cost
    INTO v_journey
    FROM journeys j
    WHERE j.id = p_journey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journey not found';
    END IF;

    -- Calculate hours before journey
    v_hours_before := EXTRACT(EPOCH FROM (v_journey.start_date - NOW())) / 3600;

    IF v_hours_before < 0 THEN
        v_hours_before := 0;
    END IF;

    -- Find applicable policy (highest priority matching policy)
    SELECT cp.*
    INTO v_policy
    FROM cancellation_policies cp
    WHERE cp.is_active = TRUE
        AND cp.hours_before_min <= v_hours_before
        AND (cp.hours_before_max IS NULL OR cp.hours_before_max > v_hours_before)
    ORDER BY cp.priority ASC
    LIMIT 1;

    IF NOT FOUND THEN
        -- Default: no refund
        v_policy.refund_percentage := 0;
        v_policy.cancellation_fee := 2000;
        v_policy.processing_fee_percentage := 0;
        v_policy.policy_name := 'Default - No Refund';
    END IF;

    -- Calculate amounts
    v_total_amount := v_journey.total_cost;
    v_base_refund := v_total_amount * (v_policy.refund_percentage / 100);
    v_cancellation_fee := v_policy.cancellation_fee;
    v_processing_fee := v_total_amount * (v_policy.processing_fee_percentage / 100);

    -- Return calculated values
    RETURN QUERY SELECT
        v_base_refund,
        v_cancellation_fee,
        v_processing_fee,
        v_base_refund - v_cancellation_fee - v_processing_fee,
        v_policy.policy_name::TEXT,
        v_hours_before::INTEGER,
        v_policy.refund_percentage,
        jsonb_build_object(
            'original_amount', v_total_amount,
            'refund_percentage', v_policy.refund_percentage,
            'base_refund', v_base_refund,
            'cancellation_fee', v_cancellation_fee,
            'processing_fee', v_processing_fee,
            'policy_details', row_to_json(v_policy)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE MODIFICATION REQUEST
-- ============================================
CREATE OR REPLACE FUNCTION create_modification_request(
    p_journey_id UUID,
    p_modification_type modification_type,
    p_requested_changes JSONB,
    p_reason TEXT DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    request_id UUID,
    request_number TEXT,
    estimated_refund DECIMAL,
    estimated_fee DECIMAL,
    policy_applied TEXT,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_journey RECORD;
    v_customer_id UUID;
    v_refund_calc RECORD;
    v_rule RECORD;
    v_modification_fee DECIMAL := 0;
    v_request_id UUID;
    v_request_number TEXT;
    v_auto_approve BOOLEAN := FALSE;
BEGIN
    -- Get journey and customer
    SELECT j.*, j.total_cost, j.customer_id
    INTO v_journey
    FROM journeys j
    WHERE j.id = p_journey_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Journey not found';
    END IF;

    v_customer_id := v_journey.customer_id;

    -- Check if modification is allowed by rules
    SELECT mr.*
    INTO v_rule
    FROM modification_rules mr
    WHERE mr.is_active = TRUE
        AND (mr.applies_to_modification_type = p_modification_type OR mr.applies_to_modification_type IS NULL)
        AND (mr.applies_to_journey_status IS NULL OR mr.applies_to_journey_status = v_journey.status)
        AND (mr.minimum_hours_before IS NULL OR
             EXTRACT(EPOCH FROM (v_journey.start_date - NOW())) / 3600 >= mr.minimum_hours_before)
    ORDER BY mr.priority ASC
    LIMIT 1;

    IF v_rule.is_allowed = FALSE THEN
        RAISE EXCEPTION 'This type of modification is not allowed for this journey';
    END IF;

    -- Calculate refund if cancellation
    IF p_modification_type = 'cancellation' THEN
        SELECT * INTO v_refund_calc FROM calculate_refund_amount(p_journey_id, p_modification_type);
        v_modification_fee := v_refund_calc.cancellation_fee + v_refund_calc.processing_fee;
    ELSE
        v_modification_fee := COALESCE(v_rule.fixed_fee, 0);
    END IF;

    -- Determine if auto-approve
    IF v_rule.requires_approval = FALSE OR
       (v_rule.auto_approve_threshold IS NOT NULL AND v_journey.total_cost <= v_rule.auto_approve_threshold) THEN
        v_auto_approve := TRUE;
    END IF;

    -- Create modification request
    INSERT INTO modification_requests (
        journey_id,
        customer_id,
        modification_type,
        status,
        original_data,
        requested_changes,
        applicable_policy_id,
        original_amount,
        refund_amount,
        cancellation_fee,
        processing_fee,
        additional_charge,
        reason,
        customer_notes,
        requested_by
    ) VALUES (
        p_journey_id,
        v_customer_id,
        p_modification_type,
        CASE WHEN v_auto_approve THEN 'approved'::modification_status ELSE 'pending'::modification_status END,
        row_to_json(v_journey)::JSONB,
        p_requested_changes,
        v_refund_calc.policy_id,
        v_journey.total_cost,
        COALESCE(v_refund_calc.net_refund, 0),
        COALESCE(v_refund_calc.cancellation_fee, 0),
        COALESCE(v_refund_calc.processing_fee, 0),
        v_modification_fee,
        p_reason,
        p_customer_notes,
        v_customer_id::TEXT
    )
    RETURNING id, request_number INTO v_request_id, v_request_number;

    -- Return result
    RETURN QUERY SELECT
        v_request_id,
        v_request_number,
        COALESCE(v_refund_calc.net_refund, 0.00),
        v_modification_fee,
        COALESCE(v_refund_calc.policy_applied, 'Standard Policy')::TEXT,
        CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END::TEXT,
        CASE
            WHEN v_auto_approve THEN 'Request auto-approved and will be processed shortly'
            ELSE 'Request submitted for review'
        END::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. GET PENDING MODIFICATION REQUESTS (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_modification_requests(
    p_status modification_status DEFAULT 'pending',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    request_id UUID,
    request_number TEXT,
    journey_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    modification_type TEXT,
    status TEXT,
    priority TEXT,
    original_amount DECIMAL,
    refund_amount DECIMAL,
    net_amount DECIMAL,
    requested_at TIMESTAMPTZ,
    hours_until_journey INTEGER,
    is_urgent BOOLEAN,
    journey_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mr.id,
        mr.request_number,
        mr.journey_id,
        c.full_name,
        c.email,
        mr.modification_type::TEXT,
        mr.status::TEXT,
        mr.priority,
        mr.original_amount,
        mr.refund_amount,
        mr.net_amount,
        mr.requested_at,
        EXTRACT(EPOCH FROM (j.start_date - NOW())) / 3600::INTEGER,
        CASE
            WHEN EXTRACT(EPOCH FROM (j.start_date - NOW())) / 3600 < 48 THEN TRUE
            ELSE FALSE
        END,
        jsonb_build_object(
            'destination', j.destination,
            'start_date', j.start_date,
            'end_date', j.end_date,
            'total_cost', j.total_cost,
            'status', j.status
        )
    FROM modification_requests mr
    JOIN customers c ON c.id = mr.customer_id
    JOIN journeys j ON j.id = mr.journey_id
    WHERE mr.status = p_status
    ORDER BY
        CASE WHEN mr.priority = 'urgent' THEN 1
             WHEN mr.priority = 'high' THEN 2
             WHEN mr.priority = 'normal' THEN 3
             ELSE 4 END,
        mr.requested_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. APPROVE/REJECT MODIFICATION REQUEST
-- ============================================
CREATE OR REPLACE FUNCTION update_modification_request_status(
    p_request_id UUID,
    p_new_status modification_status,
    p_review_notes TEXT DEFAULT NULL,
    p_approved_changes JSONB DEFAULT NULL,
    p_reviewer_id UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    request_number TEXT
) AS $$
DECLARE
    v_request RECORD;
    v_request_number TEXT;
BEGIN
    -- Get request
    SELECT * INTO v_request
    FROM modification_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Request not found'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    v_request_number := v_request.request_number;

    -- Update request
    UPDATE modification_requests
    SET
        status = p_new_status,
        reviewed_by = p_reviewer_id,
        reviewed_at = NOW(),
        review_notes = p_review_notes,
        approved_changes = COALESCE(p_approved_changes, requested_changes),
        approved_at = CASE WHEN p_new_status = 'approved' THEN NOW() ELSE NULL END,
        rejected_reason = CASE WHEN p_new_status = 'rejected' THEN p_review_notes ELSE NULL END
    WHERE id = p_request_id;

    -- If approved and is cancellation, update journey status
    IF p_new_status = 'approved' AND v_request.modification_type = 'cancellation' THEN
        UPDATE journeys
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = v_request.journey_id;
    END IF;

    RETURN QUERY SELECT
        TRUE,
        'Request ' || p_new_status::TEXT || ' successfully',
        v_request_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GET JOURNEY AUDIT TRAIL
-- ============================================
CREATE OR REPLACE FUNCTION get_journey_audit_trail(
    p_journey_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    audit_id UUID,
    audit_number TEXT,
    action_type TEXT,
    entity_type TEXT,
    version_number INTEGER,
    changed_by_name TEXT,
    changed_by_role TEXT,
    change_reason TEXT,
    state_before JSONB,
    state_after JSONB,
    changes_summary JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        jal.id,
        jal.audit_number,
        jal.action_type,
        jal.entity_type,
        jal.version_number,
        jal.changed_by_name,
        jal.changed_by_role,
        jal.change_reason,
        jal.state_before,
        jal.state_after,
        jal.changes_summary,
        jal.created_at
    FROM journey_audit_log jal
    WHERE jal.journey_id = p_journey_id
    ORDER BY jal.version_number DESC, jal.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. GET ALL CANCELLATION POLICIES
-- ============================================
CREATE OR REPLACE FUNCTION get_cancellation_policies(
    p_active_only BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    policy_id UUID,
    policy_name TEXT,
    policy_type TEXT,
    description TEXT,
    hours_before_min INTEGER,
    hours_before_max INTEGER,
    refund_percentage DECIMAL,
    cancellation_fee DECIMAL,
    allow_date_change BOOLEAN,
    date_change_fee DECIMAL,
    is_active BOOLEAN,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.policy_name,
        cp.policy_type,
        cp.description,
        cp.hours_before_min,
        cp.hours_before_max,
        cp.refund_percentage,
        cp.cancellation_fee,
        cp.allow_date_change,
        cp.date_change_fee,
        cp.is_active,
        cp.priority
    FROM cancellation_policies cp
    WHERE (NOT p_active_only OR cp.is_active = TRUE)
    ORDER BY cp.priority ASC, cp.hours_before_min DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREATE/UPDATE CANCELLATION POLICY
-- ============================================
CREATE OR REPLACE FUNCTION upsert_cancellation_policy(
    p_policy_id UUID DEFAULT NULL,
    p_policy_name TEXT,
    p_policy_type TEXT,
    p_description TEXT,
    p_hours_before_min INTEGER,
    p_hours_before_max INTEGER,
    p_refund_percentage DECIMAL,
    p_cancellation_fee DECIMAL DEFAULT 0,
    p_allow_date_change BOOLEAN DEFAULT TRUE,
    p_date_change_fee DECIMAL DEFAULT 0,
    p_is_active BOOLEAN DEFAULT TRUE,
    p_priority INTEGER DEFAULT 0
)
RETURNS TABLE (
    policy_id UUID,
    message TEXT
) AS $$
DECLARE
    v_policy_id UUID;
BEGIN
    IF p_policy_id IS NULL THEN
        -- Create new policy
        INSERT INTO cancellation_policies (
            policy_name, policy_type, description,
            hours_before_min, hours_before_max,
            refund_percentage, cancellation_fee,
            allow_date_change, date_change_fee,
            is_active, priority
        ) VALUES (
            p_policy_name, p_policy_type, p_description,
            p_hours_before_min, p_hours_before_max,
            p_refund_percentage, p_cancellation_fee,
            p_allow_date_change, p_date_change_fee,
            p_is_active, p_priority
        )
        RETURNING id INTO v_policy_id;

        RETURN QUERY SELECT v_policy_id, 'Policy created successfully'::TEXT;
    ELSE
        -- Update existing policy
        UPDATE cancellation_policies
        SET
            policy_name = p_policy_name,
            policy_type = p_policy_type,
            description = p_description,
            hours_before_min = p_hours_before_min,
            hours_before_max = p_hours_before_max,
            refund_percentage = p_refund_percentage,
            cancellation_fee = p_cancellation_fee,
            allow_date_change = p_allow_date_change,
            date_change_fee = p_date_change_fee,
            is_active = p_is_active,
            priority = p_priority,
            updated_at = NOW()
        WHERE id = p_policy_id;

        RETURN QUERY SELECT p_policy_id, 'Policy updated successfully'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GET MODIFICATION REQUEST STATS (Admin Dashboard)
-- ============================================
CREATE OR REPLACE FUNCTION get_modification_stats(
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_requests INTEGER,
    pending_requests INTEGER,
    approved_requests INTEGER,
    rejected_requests INTEGER,
    avg_resolution_hours DECIMAL,
    total_refunds_issued DECIMAL,
    cancellations_count INTEGER,
    date_changes_count INTEGER,
    avg_refund_percentage DECIMAL,
    requests_by_type JSONB,
    requests_by_status JSONB,
    daily_trend JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'approved')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER,
        AVG(EXTRACT(EPOCH FROM (approved_at - requested_at)) / 3600)::DECIMAL,
        SUM(refund_amount)::DECIMAL,
        COUNT(*) FILTER (WHERE modification_type = 'cancellation')::INTEGER,
        COUNT(*) FILTER (WHERE modification_type = 'date_change')::INTEGER,
        AVG(refund_amount / NULLIF(original_amount, 0) * 100)::DECIMAL,
        jsonb_object_agg(modification_type, type_count),
        jsonb_object_agg(status, status_count),
        jsonb_agg(daily_data ORDER BY request_date)
    FROM (
        SELECT
            modification_type,
            status,
            COUNT(*) as type_count,
            COUNT(*) as status_count,
            DATE(requested_at) as request_date,
            jsonb_build_object(
                'date', DATE(requested_at),
                'count', COUNT(*),
                'approved', COUNT(*) FILTER (WHERE status = 'approved'),
                'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
            ) as daily_data
        FROM modification_requests
        WHERE requested_at >= NOW() - (p_days_back || ' days')::INTERVAL
        GROUP BY modification_type, status, DATE(requested_at)
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- API FUNCTIONS COMPLETE
-- =====================================================
-- Available RPC functions:
-- 1. calculate_refund_amount(journey_id, modification_type)
-- 2. create_modification_request(journey_id, type, changes, reason, notes)
-- 3. get_pending_modification_requests(status, limit)
-- 4. update_modification_request_status(request_id, status, notes, changes, reviewer)
-- 5. get_journey_audit_trail(journey_id, limit)
-- 6. get_cancellation_policies(active_only)
-- 7. upsert_cancellation_policy(...all params...)
-- 8. get_modification_stats(days_back)
-- =====================================================
