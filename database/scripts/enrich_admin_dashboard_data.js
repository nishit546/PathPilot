const db = require('../../backend/src/config/database');

async function enrichAdminDashboardData() {
  console.log('🚀 Starting Admin Dashboard Data Enrichment...');

  // 1. Update User Statuses (Set ~20% of users to is_active = false for realistic active/inactive breakdown)
  console.log('1. Setting realistic active vs inactive user statuses in public.profiles...');
  
  // Keep main active travelers active, set specific test/extra accounts to inactive
  const inactiveEmailsPattern = ['%userd_%', '%stranger%', '%test_inactive%', '%userc_178738%', '%usera_17873815%'];
  
  const deactivateRes = await db.query(`
    UPDATE public.profiles
    SET is_active = FALSE, updated_at = NOW()
    WHERE email LIKE ANY($1::text[])
       OR (role = 'user' AND id::text LIKE 'a2387%')
       OR (role = 'user' AND id::text LIKE '7f26%')
       OR (role = 'user' AND id::text LIKE '0402%')
       OR (role = 'user' AND id::text LIKE '8c1d%')
       OR (role = 'user' AND id::text LIKE 'aa1b%')
       OR (role = 'user' AND id::text LIKE '5adc%')
       OR (role = 'user' AND id::text LIKE 'cee6%')
       OR (role = 'user' AND id::text LIKE '0f80%')
       OR (role = 'user' AND id::text LIKE '775c%')
    RETURNING id, first_name, email;
  `, [inactiveEmailsPattern]);

  console.log(`✅ Set ${deactivateRes.rowCount} user profiles to INACTIVE (is_active = false).`);

  // Verify counts
  const activeCountRes = await db.query(`SELECT COUNT(*) FROM public.profiles WHERE is_active = TRUE;`);
  const inactiveCountRes = await db.query(`SELECT COUNT(*) FROM public.profiles WHERE is_active = FALSE;`);
  console.log(`📊 Active Users: ${activeCountRes.rows[0].count} | Inactive Users: ${inactiveCountRes.rows[0].count}`);

  // 2. Fetch all trips to generate substantial Expense Volume across categories
  console.log('2. Inserting high-volume realistic expenses into public.budget_items...');

  const tripsRes = await db.query(`SELECT id, user_id, title, overall_budget, start_date, end_date FROM public.trips;`);
  console.log(`Found ${tripsRes.rows.length} trips to populate with expenses.`);

  const expenseTemplates = [
    // accommodation
    { category: 'accommodation', desc: '5-Star Resort & Spa Villa Booking', minAmount: 18000, maxAmount: 45000 },
    { category: 'accommodation', desc: 'Boutique Heritage Palace Stay', minAmount: 12000, maxAmount: 32000 },
    { category: 'accommodation', desc: 'Luxury Alpine Chalet Suites', minAmount: 25000, maxAmount: 60000 },
    // transport
    { category: 'transport', desc: 'Roundtrip Executive Flights', minAmount: 15000, maxAmount: 38000 },
    { category: 'transport', desc: 'Express High-Speed Bullet Rail Pass', minAmount: 8000, maxAmount: 22000 },
    { category: 'transport', desc: 'Private Chauffeur & Airport Transfers', minAmount: 4500, maxAmount: 12000 },
    // activity
    { category: 'activity', desc: 'Helicopter Glacier Flight Tour', minAmount: 12000, maxAmount: 28000 },
    { category: 'activity', desc: 'Private Yacht Sunset Cruise', minAmount: 9000, maxAmount: 24000 },
    { category: 'entry_fee', desc: 'Guided Museum & Palace VIP Access', minAmount: 3500, maxAmount: 9500 },
    // food
    { category: 'food', desc: 'Michelin Star Gourmet Tasting Menu', minAmount: 6500, maxAmount: 18000 },
    { category: 'food', desc: 'Authentic Regional Street Food Tour', minAmount: 1500, maxAmount: 4500 },
    { category: 'food', desc: 'Beachfront Seafood & Wine Dinner', minAmount: 4200, maxAmount: 11000 },
    // shopping
    { category: 'shopping', desc: 'Handcrafted Silk & Local Artisan Crafts', minAmount: 7500, maxAmount: 25000 },
    { category: 'shopping', desc: 'High-End Souvenirs & Leather Goods', minAmount: 5000, maxAmount: 18000 },
    // other
    { category: 'other', desc: 'Comprehensive Travel Insurance & Visas', minAmount: 3000, maxAmount: 8500 }
  ];

  let addedExpenseCount = 0;
  let addedExpenseVolume = 0;

  for (const trip of tripsRes.rows) {
    // Check existing expense count for trip
    const existingExp = await db.query(`SELECT COUNT(*) FROM public.budget_items WHERE trip_id::text = $1::text;`, [String(trip.id)]);
    const currentCount = parseInt(existingExp.rows[0].count, 10);

    // If trip has fewer than 3 expenses, add 3-5 expenses
    if (currentCount < 3) {
      const itemsToAddCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 items
      const shuffleTemplates = [...expenseTemplates].sort(() => 0.5 - Math.random());
      const selectedTemplates = shuffleTemplates.slice(0, itemsToAddCount);

      for (const tpl of selectedTemplates) {
        const randAmount = Math.floor(Math.random() * (tpl.maxAmount - tpl.minAmount + 1)) + tpl.minAmount;

        await db.query(`
          INSERT INTO public.budget_items (
            trip_id,
            category,
            description,
            amount,
            created_at,
            updated_at
          ) VALUES ($1::uuid, $2, $3, $4, NOW(), NOW());
        `, [trip.id, tpl.category, tpl.desc, randAmount]);

        addedExpenseCount++;
        addedExpenseVolume += randAmount;
      }
    }
  }

  console.log(`✅ Added ${addedExpenseCount} new expenses. Volume added: ₹${addedExpenseVolume.toLocaleString()}`);

  // 3. Final Summary Stats
  const overviewRes = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM public.profiles) AS total_users,
      (SELECT COUNT(*) FROM public.profiles WHERE is_active = TRUE) AS active_users,
      (SELECT COUNT(*) FROM public.profiles WHERE is_active = FALSE) AS inactive_users,
      (SELECT COUNT(*) FROM public.trips) AS total_trips,
      (SELECT COALESCE(SUM(overall_budget), 0) FROM public.trips) AS total_budget,
      (SELECT COUNT(*) FROM public.budget_items) AS total_expenses_count,
      (SELECT COALESCE(SUM(amount), 0) FROM public.budget_items) AS total_expenses_volume;
  `);

  const row = overviewRes.rows[0];
  console.log('\n🎉 ===================================================');
  console.log('🎉 ADMIN DASHBOARD DATA ENRICHMENT COMPLETE');
  console.log('🎉 ===================================================');
  console.log(`👥 Total Platform Users: ${row.total_users}`);
  console.log(`🟢 Active Users:         ${row.active_users} (${Math.round((row.active_users / row.total_users) * 100)}%)`);
  console.log(`🔴 Inactive Users:       ${row.inactive_users} (${Math.round((row.inactive_users / row.total_users) * 100)}%)`);
  console.log(`✈️ Total Trips:          ${row.total_trips}`);
  console.log(`💰 Total Budget:         ₹${Number(row.total_budget).toLocaleString()}`);
  console.log(`🧾 Expenses Logged:      ${row.total_expenses_count} items`);
  console.log(`📊 EXPENSE VOLUME:       ₹${Number(row.total_expenses_volume).toLocaleString()}`);
  console.log('===================================================\n');

  process.exit(0);
}

enrichAdminDashboardData().catch(err => {
  console.error('❌ Data enrichment failed:', err);
  process.exit(1);
});
