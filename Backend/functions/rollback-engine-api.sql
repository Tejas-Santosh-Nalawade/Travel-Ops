-- =====================================================
-- ROLLBACK ENGINE API FUNCTIONS
-- =====================================================
-- Complete transactional integrity with automatic compensation
-- =====================================================

-- ============================================
-- 1. CREATE DISTRIBUTED TRANSACTION
-- ============================================
CREATE OR REPLACE FUNCTION create_distributed_transaction(
    p_journey_id UUID,
    p_customer_id UUID,
    p_total_amount DECIMAL,
    p_steps JSONB, -- Array of step definitions
    p_idempotency_key VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_number TEXT,
    status TEXT,
    total_steps INTEGER,
    message TEXT
) AS $$
DECLARE
    v_txn_id UUID;
    v_txn_number TEXT;
    v_step JSONB;
    v_step_num INTEGER := 1;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, transaction_id INTO v_txn_id, v_txn_number
        FROM distributed_transactions
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN QUERY SELECT
                v_txn_id,
                v_txn_number,
                'already_exists'::TEXT,
                0,
                'Transaction already exists with this idempotency key'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Create transaction
    INSERT INTO distributed_transactions (
        journey_id,
        customer_id,
        total_amount,
        total_steps,
        status,
        idempotency_key,
        created_by
    ) VALUES (
        p_journey_id,
        p_customer_id,
        p_total_amount,
        jsonb_array_length(p_steps),
        'initiated',
        p_idempotency_key,
        COALESCE(current_setting('app.current_user_id', TRUE)::UUID, p_customer_id)
    )
    RETURNING id, transaction_id INTO v_txn_id, v_txn_number;

    -- Create transaction steps
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_steps)
    LOOP
        INSERT INTO transaction_steps (
            transaction_id,
            step_number,
            step_type,
            step_name,
            operation_data,
            compensation_handler,
            compensation_data,
            depends_on_steps,
            max_retries
        ) VALUES (
            v_txn_id,
            v_step_num,
            (v_step->>'step_type')::transaction_step_type,
            v_step->>'step_name',
            v_step->'operation_data',
            v_step->>'compensation_handler',
            v_step->'compensation_data',
            CASE WHEN v_step->'depends_on_steps' IS NOT NULL
                THEN ARRAY(SELECT jsonb_array_elements_text(v_step->'depends_on_steps'))::INTEGER[]
                ELSE NULL
            END,
            COALESCE((v_step->>'max_retries')::INTEGER, 3)
        );

        v_step_num := v_step_num + 1;
    END LOOP;

    -- Log event
    INSERT INTO transaction_event_log (
        transaction_id,
        event_type,
        event_category,
        event_message,
        severity,
        source
    ) VALUES (
        v_txn_id,
        'transaction_created',
        'execution',
        'Distributed transaction created with ' || jsonb_array_length(p_steps) || ' steps',
        'info',
        'system'
    );

    RETURN QUERY SELECT
        v_txn_id,
        v_txn_number,
        'initiated'::TEXT,
        jsonb_array_length(p_steps),
        'Transaction created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. EXECUTE TRANSACTION STEP
