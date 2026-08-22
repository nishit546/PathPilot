-- ============================================================================
-- Seed File: 01_cities_activities.sql
-- Description: Comprehensive seed data for 20+ Global & National Destinations
--              with 60+ curated activities across culture, nature, adventure,
--              food, shopping, sightseeing, and entertainment.
-- ============================================================================

DO $$
DECLARE
    -- International City UUIDs
    city_tokyo_id      UUID := 'c1111111-1111-1111-1111-111111111111';
    city_kyoto_id      UUID := 'c2222222-2222-2222-2222-222222222222';
    city_paris_id      UUID := 'c3333333-3333-3333-3333-333333333333';
    city_rome_id       UUID := 'c4444444-4444-4444-4444-444444444444';
    city_bali_id       UUID := 'c5555555-5555-5555-5555-555555555555';
    city_nyc_id        UUID := 'c6666666-6666-6666-6666-666666666666';
    city_dubai_id      UUID := 'c7777777-7777-7777-7777-777777777777';
    city_singapore_id  UUID := 'c8888888-8888-8888-8888-888888888888';
    city_bangkok_id    UUID := 'c9999999-9999-9999-9999-999999999999';
    city_london_id     UUID := 'caa11111-1111-1111-1111-111111111111';
    city_zurich_id     UUID := 'caa22222-2222-2222-2222-222222222222';
    city_phuket_id     UUID := 'caa33333-3333-3333-3333-333333333333';
    city_sydney_id     UUID := 'caa44444-4444-4444-4444-444444444444';

    -- National (Indian) City UUIDs
    city_jaipur_id     UUID := 'ca111111-1111-1111-1111-111111111111';
    city_varanasi_id   UUID := 'ca222222-2222-2222-2222-222222222222';
    city_manali_id     UUID := 'ca333333-3333-3333-3333-333333333333';
    city_goa_id        UUID := 'ca444444-4444-4444-4444-444444444444';
    city_kochi_id      UUID := 'ca555555-5555-5555-5555-555555555555';
    city_leh_id        UUID := 'ca666666-6666-6666-6666-666666666666';
    city_udaipur_id    UUID := 'ca777777-7777-7777-7777-777777777777';
    city_rishikesh_id  UUID := 'ca888888-8888-8888-8888-888888888888';
    city_amritsar_id   UUID := 'ca999999-9999-9999-9999-999999999999';
    city_agra_id       UUID := 'cba11111-1111-1111-1111-111111111111';
    city_darjeeling_id UUID := 'cba22222-2222-2222-2222-222222222222';
    city_mumbai_id     UUID := 'cba33333-3333-3333-3333-333333333333';
    city_bengaluru_id  UUID := 'cba44444-4444-4444-4444-444444444444';
