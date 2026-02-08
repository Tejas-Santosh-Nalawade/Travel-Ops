-- =============================================================================
-- OPERATIONS BACKEND FUNCTIONS
-- Business logic for TravelOps Operations Team
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FUNCTION: calculate_risk_level
-- Calculates risk level based on money exposure and customer budget
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_risk_level(
  p_confirmed_amount NUMERIC,
  p_pending_amount NUMERIC,
  p_customer_budget NUMERIC
) RETURNS TEXT AS $$
DECLARE
  v_total_exposure NUMERIC;
  v_exposure_percentage NUMERIC;
BEGIN
  v_total_exposure := COALESCE(p_confirmed_amount, 0) + COALESCE(p_pending_amount, 0);
  
  -- If no customer budget, calculate based on exposure amount
  IF p_customer_budget IS NULL OR p_customer_budget = 0 THEN
    IF v_total_exposure > 50000 THEN
      RETURN 'HIGH';
    ELSIF v_total_exposure > 20000 THEN
      RETURN 'MEDIUM';
    ELSE
      RETURN 'LOW';
    END IF;
  END IF;
  
  -- Calculate as percentage of budget
  v_exposure_percentage := (v_total_exposure / p_customer_budget) * 100;
  
  IF v_exposure_percentage > 80 THEN
    RETURN 'HIGH';
  ELSIF v_exposure_percentage > 50 THEN
    RETURN 'MEDIUM';
  ELSE
    RETURN 'LOW';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- FUNCTION: get_journey_statistics