-- ============================================
CREATE OR REPLACE FUNCTION execute_transaction_step(
    p_transaction_id UUID,
    p_step_number INTEGER,
    p_result JSONB DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE (
    step_id UUID,
    status TEXT,
    should_continue BOOLEAN,
    should_compensate BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_step_id UUID;
    v_txn RECORD;
    v_step RECORD;
    v_duration_ms INTEGER;
BEGIN
    -- Get transaction and step
    SELECT * INTO v_txn FROM distributed_transactions WHERE id = p_transaction_id;
    SELECT * INTO v_step FROM transaction_steps
    WHERE transaction_id = p_transaction_id AND step_number = p_step_number;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Step not found';
    END IF;

    -- Calculate duration
    v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_step.started_at)) * 1000;

    IF p_success THEN
        -- Step succeeded
        UPDATE transaction_steps
        SET
            status = 'completed',
            completed_at = NOW(),
            operation_result = p_result,
            duration_ms = v_duration_ms
        WHERE id = v_step.id
        RETURNING id INTO v_step_id;

        -- Update transaction
        UPDATE distributed_transactions
        SET
            completed_steps = completed_steps + 1,
            status = CASE
                WHEN completed_steps + 1 = total_steps THEN 'completed'::transaction_status
                ELSE 'in_progress'::transaction_status
            END,
            completed_at = CASE
                WHEN completed_steps + 1 = total_steps THEN NOW()
                ELSE NULL
            END
        WHERE id = p_transaction_id;

        -- Log event
        INSERT INTO transaction_event_log (
            transaction_id,
            step_id,
            event_type,
            event_category,
            event_message,
            severity
        ) VALUES (
            p_transaction_id,
            v_step_id,
            'step_completed',
            'execution',
            'Step ' || p_step_number || ' (' || v_step.step_name || ') completed successfully',
            'info'
        );

        -- Check if transaction complete
        SELECT * INTO v_txn FROM distributed_transactions WHERE id = p_transaction_id;

        RETURN QUERY SELECT
            v_step_id,
            'completed'::TEXT,
            v_txn.completed_steps < v_txn.total_steps, -- should_continue
            FALSE, -- should_compensate
            'Step completed successfully'::TEXT;

    ELSE
        -- Step failed
        UPDATE transaction_steps
        SET
            status = 'failed',
            completed_at = NOW(),
            error_message = p_error_message,
            duration_ms = v_duration_ms
        WHERE id = v_step.id
        RETURNING id INTO v_step_id;

        -- Update transaction
        UPDATE distributed_transactions
        SET
            status = 'failed'::transaction_status,
            failed_at = NOW(),
            failed_steps = failed_steps + 1,
            error_message = p_error_message,
            error_step_id = v_step_id
        WHERE id = p_transaction_id;

        -- Log event
        INSERT INTO transaction_event_log (
            transaction_id,
            step_id,
            event_type,
            event_category,
            event_message,
            severity
        ) VALUES (
            p_transaction_id,
            v_step_id,
            'step_failed',
            'error',
            'Step ' || p_step_number || ' (' || v_step.step_name || ') failed: ' || p_error_message,
            'error'
        );

        RETURN QUERY SELECT
            v_step_id,
            'failed'::TEXT,
            FALSE, -- should_continue
            TRUE,  -- should_compensate
            'Step failed - compensation required'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TRIGGER AUTOMATIC COMPENSATION
-- ============================================
CREATE OR REPLACE FUNCTION trigger_compensation(
    p_transaction_id UUID
)
RETURNS TABLE (
    compensation_count INTEGER,
    status TEXT,
    message TEXT
) AS $$
DECLARE
    v_completed_steps INTEGER;
    v_step RECORD;
    v_comp_action_id UUID;
BEGIN
    -- Update transaction status
    UPDATE distributed_transactions
    SET
        status = 'compensating'::transaction_status,
        compensation_started_at = NOW()
    WHERE id = p_transaction_id;

    -- Get all completed steps (in reverse order)
    v_completed_steps := 0;

    FOR v_step IN
        SELECT * FROM transaction_steps
        WHERE transaction_id = p_transaction_id
          AND status = 'completed'
        ORDER BY step_number DESC
    LOOP
        -- Create compensation action
        INSERT INTO compensation_actions (
            transaction_id,
            step_id,
            action_type,
            action_description,
            handler_function,
            request_payload,
            status
        ) VALUES (
            p_transaction_id,
            v_step.id,
            'rollback_' || v_step.step_type,
            'Compensate step: ' || v_step.step_name,
            v_step.compensation_handler,
            v_step.compensation_data,
            'pending'
        )
        RETURNING id INTO v_comp_action_id;

        -- Update step status
        UPDATE transaction_steps
        SET status = 'compensating'::transaction_step_status
        WHERE id = v_step.id;

        v_completed_steps := v_completed_steps + 1;
    END LOOP;

    -- Log event
    INSERT INTO transaction_event_log (
        transaction_id,
        event_type,
        event_category,
        event_message,
        severity
    ) VALUES (
        p_transaction_id,
        'compensation_initiated',
        'compensation',
        'Compensation initiated for ' || v_completed_steps || ' completed steps',
        'warning'
    );

    RETURN QUERY SELECT
        v_completed_steps,
        'compensating'::TEXT,
        'Compensation triggered for ' || v_completed_steps || ' steps'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. EXECUTE COMPENSATION ACTION
