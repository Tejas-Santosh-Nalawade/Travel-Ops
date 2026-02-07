-- =====================================================
-- SAMPLE DATA FOR TESTING
-- Insert destinations, packages, flights, and test data
-- =====================================================

-- =====================================================
-- 1. INSERT DESTINATIONS
-- =====================================================

INSERT INTO destinations (
  name, country, city, airport_code, description,
  timezone, currency, language, visa_required, trending_score,
  popular_attractions, best_season, average_temperature
) VALUES 
  (
    'Paris Romantic Experience',
    'France',
    'Paris',
    'CDG',
    'The City of Light awaits with its iconic Eiffel Tower, world-class museums, and charming cafes',
    'Europe/Paris',
    'EUR',
    ARRAY['French', 'English'],
    false,
    92,
    ARRAY['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Arc de Triomphe', 'Champs-Élysées'],
    'April to June, September to October',
    '{"min": 10, "max": 20, "unit": "celsius"}'::jsonb
  ),
  (
    'Dubai Luxury Escape',
    'United Arab Emirates',
    'Dubai',
    'DXB',
    'Experience ultra-modern luxury, desert safaris, and world-class shopping in this futuristic city',
    'Asia/Dubai',
    'AED',
    ARRAY['Arabic', 'English'],
    true,
    95,
    ARRAY['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall', 'Desert Safari', 'Burj Al Arab'],
    'November to March',
    '{"min": 20, "max": 35, "unit": "celsius"}'::jsonb
  ),
  (
    'Bali Island Paradise',
    'Indonesia',
    'Bali',
    'DPS',
    'Tropical paradise with stunning beaches, ancient temples, and vibrant culture',
    'Asia/Makassar',
    'IDR',
    ARRAY['Indonesian', 'English'],
    true,
    88,
    ARRAY['Tanah Lot Temple', 'Ubud Rice Terraces', 'Seminyak Beach', 'Sacred Monkey Forest', 'Mount Batur'],
    'April to October',
    '{"min": 24, "max": 30, "unit": "celsius"}'::jsonb
  ),
  (
    'Maldives Beach Resort',
    'Maldives',
    'Male',
    'MLE',
    'Overwater bungalows, crystal-clear waters, and pristine beaches in this tropical heaven',
    'Indian/Maldives',
    'MVR',
    ARRAY['Dhivehi', 'English'],
    true,
    90,
    ARRAY['Underwater Restaurant', 'Diving Spots', 'Private Islands', 'Water Sports', 'Sunset Cruises'],
    'November to April',
    '{"min": 26, "max": 32, "unit": "celsius"}'::jsonb
  ),
  (
    'Swiss Alps Adventure',
    'Switzerland',
    'Interlaken',
    'ZRH',
    'Breathtaking mountain scenery, world-class skiing, and charming alpine villages',
    'Europe/Zurich',
    'CHF',
    ARRAY['German', 'French', 'Italian', 'English'],
    false,
    85,
    ARRAY['Jungfraujoch', 'Matterhorn', 'Lake Lucerne', 'Interlaken', 'Zermatt'],
    'December to March, June to September',
    '{"min": 0, "max": 15, "unit": "celsius"}'::jsonb
  ),
  (
    'Tokyo Modern Journey',
    'Japan',
    'Tokyo',
    'NRT',
    'Blend of ancient traditions and cutting-edge technology in this vibrant metropolis',
    'Asia/Tokyo',
    'JPY',
    ARRAY['Japanese', 'English'],
    true,
    93,
    ARRAY['Tokyo Skytree', 'Sensoji Temple', 'Shibuya Crossing', 'Mount Fuji', 'Imperial Palace'],
    'March to May, September to November',
    '{"min": 10, "max": 22, "unit": "celsius"}'::jsonb
  ),
  (
    'Santorini Greek Islands',
    'Greece',
    'Santorini',
    'JTR',
    'White-washed buildings, blue-domed churches, and spectacular sunsets over the Aegean Sea',
    'Europe/Athens',
    'EUR',
    ARRAY['Greek', 'English'],
    false,
    87,
    ARRAY['Oia Village', 'Red Beach', 'Ancient Akrotiri', 'Caldera Views', 'Wine Tours'],
    'April to October',
    '{"min": 18, "max": 28, "unit": "celsius"}'::jsonb
  ),
  (
    'New York City Lights',
    'United States',
    'New York',
    'JFK',
    'The city that never sleeps with iconic landmarks, world-class dining, and Broadway shows',
    'America/New_York',
    'USD',
    ARRAY['English'],
    true,
    91,
    ARRAY['Statue of Liberty', 'Central Park', 'Times Square', 'Empire State Building', 'Brooklyn Bridge'],
    'April to June, September to November',
    '{"min": 8, "max": 18, "unit": "celsius"}'::jsonb
  );

