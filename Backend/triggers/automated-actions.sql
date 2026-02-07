-- =============================================================================
-- DATABASE TRIGGERS FOR TRAVELOPS
-- Automated actions and data integrity
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-update timestamps on all tables
-- -----------------------------------------------------------------------------

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
DROP TRIGGER IF EXISTS update_journeys_updated_at ON journeys;
CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journey_items_updated_at ON journey_items;
CREATE TRIGGER update_journey_items_updated_at
  BEFORE UPDATE ON journey_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_money_exposure_updated_at ON money_exposure;
CREATE TRIGGER update_money_exposure_updated_at
  BEFORE UPDATE ON money_exposure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ops_alerts_updated_at ON ops_alerts;
CREATE TRIGGER update_ops_alerts_updated_at
  BEFORE UPDATE ON ops_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-create alert when journey fails
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_create_alert_on_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create alert if status changed to FAILED
  IF NEW.status = 'FAILED' AND (OLD.status IS NULL OR OLD.status != 'FAILED') THEN
    INSERT INTO ops_alerts (journey_id, alert_type, status, message)
    VALUES (
      NEW.id,
      'BOOKING_FAILURE',
      'OPEN',
      'Journey for ' || NEW.customer_name || ' has failed. Immediate attention required.'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_alert_on_journey_failure ON journeys;
CREATE TRIGGER create_alert_on_journey_failure
  AFTER UPDATE ON journeys
  FOR EACH ROW
  WHEN (NEW.status = 'FAILED')
  EXECUTE FUNCTION trigger_create_alert_on_failure();

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-calculate and update risk level on money exposure
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_risk_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate risk level using the backend function
  NEW.risk_level := calculate_risk_level(
    NEW.confirmed_amount,
    NEW.pending_amount,
    NEW.customer_budget
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_risk_level ON money_exposure;
CREATE TRIGGER update_risk_level
  BEFORE INSERT OR UPDATE ON money_exposure
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_risk_level();

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-create money exposure record when journey is created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_create_money_exposure()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create for non-DRAFT journeys
  IF NEW.status != 'DRAFT' THEN
    INSERT INTO money_exposure (
      journey_id,
      confirmed_amount,
      pending_amount,
      risk_level
    ) VALUES (
      NEW.id,
      0,
      COALESCE(NEW.total_cost, 0),
      'LOW'
    )
    ON CONFLICT (journey_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_money_exposure ON journeys;
CREATE TRIGGER create_money_exposure
  AFTER INSERT OR UPDATE ON journeys
  FOR EACH ROW
  WHEN (NEW.status != 'DRAFT')
  EXECUTE FUNCTION trigger_create_money_exposure();

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-update money exposure when journey items change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_money_exposure()
RETURNS TRIGGER AS $$
DECLARE
  v_confirmed_total NUMERIC;
  v_pending_total NUMERIC;
BEGIN
  -- Calculate totals from journey items
  SELECT
    COALESCE(SUM(cost) FILTER (WHERE status = 'CONFIRMED'), 0),
    COALESCE(SUM(cost) FILTER (WHERE status = 'PENDING'), 0)
  INTO v_confirmed_total, v_pending_total
  FROM journey_items
  WHERE journey_id = COALESCE(NEW.journey_id, OLD.journey_id);
  
  -- Update money exposure
  UPDATE money_exposure
  SET
    confirmed_amount = v_confirmed_total,
    pending_amount = v_pending_total
  WHERE journey_id = COALESCE(NEW.journey_id, OLD.journey_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_money_exposure_on_items ON journey_items;
CREATE TRIGGER update_money_exposure_on_items
  AFTER INSERT OR UPDATE OR DELETE ON journey_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_money_exposure();

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-create incident for high-risk journeys
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_create_high_risk_incident()
RETURNS TRIGGER AS $$
BEGIN
  -- Create incident if risk level is HIGH and journey is not already cancelled
  IF NEW.risk_level = 'HIGH' AND (OLD.risk_level IS NULL OR OLD.risk_level != 'HIGH') THEN
    -- Check if journey is active
    IF EXISTS (
      SELECT 1 FROM journeys 
      WHERE id = NEW.journey_id 
      AND status NOT IN ('CANCELLED', 'CONFIRMED')
    ) THEN
      INSERT INTO incidents (
        incident_type,
        status,
        description
      ) VALUES (
        'PRICE_SPIKE',
        'OPEN',
        'High risk exposure detected for journey ' || NEW.journey_id::TEXT || 
        '. Total exposure: $' || (NEW.confirmed_amount + NEW.pending_amount)::TEXT
      );
      
      -- Also create an admin notification
      INSERT INTO admin_notifications (
        incident_id,
        message,
        status
      )
      SELECT
        i.id,
        'HIGH RISK ALERT: Journey ' || NEW.journey_id::TEXT || ' requires immediate review',
        'SENT'
      FROM incidents i
      WHERE i.incident_type = 'PRICE_SPIKE'
      ORDER BY i.created_at DESC
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_high_risk_incident ON money_exposure;
CREATE TRIGGER create_high_risk_incident
  AFTER INSERT OR UPDATE ON money_exposure
  FOR EACH ROW
  WHEN (NEW.risk_level = 'HIGH')
  EXECUTE FUNCTION trigger_create_high_risk_incident();

-- -----------------------------------------------------------------------------
-- TRIGGER: Set resolved_at timestamp when alert is resolved
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'RESOLVED' AND (OLD.status IS NULL OR OLD.status != 'RESOLVED') THEN
    NEW.resolved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_alert_resolved_at ON ops_alerts;
CREATE TRIGGER set_alert_resolved_at
  BEFORE UPDATE ON ops_alerts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_resolved_at();

DROP TRIGGER IF EXISTS set_incident_resolved_at ON incidents;
CREATE TRIGGER set_incident_resolved_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_resolved_at();

-- -----------------------------------------------------------------------------
-- TRIGGER: Notify admin when incident is created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_notify_admin_on_incident()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    incident_id,
    message,
    status
  ) VALUES (
    NEW.id,
    'New incident: ' || NEW.incident_type || ' - ' || COALESCE(NEW.description, 'No description'),
    'SENT'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_admin_on_incident ON incidents;
CREATE TRIGGER notify_admin_on_incident
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_admin_on_incident();

-- -----------------------------------------------------------------------------
-- TRIGGER: Update journey total_cost when items change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_update_journey_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_total_cost NUMERIC;
BEGIN
  -- Calculate total cost from all journey items
  SELECT COALESCE(SUM(cost), 0)
  INTO v_total_cost
  FROM journey_items
  WHERE journey_id = COALESCE(NEW.journey_id, OLD.journey_id);
  
  -- Update journey total cost
  UPDATE journeys
  SET total_cost = v_total_cost
  WHERE id = COALESCE(NEW.journey_id, OLD.journey_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_journey_cost ON journey_items;
CREATE TRIGGER update_journey_cost
  AFTER INSERT OR UPDATE OR DELETE ON journey_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_journey_cost();

-- =============================================================================
-- TRIGGER DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on record modification';
COMMENT ON FUNCTION trigger_create_alert_on_failure IS 'Creates ops alert when journey status changes to FAILED';
COMMENT ON FUNCTION trigger_update_risk_level IS 'Automatically calculates and updates risk level based on exposure';
COMMENT ON FUNCTION trigger_create_money_exposure IS 'Creates money exposure record when journey moves from DRAFT status';
COMMENT ON FUNCTION trigger_update_money_exposure IS 'Updates money exposure when journey items are modified';
COMMENT ON FUNCTION trigger_create_high_risk_incident IS 'Creates incident and admin notification for high-risk journeys';
COMMENT ON FUNCTION trigger_set_resolved_at IS 'Sets resolved_at timestamp when status changes to RESOLVED';
COMMENT ON FUNCTION trigger_notify_admin_on_incident IS 'Creates admin notification when new incident occurs';
COMMENT ON FUNCTION trigger_update_journey_cost IS 'Updates journey total_cost when items are added/modified/removed';