-- ============================================
CREATE OR REPLACE FUNCTION execute_compensation_action(
    p_action_id UUID,
    p_success BOOLEAN,
    p_response JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    all_compensated BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_action RECORD;
    v_txn_id UUID;
    v_duration_ms INTEGER;
    v_total_compensations INTEGER;
    v_completed_compensations INTEGER;
BEGIN
    -- Get compensation action
    SELECT * INTO v_action FROM compensation_actions WHERE id = p_action_id;
    v_txn_id := v_action.transaction_id;

    -- Calculate duration
    v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_action.started_at)) * 1000;

    IF p_success THEN
        -- Compensation succeeded
        UPDATE compensation_actions
        SET
            status = 'completed',
            success = TRUE,
            response_payload = p_response,
            completed_at = NOW(),
            duration_ms = v_duration_ms
        WHERE id = p_action_id;

        -- Update step status
        UPDATE transaction_steps
        SET
            status = 'compensated'::transaction_step_status,
            compensation_completed_at = NOW()
        WHERE id = v_action.step_id;

        -- Log event
        INSERT INTO transaction_event_log (
            transaction_id,
            step_id,
            event_type,
            event_category,
            event_message,
            severity
        ) VALUES (
            v_txn_id,
            v_action.step_id,
            'compensation_completed',
            'compensation',
            'Compensation action ' || v_action.action_number || ' completed successfully',
            'info'
        );

    ELSE
        -- Compensation failed
        UPDATE compensation_actions
        SET
            status = 'failed',
            success = FALSE,
            error_message = p_error_message,
            completed_at = NOW(),
            duration_ms = v_duration_ms,
            retry_count = retry_count + 1
        WHERE id = p_action_id;

        -- Check if max retries reached
        IF v_action.retry_count + 1 >= v_action.max_retries THEN
            -- Move to dead letter queue
            INSERT INTO rollback_dead_letter_queue (
                transaction_id,
                step_id,
                compensation_action_id,
                failure_reason,
                attempts_made,
                last_attempt_at
            ) VALUES (
                v_txn_id,
                v_action.step_id,
                p_action_id,
                p_error_message,
                v_action.retry_count + 1,
                NOW()
            );

            -- Update step
            UPDATE transaction_steps
            SET status = 'compensation_failed'::transaction_step_status
            WHERE id = v_action.step_id;

            -- Log event
            INSERT INTO transaction_event_log (
                transaction_id,
                step_id,
                event_type,
                event_category,
                event_message,
                severity
            ) VALUES (
                v_txn_id,
                v_action.step_id,
                'compensation_failed',
                'error',
                'Compensation failed after ' || (v_action.retry_count + 1) || ' attempts, moved to DLQ',
                'critical'
            );
        END IF;
    END IF;

    -- Check if all compensations complete
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total_compensations, v_completed_compensations
    FROM compensation_actions
    WHERE transaction_id = v_txn_id;

    IF v_completed_compensations = v_total_compensations THEN
        -- All compensations complete
        UPDATE distributed_transactions
        SET
            status = 'compensated'::transaction_status,
            compensation_completed_at = NOW()
        WHERE id = v_txn_id;

        RETURN QUERY SELECT
            TRUE,
            TRUE,
            'All compensations completed successfully'::TEXT;
    ELSIF v_action.retry_count + 1 >= v_action.max_retries AND NOT p_success THEN
        -- Partial failure
        UPDATE distributed_transactions
        SET status = 'partial_failure'::transaction_status
        WHERE id = v_txn_id;

        RETURN QUERY SELECT
            FALSE,
            FALSE,
            'Compensation failed - manual intervention required'::TEXT;
    ELSE
        RETURN QUERY SELECT
            p_success,
            FALSE,
            CASE WHEN p_success THEN 'Compensation successful' ELSE 'Compensation failed' END::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. GET TRANSACTION STATUS
