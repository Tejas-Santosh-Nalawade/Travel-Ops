-- =====================================================
-- API FUNCTIONS FOR COMPLETE FEATURES
-- Package Search, Recommendations, Bookings, Analytics
-- =====================================================

-- =====================================================
-- 1. PACKAGE SEARCH FUNCTIONS
-- =====================================================

-- Search packages by various criteria
CREATE OR REPLACE FUNCTION search_packages(
  p_query TEXT DEFAULT NULL,
  p_destination TEXT DEFAULT NULL,
  p_min_price DECIMAL DEFAULT 0,
  p_max_price DECIMAL DEFAULT 999999,
  p_package_type TEXT DEFAULT NULL,
  p_duration_min INTEGER DEFAULT 0,
  p_duration_max INTEGER DEFAULT 365,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  package_code TEXT,
  name TEXT,
  destination_name TEXT,
  duration_days INTEGER,
  duration_nights INTEGER,
  description TEXT,
  price_per_person DECIMAL,
  package_type TEXT,
  is_trending BOOLEAN,
  images TEXT[],
  availability_status TEXT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.package_code,
    p.name,
    d.name as destination_name,
    p.duration_days,
    p.duration_nights,
    p.description,
    p.price_per_person,
    p.package_type,
    p.is_trending,
    p.images,
    p.availability_status,
    p.tags
  FROM packages p
  LEFT JOIN destinations d ON p.destination_id = d.id
  WHERE 
    (p_query IS NULL OR 
      p.name ILIKE '%' || p_query || '%' OR 
      p.description ILIKE '%' || p_query || '%' OR
      d.name ILIKE '%' || p_query || '%')
    AND (p_destination IS NULL OR d.name ILIKE '%' || p_destination || '%')
    AND p.price_per_person BETWEEN p_min_price AND p_max_price
    AND (p_package_type IS NULL OR p.package_type = p_package_type)
    AND p.duration_days BETWEEN p_duration_min AND p_duration_max
    AND p.availability_status = 'available'
  ORDER BY 
    CASE WHEN p.is_trending THEN 0 ELSE 1 END,
    p.trend_score DESC,
    p.price_per_person ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. BUDGET-BASED RECOMMENDATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_budget_recommendations(
  p_customer_id UUID,
  p_budget_min DECIMAL,
  p_budget_max DECIMAL,
  p_num_travelers INTEGER DEFAULT 1,
  p_preferences JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  destination TEXT,
  price_per_person DECIMAL,
  total_cost DECIMAL,
  savings_percent DECIMAL,
  match_score INTEGER,
  recommendation_reason TEXT
) AS $$
BEGIN
  -- Calculate total budget per person
  DECLARE
    budget_per_person DECIMAL := p_budget_max / p_num_travelers;
  BEGIN
    RETURN QUERY
    SELECT 
      p.id as package_id,
      p.name as package_name,
      d.name as destination,
      p.price_per_person,
      (p.price_per_person * p_num_travelers) as total_cost,
      ROUND(((budget_per_person - p.price_per_person) / budget_per_person * 100)::numeric, 2) as savings_percent,
      (
        CASE WHEN p.price_per_person <= budget_per_person * 0.8 THEN 100
             WHEN p.price_per_person <= budget_per_person THEN 80
             ELSE 50 END +
        CASE WHEN p.is_trending THEN 20 ELSE 0 END
      ) as match_score,
      CASE 
        WHEN p.price_per_person <= budget_per_person * 0.7 THEN 'Great Value - ' || ROUND(((budget_per_person - p.price_per_person) / budget_per_person * 100)::numeric) || '% under budget'
        WHEN p.price_per_person <= budget_per_person THEN 'Within Budget - Perfect match'
        ELSE 'Slightly Over - Premium option'
      END as recommendation_reason
    FROM packages p
    LEFT JOIN destinations d ON p.destination_id = d.id
    WHERE 
      p.price_per_person BETWEEN p_budget_min / p_num_travelers AND budget_per_person * 1.1
      AND p.availability_status = 'available'
    ORDER BY match_score DESC, p.price_per_person ASC
    LIMIT 10;
    
    -- Save recommendation
    INSERT INTO budget_recommendations (
      customer_id, budget_min, budget_max, num_travelers, 
      preferences, recommended_packages
    )
    SELECT 
      p_customer_id, p_budget_min, p_budget_max, p_num_travelers,
      p_preferences, array_agg(p.id)
    FROM packages p
    WHERE p.price_per_person BETWEEN p_budget_min / p_num_travelers AND budget_per_person * 1.1
      AND p.availability_status = 'available'
    ORDER BY p.trend_score DESC
    LIMIT 10;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. TREND-BASED RECOMMENDATIONS (Social Media)
-- =====================================================

CREATE OR REPLACE FUNCTION get_trend_recommendations(
  p_customer_id UUID,
  p_source_type TEXT,
  p_source_url TEXT,
  p_extracted_data JSONB
)
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  destination TEXT,
  price_per_person DECIMAL,
  trend_score INTEGER,
  social_engagement INTEGER,
  recommendation_reason TEXT
) AS $$
DECLARE
  extracted_destinations TEXT[] := COALESCE(p_extracted_data->>'destinations', '{}')::TEXT[];
  extracted_activities TEXT[] := COALESCE(p_extracted_data->>'activities', '{}')::TEXT[];
