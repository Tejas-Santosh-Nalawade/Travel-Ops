-- =====================================================
-- DEMO DATA FOR ROLLBACK ENGINE SIMULATION
-- =====================================================
-- This creates realistic demo data for judges to see the system working
-- Run this AFTER running SUPABASE_SETUP.sql

-- =====================================================
-- PART 1: CREATE SAMPLE CUSTOMERS AND JOURNEYS
-- =====================================================

-- Insert sample customers if they don't exist
INSERT INTO customers (id, full_name, email, phone_number, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Rajesh Kumar', 'rajesh@example.com', '+919876543210', NOW() - INTERVAL '30 days'),
    ('22222222-2222-2222-2222-222222222222', 'Priya Sharma', 'priya@example.com', '+919876543211', NOW() - INTERVAL '25 days'),
    ('33333333-3333-3333-3333-333333333333', 'Amit Patel', 'amit@example.com', '+919876543212', NOW() - INTERVAL '20 days'),
    ('44444444-4444-4444-4444-444444444444', 'Sanjana Reddy', 'sanjana@example.com', '+919876543213', NOW() - INTERVAL '15 days'),
    ('55555555-5555-5555-5555-555555555555', 'Vikram Singh', 'vikram@example.com', '+919876543214', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Insert sample journeys
INSERT INTO journeys (id, customer_id, destination, start_date, end_date, total_price, status, created_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mumbai → Goa', NOW() + INTERVAL '10 days', NOW() + INTERVAL '15 days', 45000, 'CONFIRMED', NOW() - INTERVAL '5 days'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Delhi → Jaipur → Agra', NOW() + INTERVAL '20 days', NOW() + INTERVAL '27 days', 65000, 'CONFIRMED', NOW() - INTERVAL '4 days'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Bangalore → Mysore', NOW() + INTERVAL '15 days', NOW() + INTERVAL '18 days', 28000, 'CONFIRMED', NOW() - INTERVAL '3 days'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Chennai → Pondicherry', NOW() + INTERVAL '25 days', NOW() + INTERVAL '28 days', 32000, 'CONFIRMED', NOW() - INTERVAL '2 days'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'Kochi → Munnar', NOW() + INTERVAL '30 days', NOW() + INTERVAL '35 days', 52000, 'CONFIRMED', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: TRANSACTION SCENARIOS - DIFFERENT STATES
-- =====================================================

-- Scenario 1: SUCCESSFUL TRANSACTION (Completed)
INSERT INTO distributed_transactions (
    id, transaction_id, journey_id, customer_id, booking_reference, status,
    total_steps, completed_steps, failed_steps, total_amount, amount_committed,
    started_at, completed_at, idempotency_key, created_at
)
VALUES (
    'tx111111-1111-1111-1111-111111111111',
    'TXN-2024-001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'BOOK-45000-001',
    'completed',
    5, 5, 0,
    45000, 45000,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 30 minutes',
    'idem-tx-001',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Steps for successful transaction
INSERT INTO transaction_steps (transaction_id, step_number, step_type, step_name, status, operation_data, operation_result, started_at, completed_at, duration_ms)
VALUES
    ('tx111111-1111-1111-1111-111111111111', 1, 'flight_booking', 'Book Mumbai to Goa Flight', 'completed', '{"airline":"IndiGo","flight":"6E-501"}', '{"pnr":"ABC123","status":"confirmed"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes', 3000),
    ('tx111111-1111-1111-1111-111111111111', 2, 'hotel_booking', 'Book Goa Resort', 'completed', '{"hotel":"Taj Exotica","room":"Deluxe"}', '{"booking_id":"HTL456","status":"confirmed"}', NOW() - INTERVAL '1 hour 55 minutes', NOW() - INTERVAL '1 hour 50 minutes', 5000),
    ('tx111111-1111-1111-1111-111111111111', 3, 'payment_processing', 'Process Payment', 'completed', '{"amount":45000,"method":"credit_card"}', '{"transaction_id":"PAY789","status":"success"}', NOW() - INTERVAL '1 hour 50 minutes', NOW() - INTERVAL '1 hour 45 minutes', 2000),
    ('tx111111-1111-1111-1111-111111111111', 4, 'notification_send', 'Send Confirmation Email', 'completed', '{"email":"rajesh@example.com"}', '{"message_id":"MSG001","sent":true}', NOW() - INTERVAL '1 hour 45 minutes', NOW() - INTERVAL '1 hour 40 minutes', 1000),
    ('tx111111-1111-1111-1111-111111111111', 5, 'loyalty_points_deduct', 'Deduct Loyalty Points', 'completed', '{"points":500}', '{"new_balance":2000}', NOW() - INTERVAL '1 hour 40 minutes', NOW() - INTERVAL '1 hour 30 minutes', 500)
ON CONFLICT (transaction_id, step_number) DO NOTHING;

-- Scenario 2: FAILED TRANSACTION REQUIRING ROLLBACK
INSERT INTO distributed_transactions (
    id, transaction_id, journey_id, customer_id, booking_reference, status,
    total_steps, completed_steps, failed_steps, total_amount, amount_committed, amount_refunded,
    started_at, failed_at, error_message, error_step_id, compensation_started_at, idempotency_key, created_at
)
VALUES (
    'tx222222-2222-2222-2222-222222222222',
    'TXN-2024-002',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'BOOK-65000-002',
    'compensating',
    6, 3, 1,
    65000, 30000, 0,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '45 minutes',
    'Hotel booking failed - No availability',
    'step-tx2-4',
    NOW() - INTERVAL '40 minutes',
    'idem-tx-002',
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- Steps for failed transaction (showing compensation in progress)
INSERT INTO transaction_steps (transaction_id, step_number, step_type, step_name, status, operation_data, operation_result, started_at, completed_at, compensation_started_at, error_message, duration_ms)
VALUES
    ('tx222222-2222-2222-2222-222222222222', 1, 'flight_booking', 'Book Delhi to Jaipur Flight', 'compensating', '{"airline":"SpiceJet","flight":"SG-101"}', '{"pnr":"DEF456","status":"confirmed"}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '40 minutes', NULL, 4000),
    ('tx222222-2222-2222-2222-222222222222', 2, 'hotel_booking', 'Book Jaipur Hotel', 'compensating', '{"hotel":"ITC Rajputana","room":"Suite"}', '{"booking_id":"HTL789","status":"confirmed"}', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '52 minutes', NOW() - INTERVAL '38 minutes', NULL, 3000),
    ('tx222222-2222-2222-2222-222222222222', 3, 'payment_processing', 'Process Payment', 'compensated', '{"amount":30000,"method":"debit_card"}', '{"transaction_id":"PAY321","status":"success"}', NOW() - INTERVAL '52 minutes', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '38 minutes', NULL, 2000),
    ('tx222222-2222-2222-2222-222222222222', 4, 'hotel_booking', 'Book Agra Hotel', 'failed', '{"hotel":"Taj Hotel","room":"Deluxe"}', NULL, NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '45 minutes', NULL, 'No rooms available for selected dates', 5000),
    ('tx222222-2222-2222-2222-222222222222', 5, 'transport_booking', 'Book Taxi Jaipur-Agra', 'pending', '{"type":"taxi","route":"Jaipur-Agra"}', NULL, NULL, NULL, NULL, NULL, NULL),
    ('tx222222-2222-2222-2222-222222222222', 6, 'notification_send', 'Send Confirmation', 'pending', '{"email":"priya@example.com"}', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (transaction_id, step_number) DO NOTHING;

-- Compensation actions for failed transaction
INSERT INTO compensation_actions (id, action_number, transaction_id, step_id, action_type, action_description, status, started_at, completed_at, success, duration_ms)
SELECT
    gen_random_uuid(),
    'COMP-TX2-' || step_number::text,
    transaction_id,
    id,
    'refund_' || step_type::text,
    'Rollback: ' || step_name,
    CASE
        WHEN step_number = 3 THEN 'completed'
        ELSE 'in_progress'
    END,
    NOW() - INTERVAL '38 minutes',
    CASE
        WHEN step_number = 3 THEN NOW() - INTERVAL '35 minutes'
        ELSE NULL
    END,
    CASE
        WHEN step_number = 3 THEN true
        ELSE NULL
    END,
    CASE
        WHEN step_number = 3 THEN 3000
        ELSE NULL
    END
FROM transaction_steps
WHERE transaction_id = 'tx222222-2222-2222-2222-222222222222'
AND step_number IN (1, 2, 3)
ON CONFLICT DO NOTHING;

-- Scenario 3: IN PROGRESS TRANSACTION
INSERT INTO distributed_transactions (
    id, transaction_id, journey_id, customer_id, booking_reference, status,
    total_steps, completed_steps, failed_steps, total_amount, amount_committed,
    started_at, idempotency_key, created_at
)
VALUES (
    'tx333333-3333-3333-3333-333333333333',
    'TXN-2024-003',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'BOOK-28000-003',
    'in_progress',
    4, 2, 0,
    28000, 15000,
    NOW() - INTERVAL '15 minutes',
    'idem-tx-003',
    NOW() - INTERVAL '15 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- Steps for in-progress transaction
INSERT INTO transaction_steps (transaction_id, step_number, step_type, step_name, status, operation_data, operation_result, started_at, completed_at, duration_ms)
VALUES
    ('tx333333-3333-3333-3333-333333333333', 1, 'hotel_booking', 'Book Bangalore Hotel', 'completed', '{"hotel":"Leela Palace","room":"Executive"}', '{"booking_id":"HTL111","status":"confirmed"}', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '12 minutes', 3000),
    ('tx333333-3333-3333-3333-333333333333', 2, 'transport_booking', 'Book Bangalore-Mysore Cab', 'completed', '{"type":"cab","route":"BLR-MYS"}', '{"booking_id":"CAB222","driver":"Raj Kumar"}', NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '10 minutes', 2000),
    ('tx333333-3333-3333-3333-333333333333', 3, 'payment_processing', 'Process Payment', 'executing', '{"amount":28000,"method":"upi"}', NULL, NOW() - INTERVAL '10 minutes', NULL, NULL),
    ('tx333333-3333-3333-3333-333333333333', 4, 'notification_send', 'Send Confirmation', 'pending', '{"email":"amit@example.com"}', NULL, NULL, NULL, NULL)
ON CONFLICT (transaction_id, step_number) DO NOTHING;

-- Scenario 4: DEAD LETTER QUEUE ITEM (Compensation Failed)
INSERT INTO distributed_transactions (
    id, transaction_id, journey_id, customer_id, booking_reference, status,
    total_steps, completed_steps, failed_steps, total_amount, amount_committed,
    started_at, failed_at, error_message, compensation_started_at, idempotency_key, created_at
)
VALUES (
    'tx444444-4444-4444-4444-444444444444',
    'TXN-2024-004',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    'BOOK-32000-004',
    'compensating',
    5, 4, 1,
    32000, 32000,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 30 minutes',
    'Payment gateway timeout',
    NOW() - INTERVAL '2 hours',
    'idem-tx-004',
    NOW() - INTERVAL '3 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Steps with compensation failure
INSERT INTO transaction_steps (id, transaction_id, step_number, step_type, step_name, status, operation_data, operation_result, started_at, completed_at, compensation_started_at, compensation_error, error_message, duration_ms)
VALUES
    ('step-tx4-1', 'tx444444-4444-4444-4444-444444444444', 1, 'flight_booking', 'Book Chennai Flight', 'compensated', '{"airline":"Air India","flight":"AI-201"}', '{"pnr":"GHI789"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 50 minutes', NOW() - INTERVAL '2 hours', NULL, NULL, 4000),
    ('step-tx4-2', 'tx444444-4444-4444-4444-444444444444', 2, 'hotel_booking', 'Book Pondicherry Hotel', 'compensation_failed', '{"hotel":"Le Dupleix","room":"Heritage"}', '{"booking_id":"HTL333"}', NOW() - INTERVAL '2 hours 50 minutes', NOW() - INTERVAL '2 hours 45 minutes', NOW() - INTERVAL '1 hour 50 minutes', 'Hotel booking system offline', NULL, 5000),
    ('step-tx4-3', 'tx444444-4444-4444-4444-444444444444', 3, 'transport_booking', 'Book Local Transport', 'compensated', '{"type":"rental","vehicle":"sedan"}', '{"booking_id":"CAR444"}', NOW() - INTERVAL '2 hours 45 minutes', NOW() - INTERVAL '2 hours 40 minutes', NOW() - INTERVAL '1 hour 45 minutes', NULL, NULL, 3000),
    ('step-tx4-4', 'tx444444-4444-4444-4444-444444444444', 4, 'payment_processing', 'Process Payment', 'completed', '{"amount":32000,"method":"netbanking"}', '{"transaction_id":"PAY444","status":"success"}', NOW() - INTERVAL '2 hours 40 minutes', NOW() - INTERVAL '2 hours 35 minutes', NULL, NULL, NULL, 2000),
    ('step-tx4-5', 'tx444444-4444-4444-4444-444444444444', 5, 'notification_send', 'Send Email', 'failed', '{"email":"sanjana@example.com"}', NULL, NOW() - INTERVAL '2 hours 35 minutes', NOW() - INTERVAL '2 hours 30 minutes', NULL, NULL, 'Email service timeout', 5000)
ON CONFLICT (id) DO NOTHING;

-- Add to Dead Letter Queue
INSERT INTO rollback_dead_letter_queue (id, dlq_id, transaction_id, step_id, failure_reason, attempts_made, last_attempt_at, resolution_status, created_at, escalated, escalated_at)
VALUES (
    'dlq11111-1111-1111-1111-111111111111',
    'DLQ-2024-001',
    'tx444444-4444-4444-4444-444444444444',
    'step-tx4-2',
    'Hotel booking system is offline. Cannot cancel reservation automatically. Manual intervention required to contact hotel.',
    5,
    NOW() - INTERVAL '30 minutes',
    'pending',
    NOW() - INTERVAL '1 hour 50 minutes',
    true,
    NOW() - INTERVAL '45 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- Scenario 5: ANOTHER DLQ ITEM (Recent)
INSERT INTO distributed_transactions (
    id, transaction_id, journey_id, customer_id, booking_reference, status,
    total_steps, completed_steps, failed_steps, total_amount,
    started_at, failed_at, compensation_started_at, idempotency_key, created_at
)
VALUES (
    'tx555555-5555-5555-5555-555555555555',
    'TXN-2024-005',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '55555555-5555-5555-5555-555555555555',
    'BOOK-52000-005',
    'compensating',
    4, 3, 1,
    52000,
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '25 minutes',
    'idem-tx-005',
    NOW() - INTERVAL '45 minutes'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_steps (id, transaction_id, step_number, step_type, step_name, status, compensation_started_at, compensation_error, created_at)
VALUES
    ('step-tx5-1', 'tx555555-5555-5555-5555-555555555555', 1, 'payment_processing', 'Process Payment', 'compensation_failed', NOW() - INTERVAL '20 minutes', 'Payment gateway returned error: REFUND_LIMIT_EXCEEDED', NOW() - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rollback_dead_letter_queue (id, dlq_id, transaction_id, step_id, failure_reason, attempts_made, last_attempt_at, resolution_status, created_at)
VALUES (
    'dlq22222-2222-2222-2222-222222222222',
    'DLQ-2024-002',
    'tx555555-5555-5555-5555-555555555555',
    'step-tx5-1',
    'Payment refund failed: Daily refund limit exceeded on payment gateway. Will retry tomorrow or process manual refund.',
    3,
    NOW() - INTERVAL '10 minutes',
    'pending',
    NOW() - INTERVAL '20 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 3: EVENT LOGS FOR TRACEABILITY
-- =====================================================

-- Create sequence for event IDs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM transaction_event_log LIMIT 1) THEN
        INSERT INTO transaction_event_log (event_id, transaction_id, event_type, event_category, event_message, severity, created_at)
        SELECT
            'EVT-' || TO_CHAR(generate_series, 'FM00000'),
            CASE
                WHEN generate_series % 5 = 1 THEN 'tx111111-1111-1111-1111-111111111111'
                WHEN generate_series % 5 = 2 THEN 'tx222222-2222-2222-2222-222222222222'
                WHEN generate_series % 5 = 3 THEN 'tx333333-3333-3333-3333-333333333333'
                WHEN generate_series % 5 = 4 THEN 'tx444444-4444-4444-4444-444444444444'
                ELSE 'tx555555-5555-5555-5555-555555555555'
            END,
            CASE
                WHEN generate_series % 4 = 0 THEN 'transaction_start'
                WHEN generate_series % 4 = 1 THEN 'step_completed'
                WHEN generate_series % 4 = 2 THEN 'compensation_start'
                ELSE 'step_failed'
            END,
            'transaction',
            'Event log entry #' || generate_series,
            CASE
                WHEN generate_series % 3 = 0 THEN 'error'
                WHEN generate_series % 3 = 1 THEN 'warning'
                ELSE 'info'
            END,
            NOW() - (generate_series || ' minutes')::INTERVAL
        FROM generate_series(1, 20);
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check transaction counts by status
SELECT
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM distributed_transactions
GROUP BY status
ORDER BY status;

-- Check DLQ items
SELECT
    dlq_id,
    failure_reason,
    attempts_made,
    resolution_status,
    escalated
FROM rollback_dead_letter_queue
ORDER BY created_at DESC;

-- Success!
SELECT
    '✅ Demo data loaded successfully!' as message,
    '🎯 5 transactions created (1 completed, 1 compensating, 1 in_progress, 2 with DLQ)' as details,
    '📊 Check the Operations Dashboard to see them!' as action;
