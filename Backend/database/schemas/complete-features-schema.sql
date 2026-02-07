-- =====================================================
-- COMPLETE FEATURES SCHEMA
-- Customer Registration, Package Search, Recommendations,
-- Flight Booking, Notifications, Analytics
-- =====================================================

-- =====================================================
-- 1. CUSTOMER REGISTRATION & PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  address JSONB, -- {street, city, state, country, postal_code}
  preferences JSONB, -- {budget_range, preferred_airlines, meal_preferences, seat_preferences}
  loyalty_programs JSONB[], -- [{airline, membership_id, tier}]
  emergency_contact JSONB, -- {name, phone, relationship}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. PACKAGE SEARCH & DESTINATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  airport_code TEXT,
  description TEXT,
  image_urls TEXT[],
  popular_attractions TEXT[],
  best_season TEXT,
  average_temperature JSONB, -- {min, max, unit}
  timezone TEXT,
  currency TEXT,
  language TEXT[],
  visa_required BOOLEAN DEFAULT false,
  trending_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  destination_id UUID REFERENCES destinations(id),
  duration_days INTEGER NOT NULL,
  duration_nights INTEGER NOT NULL,
  description TEXT,
  inclusions TEXT[], -- What's included
  exclusions TEXT[], -- What's not included
  itinerary JSONB[], -- [{day, title, activities, meals}]
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_person DECIMAL(10, 2) NOT NULL,
  max_capacity INTEGER DEFAULT 10,
  min_capacity INTEGER DEFAULT 2,
  package_type TEXT, -- 'budget', 'standard', 'luxury', 'adventure', 'honeymoon', 'family'
  is_trending BOOLEAN DEFAULT false,
  trend_score INTEGER DEFAULT 0,
  instagram_mentions INTEGER DEFAULT 0,
  youtube_views INTEGER DEFAULT 0,
  difficulty_level TEXT, -- 'easy', 'moderate', 'challenging'
  age_restrictions JSONB, -- {min_age, max_age}
  images TEXT[],
  video_urls TEXT[],
  availability_status TEXT DEFAULT 'available', -- 'available', 'limited', 'sold_out'
  season TEXT[], -- ['summer', 'winter', 'monsoon', 'all_year']
  tags TEXT[], -- ['beach', 'adventure', 'cultural', 'wildlife']
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. RECOMMENDATION ENGINES
-- =====================================================

-- Budget-Based Recommendations
CREATE TABLE IF NOT EXISTS budget_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  budget_min DECIMAL(10, 2) NOT NULL,
  budget_max DECIMAL(10, 2) NOT NULL,
  travel_dates DATERANGE,
  num_travelers INTEGER DEFAULT 1,
  preferences JSONB, -- {destination_type, activities, accommodation_level}
  recommended_packages UUID[], -- Array of package IDs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trend-Based Recommendations (Social Media)
CREATE TABLE IF NOT EXISTS trend_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  source_type TEXT NOT NULL, -- 'instagram', 'youtube'
  source_url TEXT NOT NULL,
  extracted_destinations TEXT[],
  extracted_activities TEXT[],
  sentiment_score DECIMAL(3, 2), -- 0.00 to 1.00
  engagement_score INTEGER,
  recommended_packages UUID[], -- Array of package IDs
  analysis_data JSONB, -- {hashtags, mentions, keywords, influencer_id}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Credit Card Based Recommendations