BEGIN
  RETURN QUERY
  SELECT 
    p.id as package_id,
    p.name as package_name,
    d.name as destination,
    p.price_per_person,
    p.trend_score,
    (p.instagram_mentions + p.youtube_views / 1000) as social_engagement,
    'Trending on ' || p_source_type || ' - ' || 
    CASE 
      WHEN p.trend_score > 80 THEN 'Highly Popular'
      WHEN p.trend_score > 50 THEN 'Rising Trend'
      ELSE 'Emerging Destination'
    END as recommendation_reason
  FROM packages p
  LEFT JOIN destinations d ON p.destination_id = d.id
  WHERE 
    (p.is_trending = true OR p.trend_score > 30)
    AND (
      d.name = ANY(extracted_destinations) OR
      p.tags && extracted_activities OR
      p.name ILIKE ANY(SELECT '%' || unnest(extracted_destinations) || '%')
    )
    AND p.availability_status = 'available'
  ORDER BY 
    p.trend_score DESC,
    (p.instagram_mentions + p.youtube_views) DESC
  LIMIT 10;
  
  -- Save trend recommendation
  INSERT INTO trend_recommendations (
    customer_id, source_type, source_url,
    extracted_destinations, extracted_activities,
    recommended_packages, analysis_data
  )
  SELECT 
    p_customer_id, p_source_type, p_source_url,
    extracted_destinations, extracted_activities,
    array_agg(p.id), p_extracted_data
  FROM packages p
  LEFT JOIN destinations d ON p.destination_id = d.id
  WHERE p.is_trending = true
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREDIT CARD RECOMMENDATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_credit_card_recommendations(
  p_customer_id UUID,
  p_card_type TEXT,
  p_card_tier TEXT,
  p_spending_limit DECIMAL
)
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  destination TEXT,
  original_price DECIMAL,
  discounted_price DECIMAL,
  savings_amount DECIMAL,
  cashback_amount DECIMAL,
  reward_points INTEGER,
  total_benefit DECIMAL,
  card_offer TEXT
) AS $$
DECLARE
  cashback_rate DECIMAL := CASE 
    WHEN p_card_tier = 'platinum' THEN 0.05
    WHEN p_card_tier = 'gold' THEN 0.03
    WHEN p_card_tier = 'silver' THEN 0.02
    ELSE 0.01
  END;
  discount_percent DECIMAL := CASE 
    WHEN p_card_tier = 'platinum' THEN 0.15
    WHEN p_card_tier = 'gold' THEN 0.10
    WHEN p_card_tier = 'silver' THEN 0.05
    ELSE 0.02
  END;
BEGIN
  RETURN QUERY
  SELECT 
    p.id as package_id,
    p.name as package_name,
    d.name as destination,
    p.price_per_person as original_price,
    ROUND((p.price_per_person * (1 - discount_percent))::numeric, 2) as discounted_price,
    ROUND((p.price_per_person * discount_percent)::numeric, 2) as savings_amount,
    ROUND((p.price_per_person * cashback_rate)::numeric, 2) as cashback_amount,
    FLOOR(p.price_per_person / 100)::INTEGER as reward_points,
    ROUND((p.price_per_person * (discount_percent + cashback_rate))::numeric, 2) as total_benefit,
    p_card_tier || ' Card Offer: ' || ROUND((discount_percent * 100)::numeric) || '% OFF + ' || 
    ROUND((cashback_rate * 100)::numeric) || '% Cashback' as card_offer
  FROM packages p
  LEFT JOIN destinations d ON p.destination_id = d.id
  WHERE 
    p.price_per_person <= p_spending_limit
    AND p.availability_status = 'available'
  ORDER BY total_benefit DESC, p.price_per_person ASC
  LIMIT 10;
  
  -- Save credit card recommendation
  INSERT INTO credit_card_recommendations (
    customer_id, card_type, card_tier, spending_limit,
    recommended_packages, estimated_savings
  )
  SELECT 
    p_customer_id, p_card_type, p_card_tier, p_spending_limit,
    array_agg(p.id),
    SUM(p.price_per_person * (discount_percent + cashback_rate))
  FROM packages p
  WHERE p.price_per_person <= p_spending_limit
    AND p.availability_status = 'available'
  ORDER BY p.trend_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FLIGHT SEARCH & BOOKING
-- =====================================================