-- =====================================================
-- 2. INSERT PACKAGES
-- =====================================================

INSERT INTO packages (
  package_code, name, destination_id, duration_days, duration_nights,
  description, base_price, price_per_person, max_capacity, min_capacity,
  package_type, is_trending, trend_score,
  inclusions, exclusions, itinerary,
  images, availability_status, tags,
  instagram_mentions, youtube_views
) VALUES
  -- Paris Packages
  (
    'PKG-PAR-001',
    'Paris Romantic Getaway',
    (SELECT id FROM destinations WHERE city = 'Paris'),
    7, 6,
    'Experience the romance of Paris with guided tours, Seine River cruise, and Eiffel Tower dinner',
    75000, 75000, 4, 2,
    'honeymoon', true, 92,
    ARRAY['5-star hotel accommodation', 'Daily breakfast', 'Airport transfers', 'Eiffel Tower dinner', 'Seine River cruise', 'Louvre Museum tickets'],
    ARRAY['International flights', 'Travel insurance', 'Personal expenses', 'Lunch and dinner (except specified)'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival in Paris, hotel check-in, evening at Champs-Élysées',
      'day2', 'Eiffel Tower visit, Seine River cruise, romantic dinner',
      'day3', 'Louvre Museum, Notre-Dame Cathedral, Latin Quarter exploration',
      'day4', 'Versailles Palace day trip',
      'day5', 'Montmartre, Sacré-Cœur, shopping at Galeries Lafayette',
      'day6', 'Free day for personal exploration',
      'day7', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1502602898657-3e91760cbb34', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f'],
    'available',
    ARRAY['romantic', 'cultural', 'sightseeing', 'luxury'],
    15420, 89500
  ),
  -- Dubai Packages
  (
    'PKG-DXB-001',
    'Dubai Luxury Experience',
    (SELECT id FROM destinations WHERE city = 'Dubai'),
    5, 4,
    'Ultimate luxury with Burj Khalifa, desert safari, and premium shopping experiences',
    95000, 95000, 6, 2,
    'luxury', true, 95,
    ARRAY['7-star Burj Al Arab stay', 'Daily breakfast', 'Private airport transfers', 'Burj Khalifa At The Top tickets', 'Desert safari with BBQ dinner', 'Dubai Mall shopping voucher'],
    ARRAY['International flights', 'Visa fees', 'Travel insurance', 'Personal shopping'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival, luxury hotel check-in, Marina walk',
      'day2', 'Burj Khalifa visit, Dubai Mall exploration, fountain show',
      'day3', 'Desert safari with dune bashing and BBQ dinner under stars',
      'day4', 'Palm Jumeirah, Atlantis Aquaventure, luxury shopping',
      'day5', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c', 'https://images.unsplash.com/photo-1518684079-3c830dcef090'],
    'available',
    ARRAY['luxury', 'adventure', 'shopping', 'modern'],
    23800, 156000
  ),
  -- Bali Packages
  (
    'PKG-BAL-001',
    'Bali Tropical Paradise',
    (SELECT id FROM destinations WHERE city = 'Bali'),
    6, 5,
    'Beach relaxation, temple tours, and cultural experiences in tropical paradise',
    55000, 55000, 6, 2,
    'beach', true, 88,
    ARRAY['Beach resort accommodation', 'Daily breakfast', 'Airport transfers', 'Tanah Lot temple tour', 'Ubud cultural tour', 'Water sports package'],
    ARRAY['International flights', 'Visa on arrival fee', 'Travel insurance', 'Spa treatments'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival, beachfront resort check-in, sunset at Seminyak Beach',
      'day2', 'Tanah Lot temple, traditional Balinese spa',
      'day3', 'Ubud: Rice terraces, Monkey Forest, art market',
      'day4', 'Water sports: snorkeling, surfing, jet ski',
      'day5', 'Mount Batur sunrise trek (optional), leisure day',
      'day6', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1537996194471-e657df975ab4', 'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e'],
    'available',
    ARRAY['beach', 'cultural', 'adventure', 'relaxation'],
    19200, 127000
  ),
  -- Maldives Packages
  (
    'PKG-MLD-001',
    'Maldives Luxury Beach Resort',
    (SELECT id FROM destinations WHERE city = 'Male'),
    5, 4,
    'Overwater villa experience with all-inclusive luxury and water activities',
    145000, 145000, 4, 2,
    'honeymoon', true, 90,
    ARRAY['Overwater villa with private pool', 'All-inclusive meals and drinks', 'Seaplane transfers', 'Couples spa treatment', 'Diving session', 'Sunset cruise'],
    ARRAY['International flights', 'Travel insurance', 'Personal expenses', 'Premium alcohol'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival, seaplane transfer to resort, overwater villa check-in',
      'day2', 'Relaxation, snorkeling, beach dining',
      'day3', 'Scuba diving experience, couples spa',
      'day4', 'Private sunset cruise, underwater restaurant dinner',
      'day5', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1514282401047-d79a71a590e8', 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd'],
    'available',
    ARRAY['beach', 'honeymoon', 'luxury', 'diving'],
    28900, 198000
  ),
  -- Switzerland Packages
  (
    'PKG-SWS-001',
    'Swiss Alps Adventure',
    (SELECT id FROM destinations WHERE city = 'Interlaken'),
    8, 7,
    'Alpine skiing, mountain excursions, and charming Swiss villages',
    115000, 115000, 6, 2,
    'adventure', true, 85,
    ARRAY['Mountain resort accommodation', 'Daily breakfast', 'Swiss Travel Pass', 'Jungfraujoch excursion', 'Skiing equipment rental', 'Chocolate factory tour'],
    ARRAY['International flights', 'Travel insurance', 'Lunch and dinner', 'Ski instructor fees'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival in Zurich, train to Interlaken, resort check-in',
      'day2', 'Jungfraujoch - Top of Europe excursion',
      'day3', 'Skiing at Grindelwald',
      'day4', 'Lake Lucerne and Mount Pilatus',
      'day5', 'Zermatt and Matterhorn visit',
      'day6', 'Swiss chocolate factory tour, Bern city tour',
      'day7', 'Free day for personal exploration',
      'day8', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1531366936337-7c912a4589a7', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'],
    'available',
    ARRAY['adventure', 'skiing', 'mountain', 'luxury'],
    12500, 78000
  ),
  -- Tokyo Packages
  (
    'PKG-TKY-001',
    'Tokyo Modern Discovery',
    (SELECT id FROM destinations WHERE city = 'Tokyo'),
    6, 5,
    'High-tech city exploration with traditional temple visits and Mount Fuji excursion',
    82000, 82000, 6, 2,
    'cultural', true, 93,
    ARRAY['Centrally located hotel', 'Daily breakfast', 'JR Rail Pass', 'Tokyo Skytree tickets', 'Mount Fuji day trip', 'Traditional tea ceremony'],
    ARRAY['International flights', 'Visa fees', 'Travel insurance', 'Most meals', 'Shopping'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival, hotel check-in, Shibuya and Harajuku exploration',
      'day2', 'Tokyo Skytree, Asakusa Sensoji Temple, traditional tea ceremony',
      'day3', 'Mount Fuji and Hakone day trip',
      'day4', 'Imperial Palace, Tsukiji Market, Ginza shopping',
      'day5', 'Akihabara electronics district, teamLab Borderless museum',
      'day6', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8'],
    'available',
    ARRAY['cultural', 'modern', 'sightseeing', 'technology'],
    18700, 143000
  ),
  -- Santorini Packages
  (
    'PKG-SNT-001',
    'Santorini Sunset Romance',
    (SELECT id FROM destinations WHERE city = 'Santorini'),
    5, 4,
    'Cliff-side accommodation with sunset views, wine tours, and Aegean cuisine',
    68000, 68000, 4, 2,
    'honeymoon', true, 87,
    ARRAY['Cliff-side cave hotel in Oia', 'Daily breakfast', 'Ferry transfers', 'Sunset catamaran cruise', 'Wine tasting tour', 'Caldera view dinner'],
    ARRAY['International flights', 'Travel insurance', 'Most meals', 'Personal expenses'],
    JSONB_BUILD_OBJECT(
      'day1', 'Arrival, cave hotel check-in, sunset in Oia',
      'day2', 'Red Beach, Ancient Akrotiri archaeological site',
      'day3', 'Wine tasting tour, traditional village exploration',
      'day4', 'Sunset catamaran cruise with dinner',
      'day5', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e'],
    'available',
    ARRAY['romantic', 'beach', 'cultural', 'wine'],
    16800, 112000
  ),
  -- Budget Packages
  (
    'PKG-THL-001',
    'Thailand Budget Explorer',
    (SELECT id FROM destinations WHERE country = 'France'),
    7, 6,
    'Affordable Southeast Asian adventure with temples, beaches, and street food',
    35000, 35000, 8, 2,
    'budget',  true, 78,
    ARRAY['Standard hotel accommodation', 'Daily breakfast', 'City tours', 'Temple visits', 'Island hopping day trip'],
    ARRAY['International flights', 'Visa fees', 'Most meals', 'Travel insurance'],
    JSONB_BUILD_OBJECT(
      'day1', 'Bangkok arrival, Grand Palace visit',
      'day2', 'Floating market, Wat Pho temple',
      'day3', 'Flight to Phuket, beach time',
      'day4', 'Phi Phi Islands day trip',
      'day5', 'Patong Beach, Thai massage',
      'day6', 'Return to Bangkok, free time',
      'day7', 'Departure'
    ),
    ARRAY['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a'],
    'available',
    ARRAY['budget', 'adventure', 'beach', 'cultural'],
    8900, 52000
  );

-- =====================================================
-- 3. INSERT FLIGHTS
-- =====================================================

INSERT INTO flights (
  flight_number, airline_code, airline_name, 
  departure_airport, departure_city, arrival_airport, arrival_city,
  departure_time, arrival_time, duration_minutes,
  aircraft_type, total_seats, available_seats, status, classes
) VALUES
  -- Delhi to Paris
  (
    'AF226',
    'AF',
    'Air France',
    'DEL',
    'New Delhi',
    'CDG',
    'Paris',
    '2026-03-15 02:30:00+05:30',
    '2026-03-15 08:45:00+01:00',
    495,
    'Boeing 787',
    250,
    45,
    'scheduled',
    JSONB_BUILD_OBJECT(
      'economy', JSONB_BUILD_OBJECT('price', 45000, 'available', 30, 'baggage', '23kg'),
      'business', JSONB_BUILD_OBJECT('price', 125000, 'available', 12, 'baggage', '32kg'),
      'first', JSONB_BUILD_OBJECT('price', 210000, 'available', 3, 'baggage', '40kg')
    )
  ),
  -- Mumbai to Dubai
  (
    'EK500',
    'EK',
    'Emirates',
    'BOM',
    'Mumbai',
    'DXB',
    'Dubai',
    '2026-03-10 09:15:00+05:30',
    '2026-03-10 11:45:00+04:00',
    210,
    'Airbus A380',
    400,
    78,
    'scheduled',
    JSONB_BUILD_OBJECT(
      'economy', JSONB_BUILD_OBJECT('price', 25000, 'available', 50, 'baggage', '20kg'),
      'business', JSONB_BUILD_OBJECT('price', 75000, 'available', 20, 'baggage', '30kg'),
      'first', JSONB_BUILD_OBJECT('price', 150000, 'available', 8, 'baggage', '40kg')
    )
  ),
  -- Bangalore to Bali
  (
    'SG452',
    'SQ',
    'Singapore Airlines',
    'BLR',
    'Bangalore',
    'DPS',
    'Denpasar',
    '2026-03-20 14:30:00+05:30',
    '2026-03-20 22:15:00+08:00',
    465,
    'Boeing 777',
    300,
    62,
    'scheduled',
    JSONB_BUILD_OBJECT(
      'economy', JSONB_BUILD_OBJECT('price', 35000, 'available', 45, 'baggage', '20kg'),
      'business', JSONB_BUILD_OBJECT('price', 95000, 'available', 15, 'baggage', '30kg')
    )
  ),
  -- Delhi to Tokyo
  (
    'NH829',
    'NH',
    'All Nippon Airways',
    'DEL',
    'New Delhi',
    'NRT',
    'Tokyo',
    '2026-04-05 23:45:00+05:30',
    '2026-04-06 10:30:00+09:00',
    465,
    'Boeing 787',
    250,
    54,
    'scheduled',
    JSONB_BUILD_OBJECT(
      'economy', JSONB_BUILD_OBJECT('price', 52000, 'available', 38, 'baggage', '23kg'),
      'business', JSONB_BUILD_OBJECT('price', 145000, 'available', 14, 'baggage', '32kg'),
      'first', JSONB_BUILD_OBJECT('price', 220000, 'available', 2, 'baggage', '40kg')
    )
  );

-- =====================================================
-- 4. TEST CUSTOMER DATA
-- =====================================================

-- Note: This assumes auth.users already has some test users
-- Insert a test customer (replace user_id with actual auth.users id)
INSERT INTO customers (
  user_id, full_name, email, phone,
  date_of_birth, nationality,
  passport_number, passport_expiry,
  emergency_contact, preferences
)
SELECT 
  id,
  'Test Agent',
  email,
  '+91-9876543210',
  '1990-01-15',
  'Indian',
  'A1234567',
  '2028-12-31',
  JSONB_BUILD_OBJECT(
    'name', 'Emergency Contact',
    'phone', '+91-9876543211',
    'relationship', 'Family'
  ),
  JSONB_BUILD_OBJECT(
    'budget_range', JSONB_BUILD_OBJECT('min', 50000, 'max', 150000),
    'preferred_airlines', ARRAY['Emirates', 'Singapore Airlines'],
    'meal_preferences', ARRAY['Vegetarian'],
    'seat_preferences', 'Window'
  )
FROM auth.users
WHERE email LIKE '%@%'
LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 5. ANALYTICS INITIALIZATION
-- =====================================================

-- Initialize dashboard metrics for today
INSERT INTO dashboard_metrics (
  metric_date, total_customers, total_bookings,
  total_revenue, new_customers_today, bookings_today,
  revenue_today, top_destinations, trending_packages,
  conversion_rate, avg_booking_value, customer_satisfaction
) VALUES (
  CURRENT_DATE,
  1, 0, 0, 1, 0, 0,
  ARRAY['Paris', 'Dubai'],
  ARRAY[]::uuid[],
  0, 0, 4.5
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check destinations
-- SELECT COUNT(*) as destination_count FROM destinations;

-- Check packages
-- SELECT COUNT(*) as package_count FROM packages;

-- Check flights
-- SELECT COUNT(*) as flight_count FROM flights;

-- Check trending packages
-- SELECT name, trend_score, instagram_mentions, youtube_views 
-- FROM packages 
-- WHERE is_trending = true 
-- ORDER BY trend_score DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Sample data inserted successfully!
-- Run the verification queries above to confirm.