-- ============================================
CREATE OR REPLACE FUNCTION get_transaction_status(
    p_transaction_id UUID
)
RETURNS TABLE (
    transaction_number TEXT,
    status TEXT,
    total_steps INTEGER,
    completed_steps INTEGER,
    failed_steps INTEGER,
    total_amount DECIMAL,
    amount_committed DECIMAL,
    amount_refunded DECIMAL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    steps JSONB,
    timeline JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dt.transaction_id,
        dt.status::TEXT,
        dt.total_steps,
        dt.completed_steps,
        dt.failed_steps,
        dt.total_amount,
        dt.amount_committed,
        dt.amount_refunded,
        dt.started_at,
        dt.completed_at,
        dt.error_message,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'step_number', ts.step_number,
                    'step_name', ts.step_name,
                    'step_type', ts.step_type,
                    'status', ts.status,
                    'started_at', ts.started_at,
                    'completed_at', ts.completed_at,
                    'error_message', ts.error_message,
                    'duration_ms', ts.duration_ms
                ) ORDER BY ts.step_number
            )
            FROM transaction_steps ts
            WHERE ts.transaction_id = dt.id
        ) as steps,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'event_id', tel.event_id,
                    'event_type', tel.event_type,
                    'event_message', tel.event_message,
                    'severity', tel.severity,
                    'created_at', tel.created_at
                ) ORDER BY tel.created_at
            )
            FROM transaction_event_log tel
            WHERE tel.transaction_id = dt.id
        ) as timeline
    FROM distributed_transactions dt
    WHERE dt.id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. GET ACTIVE TRANSACTIONS (Dashboard)