CREATE OR REPLACE FUNCTION search_flights(
  p_departure_airport TEXT,
  p_arrival_airport TEXT,
  p_departure_date DATE,
  p_class_type TEXT DEFAULT 'economy'
)
RETURNS TABLE (
  id UUID,
  flight_number TEXT,
  airline_name TEXT,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  available_seats INTEGER,
  price DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.flight_number,
    f.airline_name,
    f.departure_time,
    f.arrival_time,
    f.duration_minutes,
    f.available_seats,
    COALESCE((f.classes->p_class_type->>'price')::DECIMAL, 0) as price,
    f.status
  FROM flights f
  WHERE 
    f.departure_airport = p_departure_airport
    AND f.arrival_airport = p_arrival_airport
    AND f.departure_time::DATE = p_departure_date
    AND f.available_seats > 0
    AND f.status = 'scheduled'
    AND (f.classes->p_class_type->>'available')::INTEGER > 0
  ORDER BY f.departure_time ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, notification_type, title, message, priority,
    related_entity_type, related_entity_id
  )
  VALUES (
    p_user_id, p_type, p_title, p_message, p_priority,
    p_related_entity_type, p_related_entity_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_is_read BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  priority TEXT,
  category TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  action_url TEXT,
  action_label TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.notification_type,
    n.title,
    n.message,
    n.priority,
    n.category,
    n.is_read,
    n.created_at,
    n.action_url,
    n.action_label
  FROM notifications n
  WHERE 
    n.user_id = p_user_id
    AND (p_is_read IS NULL OR n.is_read = p_is_read)
    AND n.is_archived = false
    AND (n.expires_at IS NULL OR n.expires_at > now())
  ORDER BY 
    CASE n.priority 
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      ELSE 4
    END,
    n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DASHBOARD ANALYTICS
-- =====================================================

CREATE OR REPLACE FUNCTION get_dashboard_analytics(
  p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_customers INTEGER,
  new_customers INTEGER,
  total_bookings INTEGER,
  total_revenue DECIMAL,
  average_booking_value DECIMAL,
  active_journeys INTEGER,
  pending_payments INTEGER,
  conversion_rate DECIMAL,
  top_destinations JSONB,
  trending_packages JSONB,
  revenue_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT c.id)::INTEGER as total_customers,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= p_date_from)::INTEGER as new_customers,
    COUNT(j.id)::INTEGER as total_bookings,
    COALESCE(SUM(j.total_cost), 0)::DECIMAL as total_revenue,
    COALESCE(AVG(j.total_cost), 0)::DECIMAL as average_booking_value,
    COUNT(j.id) FILTER (WHERE j.status IN ('PENDING', 'CONFIRMED'))::INTEGER as active_journeys,
    COUNT(j.id) FILTER (WHERE j.status = 'PENDING')::INTEGER as pending_payments,
    ROUND((COUNT(j.id)::DECIMAL / NULLIF(COUNT(DISTINCT sh.customer_id), 0) * 100), 2) as conversion_rate,
    (SELECT jsonb_agg(jsonb_build_object('name', d.name, 'count', booking_count))
     FROM (
       SELECT d.name, COUNT(j.id) as booking_count
       FROM destinations d
       JOIN packages p ON p.destination_id = d.id
       JOIN journey_items ji ON ji.package_id = p.id
       JOIN journeys j ON j.id = ji.journey_id
       WHERE j.created_at BETWEEN p_date_from AND p_date_to
       GROUP BY d.name
       ORDER BY booking_count DESC
       LIMIT 5
     ) as d
    ) as top_destinations,
    (SELECT jsonb_agg(jsonb_build_object('package_id', p.id, 'name', p.name, 'bookings', booking_count))
     FROM (
       SELECT p.id, p.name, COUNT(j.id) as booking_count
       FROM packages p
       JOIN journey_items ji ON ji.package_id = p.id
       JOIN journeys j ON j.id = ji.journey_id
       WHERE j.created_at BETWEEN p_date_from AND p_date_to
       GROUP BY p.id, p.name
       ORDER BY booking_count DESC
       LIMIT 5
     ) as p
    ) as trending_packages,
    (SELECT jsonb_object_agg(date, revenue)
     FROM (
       SELECT 
         j.created_at::DATE as date,
         SUM(j.total_cost) as revenue
       FROM journeys j
       WHERE j.created_at BETWEEN p_date_from AND p_date_to
       GROUP BY j.created_at::DATE
       ORDER BY date
     ) as daily
    ) as revenue_by_day
  FROM customers c
  LEFT JOIN journeys j ON j.created_by = c.user_id
  LEFT JOIN search_history sh ON sh.customer_id = c.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CUSTOMER REGISTRATION
-- =====================================================

CREATE OR REPLACE FUNCTION register_customer(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_preferences JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  customer_id UUID;
BEGIN
  INSERT INTO customers (
    user_id, full_name, email, phone, preferences
  )
  VALUES (
    p_user_id, p_full_name, p_email, p_phone, p_preferences
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    preferences = EXCLUDED.preferences,
    updated_at = now()
  RETURNING id INTO customer_id;
  
  -- Initialize analytics
  INSERT INTO customer_analytics (customer_id)
  VALUES (customer_id)
  ON CONFLICT (customer_id) DO NOTHING;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql;
