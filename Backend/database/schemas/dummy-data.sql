-- ============================================
-- TRAVELOPS - DUMMY DATA FOR TESTING
-- ============================================
-- Run this in your Supabase SQL Editor to populate test data
-- Make sure to replace 'YOUR_USER_ID' with your actual user ID from auth.users

-- ============================================
-- FIRST: ADD UNIQUE CONSTRAINT IF MISSING
-- ============================================
-- Add unique constraint on journey_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'money_exposure_journey_id_key'
  ) THEN
    ALTER TABLE money_exposure 
    ADD CONSTRAINT money_exposure_journey_id_key UNIQUE (journey_id);
  END IF;
END $$;

-- ============================================
-- SECOND: UPDATE TRIGGER TO FIX customer_budget ERROR
-- ============================================
-- Drop the old trigger first
DROP TRIGGER IF EXISTS create_money_exposure ON journeys;

-- Replace the function without customer_budget column and without ON CONFLICT
CREATE OR REPLACE FUNCTION trigger_create_money_exposure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'DRAFT' THEN
    -- Check if record already exists before inserting
    IF NOT EXISTS (SELECT 1 FROM money_exposure WHERE journey_id = NEW.id) THEN
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
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER create_money_exposure
  AFTER INSERT OR UPDATE ON journeys
  FOR EACH ROW
  WHEN (NEW.status != 'DRAFT')
  EXECUTE FUNCTION trigger_create_money_exposure();

-- ============================================
-- JOURNEYS - Sample bookings with various statuses
-- ============================================
INSERT INTO journeys (id, customer_name, created_by, status, total_cost) VALUES
-- Confirmed journeys
('11111111-1111-1111-1111-111111111111', 'John Smith', (SELECT id FROM auth.users LIMIT 1), 'CONFIRMED', 456500.00),
('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', (SELECT id FROM auth.users LIMIT 1), 'CONFIRMED', 265600.00),
('33333333-3333-3333-3333-333333333333', 'Michael Chen', (SELECT id FROM auth.users LIMIT 1), 'CONFIRMED', 647400.00),

-- Failed journeys (need ops attention)
('44444444-4444-4444-4444-444444444444', 'Emily Brown', (SELECT id FROM auth.users LIMIT 1), 'FAILED', 373500.00),
('55555555-5555-5555-5555-555555555555', 'David Wilson', (SELECT id FROM auth.users LIMIT 1), 'FAILED', 514600.00),

-- On hold journeys
('66666666-6666-6666-6666-666666666666', 'Lisa Anderson', (SELECT id FROM auth.users LIMIT 1), 'ON_HOLD', 423300.00),
('77777777-7777-7777-7777-777777777777', 'Robert Taylor', (SELECT id FROM auth.users LIMIT 1), 'ON_HOLD', 738700.00),

-- Pending journeys
('88888888-8888-8888-8888-888888888888', 'Jennifer Martinez', (SELECT id FROM auth.users LIMIT 1), 'PENDING', 348600.00),
('99999999-9999-9999-9999-999999999999', 'James Lee', (SELECT id FROM auth.users LIMIT 1), 'PENDING', 315400.00),

-- Draft journeys
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Amanda White', (SELECT id FROM auth.users LIMIT 1), 'DRAFT', 207500.00);

-- ============================================
-- JOURNEY ITEMS - Flights, hotels, transfers
-- ============================================
INSERT INTO journey_items (journey_id, type, status, cost, supplier_id, details) VALUES
-- Items for Journey 1 (John Smith - Confirmed)
('11111111-1111-1111-1111-111111111111', 'FLIGHT', 'CONFIRMED', 232400.00, 'AIRLINE_AA', '{"flight": "AA100", "from": "JFK", "to": "CDG", "date": "2026-03-15"}'),
('11111111-1111-1111-1111-111111111111', 'FLIGHT', 'CONFIRMED', 124500.00, 'AIRLINE_BA', '{"flight": "BA200", "from": "CDG", "to": "LHR", "date": "2026-03-20"}'),
('11111111-1111-1111-1111-111111111111', 'HOTEL', 'CONFIRMED', 83000.00, 'HOTEL_HILTON', '{"hotel": "Hilton Paris", "nights": 5, "room": "deluxe"}'),
('11111111-1111-1111-1111-111111111111', 'TRANSFER', 'CONFIRMED', 16600.00, 'UBER', '{"type": "airport_transfer", "city": "Paris"}'),