-- Returns comprehensive statistics for operations dashboard
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_journey_statistics()
RETURNS TABLE(
  total_journeys BIGINT,
  confirmed_journeys BIGINT,
  failed_journeys BIGINT,
  pending_journeys BIGINT,
  on_hold_journeys BIGINT,
  total_revenue NUMERIC,
  total_exposure NUMERIC,
  high_risk_count BIGINT,
  active_alerts BIGINT,
  open_incidents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(j.id) AS total_journeys,
    COUNT(j.id) FILTER (WHERE j.status = 'CONFIRMED') AS confirmed_journeys,
    COUNT(j.id) FILTER (WHERE j.status = 'FAILED') AS failed_journeys,
    COUNT(j.id) FILTER (WHERE j.status = 'PENDING') AS pending_journeys,
    COUNT(j.id) FILTER (WHERE j.status = 'ON_HOLD') AS on_hold_journeys,
    COALESCE(SUM(j.total_cost) FILTER (WHERE j.status = 'CONFIRMED'), 0) AS total_revenue,
    COALESCE(SUM(me.confirmed_amount + me.pending_amount), 0) AS total_exposure,
    COUNT(me.id) FILTER (WHERE me.risk_level = 'HIGH') AS high_risk_count,
    COUNT(oa.id) FILTER (WHERE oa.status IN ('OPEN', 'IN_PROGRESS')) AS active_alerts,
    COUNT(i.id) FILTER (WHERE i.status IN ('OPEN', 'MITIGATING')) AS open_incidents
  FROM journeys j
  LEFT JOIN money_exposure me ON j.id = me.journey_id
  LEFT JOIN ops_alerts oa ON j.id = oa.journey_id
  LEFT JOIN incidents i ON TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- FUNCTION: get_critical_journeys
-- Returns journeys that need immediate attention
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_critical_journeys()
RETURNS TABLE(
  journey_id UUID,
  customer_name TEXT,
  status TEXT,
  total_cost NUMERIC,
  risk_level TEXT,
  alert_count BIGINT,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id AS journey_id,
    j.customer_name,
    j.status,
    j.total_cost,
    me.risk_level,
    COUNT(oa.id) AS alert_count,
    j.created_at
  FROM journeys j
  LEFT JOIN money_exposure me ON j.id = me.journey_id
  LEFT JOIN ops_alerts oa ON j.id = oa.journey_id AND oa.status != 'RESOLVED'
  WHERE j.status IN ('FAILED', 'ON_HOLD')
     OR me.risk_level = 'HIGH'
  GROUP BY j.id, j.customer_name, j.status, j.total_cost, me.risk_level, j.created_at
  ORDER BY 
    CASE me.risk_level
      WHEN 'HIGH' THEN 1
      WHEN 'MEDIUM' THEN 2
      ELSE 3
    END,
    j.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- FUNCTION: auto_create_alert
-- Automatically creates alert when journey fails
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_alert(
  p_journey_id UUID,
  p_alert_type TEXT,
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
  v_default_message TEXT;
BEGIN
  -- Generate default message if not provided
  IF p_message IS NULL THEN
    v_default_message := 'Journey ' || p_journey_id::TEXT || ' requires attention: ' || p_alert_type;
  ELSE
    v_default_message := p_message;
  END IF;
  
  INSERT INTO ops_alerts (journey_id, alert_type, status, message)
  VALUES (p_journey_id, p_alert_type, 'OPEN', v_default_message)
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- FUNCTION: execute_ops_decision
-- Executes an operations decision and logs the action
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION execute_ops_decision(
  p_journey_id UUID,
  p_decision TEXT,
  p_decided_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_decision_id UUID;
  v_action_id UUID;
  v_journey_status TEXT;
  v_result JSON;
BEGIN
  -- Validate decision type
  IF p_decision NOT IN ('RETRY', 'REPLACE', 'ROLLBACK', 'HOLD') THEN
    RAISE EXCEPTION 'Invalid decision type: %', p_decision;
  END IF;
  
  -- Insert decision
  INSERT INTO ops_decisions (journey_id, decision, decided_by, notes)
  VALUES (p_journey_id, p_decision, p_decided_by, p_notes)
  RETURNING id INTO v_decision_id;
  
  -- Execute action based on decision
  CASE p_decision
    WHEN 'RETRY' THEN
      UPDATE journeys SET status = 'PENDING' WHERE id = p_journey_id;
      INSERT INTO ops_actions (journey_id, action, status, executed_by)
      VALUES (p_journey_id, 'RETRY_BOOKING', 'SUCCESS', p_decided_by)
      RETURNING id INTO v_action_id;
      
    WHEN 'REPLACE' THEN
      UPDATE journeys SET status = 'PENDING' WHERE id = p_journey_id;
      INSERT INTO ops_actions (journey_id, action, status, executed_by)
      VALUES (p_journey_id, 'REPLACE_SUPPLIER', 'SUCCESS', p_decided_by)
      RETURNING id INTO v_action_id;
      
    WHEN 'ROLLBACK' THEN
      UPDATE journeys SET status = 'CANCELLED' WHERE id = p_journey_id;
      INSERT INTO ops_actions (journey_id, action, status, executed_by)
      VALUES (p_journey_id, 'ROLLBACK_BOOKING', 'SUCCESS', p_decided_by)
      RETURNING id INTO v_action_id;
      
    WHEN 'HOLD' THEN
      UPDATE journeys SET status = 'ON_HOLD' WHERE id = p_journey_id;
      INSERT INTO ops_actions (journey_id, action, status, executed_by)
      VALUES (p_journey_id, 'HOLD_BOOKING', 'SUCCESS', p_decided_by)
      RETURNING id INTO v_action_id;
  END CASE;
  
  -- Get updated journey status
  SELECT status INTO v_journey_status FROM journeys WHERE id = p_journey_id;
  
  -- Return result
  v_result := json_build_object(
    'decision_id', v_decision_id,
    'action_id', v_action_id,
    'journey_status', v_journey_status,
    'success', true
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- FUNCTION: resolve_alert
-- Resolves an alert and optionally creates incident if critical
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id UUID,
  p_create_incident BOOLEAN DEFAULT FALSE,
  p_incident_description TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_incident_id UUID;
  v_alert_type TEXT;
  v_result JSON;
BEGIN
  -- Get alert type
  SELECT alert_type INTO v_alert_type FROM ops_alerts WHERE id = p_alert_id;
  
  -- Update alert status
  UPDATE ops_alerts 
  SET status = 'RESOLVED', resolved_at = NOW()
  WHERE id = p_alert_id;
  
  -- Create incident if requested
  IF p_create_incident THEN
    INSERT INTO incidents (
      incident_type,
      status,
      description
    ) VALUES (
      v_alert_type,
      'OPEN',
      COALESCE(p_incident_description, 'Escalated from alert: ' || v_alert_type)
    )
    RETURNING id INTO v_incident_id;
  END IF;
  
  v_result := json_build_object(
    'alert_id', p_alert_id,
    'incident_id', v_incident_id,
    'success', true
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- FUNCTION: get_exposure_summary
-- Returns money exposure summary with aggregations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_exposure_summary()
RETURNS TABLE(
  total_confirmed NUMERIC,
  total_pending NUMERIC,
  total_exposure NUMERIC,
  high_risk_exposure NUMERIC,
  medium_risk_exposure NUMERIC,
  low_risk_exposure NUMERIC,
  journey_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(confirmed_amount), 0) AS total_confirmed,
    COALESCE(SUM(pending_amount), 0) AS total_pending,
    COALESCE(SUM(confirmed_amount + pending_amount), 0) AS total_exposure,
    COALESCE(SUM(confirmed_amount + pending_amount) FILTER (WHERE risk_level = 'HIGH'), 0) AS high_risk_exposure,
    COALESCE(SUM(confirmed_amount + pending_amount) FILTER (WHERE risk_level = 'MEDIUM'), 0) AS medium_risk_exposure,
    COALESCE(SUM(confirmed_amount + pending_amount) FILTER (WHERE risk_level = 'LOW'), 0) AS low_risk_exposure,
    COUNT(*) AS journey_count
  FROM money_exposure;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION calculate_risk_level TO authenticated;
GRANT EXECUTE ON FUNCTION get_journey_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_critical_journeys TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_alert TO authenticated;
GRANT EXECUTE ON FUNCTION execute_ops_decision TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_alert TO authenticated;
GRANT EXECUTE ON FUNCTION get_exposure_summary TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION calculate_risk_level IS 'Calculates risk level (LOW/MEDIUM/HIGH) based on exposure and budget';
COMMENT ON FUNCTION get_journey_statistics IS 'Returns comprehensive statistics for operations dashboard';
COMMENT ON FUNCTION get_critical_journeys IS 'Returns journeys requiring immediate attention';
COMMENT ON FUNCTION auto_create_alert IS 'Automatically creates alert with proper formatting';
COMMENT ON FUNCTION execute_ops_decision IS 'Executes operations decision and updates journey status';
COMMENT ON FUNCTION resolve_alert IS 'Resolves alert and optionally escalates to incident';
COMMENT ON FUNCTION get_exposure_summary IS 'Returns aggregated money exposure statistics';