BEGIN

    -- ========================================================================
    -- 1. INSERT CITIES (INTERNATIONAL & NATIONAL)
    -- ========================================================================
    INSERT INTO public.cities (id, name, country, state_region, description, image_url, latitude, longitude)
    VALUES
        -- International
        (city_tokyo_id, 'Tokyo', 'Japan', 'Kanto', 'A dynamic metropolis blending neon-lit skyscrapers with historic temples and world-class culinary scenes.', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', 35.6762, 139.6503),
        (city_kyoto_id, 'Kyoto', 'Japan', 'Kansai', 'The cultural heart of Japan, famous for classical Buddhist temples, gardens, imperial palaces, and traditional wooden houses.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80', 35.0116, 135.7681),
        (city_paris_id, 'Paris', 'France', 'Île-de-France', 'The City of Light, celebrated for high fashion, gastronomy, romantic boulevards, and timeless artistic landmarks.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', 48.8566, 2.3522),
        (city_rome_id, 'Rome', 'Italy', 'Lazio', 'The Eternal City, home to nearly three millennia of globally influential art, architecture, and classical antiquity.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', 41.9028, 12.4964),
        (city_bali_id, 'Bali', 'Indonesia', 'Bali Province', 'An Indonesian paradise known for forested volcanic mountains, iconic rice paddies, pristine beaches, and coral reefs.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80', -8.4095, 115.1889),
        (city_nyc_id, 'New York City', 'United States', 'New York', 'The premier global cultural hub featuring Broadway theater, Central Park, iconic skyline vistas, and multicultural neighborhoods.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80', 40.7128, -74.0060),
        (city_dubai_id, 'Dubai', 'United Arab Emirates', 'Dubai Emirate', 'An ultra-modern desert metropolis famous for towering architectural wonders, luxury shopping, and vibrant nightlife.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80', 25.2048, 55.2708),
        (city_singapore_id, 'Singapore', 'Singapore', 'Central Region', 'A gleaming global island city-state renowned for Gardens by the Bay, diverse street gastronomy, and tropical urban greenery.', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80', 1.3521, 103.8198),
        (city_bangkok_id, 'Bangkok', 'Thailand', 'Bangkok', 'Thailand’s vibrant capital famous for ornate gilded shrines, buzzing street food alleys, and lively boat-filled canals.', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80', 13.7563, 100.5018),
        (city_london_id, 'London', 'United Kingdom', 'Greater London', 'The historic British capital on the Thames, packed with royal palaces, West End theaters, world-class museums, and iconic red buses.', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', 51.5074, -0.1278),
        (city_zurich_id, 'Zurich', 'Switzerland', 'Zurich Canton', 'A scenic alpine hub on Lake Zurich, known for historic guild houses, Swiss chocolate boutiques, and gateway to snow peaks.', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=1200&q=80', 47.3769, 8.5417),
        (city_phuket_id, 'Phuket', 'Thailand', 'Phuket Province', 'Thailand’s largest island featuring Andaman turquoise waters, limestone karst sea caves, night markets, and beach resorts.', 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80', 7.8804, 98.3923),
        (city_sydney_id, 'Sydney', 'Australia', 'New South Wales', 'A coastal metropolis renowned for the sail-shaped Sydney Opera House, Harbour Bridge, Bondi surf, and coastal walks.', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80', -33.8688, 151.2093),

        -- National (India)
        (city_jaipur_id, 'Jaipur', 'India', 'Rajasthan', 'The iconic Pink City, famed for majestic hill forts, royal palaces, vibrant bazaars, and rich Rajput culinary heritage.', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80', 26.9124, 75.7873),
        (city_varanasi_id, 'Varanasi', 'India', 'Uttar Pradesh', 'The spiritual capital of India on the banks of the sacred Ganges, home to ancient ghats, classical music, and mystical evening aartis.', 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80', 25.3176, 82.9739),
        (city_manali_id, 'Manali', 'India', 'Himachal Pradesh', 'A high-altitude Himalayan resort town surrounded by snow-capped peaks, pine forests, adventure valleys, and apple orchards.', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80', 32.2432, 77.1892),
        (city_goa_id, 'Goa', 'India', 'Goa', 'India’s premier coastal paradise, celebrated for sun-drenched beaches, Portuguese colonial architecture, and fresh seafood shacks.', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', 15.2993, 74.1240),
        (city_kochi_id, 'Kochi', 'India', 'Kerala', 'The Queen of the Arabian Sea, featuring historic Chinese fishing nets, spice trading streets, and gateway to tranquil backwaters.', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80', 9.9312, 76.2673),
        (city_leh_id, 'Leh Ladakh', 'India', 'Ladakh', 'A breathtaking high-altitude Himalayan desert with crystal-clear turquoise lakes, ancient Buddhist gompas, and dramatic mountain passes.', 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80', 34.1526, 77.5771),
        (city_udaipur_id, 'Udaipur', 'India', 'Rajasthan', 'The City of Lakes and Venice of the East, famed for shimmering Lake Pichola, ornate marble palaces, and royal courtyards.', 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80', 24.5854, 73.7125),
        (city_rishikesh_id, 'Rishikesh', 'India', 'Uttarakhand', 'The Yoga Capital of the World on the foothills of the Himalayas, famed for white water rafting, ashrams, and Beatles cafe vibes.', 'https://images.unsplash.com/photo-1600100397608-f010e47c5d41?auto=format&fit=crop&w=1200&q=80', 30.0869, 78.2676),
        (city_amritsar_id, 'Amritsar', 'India', 'Punjab', 'The holy city of the Golden Temple (Harmandir Sahib), famous for spiritual serenity, 24/7 community langar, and Wagah Border ceremony.', 'https://images.unsplash.com/photo-1588096344356-9b5145b59639?auto=format&fit=crop&w=1200&q=80', 31.6340, 74.8723),
        (city_agra_id, 'Agra', 'India', 'Uttar Pradesh', 'Home of the timeless white marble Taj Mahal, majestic Agra Fort, and rich Mughal architectural legacies on the Yamuna river.', 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80', 27.1767, 78.0081),
        (city_darjeeling_id, 'Darjeeling', 'India', 'West Bengal', 'The Queen of the Hills, celebrated for tea gardens, view of Mount Kanchenjunga, and the UNESCO Himalayan Toy Train.', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80', 27.0410, 88.2663),
        (city_mumbai_id, 'Mumbai', 'India', 'Maharashtra', 'The Maximum City, bustling with colonial heritage landmarks, Marine Drive sunset views, Bollywood, and iconic street food.', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80', 19.0760, 72.8777),
        (city_bengaluru_id, 'Bengaluru', 'India', 'Karnataka', 'The Garden City and Silicon Valley of India, known for lush parks, vibrant craft breweries, and tech innovation culture.', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80', 12.9716, 77.5946)
    ON CONFLICT (name, country, state_region) DO UPDATE
    SET description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude;

    -- ========================================================================
    -- 2. INSERT CURATED ACTIVITIES (60+ ACTIVITIES)
    -- ========================================================================
    INSERT INTO public.activities (id, city_id, name, description, category, estimated_cost, duration_minutes, image_url)
    VALUES
        -- Tokyo Activities
        ('a1111111-0001-0000-0000-000000000001', city_tokyo_id, 'Senso-ji Temple & Asakusa Walking Tour', 'Explore Tokyo’s oldest Buddhist temple and stroll down the vibrant Nakamise shopping street.', 'culture', 0.00, 120, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80'),
        ('a1111111-0002-0000-0000-000000000002', city_tokyo_id, 'teamLab Planets Digital Art Immersion', 'Walk through water and dynamic immersive digital gardens in Toyosu.', 'sightseeing', 38.00, 90, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'),
        ('a1111111-0003-0000-0000-000000000003', city_tokyo_id, 'Tsukiji Outer Market Food Tasting', 'Sample fresh tuna sashimi, tamagoyaki, wagyu skewers, and matcha sweets from historic food stalls.', 'food', 35.00, 120, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80'),
        ('a1111111-0004-0000-0000-000000000004', city_tokyo_id, 'Shibuya Crossing & Rooftop Sky View', 'Witness the busiest intersection in the world and view sunset from Shibuya Sky rooftop deck.', 'sightseeing', 22.00, 75, 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80'),

        -- Kyoto Activities
        ('a2222222-0001-0000-0000-000000000001', city_kyoto_id, 'Fushimi Inari Shrine Hike', 'Hike through thousands of vermilion torii gates winding up Mount Inari.', 'nature', 0.00, 150, 'https://images.unsplash.com/photo-1478436127897-769e00d0c71e?auto=format&fit=crop&w=800&q=80'),
        ('a2222222-0002-0000-0000-000000000002', city_kyoto_id, 'Arashiyama Bamboo Grove & Monkey Park', 'Walk through towering bamboo stalks and visit the wild macaque sanctuary overlooking Kyoto.', 'nature', 10.00, 180, 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=800&q=80'),
        ('a2222222-0003-0000-0000-000000000003', city_kyoto_id, 'Traditional Matcha Tea Ceremony in Gion', 'Experience authentic Zen tea ritual hosted by a licensed Urasenke tea master.', 'culture', 45.00, 60, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'),

        -- Paris Activities
        ('a3333333-0001-0000-0000-000000000001', city_paris_id, 'Louvre Museum Masterpieces Tour', 'Skip-the-line guided access to the Mona Lisa, Venus de Milo, and Winged Victory.', 'culture', 22.00, 180, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80'),
        ('a3333333-0002-0000-0000-000000000002', city_paris_id, 'Eiffel Tower Summit Access & Champagne', 'Ascend to the top summit of the Iron Lady with panoramic views across Paris.', 'sightseeing', 35.00, 120, 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80'),
        ('a3333333-0003-0000-0000-000000000003', city_paris_id, 'Seine River Sunset Dinner Cruise', 'Enjoy a 3-course French dinner while gliding past illuminated monuments.', 'food', 85.00, 150, 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80'),

        -- Rome Activities
        ('a4444444-0001-0000-0000-000000000001', city_rome_id, 'Colosseum & Roman Forum Gladiator Arena', 'Step onto the arena floor of the Colosseum and wander through the ruins of ancient Rome.', 'culture', 28.00, 180, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'),
        ('a4444444-0002-0000-0000-000000000002', city_rome_id, 'Vatican Museums & Sistine Chapel', 'Witness Michelangelo’s magnificent ceiling fresco and the papal art collections.', 'culture', 30.00, 210, 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=800&q=80'),
        ('a4444444-0003-0000-0000-000000000003', city_rome_id, 'Trastevere Culinary & Wine Tour', 'Taste authentic carbonara, supplì, artisanal gelato, and local Roman wines.', 'food', 65.00, 180, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'),

        -- Dubai Activities
        ('a7777777-0001-0000-0000-000000000001', city_dubai_id, 'Burj Khalifa At the Top (148th Floor)', 'Soar up the world’s tallest tower for unmatched desert skyline and Gulf vistas.', 'sightseeing', 75.00, 90, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'),
        ('a7777777-0002-0000-0000-000000000002', city_dubai_id, 'Red Dune Desert Safari & BBQ Dinner', 'Dune bashing in 4x4, sandboarding, camel rides, and Arabic barbecue under stars.', 'adventure', 60.00, 360, 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80'),
        ('a7777777-0003-0000-0000-000000000003', city_dubai_id, 'Dubai Marina Luxury Yacht Cruise', 'Glide past JBR and Atlantis Palm on a luxury catamaran with sunset mocktails.', 'entertainment', 50.00, 120, 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80'),

        -- Singapore Activities
        ('a8888888-0001-0000-0000-000000000001', city_singapore_id, 'Gardens by the Bay & Supertree Observatory', 'Explore the Cloud Forest indoor waterfall and walk the futuristic Supertree skyway.', 'nature', 28.00, 150, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80'),
        ('a8888888-0002-0000-0000-000000000002', city_singapore_id, 'Chinatown & Maxwell Hawker Food Trail', 'Taste legendary Tian Tian Hainanese chicken rice, laksa, and satay skewers.', 'food', 18.00, 120, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'),
        ('a8888888-0003-0000-0000-000000000003', city_singapore_id, 'Night Safari Tram Adventure', 'World’s first nocturnal wildlife park with open tram ride through Asian rainforest habitats.', 'adventure', 40.00, 180, 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80'),

        -- London Activities
        ('ab111111-0001-0000-0000-000000000001', city_london_id, 'Tower of London & Crown Jewels Tour', 'Explore the 1,000-year-old fortress and view the world-famous royal Crown Jewels.', 'culture', 35.00, 180, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'),
        ('ab111111-0002-0000-0000-000000000002', city_london_id, 'Thames River Cruise to Greenwich', 'Glide past Big Ben, St. Paul’s Cathedral, and Tower Bridge to the Prime Meridian.', 'sightseeing', 25.00, 120, 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80'),
        ('ab111111-0003-0000-0000-000000000003', city_london_id, 'Borough Market British Food Tasting', 'Taste artisanal cheddar cheeses, hot Scotch eggs, meat pies, and warm cinnamon doughnuts.', 'food', 30.00, 120, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80'),

        -- Zurich Activities
        ('ab222222-0001-0000-0000-000000000001', city_zurich_id, 'Jungfraujoch Top of Europe Alpine Excursion', 'Train journey to 3,454m altitude with Ice Palace, Aletsch Glacier, and snow plateaus.', 'nature', 180.00, 480, 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80'),
        ('ab222222-0002-0000-0000-000000000002', city_zurich_id, 'Lake Zurich Sunset Boat Cruise', 'Panoramic lake sailing with views of the snow-covered Glarus Alps and lakeside villas.', 'sightseeing', 30.00, 90, 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=800&q=80'),
        ('ab222222-0003-0000-0000-000000000003', city_zurich_id, 'Lindt Home of Chocolate Tasting Tour', 'Marvel at the world’s tallest chocolate fountain and sample infinite Swiss pralines.', 'food', 18.00, 120, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80'),

        -- Phuket Activities
        ('ab333333-0001-0000-0000-000000000001', city_phuket_id, 'Phi Phi & Maya Bay Speedboat Tour', 'Snorkel in turquoise waters and visit Maya Bay where The Beach was filmed.', 'adventure', 65.00, 480, 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=800&q=80'),
        ('ab333333-0002-0000-0000-000000000002', city_phuket_id, 'Big Buddha & Wat Chalong Temple Visit', 'Panoramic 360-degree island views from the 45-meter tall white marble seated Buddha.', 'culture', 0.00, 150, 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=800&q=80'),
        ('ab333333-0003-0000-0000-000000000003', city_phuket_id, 'Phuket Old Town Sunday Walking Street Night Market', 'Taste mango sticky rice, grilled skewers, and coconut ice cream among Sino-Portuguese shophouses.', 'food', 15.00, 180, 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80'),

        -- Sydney Activities
        ('ab444444-0001-0000-0000-000000000001', city_sydney_id, 'Sydney Harbour BridgeClimb Dawn Tour', 'Climb to the summit of the iconic bridge for 360-degree sunrise views of the harbor.', 'adventure', 190.00, 210, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80'),
        ('ab444444-0002-0000-0000-000000000002', city_sydney_id, 'Bondi to Coogee Coastal Cliff Walk', 'Scenic 6km cliffside path past dramatic headlands, Tamarama, and ocean swimming pools.', 'nature', 0.00, 180, 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=800&q=80'),
        ('ab444444-0003-0000-0000-000000000003', city_sydney_id, 'Sydney Opera House Architectural Tour', 'Go behind the scenes of the world’s most iconic performing arts shells.', 'culture', 32.00, 90, 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&w=800&q=80'),

        -- Jaipur Activities (National)
        ('aa111111-0001-0000-0000-000000000001', city_jaipur_id, 'Amber Fort & Elephant Pathway Exploration', 'Ascend the rugged Aravalli hilltop to explore grand courtyards, Sheesh Mahal mirror palace, and secret tunnels.', 'culture', 12.00, 210, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'),
        ('aa111111-0002-0000-0000-000000000002', city_jaipur_id, 'Hawa Mahal & Johari Bazaar Jewelry Trail', 'Photograph the 953 honeycomb windows of the Palace of Winds and shop for handcrafted gemstones.', 'shopping', 8.00, 150, 'https://images.unsplash.com/photo-1609137144822-26368d4077c5?auto=format&fit=crop&w=800&q=80'),
        ('aa111111-0003-0000-0000-000000000003', city_jaipur_id, 'Authentic Rajasthani Thali at Chokhi Dhani', 'Traditional village cultural evening with folk Ghoomar dance, puppet shows, and unlimited Dal Baati Churma.', 'food', 20.00, 240, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80'),

        -- Varanasi Activities (National)
        ('aa222222-0001-0000-0000-000000000001', city_varanasi_id, 'Dawn Boat Ride along Dashashwamedh Ghat', 'Witness sunrise over the sacred Ganges as pilgrims perform holy morning rituals and prayers.', 'culture', 10.00, 120, 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80'),
        ('aa222222-0002-0000-0000-000000000002', city_varanasi_id, 'Grand Evening Ganga Aarti Ceremony', 'Experience chanting priests, brass lamps, conch shells, and floating diya offerings on the riverbank.', 'culture', 0.00, 90, 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80'),
        ('aa222222-0003-0000-0000-000000000003', city_varanasi_id, 'Kashi Street Food & Malaiyo Dessert Tour', 'Savor Banarasi kachori sabzi, tamatar chaat, creamy lassi in clay kulhads, and winter saffron malaiyo.', 'food', 6.00, 120, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'),

        -- Manali Activities (National)
        ('aa333333-0001-0000-0000-000000000001', city_manali_id, 'Solang Valley Paragliding & Zorbing', 'Tandem paragliding flight offering bird’s eye view of snow-dusted Himalayan peaks and alpine meadows.', 'adventure', 35.00, 180, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'),
        ('aa333333-0002-0000-0000-000000000002', city_manali_id, 'Old Manali Cafe Trail & Cedar Forest Walk', 'Explore stone-and-wood Himalayan architecture, indie bakeries, live acoustic music, and pine trails.', 'food', 12.00, 180, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'),
        ('aa333333-0003-0000-0000-000000000003', city_manali_id, 'Atal Tunnel & Sissu Waterfall Day Excursion', 'Drive through the engineering marvel of Atal Tunnel into the rugged, mystical Lahaul Valley.', 'nature', 25.00, 300, 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=800&q=80'),

        -- Goa Activities (National)
        ('aa444444-0001-0000-0000-000000000001', city_goa_id, 'Old Goa Latin Quarter (Fontainhas) Heritage Walk', 'Wander through pastel-painted Portuguese villas, art galleries, and historic bakeries in Panaji.', 'culture', 8.00, 120, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'),
        ('aa444444-0002-0000-0000-000000000002', city_goa_id, 'Palolem Beach Kayaking & Sunset Dolphin Cruise', 'Paddle through serene South Goa cove waters and watch coastal bottle-nosed dolphins.', 'adventure', 18.00, 150, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'),
        ('aa444444-0003-0000-0000-000000000003', city_goa_id, 'Goan Crab Xec Xec & Beach Shack Feast', 'Fresh seafood feast with tiger prawns, fish curry rice, and feni cocktails right on the sand.', 'food', 22.00, 150, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'),

        -- Kochi Activities (National)
        ('aa555555-0001-0000-0000-000000000001', city_kochi_id, 'Fort Kochi Heritage Walk & Chinese Nets', 'Stroll past colonial Dutch warehouses, Santa Cruz Basilica, and cantilevered Chinese fishing nets.', 'culture', 0.00, 120, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'),
        ('aa555555-0002-0000-0000-000000000002', city_kochi_id, 'Kathakali Dance & Martial Arts Evening', 'Watch intricate makeup transformation followed by dynamic Kathakali story performance and Kalaripayattu.', 'culture', 14.00, 120, 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'),
        ('aa555555-0003-0000-0000-000000000003', city_kochi_id, 'Alleppey Houseboat Backwater Cruise with Karimeen', 'Glide through palm-fringed canals with traditional banana-leaf Kerala lunch and pearl spot fish fry.', 'nature', 60.00, 360, 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80'),

        -- Leh Ladakh Activities (National)
        ('aa666666-0001-0000-0000-000000000001', city_leh_id, 'Pangong Tso High-Altitude Lake Excursion', 'Journey across Chang La Pass (17,688 ft) to the world’s highest saltwater lake changing colors from turquoise to blue.', 'nature', 45.00, 480, 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80'),
        ('aa666666-0002-0000-0000-000000000002', city_leh_id, 'Thiksey & Hemis Monastery Morning Prayers', 'Experience early morning Buddhist chanting with butter tea in the twelve-story hilltop monastery.', 'culture', 5.00, 180, 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'),
        ('aa666666-0003-0000-0000-000000000003', city_leh_id, 'Nubra Valley Double-Humped Camel Safari', 'Cross the mighty Khardung La pass to ride Bactrian camels across the silver sand dunes of Hunder.', 'adventure', 30.00, 360, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80'),

        -- Udaipur Activities (National)
        ('aa777777-0001-0000-0000-000000000001', city_udaipur_id, 'City Palace Complex & Crystal Gallery Tour', 'Explore Rajasthan’s largest palace complex overlooking Lake Pichola with mirrored balconies and marble courtyards.', 'culture', 14.00, 180, 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80'),
        ('aa777777-0002-0000-0000-000000000002', city_udaipur_id, 'Lake Pichola Sunset Boat Cruise to Jagmandir', 'Romantic boat cruise past Lake Palace with views of the Aravalli hills illuminated in golden hour.', 'sightseeing', 12.00, 90, 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'),
        ('aa777777-0003-0000-0000-000000000003', city_udaipur_id, 'Dharohar Folk Dance at Bagore Ki Haveli', 'Dynamic Rajasthani puppet shows, Terah Taali, and Chari dance right on the water edge of Gangaur Ghat.', 'entertainment', 6.00, 90, 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80'),

        -- Rishikesh Activities (National)
        ('aa888888-0001-0000-0000-000000000001', city_rishikesh_id, 'White Water River Rafting (Shivpuri to NIM Beach)', 'Conquer grade III and IV rapids like Roller Coaster and Golf Course on the emerald Ganges river.', 'adventure', 18.00, 240, 'https://images.unsplash.com/photo-1600100397608-f010e47c5d41?auto=format&fit=crop&w=800&q=80'),
        ('aa888888-0002-0000-0000-000000000002', city_rishikesh_id, 'Sunrise Yoga & Meditation at Parmarth Niketan', 'Guided Hatha yoga and breathwork session overlooking the Ram Jhula suspension bridge.', 'nature', 8.00, 90, 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'),
        ('aa888888-0003-0000-0000-000000000003', city_rishikesh_id, 'Beatles Ashram (Chaurasi Kutia) Graffiti Walk', 'Explore the forested meditation domes where the Beatles composed the White Album in 1968.', 'culture', 8.00, 120, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'),

        -- Amritsar Activities (National)
        ('aa999999-0001-0000-0000-000000000001', city_amritsar_id, 'Golden Temple (Harmandir Sahib) & Langar Sewa', 'Experience the spiritual sanctum wrapped in real gold foil and participate in the world’s largest free community kitchen.', 'culture', 0.00, 180, 'https://images.unsplash.com/photo-1588096344356-9b5145b59639?auto=format&fit=crop&w=800&q=80'),
        ('aa999999-0002-0000-0000-000000000002', city_amritsar_id, 'Wagah Border Beating Retreat Ceremony', 'Electrifying patriotic flag-lowering military drill ceremony between India and Pakistan border guards.', 'entertainment', 0.00, 240, 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80'),
        ('aa999999-0003-0000-0000-000000000003', city_amritsar_id, 'Amritsari Kulcha & Makhan Fish Food Trail', 'Crispy clay-oven baked potato-onion kulchas dripping with butter paired with spicy chole and sweet lassi.', 'food', 8.00, 120, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'),

        -- Agra Activities (National)
        ('ac111111-0001-0000-0000-000000000001', city_agra_id, 'Sunrise Taj Mahal Guided Monument Tour', 'Witness the changing pastel pink and gold colors of the iconic marble mausoleum at dawn.', 'culture', 18.00, 180, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80'),
        ('ac111111-0002-0000-0000-000000000002', city_agra_id, 'Agra Fort & Diwan-i-Khas Royal Tour', 'Explore the massive red sandstone fortress where Emperor Shah Jahan spent his final years.', 'culture', 10.00, 120, 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'),
        ('ac111111-0003-0000-0000-000000000003', city_agra_id, 'Mughlai Kebab & Petha Sweet Tasting', 'Sample Agra’s famous translucent Ash Gourd Petha and charcoal-grilled Seekh kebabs.', 'food', 10.00, 90, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80'),

        -- Darjeeling Activities (National)
        ('ac222222-0001-0000-0000-000000000001', city_darjeeling_id, 'Tiger Hill Sunrise & Kanchenjunga View', 'Watch sunrise illuminate the world’s third-highest mountain peak with golden Himalayan glow.', 'nature', 10.00, 180, 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'),
        ('ac222222-0002-0000-0000-000000000002', city_darjeeling_id, 'Himalayan Toy Train Joyride (Ghum Station)', 'Ride the UNESCO heritage steam engine through Batasia Loop to India’s highest railway station.', 'sightseeing', 20.00, 150, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'),
        ('ac222222-0003-0000-0000-000000000003', city_darjeeling_id, 'Happy Valley Tea Estate Plucking & Tasting', 'Walk through emerald tea bushes and learn the art of orthodox Muscatel Black Tea infusion.', 'food', 8.00, 120, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80')
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        estimated_cost = EXCLUDED.estimated_cost,
        duration_minutes = EXCLUDED.duration_minutes,
        image_url = EXCLUDED.image_url;

END $$;