-- Items for Journey 2 (Sarah Johnson - Confirmed)
('22222222-2222-2222-2222-222222222222', 'FLIGHT', 'CONFIRMED', 149400.00, 'AIRLINE_UA', '{"flight": "UA500", "from": "LAX", "to": "NRT", "date": "2026-04-01"}'),
('22222222-2222-2222-2222-222222222222', 'HOTEL', 'CONFIRMED', 99600.00, 'HOTEL_HYATT', '{"hotel": "Hyatt Tokyo", "nights": 9, "room": "standard"}'),
('22222222-2222-2222-2222-222222222222', 'TRANSFER', 'CONFIRMED', 16600.00, 'LOCAL_TAXI', '{"type": "airport_transfer", "city": "Tokyo"}'),

-- Items for Journey 4 (Emily Brown - FAILED)
('44444444-4444-4444-4444-444444444444', 'FLIGHT', 'FAILED', 182600.00, 'AIRLINE_IB', '{"flight": "IB300", "from": "BOS", "to": "BCN", "date": "2026-03-20", "error": "No availability"}'),
('44444444-4444-4444-4444-444444444444', 'HOTEL', 'PENDING', 149400.00, 'HOTEL_MARRIOTT', '{"hotel": "Marriott Barcelona", "nights": 8}'),
('44444444-4444-4444-4444-444444444444', 'TRANSFER', 'PENDING', 41500.00, 'CAR_RENTAL', '{"type": "car_rental", "days": 8}'),

-- Items for Journey 5 (David Wilson - FAILED)
('55555555-5555-5555-5555-555555555555', 'FLIGHT', 'FAILED', 290500.00, 'AIRLINE_AI', '{"flight": "AI800", "from": "ORD", "to": "BOM", "date": "2026-04-15", "error": "Payment declined"}'),
('55555555-5555-5555-5555-555555555555', 'FLIGHT', 'PENDING', 124500.00, 'AIRLINE_TG', '{"flight": "TG900", "from": "BOM", "to": "BKK", "date": "2026-04-20"}'),
('55555555-5555-5555-5555-555555555555', 'HOTEL', 'PENDING', 99600.00, 'HOTEL_TAJ', '{"hotel": "Taj Mumbai", "nights": 5}'),

-- Items for Journey 6 (Lisa Anderson - ON_HOLD)
('66666666-6666-6666-6666-666666666666', 'FLIGHT', 'PENDING', 232400.00, 'AIRLINE_DL', '{"flight": "DL400", "from": "SEA", "to": "AMS", "date": "2026-05-01"}'),
('66666666-6666-6666-6666-666666666666', 'HOTEL', 'PENDING', 166000.00, 'HOTEL_NH', '{"hotel": "NH Amsterdam", "nights": 11}'),
('66666666-6666-6666-6666-666666666666', 'TRANSFER', 'PENDING', 24900.00, 'TAXI_SERVICE', '{"type": "airport_transfer"}');

-- ============================================
-- MONEY EXPOSURE - Financial risk tracking
-- ============================================
INSERT INTO money_exposure (journey_id, confirmed_amount, pending_amount, risk_level) VALUES
('11111111-1111-1111-1111-111111111111', 456500.00, 0.00, 'LOW'),
('22222222-2222-2222-2222-222222222222', 265600.00, 0.00, 'LOW'),
('33333333-3333-3333-3333-333333333333', 647400.00, 0.00, 'MEDIUM'),
('44444444-4444-4444-4444-444444444444', 0.00, 373500.00, 'HIGH'),
('55555555-5555-5555-5555-555555555555', 0.00, 514600.00, 'HIGH'),
('66666666-6666-6666-6666-666666666666', 0.00, 423300.00, 'MEDIUM'),
('77777777-7777-7777-7777-777777777777', 0.00, 738700.00, 'HIGH'),
('88888888-8888-8888-8888-888888888888', 99600.00, 249000.00, 'LOW'),
('99999999-9999-9999-9999-999999999999', 124500.00, 190900.00, 'LOW');

-- ============================================
-- OPS ALERTS - Active booking issues
-- ============================================
INSERT INTO ops_alerts (journey_id, alert_type, status, message) VALUES
('44444444-4444-4444-4444-444444444444', 'BOOKING_FAILURE', 'OPEN', 'Flight booking failed - no available seats on preferred route'),
('55555555-5555-5555-5555-555555555555', 'BOOKING_FAILURE', 'IN_PROGRESS', 'Payment gateway timeout - retrying transaction'),
('66666666-6666-6666-6666-666666666666', 'PRICE_SPIKE', 'OPEN', 'Hotel prices increased 40% since quote - customer approval needed'),
('77777777-7777-7777-7777-777777777777', 'PRICE_SPIKE', 'OPEN', 'Flight prices surged due to high demand - awaiting customer confirmation'),
('88888888-8888-8888-8888-888888888888', 'SUPPLIER_OUTAGE', 'IN_PROGRESS', 'Hotel booking system down - booking on hold'),
('22222222-2222-2222-2222-222222222222', 'BOOKING_FAILURE', 'RESOLVED', 'Transfer booking initially failed but successfully rebooked');

