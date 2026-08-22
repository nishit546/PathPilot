const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const SALT_ROUNDS = 10;
const hashSync = (password) => bcrypt.hashSync(password, SALT_ROUNDS);

const SEED_USERS = [
  {
    email: 'admin@pathpilot.com',
    password: 'AdminPassword123!',
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin',
    city: 'San Francisco',
    country: 'United States',
    phone: '+1-555-0100',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  },
  {
    email: 'traveler@pathpilot.com',
    password: 'Password123!',
    firstName: 'Nishit',
    lastName: 'Traveler',
    role: 'user',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-9876543210',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  }
];

const CITIES = [
  { name: 'Delhi', country: 'India', state_region: 'National Capital Territory', description: 'India’s historic heart, home to Mughal monuments, vibrant bazaars, and street food.', image_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80', latitude: 28.6139, longitude: 77.2090, popularity: 92 },
  { name: 'Manali', country: 'India', state_region: 'Himachal Pradesh', description: 'A high-altitude Himalayan resort town known for snow-capped peaks, paragliding, and pine-scented valleys.', image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80', latitude: 32.2432, longitude: 77.1892, popularity: 88 },
  { name: 'Goa', country: 'India', state_region: 'Goa', description: 'Coastal paradise known for golden beaches, Portuguese heritage, nightlife, and spice plantations.', image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80', latitude: 15.2993, longitude: 74.1240, popularity: 95 },
  { name: 'Tokyo', country: 'Japan', state_region: 'Kanto', description: 'Metropolis blending neon skyscrapers with historic temples and culinary scenes.', image_url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80', latitude: 35.6762, longitude: 139.6503, popularity: 98 },
  { name: 'Paris', country: 'France', state_region: 'Île-de-France', description: 'The City of Light, world capital of art, fashion, gastronomy, and culture.', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80', latitude: 48.8566, longitude: 2.3522, popularity: 99 },
  { name: 'Rome', country: 'Italy', state_region: 'Lazio', description: 'The Eternal City packed with ancient ruins like the Colosseum, the Pantheon, and the Vatican.', image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80', latitude: 41.9028, longitude: 12.4964, popularity: 94 },
  { name: 'New York', country: 'United States', state_region: 'New York', description: 'The city that never sleeps, with Times Square, Central Park, Broadway shows, and iconic skyline views.', image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80', latitude: 40.7128, longitude: -74.0060, popularity: 97 },
  { name: 'London', country: 'United Kingdom', state_region: 'Greater London', description: 'Cosmopolitan capital with centuries of history, iconic landmarks, and world-class museums.', image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80', latitude: 51.5074, longitude: -0.1278, popularity: 96 }
];

const ACTIVITIES_BY_CITY = {
  'Delhi': [
    { name: 'Red Fort & Old Delhi Heritage Walk', description: 'Explore the 17th-century Mughal fortress followed by a rickshaw tour.', category: 'CULTURE', estimated_cost: 1200, duration_minutes: 240, popularity: 94, image_url: 'https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Qutub Minar & Mehrauli Archaeological Park', description: 'Visit the UNESCO World Heritage minaret and discover ancient ruins.', category: 'SIGHTSEEING', estimated_cost: 800, duration_minutes: 180, popularity: 90, image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80' },
    { name: 'Street Food Tasting in Chandni Chowk', description: 'Savor parathas, jalebis, and kebabs in historical culinary alleys.', category: 'FOOD', estimated_cost: 600, duration_minutes: 120, popularity: 96, image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' }
  ],
  'Manali': [
    { name: 'Solang Valley Paragliding & Zorbing', description: 'High-adrenaline tandem paragliding overlooking lush cedar forests.', category: 'ADVENTURE', estimated_cost: 3500, duration_minutes: 150, popularity: 95, image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80' },
    { name: 'Rohtang Pass Snow Excursion', description: 'Spectacular mountain pass trip with snow scooter rides and panoramic views.', category: 'SIGHTSEEING', estimated_cost: 4500, duration_minutes: 360, popularity: 92, image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Jogini Waterfall Trek & Cafe Hopping', description: 'Scenic forest hike to natural waterfalls followed by live music in cozy cafes.', category: 'RELAXATION', estimated_cost: 500, duration_minutes: 210, popularity: 88, image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80' }
  ],
  'Paris': [
    { name: 'Eiffel Tower Summit Tour', description: 'Ascend to the top of the Eiffel Tower for panoramic views of Paris.', category: 'SIGHTSEEING', estimated_cost: 3000, duration_minutes: 150, popularity: 99, image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80' },
    { name: 'Louvre Museum Masterpieces Guided Tour', description: 'Skip the line to see the Mona Lisa, Venus de Milo, and Winged Victory.', category: 'CULTURE', estimated_cost: 2500, duration_minutes: 180, popularity: 98, image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80' }
  ]
};

async function seedMasterData() {
  console.log('🌱 Seeding baseline users, cities, and activities...');
  try {
    // 1. Seed users
    for (const u of SEED_USERS) {
      const existing = await db.query(`SELECT id FROM auth.users WHERE LOWER(email) = LOWER($1);`, [u.email]);
      if (existing.rows.length === 0) {
        const hashedPassword = hashSync(u.password);
        const authRes = await db.query(
          `INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            now(),
            $3::jsonb,
            now(),
            now()
          ) RETURNING id;`,
          [
            u.email.toLowerCase(),
            hashedPassword,
            JSON.stringify({
              first_name: u.firstName,
              last_name: u.lastName,
              role: u.role
            })
          ]
        );
        const uid = authRes.rows[0].id;
        await db.query(
          `UPDATE public.profiles
           SET first_name = $1, last_name = $2, role = $3, city = $4, country = $5, phone_number = $6, avatar_url = $7
           WHERE id = $8;`,
          [u.firstName, u.lastName, u.role, u.city, u.country, u.phone, u.profilePhoto, uid]
        );
        console.log(`  ✓ Seeded user: ${u.email} (${u.role})`);
      } else {
        // Ensure role is admin if it's admin@pathpilot.com
        const uid = existing.rows[0].id;
        const hashedPassword = hashSync(u.password);
        await db.query(`UPDATE auth.users SET encrypted_password = $1 WHERE id = $2;`, [hashedPassword, uid]);
        await db.query(`UPDATE public.profiles SET role = $1 WHERE id = $2;`, [u.role, uid]);
        console.log(`  ✓ Updated existing user credentials/role: ${u.email} (${u.role})`);
      }
    }

    // 2. Seed cities
    for (const c of CITIES) {
      const cityRes = await db.query(
        `INSERT INTO public.cities (name, country, state_region, description, image_url, latitude, longitude, popularity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name, country, state_region) DO UPDATE
         SET description = EXCLUDED.description, image_url = EXCLUDED.image_url, popularity = EXCLUDED.popularity
         RETURNING id;`,
        [c.name, c.country, c.state_region, c.description, c.image_url, c.latitude, c.longitude, c.popularity || 90]
      );
      const cityId = cityRes.rows[0].id;

      // 3. Seed activities for city
      const acts = ACTIVITIES_BY_CITY[c.name] || [];
      for (const a of acts) {
        await db.query(
          `INSERT INTO public.activities (city_id, name, description, category, estimated_cost, duration_minutes, popularity, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING;`,
          [cityId, a.name, a.description, a.category, a.estimated_cost, a.duration_minutes, a.popularity, a.image_url]
        );
      }
    }

    console.log('✅ Baseline users, cities, and activities seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedMasterData();
