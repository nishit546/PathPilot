const db = require('../../backend/src/config/database');

async function fixLocationActivities() {
  console.log('🚀 Synchronizing Location Activities for all Trip Stops & Days...');

  // 1. Fetch all trip sections
  const sectionsRes = await db.query(`
    SELECT ts.id as section_id, ts.trip_id, ts.city_id, c.name as city_name, c.country
    FROM public.trip_sections ts
    JOIN public.cities c ON c.id = ts.city_id;
  `);

  console.log(`Found ${sectionsRes.rows.length} destination stops in database.`);

  let activitiesAssigned = 0;

  for (const section of sectionsRes.rows) {
    // Get city activities
    const cityActsRes = await db.query(
      `SELECT id, name, estimated_cost FROM public.activities WHERE city_id::text = $1::text ORDER BY name ASC;`,
      [String(section.city_id)]
    );

    const cityActs = cityActsRes.rows;
    if (cityActs.length === 0) continue;

    // Get days for section
    const daysRes = await db.query(
      `SELECT id, day_number, date FROM public.days WHERE section_id::text = $1::text ORDER BY day_number ASC;`,
      [String(section.section_id)]
    );

    for (let i = 0; i < daysRes.rows.length; i++) {
      const day = daysRes.rows[i];
      // Check existing day_activities
      const existingActs = await db.query(
        `SELECT COUNT(*) FROM public.day_activities WHERE day_id::text = $1::text;`,
        [String(day.id)]
      );

      if (parseInt(existingActs.rows[0].count, 10) === 0) {
        // Assign 1-2 location activities
        const act1 = cityActs[i % cityActs.length];
        const act2 = cityActs[(i + 1) % cityActs.length];

        if (act1) {
          await db.query(`
            INSERT INTO public.day_activities (
              day_id, activity_id, activity_order, planned_time, notes, expense_amount
            ) VALUES ($1::uuid, $2::uuid, 1, '10:00:00', $3, $4)
            ON CONFLICT DO NOTHING;
          `, [day.id, act1.id, `Explore ${act1.name} in ${section.city_name}`, act1.estimated_cost || 0]);
          activitiesAssigned++;
        }

        if (act2 && act2.id !== act1.id) {
          await db.query(`
            INSERT INTO public.day_activities (
              day_id, activity_id, activity_order, planned_time, notes, expense_amount
            ) VALUES ($1::uuid, $2::uuid, 2, '15:00:00', $3, $4)
            ON CONFLICT DO NOTHING;
          `, [day.id, act2.id, `Visit ${act2.name} in ${section.city_name}`, act2.estimated_cost || 0]);
          activitiesAssigned++;
        }
      }
    }
  }

  console.log(`✅ Successfully assigned ${activitiesAssigned} location-matching activities across all trip stops!`);
  process.exit(0);
}

fixLocationActivities().catch(err => {
  console.error('❌ Failed location activity synchronization:', err);
  process.exit(1);
});