-- ============================================
-- OPS DECISIONS - Historical decisions
-- ============================================
INSERT INTO ops_decisions (journey_id, decision, decided_by, notes) VALUES
('44444444-4444-4444-4444-444444444444', 'REPLACE', (SELECT id FROM auth.users LIMIT 1), 'Booking alternative airline due to availability issue'),
('55555555-5555-5555-5555-555555555555', 'RETRY', (SELECT id FROM auth.users LIMIT 1), 'Retrying payment with backup payment gateway'),
('66666666-6666-6666-6666-666666666666', 'HOLD', (SELECT id FROM auth.users LIMIT 1), 'Waiting for customer approval on price increase'),
('22222222-2222-2222-2222-222222222222', 'RETRY', (SELECT id FROM auth.users LIMIT 1), 'Successfully rebooked transfer after initial failure'),
('11111111-1111-1111-1111-111111111111', 'REPLACE', (SELECT id FROM auth.users LIMIT 1), 'Upgraded hotel due to original property overbooking');

-- ============================================
-- INCIDENTS - System-wide issues
-- ============================================
INSERT INTO incidents (incident_type, status, description) VALUES
('SUPPLIER_OUTAGE', 'OPEN', 'Major airline booking system experiencing intermittent outages'),
('PAYMENT_FAILURE', 'MITIGATING', 'Primary payment gateway having latency issues - switched to backup'),
('PRICE_SPIKE', 'OPEN', 'Hotels in European markets showing 35% average price increase for summer season'),
('SYSTEM_DEGRADATION', 'RESOLVED', 'Database performance issues resolved - query optimization applied'),
('SUPPLIER_OUTAGE', 'RESOLVED', 'Hotel chain API was down for 2 hours - now restored');

-- ============================================
-- OPS ACTIONS - Action history
-- ============================================
INSERT INTO ops_actions (journey_id, action, status, executed_by) VALUES
('44444444-4444-4444-4444-444444444444', 'Search alternative flights', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('44444444-4444-4444-4444-444444444444', 'Send customer notification', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('55555555-5555-5555-5555-555555555555', 'Retry payment processing', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('55555555-5555-5555-5555-555555555555', 'Switch to backup gateway', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('66666666-6666-6666-6666-666666666666', 'Request customer approval', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('22222222-2222-2222-2222-222222222222', 'Rebook transfer service', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1)),
('11111111-1111-1111-1111-111111111111', 'Upgrade hotel booking', 'SUCCESS', (SELECT id FROM auth.users LIMIT 1));

-- ============================================
-- ADMIN NOTIFICATIONS
-- ============================================
INSERT INTO admin_notifications (incident_id, message, status) VALUES
((SELECT id FROM incidents WHERE incident_type = 'SUPPLIER_OUTAGE' AND status = 'OPEN' LIMIT 1), 
 'CRITICAL: Major airline booking system outage detected - 12 bookings affected', 'SENT'),
((SELECT id FROM incidents WHERE incident_type = 'PAYMENT_FAILURE' AND status = 'MITIGATING' LIMIT 1), 
 'WARNING: Payment gateway experiencing delays - backup activated', 'ACKNOWLEDGED'),
((SELECT id FROM incidents WHERE incident_type = 'PRICE_SPIKE' AND status = 'OPEN' LIMIT 1), 
 'NOTICE: Significant price increases detected across European hotel market', 'SENT');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data was inserted correctly:

-- SELECT COUNT(*) as total_journeys FROM journeys;
-- SELECT status, COUNT(*) FROM journeys GROUP BY status ORDER BY status;
-- SELECT COUNT(*) as total_alerts FROM ops_alerts WHERE status IN ('OPEN', 'IN_PROGRESS');
-- SELECT COUNT(*) as total_incidents FROM incidents WHERE status IN ('OPEN', 'MITIGATING');
-- SELECT risk_level, COUNT(*) FROM money_exposure GROUP BY risk_level ORDER BY risk_level;
-- SELECT SUM(pending_amount + confirmed_amount) as total_exposure FROM money_exposure;
