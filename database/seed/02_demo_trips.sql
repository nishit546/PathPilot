-- ============================================================================
-- Seed File: 02_demo_trips.sql
-- Description: Authentic Indian traveler profiles, national & international multi-city
--              itineraries, scheduled daily activities, budget items, posts, and share links.
-- ============================================================================

DO $$
DECLARE
    -- Indian User UUIDs (10 Profiles)
    user_harshit_id UUID := '11111111-1111-1111-1111-111111111111';
    user_aarav_id   UUID := '22222222-2222-2222-2222-222222222222';
    user_ananya_id  UUID := '33333333-3333-3333-3333-333333333333';
    user_rohan_id   UUID := '44444444-4444-4444-4444-444444444444';
    user_priya_id   UUID := '55555555-5555-5555-5555-555555555555';
    user_vikram_id  UUID := '66666666-6666-6666-6666-666666666666';
    user_neha_id    UUID := '77777777-7777-7777-7777-777777777777';
    user_aditya_id  UUID := '88888888-8888-8888-8888-888888888888';
    user_tanvi_id   UUID := '99999999-9999-9999-9999-999999999999';
    user_kabir_id   UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    -- Cities (International & National)
    city_tokyo_id      UUID := 'c1111111-1111-1111-1111-111111111111';
    city_kyoto_id      UUID := 'c2222222-2222-2222-2222-222222222222';
    city_paris_id      UUID := 'c3333333-3333-3333-3333-333333333333';
    city_rome_id       UUID := 'c4444444-4444-4444-4444-444444444444';
    city_dubai_id      UUID := 'c7777777-7777-7777-7777-777777777777';
    city_singapore_id  UUID := 'c8888888-8888-8888-8888-888888888888';
    city_london_id     UUID := 'caa11111-1111-1111-1111-111111111111';
    city_zurich_id     UUID := 'caa22222-2222-2222-2222-222222222222';
    city_phuket_id     UUID := 'caa33333-3333-3333-3333-333333333333';

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

    -- Trips (9 Detailed Trips)
    trip_japan_id     UUID := 'a1111111-1111-1111-1111-111111111111';
    trip_rajasthan_id UUID := 'a2222222-2222-2222-2222-222222222222';
    trip_kerala_id    UUID := 'a3333333-3333-3333-3333-333333333333';
    trip_ladakh_id    UUID := 'a4444444-4444-4444-4444-444444444444';
    trip_dubai_id     UUID := 'a5555555-5555-5555-5555-555555555555';
    trip_rishikesh_id UUID := 'a6666666-6666-6666-6666-666666666666';
    trip_mewar_id     UUID := 'a7777777-7777-7777-7777-777777777777';
    trip_swiss_id     UUID := 'a8888888-8888-8888-8888-888888888888';
    trip_london_id    UUID := 'a9999999-9999-9999-9999-999999999999';

    -- Trip Sections
    sec_tokyo_id      UUID := 'b1111111-1111-1111-1111-111111111111';
    sec_kyoto_id      UUID := 'b1111111-2222-2222-2222-222222222222';
    sec_jaipur_id     UUID := 'b2222222-1111-1111-1111-111111111111';
    sec_varanasi_id   UUID := 'b2222222-2222-2222-2222-222222222222';
    sec_kochi_id      UUID := 'b3333333-1111-1111-1111-111111111111';
    sec_goa_id        UUID := 'b3333333-2222-2222-2222-222222222222';
    sec_manali_id     UUID := 'b4444444-1111-1111-1111-111111111111';
    sec_leh_id        UUID := 'b4444444-2222-2222-2222-222222222222';
    sec_dubai_id      UUID := 'b5555555-1111-1111-1111-111111111111';
    sec_rishikesh_id  UUID := 'b6666666-1111-1111-1111-111111111111';
    sec_agra_id       UUID := 'b6666666-2222-2222-2222-222222222222';
    sec_udaipur_id    UUID := 'b7777777-1111-1111-1111-111111111111';
    sec_jaipur2_id    UUID := 'b7777777-2222-2222-2222-222222222222';
    sec_zurich_id     UUID := 'b8888888-1111-1111-1111-111111111111';
    sec_london_id     UUID := 'b9999999-1111-1111-1111-111111111111';

    -- Days
    day_jp_t1_id UUID := 'd1111111-1111-0000-0000-000000000001';
    day_jp_t2_id UUID := 'd1111111-1111-0000-0000-000000000002';
    day_jp_k1_id UUID := 'd1111111-2222-0000-0000-000000000001';
    day_jp_k2_id UUID := 'd1111111-2222-0000-0000-000000000002';

    day_rj_j1_id UUID := 'd2222222-1111-0000-0000-000000000001';
    day_rj_j2_id UUID := 'd2222222-1111-0000-0000-000000000002';
    day_rj_v1_id UUID := 'd2222222-2222-0000-0000-000000000001';
    day_rj_v2_id UUID := 'd2222222-2222-0000-0000-000000000002';

    day_kl_k1_id UUID := 'd3333333-1111-0000-0000-000000000001';
    day_kl_g1_id UUID := 'd3333333-2222-0000-0000-000000000001';

    day_ld_m1_id UUID := 'd4444444-1111-0000-0000-000000000001';
    day_ld_l1_id UUID := 'd4444444-2222-0000-0000-000000000001';

    day_db_d1_id UUID := 'd5555555-1111-0000-0000-000000000001';
    day_db_d2_id UUID := 'd5555555-1111-0000-0000-000000000002';

    day_rk_r1_id UUID := 'd6666666-1111-0000-0000-000000000001';
    day_rk_a1_id UUID := 'd6666666-2222-0000-0000-000000000001';

    day_mw_u1_id UUID := 'd7777777-1111-0000-0000-000000000001';
    day_mw_j1_id UUID := 'd7777777-2222-0000-0000-000000000001';

    day_sw_z1_id UUID := 'd8888888-1111-0000-0000-000000000001';
    day_ln_l1_id UUID := 'd9999999-1111-0000-0000-000000000001';