-- ============================================
CREATE OR REPLACE FUNCTION get_active_transactions(
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_number TEXT,
    customer_name TEXT,
    journey_destination TEXT,
    status TEXT,
    total_steps INTEGER,
    completed_steps INTEGER,
    failed_steps INTEGER,
    total_amount DECIMAL,
    started_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    requires_attention BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dt.id,
        dt.transaction_id,
        c.full_name,
        j.destination,
        dt.status::TEXT,
        dt.total_steps,
        dt.completed_steps,
        dt.failed_steps,
        dt.total_amount,
        dt.started_at,
        dt.failed_at,
        dt.error_message,
        dt.status IN ('failed', 'compensating', 'partial_failure')
    FROM distributed_transactions dt
    LEFT JOIN customers c ON c.id = dt.customer_id
    LEFT JOIN journeys j ON j.id = dt.journey_id
    WHERE (p_status IS NULL OR dt.status::TEXT = p_status)
    ORDER BY
        CASE WHEN dt.status = 'failed' THEN 1
             WHEN dt.status = 'compensating' THEN 2
             WHEN dt.status = 'partial_failure' THEN 3
             WHEN dt.status = 'in_progress' THEN 4
             ELSE 5 END,
        dt.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. GET DEAD LETTER QUEUE ITEMS
-- ============================================
CREATE OR REPLACE FUNCTION get_dlq_items(
    p_status TEXT DEFAULT 'pending',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    dlq_id TEXT,
    transaction_number TEXT,
    step_name TEXT,
    failure_reason TEXT,
    attempts_made INTEGER,
    last_attempt_at TIMESTAMPTZ,
    resolution_status TEXT,
    created_at TIMESTAMPTZ,
    escalated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dlq.dlq_id,
        dt.transaction_id,
        ts.step_name,
        dlq.failure_reason,
        dlq.attempts_made,
        dlq.last_attempt_at,
        dlq.resolution_status,
        dlq.created_at,
        dlq.escalated
    FROM rollback_dead_letter_queue dlq
    JOIN distributed_transactions dt ON dt.id = dlq.transaction_id
    LEFT JOIN transaction_steps ts ON ts.id = dlq.step_id
    WHERE dlq.resolution_status = p_status
    ORDER BY
        CASE WHEN dlq.escalated THEN 1 ELSE 2 END,
        dlq.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. MANUAL ROLLBACK TRIGGER (Admin)
-- ============================================
CREATE OR REPLACE FUNCTION manual_rollback_transaction(
    p_transaction_id UUID,
    p_reason TEXT,
    p_admin_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    compensation_count INTEGER
) AS $$
DECLARE
    v_txn RECORD;
    v_comp_count INTEGER;
BEGIN
    -- Get transaction
    SELECT * INTO v_txn FROM distributed_transactions WHERE id = p_transaction_id;

    IF v_txn.status NOT IN ('completed', 'in_progress') THEN
        RETURN QUERY SELECT
            FALSE,
            'Transaction cannot be rolled back in status: ' || v_txn.status,
            0;
        RETURN;
    END IF;

    -- Log manual rollback
    INSERT INTO transaction_event_log (
        transaction_id,
        event_type,
        event_category,
        event_message,
        severity,
        source
    ) VALUES (
        p_transaction_id,
        'manual_rollback_initiated',
        'compensation',
        'Manual rollback initiated by admin: ' || p_reason,
        'warning',
        'manual'
    );

    -- Trigger compensation
    SELECT compensation_count INTO v_comp_count
    FROM trigger_compensation(p_transaction_id);

    RETURN QUERY SELECT
        TRUE,
        'Manual rollback initiated successfully',
        v_comp_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GET TRANSACTION STATISTICS
-- ============================================
CREATE OR REPLACE FUNCTION get_transaction_statistics(
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    total_transactions INTEGER,
    completed_transactions INTEGER,
    failed_transactions INTEGER,
    compensated_transactions INTEGER,
    partial_failures INTEGER,
    success_rate DECIMAL,
    avg_transaction_time_seconds DECIMAL,
    total_amount_processed DECIMAL,
    total_amount_refunded DECIMAL,
    dlq_count INTEGER,
    by_status JSONB,
    daily_trend JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'compensated')::INTEGER,
        COUNT(*) FILTER (WHERE status = 'partial_failure')::INTEGER,
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*)::DECIMAL, 0) * 100),
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::DECIMAL,
        SUM(total_amount)::DECIMAL,
        SUM(amount_refunded)::DECIMAL,
        (SELECT COUNT(*)::INTEGER FROM rollback_dead_letter_queue WHERE resolution_status = 'pending'),
        (
            SELECT jsonb_object_agg(status, count)
            FROM (
                SELECT status::TEXT, COUNT(*)
                FROM distributed_transactions
                WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL
                GROUP BY status
            ) s
        ),
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', day,
                    'total', count,
                    'completed', completed,
                    'failed', failed
                )
                ORDER BY day
            )
            FROM (
                SELECT
                    DATE(created_at) as day,
                    COUNT(*) as count,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM distributed_transactions
                WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL
                GROUP BY DATE(created_at)
            ) daily
        )
    FROM distributed_transactions
    WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- API FUNCTIONS COMPLETE
-- =====================================================
-- 9 RPC functions created:
-- 1. create_distributed_transaction - Start new transaction
-- 2. execute_transaction_step - Execute individual step
-- 3. trigger_compensation - Start rollback process
-- 4. execute_compensation_action - Execute rollback action
-- 5. get_transaction_status - Complete transaction details
-- 6. get_active_transactions - Dashboard view
-- 7. get_dlq_items - Dead letter queue items
-- 8. manual_rollback_transaction - Admin-initiated rollback
-- 9. get_transaction_statistics - Analytics
-- =====================================================