CREATE TABLE IF NOT EXISTS credit_card_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  card_type TEXT NOT NULL, -- 'visa', 'mastercard', 'amex', 'rupay'
  card_tier TEXT, -- 'basic', 'silver', 'gold', 'platinum', 'signature'
  card_benefits JSONB, -- {cashback_percent, reward_points, lounge_access, insurance}
  spending_limit DECIMAL(10, 2),
  available_offers JSONB[], -- [{offer_id, discount_percent, max_discount, valid_until}]
  recommended_packages UUID[], -- Packages with best credit card offers
  estimated_savings DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. FLIGHT BOOKING SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number TEXT NOT NULL,
  airline_code TEXT NOT NULL,
  airline_name TEXT NOT NULL,
  departure_airport TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  aircraft_type TEXT,
  total_seats INTEGER,
  available_seats INTEGER,
  classes JSONB, -- {economy: {available, price}, business: {available, price}, first: {available, price}}
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled'
  baggage_allowance JSONB, -- {cabin: {weight, pieces}, checked: {weight, pieces}}
  meal_service BOOLEAN DEFAULT true,
  wifi_available BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flight_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  journey_id UUID REFERENCES journeys(id),
  flight_id UUID REFERENCES flights(id),
  passenger_details JSONB[], -- [{name, age, gender, passport, seat_number, meal_pref}]
  class_type TEXT NOT NULL, -- 'economy', 'business', 'first'
  total_passengers INTEGER NOT NULL,
  base_fare DECIMAL(10, 2) NOT NULL,
  taxes_fees DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  booking_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'completed'
  seat_assignments TEXT[], -- ['12A', '12B']
  special_requests TEXT[],
  checked_in BOOLEAN DEFAULT false,
  boarding_passes JSONB[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. NOTIFICATIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  notification_type TEXT NOT NULL, -- 'booking', 'payment', 'flight_update', 'promotion', 'alert', 'reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  category TEXT, -- 'info', 'success', 'warning', 'error'
  related_entity_type TEXT, -- 'journey', 'flight', 'package', 'payment'
  related_entity_id UUID,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB, -- Additional context data
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_types JSONB DEFAULT '{"booking": true, "payment": true, "flight_update": true, "promotion": true, "alert": true, "reminder": true}'::jsonb,
  quiet_hours JSONB, -- {enabled, start_time, end_time}
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. ANALYTICS & DASHBOARD
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) UNIQUE,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  average_booking_value DECIMAL(10, 2) DEFAULT 0,
  preferred_destinations TEXT[],
  preferred_package_types TEXT[],
  booking_frequency TEXT, -- 'frequent', 'regular', 'occasional', 'first_time'
  last_booking_date TIMESTAMPTZ,
  loyalty_tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  reward_points INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(4, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  lifetime_value DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) UNIQUE,
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  search_appearances INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  most_booked_months INTEGER[], -- [1,2,3...12]
  average_booking_lead_days INTEGER,
  cancellation_rate DECIMAL(4, 2) DEFAULT 0,
  repeat_booking_rate DECIMAL(4, 2) DEFAULT 0,
  competitor_packages UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_customers INTEGER DEFAULT 0,
  new_customers_today INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  bookings_today INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  revenue_today DECIMAL(12, 2) DEFAULT 0,
  active_journeys INTEGER DEFAULT 0,
  pending_payments INTEGER DEFAULT 0,
  flight_bookings_today INTEGER DEFAULT 0,
  avg_booking_value DECIMAL(10, 2) DEFAULT 0,
  top_destinations TEXT[],
  trending_packages UUID[],
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  customer_satisfaction DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(metric_date)
);

-- =====================================================
-- 7. SEARCH HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'destination', 'package', 'budget', 'trend'
  filters JSONB, -- {budget, dates, travelers, package_type}
  results_count INTEGER,
  selected_package_id UUID REFERENCES packages(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_packages_destination ON packages(destination_id);
CREATE INDEX idx_packages_type ON packages(package_type);
CREATE INDEX idx_packages_trending ON packages(is_trending, trend_score DESC);
CREATE INDEX idx_packages_price ON packages(price_per_person);
CREATE INDEX idx_flights_departure ON flights(departure_time);
CREATE INDEX idx_flights_route ON flights(departure_airport, arrival_airport);
CREATE INDEX idx_flight_bookings_customer ON flight_bookings(customer_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_search_history_customer ON search_history(customer_id, created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update customer analytics on new booking
CREATE OR REPLACE FUNCTION update_customer_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_analytics (customer_id, total_bookings, last_booking_date)
  VALUES (NEW.created_by, 1, NEW.created_at)
  ON CONFLICT (customer_id) 
  DO UPDATE SET 
    total_bookings = customer_analytics.total_bookings + 1,
    last_booking_date = NEW.created_at,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_analytics
AFTER INSERT ON journeys
FOR EACH ROW
EXECUTE FUNCTION update_customer_analytics();

-- Update package analytics on booking
CREATE OR REPLACE FUNCTION update_package_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be triggered by journey_items table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flights_updated_at BEFORE UPDATE ON flights
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own data)
CREATE POLICY "Users can view own customer data" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own customer data" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