BEGIN

    -- Cleanup existing demo data for clean idempotency
    DELETE FROM public.budget_items WHERE trip_id IN (
        trip_japan_id, trip_rajasthan_id, trip_kerala_id, trip_ladakh_id,
        trip_dubai_id, trip_rishikesh_id, trip_mewar_id, trip_swiss_id, trip_london_id
    );
    DELETE FROM public.day_activities WHERE day_id IN (
        day_jp_t1_id, day_jp_t2_id, day_jp_k1_id, day_jp_k2_id,
        day_rj_j1_id, day_rj_j2_id, day_rj_v1_id, day_rj_v2_id,
        day_kl_k1_id, day_kl_g1_id, day_ld_m1_id, day_ld_l1_id,
        day_db_d1_id, day_db_d2_id, day_rk_r1_id, day_rk_a1_id,
        day_mw_u1_id, day_mw_j1_id, day_sw_z1_id, day_ln_l1_id
    );
    DELETE FROM public.community_posts WHERE user_id IN (
        user_harshit_id, user_aarav_id, user_ananya_id, user_rohan_id,
        user_priya_id, user_vikram_id, user_neha_id, user_aditya_id,
        user_tanvi_id, user_kabir_id
    );
    DELETE FROM public.shared_trips WHERE trip_id IN (
        trip_japan_id, trip_rajasthan_id, trip_kerala_id, trip_ladakh_id,
        trip_dubai_id, trip_rishikesh_id, trip_mewar_id, trip_swiss_id, trip_london_id
    );

    -- ========================================================================
    -- 1. AUTH USERS (10 INDIAN TRAVELERS)
    -- ========================================================================
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES
        (
            user_harshit_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'harshit@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Harshit","last_name":"Kumar","city":"Bengaluru","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_aarav_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'aarav.sharma@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Aarav","last_name":"Sharma","city":"New Delhi","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_ananya_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'ananya.iyer@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Ananya","last_name":"Iyer","city":"Chennai","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_rohan_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'rohan.verma@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Rohan","last_name":"Verma","city":"Mumbai","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_priya_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'priya.sen@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Priyadarshini","last_name":"Sen","city":"Kolkata","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_vikram_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'vikram.malhotra@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Vikram","last_name":"Malhotra","city":"Hyderabad","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_neha_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'neha.kapoor@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Neha","last_name":"Kapoor","city":"Chandigarh","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_aditya_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'aditya.nair@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Aditya","last_name":"Nair","city":"Kochi","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_tanvi_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'tanvi.deshmukh@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Tanvi","last_name":"Deshmukh","city":"Pune","country":"India"}',
            NOW(), NOW()
        ),
        (
            user_kabir_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'kabir.mehta@pathpilot.dev', crypt('PathPilotPass123!', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Kabir","last_name":"Mehta","city":"Ahmedabad","country":"India"}',
            NOW(), NOW()
        )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    -- ========================================================================
    -- 2. APPLICATION PROFILES
    -- ========================================================================
    INSERT INTO public.profiles (id, first_name, last_name, email, phone_number, city, country, bio, avatar_url)
    VALUES
        (user_harshit_id, 'Harshit', 'Kumar', 'harshit@pathpilot.dev', '+91 98765 43210', 'Bengaluru', 'India', 'Full-stack explorer and tech enthusiast. Always planning the next cultural adventure across East Asia and India.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'),
        (user_aarav_id, 'Aarav', 'Sharma', 'aarav.sharma@pathpilot.dev', '+91 98111 22334', 'New Delhi', 'India', 'Heritage buff and architectural photographer. Passionate about royal forts, Mughal history, and Indian street food.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'),
        (user_ananya_id, 'Ananya', 'Iyer', 'ananya.iyer@pathpilot.dev', '+91 94444 55667', 'Chennai', 'India', 'Solo traveler, classical dancer, and tea lover. Exploring coastal towns and tranquil backwaters.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'),
        (user_rohan_id, 'Rohan', 'Verma', 'rohan.verma@pathpilot.dev', '+91 99200 11223', 'Mumbai', 'India', 'Motorcycle enthusiast and high-altitude trekker. Conquering Himalayan passes and off-beat valleys.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'),
        (user_priya_id, 'Priyadarshini', 'Sen', 'priya.sen@pathpilot.dev', '+91 98300 44556', 'Kolkata', 'India', 'Literature enthusiast and street gastronomy blogger. Exploring vibrant Asian markets and art districts.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
        (user_vikram_id, 'Vikram', 'Malhotra', 'vikram.malhotra@pathpilot.dev', '+91 98490 77889', 'Hyderabad', 'India', 'Luxury travel curator and adventure seeker. Living for desert safaris, yacht cruises, and modern architecture.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'),
        (user_neha_id, 'Neha', 'Kapoor', 'neha.kapoor@pathpilot.dev', '+91 98140 12345', 'Chandigarh', 'India', 'Spiritual yogini, white water rafter, and nature lover. Seeking solace in Himalayan foothills.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'),
        (user_aditya_id, 'Aditya', 'Nair', 'aditya.nair@pathpilot.dev', '+91 94470 98765', 'Kochi', 'India', 'Alpine mountaineer and winter sports enthusiast. Chasing Swiss peaks, glaciers, and scenic trains.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'),
        (user_tanvi_id, 'Tanvi', 'Deshmukh', 'tanvi.deshmukh@pathpilot.dev', '+91 98220 54321', 'Pune', 'India', 'Architectural historian and theater enthusiast. Exploring Victorian London, West End plays, and European art.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'),
        (user_kabir_id, 'Kabir', 'Mehta', 'kabir.mehta@pathpilot.dev', '+91 98980 67890', 'Ahmedabad', 'India', 'Royal Rajputana enthusiast and textile designer. Exploring lake palaces, vintage cars, and desert folk arts.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80')
    ON CONFLICT (id) DO UPDATE
    SET first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url;

    -- ========================================================================
    -- 3. TRIPS (NATIONAL & INTERNATIONAL)
    -- ========================================================================
    INSERT INTO public.trips (id, user_id, title, description, start_date, end_date, status, visibility, overall_budget, cover_image_url)
    VALUES
        -- 1. Japan Spring Expedition (Harshit Kumar)
        (
            trip_japan_id, user_harshit_id,
            'Japan Spring Blossom: Tokyo & Kyoto',
            'An 8-day journey covering vibrant Tokyo tech districts, teamLab digital art, ancient Kyoto shrines, and Gion matcha tea ceremonies.',
            '2026-04-01', '2026-04-08', 'upcoming', 'public', 3200.00,
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 2. Royal Rajasthan & Kashi (Aarav Sharma)
        (
            trip_rajasthan_id, user_aarav_id,
            'Royal Rajasthan & Spiritual Kashi: Jaipur to Varanasi',
            'A 7-day heritage expedition through Rajput hill forts, Hawa Mahal jewel bazaars, and divine sunrise boat rides along the sacred Ganges.',
            '2026-03-15', '2026-03-21', 'ongoing', 'public', 950.00,
            'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 3. Coastal Serenity (Ananya Iyer)
        (
            trip_kerala_id, user_ananya_id,
            'Coastal Serenity: Fort Kochi Backwaters to Sunlit Goa',
            'A 6-day relaxing journey featuring Kathakali performances, Alleppey houseboat feasts, and Latin Quarter heritage walks in Goa.',
            '2026-04-12', '2026-04-17', 'upcoming', 'shared', 680.00,
            'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 4. High-Pass Himalayan Adventure (Rohan Verma)
        (
            trip_ladakh_id, user_rohan_id,
            'Himalayan Odyssey: Manali Alpine Valleys to Pangong Lake',
            'An 8-day thrill across Rohtang, Atal Tunnel, high-altitude Buddhist monasteries, and turquoise waters of Pangong Tso in Ladakh.',
            '2026-06-01', '2026-06-08', 'planning', 'public', 850.00,
            'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 5. Dubai Desert & Marina Glitz (Vikram Malhotra)
        (
            trip_dubai_id, user_vikram_id,
            'Arabian Luxury: Dubai Marina & Red Dune Safari',
            'A 5-day luxury getaway experiencing Burj Khalifa top deck, sunset yacht sailing, and desert dunes under Arabian starry skies.',
            '2026-05-01', '2026-05-05', 'upcoming', 'shared', 2400.00,
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 6. Sacred Ganges & Mughal Splendor (Neha Kapoor)
        (
            trip_rishikesh_id, user_neha_id,
            'Ganga Yoga & Mughal Wonders: Rishikesh to Agra',
            'A 5-day rejuvenating journey with white water rafting on the Ganges, Parmarth yoga, and sunrise at the timeless Taj Mahal.',
            '2026-04-20', '2026-04-24', 'upcoming', 'public', 550.00,
            'https://images.unsplash.com/photo-1600100397608-f010e47c5d41?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 7. Lakes & Palaces of Mewar (Kabir Mehta)
        (
            trip_mewar_id, user_kabir_id,
            'Venice of the East & Pink City: Udaipur to Jaipur',
            'A 6-day royal getaway featuring Lake Pichola boat cruises, City Palace mirrored halls, and folk dance evenings at Bagore Ki Haveli.',
            '2026-05-15', '2026-05-20', 'planning', 'shared', 820.00,
            'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 8. Swiss Alps Alpine Escape (Aditya Nair)
        (
            trip_swiss_id, user_aditya_id,
            'Swiss Alpine Wonderland: Zurich to Jungfraujoch Top of Europe',
            'A 5-day dream alpine trip through snow glaciers, Lindt chocolate fountains, and scenic cogwheel mountain railways.',
            '2026-06-10', '2026-06-14', 'planning', 'public', 2100.00,
            'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=1200&q=80'
        ),
        -- 9. London Royal Heritage (Tanvi Deshmukh)
        (
            trip_london_id, user_tanvi_id,
            'London Heritage & Thames Vistas: Tower Bridge to Borough Market',
            'A 5-day classic exploration of British royalty, Crown Jewels, Borough Market artisan delicacies, and West End theater.',
            '2026-07-01', '2026-07-05', 'upcoming', 'public', 1900.00,
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'
        )
    ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        visibility = EXCLUDED.visibility,
        overall_budget = EXCLUDED.overall_budget,
        cover_image_url = EXCLUDED.cover_image_url;

    -- ========================================================================
    -- 4. TRIP SECTIONS
    -- ========================================================================
    INSERT INTO public.trip_sections (id, trip_id, city_id, section_order, start_date, end_date, section_budget, notes)
    VALUES
        -- Japan (Harshit)
        (sec_tokyo_id, trip_japan_id, city_tokyo_id, 1, '2026-04-01', '2026-04-04', 1600.00, 'Stay in Shinjuku, focus on digital art, food markets, and modern cityscape.'),
        (sec_kyoto_id, trip_japan_id, city_kyoto_id, 2, '2026-04-05', '2026-04-08', 1600.00, 'Stay near Gion, focus on heritage shrines, bamboo grove, and tea rituals.'),

        -- Rajasthan & Varanasi (Aarav)
        (sec_jaipur_id, trip_rajasthan_id, city_jaipur_id, 1, '2026-03-15', '2026-03-17', 500.00, 'Heritage haveli stay near Pink City, fort tours, and gemstone shopping.'),
        (sec_varanasi_id, trip_rajasthan_id, city_varanasi_id, 2, '2026-03-18', '2026-03-21', 450.00, 'Ghat-side heritage stay, dawn boat rides, and evening Ganga Aarti.'),

        -- Kerala & Goa (Ananya)
        (sec_kochi_id, trip_kerala_id, city_kochi_id, 1, '2026-04-12', '2026-04-14', 380.00, 'Fort Kochi homestay and Alleppey day cruise.'),
        (sec_goa_id, trip_kerala_id, city_goa_id, 2, '2026-04-15', '2026-04-17', 300.00, 'South Goa beach cottage and Fontainhas Latin Quarter walk.'),

        -- Ladakh (Rohan)
        (sec_manali_id, trip_ladakh_id, city_manali_id, 1, '2026-06-01', '2026-06-03', 350.00, 'Acclimatization, Solang paragliding, and Atal Tunnel excursion.'),
        (sec_leh_id, trip_ladakh_id, city_leh_id, 2, '2026-06-04', '2026-06-08', 500.00, 'Pangong lake camp, Nubra valley sand dunes, and Hemis monastery.'),

        -- Dubai (Vikram)
        (sec_dubai_id, trip_dubai_id, city_dubai_id, 1, '2026-05-01', '2026-05-05', 2400.00, 'Downtown luxury suite, desert safari, and Marina private yacht.'),

        -- Rishikesh & Agra (Neha)
        (sec_rishikesh_id, trip_rishikesh_id, city_rishikesh_id, 1, '2026-04-20', '2026-04-22', 320.00, 'Ashram stay, white water rafting, and yoga sessions.'),
        (sec_agra_id, trip_rishikesh_id, city_agra_id, 2, '2026-04-23', '2026-04-24', 230.00, 'Sunrise Taj Mahal guided tour and Agra Fort exploration.'),

        -- Udaipur & Jaipur (Kabir)
        (sec_udaipur_id, trip_mewar_id, city_udaipur_id, 1, '2026-05-15', '2026-05-17', 480.00, 'Lake Pichola heritage hotel and City Palace tour.'),
        (sec_jaipur2_id, trip_mewar_id, city_jaipur_id, 2, '2026-05-18', '2026-05-20', 340.00, 'Hawa Mahal photography and Chokhi Dhani thali dinner.'),

        -- Switzerland (Aditya)
        (sec_zurich_id, trip_swiss_id, city_zurich_id, 1, '2026-06-10', '2026-06-14', 2100.00, 'Lake Zurich hotel, Jungfraujoch alpine day trip, and Lindt chocolate.'),

        -- London (Tanvi)
        (sec_london_id, trip_london_id, city_london_id, 1, '2026-07-01', '2026-07-05', 1900.00, 'Covent Garden hotel, Tower of London, and Borough Market.')
    ON CONFLICT (id) DO UPDATE
    SET section_order = EXCLUDED.section_order,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        section_budget = EXCLUDED.section_budget;

    -- ========================================================================
    -- 5. ITINERARY DAYS
    -- ========================================================================
    INSERT INTO public.days (id, section_id, date, day_number, notes)
    VALUES
        -- Tokyo & Kyoto
        (day_jp_t1_id, sec_tokyo_id, '2026-04-01', 1, 'Arrival at Haneda, hotel check-in and Asakusa evening walk.'),
        (day_jp_t2_id, sec_tokyo_id, '2026-04-02', 2, 'Tsukiji fish market breakfast and teamLab digital exhibition.'),
        (day_jp_k1_id, sec_kyoto_id, '2026-04-05', 1, 'Shinkansen transfer to Kyoto, early Fushimi Inari hike.'),
        (day_jp_k2_id, sec_kyoto_id, '2026-04-06', 2, 'Arashiyama morning bamboo walk followed by Gion tea ceremony.'),

        -- Jaipur & Varanasi
        (day_rj_j1_id, sec_jaipur_id, '2026-03-15', 1, 'Morning Amber Fort hike, Sheesh Mahal exploration, and Chokhi Dhani dinner.'),
        (day_rj_j2_id, sec_jaipur_id, '2026-03-16', 2, 'Hawa Mahal sunrise photo shoot and Johari Bazaar handicraft shopping.'),
        (day_rj_v1_id, sec_varanasi_id, '2026-03-18', 1, 'Dawn boat ride along Dashashwamedh Ghat and Banarasi kachori breakfast.'),
        (day_rj_v2_id, sec_varanasi_id, '2026-03-19', 2, 'Kashi Vishwanath temple darshan and grand evening Ganga Aarti ceremony.'),

        -- Kerala & Goa
        (day_kl_k1_id, sec_kochi_id, '2026-04-12', 1, 'Fort Kochi heritage walk and Alleppey backwater banana leaf feast.'),
        (day_kl_g1_id, sec_goa_id, '2026-04-15', 1, 'Fontainhas Portuguese quarter stroll and Palolem beach kayaking.'),

        -- Ladakh
        (day_ld_m1_id, sec_manali_id, '2026-06-01', 1, 'Solang Valley tandem paragliding and Old Manali cafe trail.'),
        (day_ld_l1_id, sec_leh_id, '2026-06-04', 1, 'Thiksey monastery morning chanting and high-pass drive to Pangong Tso.'),

        -- Dubai
        (day_db_d1_id, sec_dubai_id, '2026-05-01', 1, 'Burj Khalifa 148th floor sky lounge and Dubai Mall fountain show.'),
        (day_db_d2_id, sec_dubai_id, '2026-05-02', 2, 'Red dune 4x4 safari, sandboarding, and Arabic barbecue under stars.'),

        -- Rishikesh & Agra
        (day_rk_r1_id, sec_rishikesh_id, '2026-04-20', 1, 'Shivpuri white water rafting on Ganges and Parmarth Niketan sunset aarti.'),
        (day_rk_a1_id, sec_agra_id, '2026-04-23', 1, 'Sunrise Taj Mahal monument entry and Agra Fort Diwan-i-Khas tour.'),

        -- Udaipur & Jaipur
        (day_mw_u1_id, sec_udaipur_id, '2026-05-15', 1, 'City Palace complex exploration and Lake Pichola sunset boat ride to Jagmandir.'),
        (day_mw_j1_id, sec_jaipur2_id, '2026-05-18', 1, 'Amber Fort elephant pathway and Chokhi Dhani folk dance dinner.'),

        -- Switzerland
        (day_sw_z1_id, sec_zurich_id, '2026-06-11', 1, 'Jungfraujoch Top of Europe cogwheel railway and Lindt chocolate fountain.'),

        -- London
        (day_ln_l1_id, sec_london_id, '2026-07-01', 1, 'Tower of London Crown Jewels tour and Borough Market British food tasting.')
    ON CONFLICT (id) DO UPDATE
    SET date = EXCLUDED.date,
        day_number = EXCLUDED.day_number,
        notes = EXCLUDED.notes;

    -- ========================================================================
    -- 6. DAY ACTIVITIES
    -- ========================================================================
    INSERT INTO public.day_activities (day_id, activity_id, activity_order, planned_time, notes, expense_amount)
    VALUES
        -- Tokyo Day 1
        (day_jp_t1_id, 'a1111111-0001-0000-0000-000000000001', 1, '10:00:00', 'Explore Senso-ji temple grounds and Nakamise shopping street', 0.00),
        (day_jp_t1_id, 'a1111111-0004-0000-0000-000000000004', 2, '17:30:00', 'Catch golden hour over Shibuya Crossing from rooftop deck', 22.00),
        -- Tokyo Day 2
        (day_jp_t2_id, 'a1111111-0003-0000-0000-000000000003', 1, '09:00:00', 'Sample fresh sashimi and tamagoyaki breakfast at Tsukiji', 35.00),
        (day_jp_t2_id, 'a1111111-0002-0000-0000-000000000002', 2, '14:30:00', 'teamLab Planets immersive water exhibition', 38.00),

        -- Kyoto Day 1
        (day_jp_k1_id, 'a2222222-0001-0000-0000-000000000001', 1, '08:00:00', 'Early morning hike before crowds arrive at Torii gates', 0.00),
        (day_jp_k1_id, 'a2222222-0003-0000-0000-000000000003', 2, '15:00:00', 'Traditional tea ritual in historic Gion teahouse', 45.00),
        -- Kyoto Day 2
        (day_jp_k2_id, 'a2222222-0002-0000-0000-000000000002', 1, '09:30:00', 'Walk through bamboo forest and visit monkey sanctuary', 10.00),

        -- Jaipur Day 1
        (day_rj_j1_id, 'aa111111-0001-0000-0000-000000000001', 1, '09:30:00', 'Amber Fort royal courtyards and Sheesh Mahal mirror palace', 12.00),
        (day_rj_j1_id, 'aa111111-0003-0000-0000-000000000003', 2, '18:30:00', 'Chokhi Dhani cultural evening with folk music & Dal Baati Churma', 20.00),
        -- Jaipur Day 2
        (day_rj_j2_id, 'aa111111-0002-0000-0000-000000000002', 1, '08:30:00', 'Hawa Mahal facade photography and Johari Bazaar handicraft shopping', 8.00),

        -- Varanasi Day 1
        (day_rj_v1_id, 'aa222222-0001-0000-0000-000000000001', 1, '05:45:00', 'Sunrise wooden boat ride past ancient ghats on the sacred Ganges', 10.00),
        (day_rj_v1_id, 'aa222222-0003-0000-0000-000000000003', 2, '08:30:00', 'Banarasi kachori sabzi and creamy saffron lassi in kulhad', 6.00),
        -- Varanasi Day 2
        (day_rj_v2_id, 'aa222222-0002-0000-0000-000000000002', 1, '18:15:00', 'Grand evening Ganga Aarti with brass lamps and Vedic chants', 0.00),

        -- Kerala Day 1
        (day_kl_k1_id, 'aa555555-0001-0000-0000-000000000001', 1, '09:00:00', 'Fort Kochi Chinese fishing nets and colonial spice godowns walk', 0.00),
        (day_kl_k1_id, 'aa555555-0003-0000-0000-000000000003', 2, '12:00:00', 'Alleppey houseboat cruise with Karimeen pollichathu lunch', 60.00),

        -- Goa Day 1
        (day_kl_g1_id, 'aa444444-0001-0000-0000-000000000001', 1, '10:00:00', 'Fontainhas heritage walk through pastel Portuguese architecture', 8.00),
        (day_kl_g1_id, 'aa444444-0002-0000-0000-000000000002', 2, '16:00:00', 'Palolem beach kayaking and dolphin watching sunset cruise', 18.00),

        -- Manali Day 1
        (day_ld_m1_id, 'aa333333-0001-0000-0000-000000000001', 1, '10:00:00', 'Solang Valley high-altitude paragliding over pine forests', 35.00),
        (day_ld_m1_id, 'aa333333-0002-0000-0000-000000000002', 2, '16:00:00', 'Old Manali live acoustic cafe trail and cedar forest stroll', 12.00),

        -- Leh Day 1
        (day_ld_l1_id, 'aa666666-0002-0000-0000-000000000002', 1, '06:30:00', 'Thiksey monastery early morning Buddhist prayer chanting', 5.00),
        (day_ld_l1_id, 'aa666666-0001-0000-0000-000000000001', 2, '10:00:00', 'Pangong Tso high-altitude lake expedition across Chang La Pass', 45.00),

        -- Dubai Day 1 & 2
        (day_db_d1_id, 'a7777777-0001-0000-0000-000000000001', 1, '16:00:00', 'Burj Khalifa 148th floor observation deck sunset view', 75.00),
        (day_db_d2_id, 'a7777777-0002-0000-0000-000000000002', 1, '15:00:00', '4x4 desert dune bashing, sandboarding, and stargazing dinner', 60.00),

        -- Rishikesh Day 1 & Agra Day 1
        (day_rk_r1_id, 'aa888888-0001-0000-0000-000000000001', 1, '10:00:00', 'White water river rafting Shivpuri grade III rapids', 18.00),
        (day_rk_a1_id, 'ac111111-0001-0000-0000-000000000001', 1, '06:00:00', 'Sunrise Taj Mahal guided photography walk', 18.00),

        -- Udaipur Day 1
        (day_mw_u1_id, 'aa777777-0001-0000-0000-000000000001', 1, '10:00:00', 'City Palace complex mirrored galleries and courtyards', 14.00),
        (day_mw_u1_id, 'aa777777-0002-0000-0000-000000000002', 2, '17:00:00', 'Lake Pichola sunset boat cruise to Jagmandir palace', 12.00),

        -- Switzerland Day 1
        (day_sw_z1_id, 'ab222222-0001-0000-0000-000000000001', 1, '08:30:00', 'Jungfraujoch Top of Europe glacier railway journey', 180.00),

        -- London Day 1
        (day_ln_l1_id, 'ab111111-0001-0000-0000-000000000001', 1, '10:00:00', 'Tower of London fortress and Royal Crown Jewels', 35.00),
        (day_ln_l1_id, 'ab111111-0003-0000-0000-000000000003', 2, '13:30:00', 'Borough Market British hot meat pies & artisan cheese', 30.00)
    ON CONFLICT DO NOTHING;

    -- ========================================================================
    -- 7. BUDGET ITEMS / EXPENSES
    -- ========================================================================
    INSERT INTO public.budget_items (trip_id, section_id, day_id, category, description, amount)
    VALUES
        -- Japan Expenses (Harshit)
        (trip_japan_id, sec_tokyo_id, NULL, 'accommodation', 'Shinjuku Granbell Hotel (3 Nights)', 540.00),
        (trip_japan_id, sec_tokyo_id, NULL, 'transport', 'Tokyo Metro 72-Hour Tourist Pass', 25.00),
        (trip_japan_id, sec_tokyo_id, day_jp_t1_id, 'activity', 'Shibuya Sky Observatory Ticket', 22.00),
        (trip_japan_id, sec_tokyo_id, day_jp_t2_id, 'food', 'Tsukiji Market Street Food & Sushi', 35.00),
        (trip_japan_id, sec_tokyo_id, day_jp_t2_id, 'activity', 'teamLab Planets Admission Ticket', 38.00),
        (trip_japan_id, NULL, NULL, 'transport', 'Shinkansen Bullet Train Tokyo to Kyoto', 140.00),
        (trip_japan_id, sec_kyoto_id, NULL, 'accommodation', 'Gion Traditional Machiya Ryokan (3 Nights)', 620.00),
        (trip_japan_id, sec_kyoto_id, day_jp_k1_id, 'activity', 'Gion Urasenke Tea Ceremony', 45.00),
        (trip_japan_id, sec_kyoto_id, day_jp_k2_id, 'food', 'Kaiseki Multi-Course Dinner in Pontocho', 110.00),

        -- Rajasthan Expenses (Aarav)
        (trip_rajasthan_id, sec_jaipur_id, NULL, 'accommodation', 'Heritage Haveli Stay in Jaipur (2 Nights)', 120.00),
        (trip_rajasthan_id, sec_jaipur_id, day_rj_j1_id, 'activity', 'Amber Fort Guided Entry & Camera Fee', 12.00),
        (trip_rajasthan_id, sec_jaipur_id, day_rj_j1_id, 'food', 'Chokhi Dhani Royal Thali Dinner', 20.00),
        (trip_rajasthan_id, sec_jaipur_id, day_rj_j2_id, 'shopping', 'Johari Bazaar Blue Pottery & Gems', 45.00),
        (trip_rajasthan_id, NULL, NULL, 'transport', 'Vande Bharat Express Jaipur to Varanasi', 40.00),
        (trip_rajasthan_id, sec_varanasi_id, NULL, 'accommodation', 'Ghat-View Heritage Stay Varanasi (2 Nights)', 90.00),
        (trip_rajasthan_id, sec_varanasi_id, day_rj_v1_id, 'activity', 'Private Morning Boat on Ganges', 10.00),
        (trip_rajasthan_id, sec_varanasi_id, day_rj_v1_id, 'food', 'Banarasi Street Food & Blue Lassi', 6.00),

        -- Kerala & Goa Expenses (Ananya)
        (trip_kerala_id, sec_kochi_id, NULL, 'accommodation', 'Fort Kochi Heritage Homestay', 80.00),
        (trip_kerala_id, sec_kochi_id, day_kl_k1_id, 'activity', 'Alleppey Day Houseboat with Lunch', 60.00),
        (trip_kerala_id, NULL, NULL, 'transport', 'Direct Flight Kochi to Goa', 65.00),
        (trip_kerala_id, sec_goa_id, NULL, 'accommodation', 'Palolem Beachfront Cottage (2 Nights)', 110.00),
        (trip_kerala_id, sec_goa_id, day_kl_g1_id, 'food', 'Goan Crab Xec Xec & Feni Cocktail Dinner', 25.00),

        -- Ladakh Expenses (Rohan)
        (trip_ladakh_id, sec_manali_id, NULL, 'accommodation', 'Old Manali Apple Orchard Lodge', 70.00),
        (trip_ladakh_id, sec_manali_id, day_ld_m1_id, 'activity', 'Solang Tandem Paragliding Flight', 35.00),
        (trip_ladakh_id, NULL, NULL, 'transport', 'Manali to Leh 4x4 Shared Expedition Taxi', 85.00),
        (trip_ladakh_id, sec_leh_id, NULL, 'accommodation', 'Pangong Glamping Tent & Leh Guest House', 160.00),
        (trip_ladakh_id, sec_leh_id, day_ld_l1_id, 'activity', 'Permit Fees & Pangong Tso Lake Excursion', 45.00),

        -- Dubai Expenses (Vikram)
        (trip_dubai_id, sec_dubai_id, NULL, 'accommodation', 'Address Downtown Dubai Suite (4 Nights)', 1100.00),
        (trip_dubai_id, sec_dubai_id, day_db_d1_id, 'activity', 'Burj Khalifa At The Top Lounge VIP', 75.00),
        (trip_dubai_id, sec_dubai_id, day_db_d2_id, 'activity', 'VIP Red Dune Safari & Falconry Show', 60.00),
        (trip_dubai_id, sec_dubai_id, NULL, 'activity', 'Private Sunset Yacht Charter from Marina', 250.00),
        (trip_dubai_id, sec_dubai_id, NULL, 'food', 'Fine Dining at Atmosphere Burj Khalifa', 180.00),

        -- Rishikesh & Agra (Neha)
        (trip_rishikesh_id, sec_rishikesh_id, NULL, 'accommodation', 'Parmarth Ganga View Ashram (2 Nights)', 60.00),
        (trip_rishikesh_id, sec_rishikesh_id, day_rk_r1_id, 'activity', 'Shivpuri 16km River Rafting & Cliff Jump', 18.00),
        (trip_rishikesh_id, NULL, NULL, 'transport', 'Express AC Train Haridwar to Agra', 25.00),
        (trip_rishikesh_id, sec_agra_id, NULL, 'accommodation', 'Tajganj Heritage Boutique Hotel', 55.00),
        (trip_rishikesh_id, sec_agra_id, day_rk_a1_id, 'activity', 'Taj Mahal VIP Foreign Tourist Ticket', 18.00),

        -- Udaipur & Mewar (Kabir)
        (trip_mewar_id, sec_udaipur_id, NULL, 'accommodation', 'Lake Pichola Heritage Haveli (2 Nights)', 140.00),
        (trip_mewar_id, sec_udaipur_id, day_mw_u1_id, 'activity', 'City Palace & Jagmandir Boat Cruise', 26.00),
        (trip_mewar_id, NULL, NULL, 'transport', 'Superfast Express Train Udaipur to Jaipur', 20.00),
        (trip_mewar_id, sec_jaipur2_id, NULL, 'accommodation', 'Civil Lines Boutique Stay (2 Nights)', 90.00),

        -- Switzerland (Aditya)
        (trip_swiss_id, sec_zurich_id, NULL, 'accommodation', 'Zurich Old Town Swiss Hotel (4 Nights)', 850.00),
        (trip_swiss_id, sec_zurich_id, day_sw_z1_id, 'activity', 'Jungfraujoch Mountain Train Ticket', 180.00),
        (trip_swiss_id, sec_zurich_id, NULL, 'transport', 'Swiss Travel Pass 4-Day Consecutive', 290.00),

        -- London (Tanvi)
        (trip_london_id, sec_london_id, NULL, 'accommodation', 'Bloomsbury Victorian Hotel (4 Nights)', 750.00),
        (trip_london_id, sec_london_id, day_ln_l1_id, 'activity', 'Tower of London & Crown Jewels', 35.00),
        (trip_london_id, sec_london_id, day_ln_l1_id, 'food', 'Borough Market Street Gastronomy Tour', 30.00);

    -- ========================================================================
    -- 8. COMMUNITY POSTS (10 TRAVEL STORIES & TIPS)
    -- ========================================================================
    INSERT INTO public.community_posts (user_id, trip_id, activity_id, title, content, image_url, likes_count)
    VALUES
        (
            user_harshit_id, trip_japan_id, 'a1111111-0002-0000-0000-000000000002',
            'Unforgettable experience at teamLab Planets Tokyo!',
            'Wading through knee-deep water surrounded by floating digital koi and crystalline lights was magical. Highly recommend booking the earliest 09:00 AM slot to beat the crowds.',
            'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
            142
        ),
        (
            user_aarav_id, trip_rajasthan_id, 'aa222222-0002-0000-0000-000000000002',
            'Divine Energy at Varanasi Ganga Aarti — A Spiritual Masterpiece',
            'Standing on Dashashwamedh Ghat as seven priests wave giant multi-tiered brass lamps to Sanskrit chants is an experience that stays with you forever. Hire a boat from the river for the most breathtaking vantage point.',
            'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
            289
        ),
        (
            user_ananya_id, trip_kerala_id, 'aa555555-0003-0000-0000-000000000003',
            'Tranquil Houseboating in Alleppey: Fresh Karimeen & Backwater Calm',
            'Nothing beats drifting slowly through emerald green canals with swaying palms while the onboard chef serves piping hot Karimeen fish fry on a fresh banana leaf. Perfect slow travel escape!',
            'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
            195
        ),
        (
            user_rohan_id, trip_ladakh_id, 'aa666666-0001-0000-0000-000000000001',
            'Crossing Khardung La to Pangong Tso: The Ultimate Roadtrip',
            'Riding through the cold desert of Ladakh with turquoise glacial lakes meeting snow-dusted mountains is surreal. Make sure you acclimatize for 48 hours in Leh before attempting higher passes!',
            'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
            312
        ),
        (
            user_vikram_id, trip_dubai_id, 'a7777777-0002-0000-0000-000000000002',
            'Sunset Dune Bashing in the Lahbab Red Dunes',
            'The sheer adrenaline of 4x4 dune bashing followed by sandboarding down 300-foot dunes and watching the sunset over the desert horizon is worth every penny. A must-do in the UAE!',
            'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=800&q=80',
            178
        ),
        (
            user_priya_id, NULL, 'a8888888-0002-0000-0000-000000000002',
            'Best Street Gastronomy Spots at Maxwell Hawker Centre, Singapore',
            'From Michelin-starred Hainanese Chicken Rice to spicy laksa bowls, Singapore’s hawker centers are a food lover’s paradise. Grab a fresh sugarcane juice and arrive by 11:30 AM to skip lunchtime queues.',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
            220
        ),
        (
            user_neha_id, trip_rishikesh_id, 'aa888888-0001-0000-0000-000000000001',
            'Adrenaline on the Ganges: Conquering Roller Coaster Rapids in Rishikesh',
            'Grade IV rapids, cliff jumping into glacial turquoise water, and concluding the evening with hot masala chai by Ram Jhula. Rishikesh combines spirituality and extreme adventure like nowhere else!',
            'https://images.unsplash.com/photo-1600100397608-f010e47c5d41?auto=format&fit=crop&w=800&q=80',
            164
        ),
        (
            user_kabir_id, trip_mewar_id, 'aa777777-0002-0000-0000-000000000002',
            'Magical Sunset Boat Ride across Lake Pichola in Udaipur',
            'Watching the marble facades of Lake Palace and Jagmandir glow amber as the sun dips behind the Aravalli hills is pure poetry. Take the 5:00 PM sunset boat from City Palace jetty.',
            'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
            245
        ),
        (
            user_aditya_id, trip_swiss_id, 'ab222222-0001-0000-0000-000000000001',
            'Standing on the Top of Europe at Jungfraujoch (3,454m)',
            'Taking the Eiger Express tri-cable gondola and cogwheel train right through the inside of Mount Eiger to reach the Sphinx observatory was breathtaking. Snow even in midsummer!',
            'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
            280
        ),
        (
            user_tanvi_id, trip_london_id, 'ab111111-0003-0000-0000-000000000003',
            'Foodie Haven: Borough Market Hot Salt Beef & Artisanal Cheeses',
            'A sensory overload under the Victorian railway arches! Make sure you try the hot salt beef bagel with English mustard and warm cinnamon doughnuts from Bread Ahead.',
            'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
            190
        );

    -- ========================================================================
    -- 9. SHARED TRIP TOKENS (PUBLIC SHARING LINKS)
    -- ========================================================================
    INSERT INTO public.shared_trips (trip_id, shared_by, share_token, is_public, expires_at)
    VALUES
        (trip_japan_id, user_harshit_id, 'tokyo-kyoto-spring-2026', TRUE, NOW() + INTERVAL '90 days'),
        (trip_rajasthan_id, user_aarav_id, 'rajasthan-kashi-heritage-2026', TRUE, NOW() + INTERVAL '90 days'),
        (trip_kerala_id, user_ananya_id, 'kerala-goa-coastal-trail-2026', TRUE, NOW() + INTERVAL '90 days'),
        (trip_ladakh_id, user_rohan_id, 'himalayan-ladakh-odyssey-2026', TRUE, NOW() + INTERVAL '120 days'),
        (trip_dubai_id, user_vikram_id, 'dubai-luxury-marina-2026', TRUE, NOW() + INTERVAL '60 days'),
        (trip_rishikesh_id, user_neha_id, 'rishikesh-agra-spiritual-2026', TRUE, NOW() + INTERVAL '90 days'),
        (trip_mewar_id, user_kabir_id, 'udaipur-jaipur-mewar-2026', TRUE, NOW() + INTERVAL '90 days'),
        (trip_swiss_id, user_aditya_id, 'swiss-alps-jungfrau-2026', TRUE, NOW() + INTERVAL '120 days'),
        (trip_london_id, user_tanvi_id, 'london-heritage-thames-2026', TRUE, NOW() + INTERVAL '90 days')
    ON CONFLICT (share_token) DO NOTHING;

END $$;
