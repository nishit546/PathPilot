const http = require('http');
const app = require('./src/app');

const PORT = 5008;

function makeRequest(server, options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n🧪 =================================================================`);
    console.log(`🧪 Running PathPilot End-to-End System Integration Suite (Port ${PORT})`);
    console.log(`🧪 =================================================================\n`);
    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, details = '') => {
      if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${testName} - ${details}`);
        failed++;
      }
    };

    try {
      // -------------------------------------------------------------
      // 1. SYSTEM & GATEWAY DISCOVERY
      // -------------------------------------------------------------
      const health = await makeRequest(server, { path: '/api/health', method: 'GET' });
      assert(health.status === 200 && health.data.data.status === 'healthy', 'GET /api/health returns healthy diagnostic data');

      const gateway = await makeRequest(server, { path: '/api', method: 'GET' });
      assert(gateway.status === 200 && gateway.data.data.modules.length > 5, 'GET /api returns gateway modules catalog');

      const docs = await makeRequest(server, { path: '/api/docs/', method: 'GET' });
      assert(docs.status === 200 || docs.status === 301, 'GET /api/docs serves OpenAPI interactive documentation');

      // -------------------------------------------------------------
      // 2. AUTHENTICATION & MULTI-USER JOURNEY (User A & User B)
      // -------------------------------------------------------------
      const userA_Email = `usera_${Date.now()}@example.com`;
      const regUserA = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Alice',
        lastName: 'Traveler',
        email: userA_Email,
        password: 'Password123!',
        city: 'San Francisco',
        country: 'United States'
      });
      assert(regUserA.status === 201 && regUserA.data.data.token, 'POST /api/auth/register (User A onboarded)');
      const tokenA = regUserA.data?.data?.token;

      const userB_Email = `userb_${Date.now()}@example.com`;
      const regUserB = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Bob',
        lastName: 'Explorer',
        email: userB_Email,
        password: 'Password123!',
        city: 'Toronto',
        country: 'Canada'
      });
      assert(regUserB.status === 201 && regUserB.data.data.token, 'POST /api/auth/register (User B onboarded)');
      const tokenB = regUserB.data?.data?.token;

      // Duplicate registration rejection
      const duplicateReg = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Alice',
        lastName: 'Traveler',
        email: userA_Email,
        password: 'Password123!'
      });
      assert(duplicateReg.status === 409 || duplicateReg.status === 400, 'POST /api/auth/register rejects duplicate email');

      // User A Login
      const loginA = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: userA_Email,
        password: 'Password123!'
      });
      assert(loginA.status === 200 && loginA.data.data.token, 'POST /api/auth/login (User A authenticated)');

      // User Profile Check & Update
      const profileA = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(profileA.status === 200 && profileA.data.data.user.email === userA_Email, 'GET /api/users/profile returns profile without password');

      const updateProfileA = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        firstName: 'Alice Marie',
        phone: '+1-555-0101',
        role: 'ADMIN' // Malicious role escalation attempt
      });
      assert(
        updateProfileA.status === 200 &&
        updateProfileA.data.data.user.firstName === 'Alice Marie' &&
        (updateProfileA.data.data.user.role === 'USER' || updateProfileA.data.data.user.role === 'user'),
        'PUT /api/users/profile updates profile and protects role'
      );

      // -------------------------------------------------------------
      // 3. MASTER CATALOG DISCOVERY (Cities & Activities)
      // -------------------------------------------------------------
      const citiesSearch = await makeRequest(server, { path: '/api/cities?page=1&limit=5', method: 'GET' });
      assert(citiesSearch.status === 200 && citiesSearch.data.pagination.page === 1, 'GET /api/cities searches with pagination & popularity filter');

      const allCitiesRes = await makeRequest(server, { path: '/api/cities', method: 'GET' });
      const dbCities = Array.isArray(allCitiesRes.data?.data) ? allCitiesRes.data.data : (allCitiesRes.data?.data?.cities || []);
      const testCity1Id = dbCities[0]?.id;
      const testCity2Id = dbCities[1]?.id || testCity1Id;

      const cityDetail = await makeRequest(server, { path: `/api/cities/${testCity1Id}`, method: 'GET' });
      assert(cityDetail.status === 200, 'GET /api/cities/:id includes city activities');

      const activitiesSearch = await makeRequest(server, { path: '/api/activities?page=1&limit=5', method: 'GET' });
      assert(activitiesSearch.status === 200 && activitiesSearch.data.data.length > 0, 'GET /api/activities filters by category and cost ceiling');

      const allActsRes = await makeRequest(server, { path: '/api/activities', method: 'GET' });
      const dbActs = Array.isArray(allActsRes.data?.data) ? allActsRes.data.data : (allActsRes.data?.data?.activities || []);
      const testAct1Id = dbActs[0]?.id;
      const testAct2Id = dbActs[1]?.id || testAct1Id;

      // -------------------------------------------------------------
      // 4. TRIP CREATION & MULTI-SECTION ITINERARY ENGINE
      // -------------------------------------------------------------
      const createTrip = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Grand European Winter Odyssey',
        description: 'Exploring Paris cultural landmarks and Swiss alpine serenity.',
        startDate: '2026-11-01',
        endDate: '2026-11-10',
        totalBudget: 120000,
        visibility: 'PRIVATE'
      });
      assert(createTrip.status === 201 && (createTrip.data.data.trip.status === 'UPCOMING' || createTrip.data.data.trip.status === 'upcoming'), 'POST /api/trips creates trip with dynamic UPCOMING status');
      const tripId = createTrip.data?.data?.trip?.id;

      // Section 1 (Nov 1 to Nov 4)
      const sec1 = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityId: testCity1Id,
        startDate: '2026-11-01',
        endDate: '2026-11-04',
        budget: 45000,
        order: 1
      });
      assert(sec1.status === 201 && sec1.data.data.section.days.length === 4, 'POST /api/trips/:tripId/sections auto-generates 4 days for Paris');
      const sec1Id = sec1.data?.data?.section?.id;
      const day1Id = sec1.data?.data?.section?.days[0]?.id;

      // Section 2 (Nov 5 to Nov 8)
      const sec2 = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityId: testCity2Id,
        startDate: '2026-11-05',
        endDate: '2026-11-08',
        budget: 50000,
        order: 2
      });
      assert(sec2.status === 201 && sec2.data.data.section.days.length === 4, 'POST /api/trips/:tripId/sections auto-generates 4 days for Manali');
      const sec2Id = sec2.data?.data?.section?.id;

      // Section reordering
      const reorderSec = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections/reorder`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        sectionIds: [sec2Id, sec1Id]
      });
      assert(reorderSec.status === 200 && reorderSec.data.data.sections[0].id === sec2Id, 'PUT /api/trips/:tripId/sections/reorder updates section order');

      // -------------------------------------------------------------
      // 5. DAY ACTIVITY SCHEDULING & CONFLICT DETECTION ENGINE
      // -------------------------------------------------------------
      const act1 = await makeRequest(server, {
        path: `/api/days/${day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityId: testAct1Id,
        startTime: '10:00',
        endTime: '12:30',
        customCost: 6500,
        notes: 'Summit tickets pre-booked'
      });
      assert(act1.status === 201 && act1.data.data.dayActivity.activity.name, 'POST /api/days/:dayId/activities schedules Eiffel Tower (10:00 - 12:30)');
      const act1Id = act1.data?.data?.dayActivity?.id;

      // Overlapping activity rejected -> 409 Conflict
      const actConflict = await makeRequest(server, {
        path: `/api/days/${day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityId: testAct2Id,
        startTime: '11:00', // Overlaps with 10:00 - 12:30!
        endTime: '13:30'
      });
      assert(actConflict.status === 409, 'POST /api/days/:dayId/activities rejects overlapping activity with 409 Conflict');

      // Non-overlapping activity
      const act2 = await makeRequest(server, {
        path: `/api/days/${day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityId: testAct2Id,
        startTime: '14:00',
        endTime: '17:00',
        customCost: null // Fallback to estimated activity cost
      });
      assert(act2.status === 201 && act2.data.data.dayActivity.effectiveCost > 0, 'POST /api/days/:dayId/activities schedules second activity with effectiveCost fallback');
      const act2Id = act2.data?.data?.dayActivity?.id;

      // Reorder day activities
      const reorderActs = await makeRequest(server, {
        path: `/api/days/${day1Id}/activities/reorder`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityIds: [act2Id, act1Id]
      });
      assert(reorderActs.status === 200 && reorderActs.data.data.activities[0].id === act2Id, 'PUT /api/days/:dayId/activities/reorder reorders activities on day');

      // -------------------------------------------------------------
      // 6. EXPENSE MANAGEMENT & DEEP BUDGET ENGINE
      // -------------------------------------------------------------
      const exp1 = await makeRequest(server, {
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        category: 'STAY',
        amount: 30000,
        description: 'Paris Boutique Hotel (4 Nights)',
        date: '2026-11-01',
        sectionId: sec1Id,
        dayId: day1Id
      });
      assert(exp1.status === 201, 'POST /api/trips/:tripId/expenses logs accommodation expense');

      const exp2 = await makeRequest(server, {
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        category: 'FOOD',
        amount: 8500,
        description: 'Gourmet Dinner & Bistro Lunches',
        date: '2026-11-02'
      });
      assert(exp2.status === 201, 'POST /api/trips/:tripId/expenses logs food expense');

      // Budget Analytics
      const budgetRes = await makeRequest(server, {
        path: `/api/trips/${tripId}/budget`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        budgetRes.status === 200 &&
        budgetRes.data.data.totalBudget === 120000 &&
        budgetRes.data.data.totalSpent === 38500 &&
        budgetRes.data.data.remainingBudget === 81500 &&
        budgetRes.data.data.activityEstimatedCost > 0 &&
        budgetRes.data.data.dayBreakdown.length >= 8 &&
        budgetRes.data.data.sectionBreakdown.length === 2,
        'GET /api/trips/:tripId/budget provides single source of truth for budget, sections, and daily breakdown'
      );

      // -------------------------------------------------------------
      // 7. CALENDAR API & DATE-RANGE INTERSECTION
      // -------------------------------------------------------------
      const calRes = await makeRequest(server, {
        path: '/api/calendar?month=11&year=2026',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(calRes.status === 200 && calRes.data.data.trips.length >= 1, 'GET /api/calendar returns date-mapped trip for Nov 2026');

      // -------------------------------------------------------------
      // 8. PUBLIC TRIP SHARING & SANITIZED VIEWER
      // -------------------------------------------------------------
      const shareRes = await makeRequest(server, {
        path: `/api/trips/${tripId}/share`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(shareRes.status === 201 && shareRes.data.data.shareToken, 'POST /api/trips/:tripId/share creates unique share token');
      const shareToken = shareRes.data?.data?.shareToken;

      const publicTrip = await makeRequest(server, {
        path: `/api/shared/${shareToken}`,
        method: 'GET'
      });
      assert(
        publicTrip.status === 200 &&
        publicTrip.data.data.trip.name === 'Grand European Winter Odyssey' &&
        !publicTrip.data.data.trip.author.password &&
        !publicTrip.data.data.trip.author.email &&
        !publicTrip.data.data.trip.author.phone,
        'GET /api/shared/:shareToken reads trip publicly and strips sensitive author information'
      );

      // -------------------------------------------------------------
      // 9. COMMUNITY FEEDS & PERMISSIONS
      // -------------------------------------------------------------
      const createPost = await makeRequest(server, {
        path: '/api/community/posts',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Winter Highlights across Paris and Manali',
        content: 'Sharing essential packing tips and schedule recommendations for 10-day winter expeditions.',
        tripId
      });
      assert(createPost.status === 201, 'POST /api/community/posts creates community post with attached trip');
      const postId = createPost.data?.data?.post?.id;

      const communityFeed = await makeRequest(server, { path: '/api/community/posts?page=1&limit=5', method: 'GET' });
      assert(communityFeed.status === 200 && communityFeed.data.data.length >= 1, 'GET /api/community/posts returns paginated feed');

      // -------------------------------------------------------------
      // 10. MULTI-USER ISOLATION & AUTHORIZATION BARRIERS (User B vs User A)
      // -------------------------------------------------------------
      const bViewPrivateTrip = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(bViewPrivateTrip.status === 403, 'User B cannot view User A private trip (403 Forbidden)');

      const bEditPrivateTrip = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, { name: 'Hacked By User B' });
      assert(bEditPrivateTrip.status === 403, 'User B cannot modify User A private trip (403 Forbidden)');

      const bDeletePrivateTrip = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(bDeletePrivateTrip.status === 403, 'User B cannot delete User A private trip (403 Forbidden)');

      const bAddSection = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, { cityId: testCity1Id, startDate: '2026-11-01', endDate: '2026-11-03' });
      assert(bAddSection.status === 403, 'User B cannot add section to User A private trip (403 Forbidden)');

      const bAddActivity = await makeRequest(server, {
        path: `/api/days/${day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, { activityId: testAct1Id, startTime: '08:00', endTime: '09:00' });
      assert(bAddActivity.status === 403, 'User B cannot schedule activity on User A private day (403 Forbidden)');

      const bLogExpense = await makeRequest(server, {
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, { category: 'FOOD', amount: 1000 });
      assert(bLogExpense.status === 403, 'User B cannot log expense on User A private trip (403 Forbidden)');

      const bEditPost = await makeRequest(server, {
        path: `/api/community/posts/${postId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, { title: 'Unauthorized Modification' });
      assert(bEditPost.status === 403, 'User B cannot edit User A community post (403 Forbidden)');

      const bDeletePost = await makeRequest(server, {
        path: `/api/community/posts/${postId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(bDeletePost.status === 403, 'User B cannot delete User A community post (403 Forbidden)');

      // User A deletes own post
      const aDeletePost = await makeRequest(server, {
        path: `/api/community/posts/${postId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(aDeletePost.status === 200, 'User A can delete their own community post');

      // -------------------------------------------------------------
      // 11. ADMIN PRIVILEGES & SECURITY MATRIX
      // -------------------------------------------------------------
      const adminLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: 'admin@pathpilot.com',
        password: 'AdminPassword123!'
      });
      assert(adminLogin.status === 200 && adminLogin.data.data.token, 'POST /api/auth/login (Admin authenticated)');
      const adminToken = adminLogin.data?.data?.token;
      const adminId = adminLogin.data?.data?.user?.id;

      // Non-admin denied admin analytics
      const nonAdminAnalytics = await makeRequest(server, {
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(nonAdminAnalytics.status === 403, 'Non-admin user rejected from /api/admin/analytics with 403 Forbidden');

      // Admin accesses analytics
      const adminAnalytics = await makeRequest(server, {
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(
        adminAnalytics.status === 200 &&
        adminAnalytics.data.data.overview.totalUsers >= 2,
        'GET /api/admin/analytics returns system metrics with activeUsers count'
      );

      // Admin blocks User B
      const blockB = await makeRequest(server, {
        path: `/api/admin/users/${regUserB.data.data.user.id}/block`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(blockB.status === 200, 'PATCH /api/admin/users/:id/block blocks User B account');

      // Blocked User B denied access to protected endpoints
      const blockedAttempt = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(blockedAttempt.status === 403, 'Blocked User B denied access to protected profile (403 Forbidden)');

      // Admin unblocks User B
      const unblockB = await makeRequest(server, {
        path: `/api/admin/users/${regUserB.data.data.user.id}/unblock`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(unblockB.status === 200, 'PATCH /api/admin/users/:id/unblock unblocks User B account');

      // Admin self-block prevention
      const selfBlock = await makeRequest(server, {
        path: `/api/admin/users/${adminId}/block`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(selfBlock.status === 400, 'Admin cannot block own administrator account (400 Bad Request)');

      // -------------------------------------------------------------
      // 12. CASCADING DELETION & DATA LIFECYCLE AUDIT
      // -------------------------------------------------------------
      // Revoke share token
      const revokeShare = await makeRequest(server, {
        path: `/api/trips/${tripId}/share`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(revokeShare.status === 200, 'DELETE /api/trips/:tripId/share revokes public share link');

      const sharedAfterRevoke = await makeRequest(server, { path: `/api/shared/${shareToken}`, method: 'GET' });
      assert(sharedAfterRevoke.status === 404, 'GET /api/shared/:revokedToken returns 404 Not Found');

      // Delete Section 2 (Manali)
      const deleteSec2 = await makeRequest(server, {
        path: `/api/sections/${sec2Id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(deleteSec2.status === 200, 'DELETE /api/sections/:id cascades deletion of section days and day activities');

      // Delete Trip -> cascades everything
      const deleteTripRes = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(deleteTripRes.status === 200, 'DELETE /api/trips/:id cascades deletion of all child sections, days, activities, and expenses');

      // Access deleted trip -> 404
      const getDeletedTrip = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(getDeletedTrip.status === 404, 'GET /api/trips/:deletedId returns 404 Not Found (no orphaned data)');

      // -------------------------------------------------------------
      // 13. GLOBAL ERROR HANDLER & NOT FOUND VERIFICATION
      // -------------------------------------------------------------
      const notFoundRoute = await makeRequest(server, { path: '/api/completely-undefined-route', method: 'GET' });
      assert(notFoundRoute.status === 404 && notFoundRoute.data.success === false, 'GET undefined route returns 404 JSON error');

      // -------------------------------------------------------------
      // 14. SMART RECOMMENDATION ENGINE & TRAVEL PREFERENCES
      // -------------------------------------------------------------
      // 14.1 User Travel Preferences (PUT & GET)
      const updatePrefs = await makeRequest(server, {
        path: '/api/users/preferences',
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        interests: ['ADVENTURE', 'FOOD', 'CULTURE'],
        preferredCountries: ['India', 'France'],
        budgetLevel: 'MEDIUM'
      });
      assert(
        updatePrefs.status === 200 &&
        updatePrefs.data.data.preferences.interests.includes('ADVENTURE') &&
        updatePrefs.data.data.preferences.preferredCountries.includes('France'),
        'PUT /api/users/preferences saves user travel preferences'
      );

      const getPrefs = await makeRequest(server, {
        path: '/api/users/preferences',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        getPrefs.status === 200 &&
        getPrefs.data.data.preferences.budgetLevel === 'MEDIUM',
        'GET /api/users/preferences retrieves stored preferences'
      );

      // 14.2 Trip Planning Recommendation (POST /api/trips/recommend)
      const tripRec = await makeRequest(server, {
        path: '/api/trips/recommend',
        method: 'POST'
      }, {
        startDate: '2026-09-10',
        endDate: '2026-09-17',
        budget: 65000,
        interests: ['ADVENTURE', 'FOOD'],
        preferredCountries: ['India'],
        maxCities: 2
      });
      assert(
        tripRec.status === 200 &&
        tripRec.data.data.tripDurationDays === 8 &&
        tripRec.data.data.recommendedCities.length === 2 &&
        tripRec.data.data.recommendedActivities.length > 0 &&
        tripRec.data.data.budgetStatus === 'WITHIN_BUDGET',
        'POST /api/trips/recommend generates structured trip recommendations matching interests and duration'
      );

      // 14.3 Preferred Country Prioritization & High Scoring Check
      const franceRec = await makeRequest(server, {
        path: '/api/trips/recommend',
        method: 'POST'
      }, {
        startDate: '2026-10-01',
        endDate: '2026-10-07',
        budget: 90000,
        interests: ['CULTURE'],
        preferredCountries: ['France'],
        maxCities: 1
      });
      assert(
        franceRec.status === 200 &&
        franceRec.data.data.recommendedCities[0].name === 'Paris',
        'POST /api/trips/recommend prioritizes preferred country (Paris, France)'
      );

      // 14.4 Low Budget Recommendation
      const lowBudgetRec = await makeRequest(server, {
        path: '/api/trips/recommend',
        method: 'POST'
      }, {
        startDate: '2026-09-10',
        endDate: '2026-09-15',
        budget: 6000,
        interests: ['NATURE'],
        maxCities: 1
      });
      assert(
        lowBudgetRec.status === 200 &&
        lowBudgetRec.data.data.recommendedCities.length >= 1,
        'POST /api/trips/recommend handles low budget scenarios gracefully'
      );

      // 14.5 Budget Optimizer & Allocation Breakdown (POST /api/trips/optimize-budget)
      const budgetOpt = await makeRequest(server, {
        path: '/api/trips/optimize-budget',
        method: 'POST'
      }, {
        budget: 50000,
        cities: [1, 2], // Delhi, Manali
        activities: [1, 4] // Taj Mahal, Solang Paragliding
      });
      assert(
        budgetOpt.status === 200 &&
        budgetOpt.data.data.totalBudget === 50000 &&
        budgetOpt.data.data.recommendedAllocation.stay > 0 &&
        budgetOpt.data.data.recommendedAllocation.transport > 0 &&
        budgetOpt.data.data.remainingBudget > 0,
        'POST /api/trips/optimize-budget calculates dynamic category allocation (transport, stay, food, activities)'
      );

      // 14.6 Over-budget warning and removal suggestion
      const overBudgetOpt = await makeRequest(server, {
        path: '/api/trips/optimize-budget',
        method: 'POST'
      }, {
        budget: 2000, // Very low budget vs high cost activities
        cities: [5], // Paris
        activities: [12, 13] // Eiffel Tower (6500) + Louvre (5000)
      });
      assert(
        overBudgetOpt.status === 200 &&
        overBudgetOpt.data.data.warnings.some(w => w.type === 'OVER_BUDGET') &&
        overBudgetOpt.data.data.suggestions.some(s => s.type === 'REMOVE_ACTIVITY'),
        'POST /api/trips/optimize-budget returns OVER_BUDGET warnings and actionable removal suggestions'
      );

      // 14.7 Smart Itinerary Suggestions Engine (POST /api/trips/suggest-itinerary)
      // Create a fresh trip for User A to test itinerary suggestions
      const freshTrip = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Autumn Discovery Expedition',
        startDate: '2026-10-15',
        endDate: '2026-10-18',
        totalBudget: 40000,
        visibility: 'PRIVATE'
      });
      const freshTripId = freshTrip.data.data.trip.id;

      // Add section (Delhi: 4 days with 0 activities scheduled -> empty days)
      await makeRequest(server, {
        path: `/api/trips/${freshTripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityId: testCity1Id,
        startDate: '2026-10-15',
        endDate: '2026-10-18',
        budget: 20000,
        order: 1
      });

      const itinerarySug = await makeRequest(server, {
        path: '/api/trips/suggest-itinerary',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        tripId: freshTripId
      });
      assert(
        itinerarySug.status === 200 &&
        itinerarySug.data.data.suggestions.some(s => s.type === 'EMPTY_DAY') &&
        itinerarySug.data.data.suggestions.find(s => s.type === 'EMPTY_DAY').recommendedActivities.length > 0,
        'POST /api/trips/suggest-itinerary identifies EMPTY_DAY and recommends available city activities'
      );

      // 14.8 Trip Ownership Check on Suggest Itinerary
      const unauthorizedSug = await makeRequest(server, {
        path: '/api/trips/suggest-itinerary',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` } // User B tries to access User A's trip
      }, {
        tripId: freshTripId
      });
      assert(
        unauthorizedSug.status === 403,
        'POST /api/trips/suggest-itinerary blocks non-owner with 403 Forbidden'
      );

      // 14.9 Personalized Recommendations (GET /api/recommendations/personalized)
      const personalizedRec = await makeRequest(server, {
        path: '/api/recommendations/personalized',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        personalizedRec.status === 200 &&
        personalizedRec.data.data.recommendedCities.length > 0 &&
        personalizedRec.data.data.recommendedActivities.length > 0 &&
        personalizedRec.data.data.basedOn.length > 0,
        'GET /api/recommendations/personalized produces tailored suggestions based on preferences and journey history'
      );

      // -------------------------------------------------------------
      // 15. TRIP COLLABORATION SYSTEM & ACTIVITY LOGGING
      // -------------------------------------------------------------
      // Onboard User C (Viewer) and User D (Stranger)
      const userC_Email = `userc_${Date.now()}@example.com`;
      const regUserC = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Charlie',
        lastName: 'Viewer',
        email: userC_Email,
        password: 'Password123!',
        city: 'London',
        country: 'United Kingdom'
      });
      const tokenC = regUserC.data.data.token;
      const userC_Id = regUserC.data.data.user.id;

      const userD_Email = `userd_${Date.now()}@example.com`;
      const regUserD = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'David',
        lastName: 'Stranger',
        email: userD_Email,
        password: 'Password123!',
        city: 'Sydney',
        country: 'Australia'
      });
      const tokenD = regUserD.data.data.token;
      const userD_Id = regUserD.data.data.user.id;

      // User A creates a Private Collaboration Trip
      const collabTripRes = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Collaborative Alpine Expedition',
        startDate: '2026-12-01',
        endDate: '2026-12-10',
        totalBudget: 80000,
        visibility: 'PRIVATE'
      });
      assert(collabTripRes.status === 201, 'Owner (User A) creates collaborative trip');
      const collabTripId = collabTripRes.data.data.trip.id;

      // 15.1 Owner Invites User B as EDITOR
      const inviteB = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: regUserB.data.data.user.id,
        role: 'EDITOR'
      });
      assert(inviteB.status === 201 && inviteB.data.data.role === 'EDITOR', 'Owner invites User B as EDITOR (201 Created)');

      // 15.2 Owner Invites User C as VIEWER
      const inviteC = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: userC_Id,
        role: 'VIEWER'
      });
      assert(inviteC.status === 201 && inviteC.data.data.role === 'VIEWER', 'Owner invites User C as VIEWER (201 Created)');

      // 15.3 Duplicate collaborator rejected
      const duplicateInvite = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: regUserB.data.data.user.id,
        role: 'EDITOR'
      });
      assert(duplicateInvite.status === 409, 'Duplicate collaborator invitation rejected with 409 Conflict');

      // 15.4 Owner cannot invite self as collaborator
      const selfInvite = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: regUserA.data.data.user.id,
        role: 'EDITOR'
      });
      assert(selfInvite.status === 400, 'Owner cannot be added as collaborator (400 Bad Request)');

      // 15.5 Non-owner (User B) cannot invite collaborators
      const nonOwnerInvite = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        userId: userD_Id,
        role: 'VIEWER'
      });
      assert(nonOwnerInvite.status === 403, 'Non-owner collaborator cannot invite others (403 Forbidden)');

      // 15.6 List collaborators
      const listCollabs = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        listCollabs.status === 200 &&
        listCollabs.data.data.collaborators.length === 2 &&
        listCollabs.data.data.owner.id === regUserA.data.data.user.id,
        'GET /api/trips/:tripId/collaborators lists all collaborators with safe user profiles'
      );

      // 15.7 Permissions: EDITOR (User B) can modify itinerary and expenses
      const editorAddSec = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        cityId: testCity1Id,
        startDate: '2026-12-01',
        endDate: '2026-12-04',
        budget: 35000,
        order: 1
      });
      assert(editorAddSec.status === 201, 'Editor (User B) can add destination sections');
      const collabSecId = editorAddSec.data.data.section.id;
      const collabDay1Id = editorAddSec.data.data.section.days[0].id;

      const editorAddAct = await makeRequest(server, {
        path: `/api/days/${collabDay1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        activityId: testAct1Id,
        startTime: '10:00',
        endTime: '12:00',
        customCost: 1500
      });
      assert(editorAddAct.status === 201, 'Editor (User B) can schedule day activities');

      const editorLogExp = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        category: 'STAY',
        amount: 20000,
        description: 'Shinjuku Hotel'
      });
      assert(editorLogExp.status === 201, 'Editor (User B) can log expenses');

      // 15.8 Permissions: EDITOR CANNOT delete trip or manage public sharing
      const editorDeleteTrip = await makeRequest(server, {
        path: `/api/trips/${collabTripId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(editorDeleteTrip.status === 403, 'Editor (User B) cannot delete trip (403 Forbidden)');

      const editorShareTrip = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/share`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(editorShareTrip.status === 403, 'Editor (User B) cannot create public share link (403 Forbidden)');

      // 15.9 Permissions: VIEWER (User C) has read-only access
      const viewerGetTrip = await makeRequest(server, {
        path: `/api/trips/${collabTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenC}` }
      });
      assert(viewerGetTrip.status === 200 && (viewerGetTrip.data.data.trip.userRole === 'VIEWER' || viewerGetTrip.data.data.trip.userRole === 'viewer'), 'Viewer (User C) can view trip details and receives userRole: VIEWER');

      const viewerAddSec = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        cityId: testCity1Id,
        startDate: '2026-12-05',
        endDate: '2026-12-08'
      });
      assert(viewerAddSec.status === 403, 'Viewer (User C) cannot add sections (403 Forbidden)');

      const viewerAddAct = await makeRequest(server, {
        path: `/api/days/${collabDay1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        activityId: testAct1Id,
        startTime: '13:00',
        endTime: '15:00'
      });
      assert(viewerAddAct.status === 403, 'Viewer (User C) cannot schedule activities (403 Forbidden)');

      const viewerLogExp = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        category: 'FOOD',
        amount: 2000
      });
      assert(viewerLogExp.status === 403, 'Viewer (User C) cannot log expenses (403 Forbidden)');

      // 15.10 Permissions: STRANGER (User D) has no access
      const strangerGetTrip = await makeRequest(server, {
        path: `/api/trips/${collabTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(strangerGetTrip.status === 403, 'Stranger (User D) blocked from viewing private trip (403 Forbidden)');

      // 15.11 Shared-with-me endpoint
      const sharedWithB = await makeRequest(server, {
        path: '/api/trips/shared-with-me',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        sharedWithB.status === 200 &&
        sharedWithB.data.data.some(t => t.id === collabTripId && t.collaborationRole === 'EDITOR'),
        'GET /api/trips/shared-with-me returns collaborative trips with user role'
      );

      const sharedWithD = await makeRequest(server, {
        path: '/api/trips/shared-with-me',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(
        sharedWithD.status === 200 &&
        sharedWithD.data.data.length === 0,
        'GET /api/trips/shared-with-me returns empty list for user with no shared trips'
      );

      // 15.12 Role Update: Owner promotes User C to EDITOR
      const promoteC = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators/${userC_Id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        role: 'EDITOR'
      });
      assert(promoteC.status === 200 && promoteC.data.data.role === 'EDITOR', 'Owner can update collaborator role to EDITOR');

      // User C (now EDITOR) can now log expense
      const cLogExp = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        category: 'FOOD',
        amount: 3500,
        description: 'Team Dinner'
      });
      assert(cLogExp.status === 201, 'Promoted User C can now log expenses as EDITOR');

      // 15.13 Collaborator Departure & Removal
      // User B leaves the trip (self-removal)
      const bLeave = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators/${regUserB.data.data.user.id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(bLeave.status === 200, 'Collaborator (User B) can remove themselves from trip');

      // User B can no longer access trip
      const bAccessAfterLeave = await makeRequest(server, {
        path: `/api/trips/${collabTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(bAccessAfterLeave.status === 403, 'Departed User B immediately loses access to trip (403 Forbidden)');

      // Owner removes User C
      const aRemoveC = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/collaborators/${userC_Id}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(aRemoveC.status === 200, 'Owner can remove collaborator User C');

      // 15.14 Activity Logging Audit
      const activityLogs = await makeRequest(server, {
        path: `/api/trips/${collabTripId}/activity-log`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        activityLogs.status === 200 &&
        activityLogs.data.data.length >= 6 &&
        activityLogs.data.data.some(l => l.action === 'COLLABORATOR_ADDED') &&
        activityLogs.data.data.some(l => l.action === 'SECTION_CREATED') &&
        activityLogs.data.data.some(l => l.action === 'ROLE_UPDATED'),
        'GET /api/trips/:tripId/activity-log records chronological collaboration and itinerary actions'
      );

      // -------------------------------------------------------------
      // 16. NOTIFICATIONS & SMART TRIP ALERTS SYSTEM
      // -------------------------------------------------------------
      // 16.1 Verify User B received collaboration invitation notification
      const userB_Notifs = await makeRequest(server, {
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        userB_Notifs.status === 200 &&
        userB_Notifs.data.data.some(n => n.type === 'TRIP_INVITATION'),
        'Collaborator invitation automatically creates TRIP_INVITATION notification for invited user'
      );

      // 16.2 Verify User C received ROLE_CHANGED notification
      const userC_Notifs = await makeRequest(server, {
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenC}` }
      });
      assert(
        userC_Notifs.status === 200 &&
        userC_Notifs.data.data.some(n => n.type === 'ROLE_CHANGED'),
        'Collaborator role modification automatically creates ROLE_CHANGED notification'
      );

      // 16.3 Verify User C received COLLABORATOR_REMOVED notification
      assert(
        userC_Notifs.data.data.some(n => n.type === 'COLLABORATOR_REMOVED'),
        'Removed collaborator receives COLLABORATOR_REMOVED notification'
      );

      // 16.4 Isolation: User only sees their own notifications
      const userD_Notifs = await makeRequest(server, {
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(
        userD_Notifs.status === 200 &&
        userD_Notifs.data.data.length === 0,
        'User D only sees their own notifications (isolated empty notification center)'
      );

      // 16.5 Unread Notification Count
      const userB_Unread = await makeRequest(server, {
        path: '/api/notifications/unread-count',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        userB_Unread.status === 200 &&
        userB_Unread.data.data.unreadCount > 0,
        'GET /api/notifications/unread-count returns accurate unread count'
      );

      // 16.6 Security: User B cannot modify or read User A's notifications
      const userA_Notifs = await makeRequest(server, {
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const aNotifId = userA_Notifs.data.data[0] ? userA_Notifs.data.data[0].id : null;
      if (aNotifId) {
        const unauthorizedMarkRead = await makeRequest(server, {
          path: `/api/notifications/${aNotifId}/read`,
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenB}` }
        });
        assert(unauthorizedMarkRead.status === 403, 'User cannot modify another user’s notification (403 Forbidden)');
      }

      // 16.7 Mark Single Notification as Read
      const bNotifToRead = userB_Notifs.data.data[0].id;
      const markSingleRead = await makeRequest(server, {
        path: `/api/notifications/${bNotifToRead}/read`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        markSingleRead.status === 200 &&
        markSingleRead.data.data.notification.isRead === true,
        'PATCH /api/notifications/:id/read safely marks individual notification as read'
      );

      // 16.8 Mark All Notifications as Read
      const markAllRead = await makeRequest(server, {
        path: '/api/notifications/read-all',
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        markAllRead.status === 200 &&
        markAllRead.data.data.updatedCount >= 0,
        'PATCH /api/notifications/read-all marks all user notifications as read'
      );

      const userB_UnreadAfter = await makeRequest(server, {
        path: '/api/notifications/unread-count',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(userB_UnreadAfter.data.data.unreadCount === 0, 'Unread count drops to 0 after read-all');

      // 16.9 Delete Single Notification
      const deleteSingleNotif = await makeRequest(server, {
        path: `/api/notifications/${bNotifToRead}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(deleteSingleNotif.status === 200, 'DELETE /api/notifications/:id deletes single notification');

      // 16.10 Clear All Notifications
      const clearAllNotifs = await makeRequest(server, {
        path: '/api/notifications',
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenC}` }
      });
      assert(clearAllNotifs.status === 200, 'DELETE /api/notifications clears all user notifications');

      // 16.11 Budget Alerts & Duplicate Prevention Engine
      // Create a test trip with budget 10,000
      const budgetTrip = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Budget Alert Test Expedition',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
        totalBudget: 10000
      });
      const bTripId = budgetTrip.data.data.trip.id;

      // Log expense of 8,500 (85% -> triggers BUDGET_WARNING)
      await makeRequest(server, {
        path: `/api/trips/${bTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        category: 'STAY',
        amount: 8500,
        description: 'Budget Warning Trigger'
      });

      const notifsAfterWarning = await makeRequest(server, {
        path: '/api/notifications?type=BUDGET_WARNING',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        notifsAfterWarning.status === 200 &&
        notifsAfterWarning.data.data.some(n => n.type === 'BUDGET_WARNING' && n.relatedTripId === bTripId),
        'Budget warning (80%+) notification automatically created'
      );

      // Log another expense pushing to 12,000 (120% -> triggers BUDGET_EXCEEDED)
      await makeRequest(server, {
        path: `/api/trips/${bTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        category: 'FOOD',
        amount: 3500,
        description: 'Budget Exceeded Trigger'
      });

      const notifsAfterExceeded = await makeRequest(server, {
        path: '/api/notifications?type=BUDGET_EXCEEDED',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        notifsAfterExceeded.status === 200 &&
        notifsAfterExceeded.data.data.some(n => n.type === 'BUDGET_EXCEEDED' && n.relatedTripId === bTripId),
        'Budget exceeded (100%+) notification automatically created'
      );

      // Duplicate prevention test: logging another small expense does not duplicate unread BUDGET_EXCEEDED alert
      const countBefore = notifsAfterExceeded.data.data.length;
      await makeRequest(server, {
        path: `/api/trips/${bTripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        category: 'OTHER',
        amount: 500
      });
      const notifsAfterDuplicate = await makeRequest(server, {
        path: '/api/notifications?type=BUDGET_EXCEEDED',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        notifsAfterDuplicate.data.data.length === countBefore,
        'Duplicate budget notifications prevented for the same trip threshold'
      );

      // 16.12 Trip Health Analysis & Smart Alerts
      const tripHealthRes = await makeRequest(server, {
        path: `/api/trips/${bTripId}/health`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        tripHealthRes.status === 200 &&
        typeof tripHealthRes.data.data.score === 'number' &&
        ['EXCELLENT', 'GOOD', 'NEEDS_ATTENTION', 'CRITICAL'].includes(tripHealthRes.data.data.status) &&
        Array.isArray(tripHealthRes.data.data.issues) &&
        Array.isArray(tripHealthRes.data.data.suggestions),
        'GET /api/trips/:tripId/health calculates deterministic trip health score and actionable issues'
      );

      // 16.13 Trip Health Access Security
      const unauthorizedHealth = await makeRequest(server, {
        path: `/api/trips/${bTripId}/health`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` } // Stranger User D
      });
      assert(unauthorizedHealth.status === 403, 'Unauthorized user blocked from accessing trip health (403 Forbidden)');

      // -------------------------------------------------------------
      // 17. TRIP TEMPLATES & TRIP CLONING SYSTEM
      // -------------------------------------------------------------
      // Setup: User A has a rich trip with 2 sections & scheduled activities
      const templateTripRes = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: '7-Day Japan Adventure Original',
        description: 'Tokyo modernism and Kyoto tranquility',
        startDate: '2026-10-01',
        endDate: '2026-10-07',
        totalBudget: 120000
      });
      const tTripId = templateTripRes.data.data.trip.id;

      // Add section 1: Tokyo (3 days: 2026-10-01 to 2026-10-03)
      const tSec1 = await makeRequest(server, {
        path: `/api/trips/${tTripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityId: testCity1Id,
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        budget: 60000,
        order: 1
      });
      const tSec1Day1Id = tSec1.data.data.section.days[0].id;

      // Add activity to Tokyo Day 1
      await makeRequest(server, {
        path: `/api/days/${tSec1Day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityId: testAct1Id,
        startTime: '10:00',
        endTime: '12:00',
        customCost: 2000
      });

      // Add section 2: Paris/Kyoto (4 days: 2026-10-04 to 2026-10-07)
      const tSec2 = await makeRequest(server, {
        path: `/api/trips/${tTripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityId: testCity2Id,
        startDate: '2026-10-04',
        endDate: '2026-10-07',
        budget: 60000,
        order: 2
      });
      const tSec2Day1Id = tSec2.data.data.section.days[0].id;

      // Add activity to Section 2 Day 1
      await makeRequest(server, {
        path: `/api/days/${tSec2Day1Id}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        activityId: testAct2Id,
        startTime: '14:00',
        endTime: '17:00',
        customCost: 4000
      });

      // 17.1 Owner creates a Public Template
      const createTmplRes = await makeRequest(server, {
        path: `/api/trips/${tTripId}/template`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: '7-Day Golden Japan & Europe Route',
        description: 'Complete curated multi-city itinerary',
        isPublic: true,
        category: 'CULTURE'
      });
      assert(
        createTmplRes.status === 201 &&
        createTmplRes.data.data.template.sections.length === 2 &&
        createTmplRes.data.data.template.metadata.totalActivities === 2,
        'Owner creates a reusable public template from existing trip'
      );
      const publicTmplId = createTmplRes.data.data.template.id;

      // 17.2 Owner creates a Private Template
      const createPrivTmpl = await makeRequest(server, {
        path: `/api/trips/${tTripId}/template`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Private Alpine Secret',
        isPublic: false,
        category: 'ADVENTURE'
      });
      assert(createPrivTmpl.status === 201, 'Owner creates private template');
      const privTmplId = createPrivTmpl.data.data.template.id;

      // 17.3 Non-owner cannot create template from User A trip
      const unauthorizedTmpl = await makeRequest(server, {
        path: `/api/trips/${tTripId}/template`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        name: 'Unauthorized Template'
      });
      assert(unauthorizedTmpl.status === 403, 'Non-owner cannot create template from private trip (403 Forbidden)');

      // 17.4 Private template cannot be accessed by another user
      const userB_GetPrivTmpl = await makeRequest(server, {
        path: `/api/templates/${privTmplId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(userB_GetPrivTmpl.status === 403, 'Private template cannot be viewed by other users (403 Forbidden)');

      // 17.5 Public template discovery
      const publicTmpls = await makeRequest(server, {
        path: '/api/templates?category=CULTURE',
        method: 'GET'
      });
      assert(
        publicTmpls.status === 200 &&
        publicTmpls.data.data.some(t => t.id === publicTmplId),
        'Public template can be discovered with category filters'
      );

      // 17.6 User B creates trip from public template
      const useTmplRes = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/use`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        tripName: 'Bob Japan Vacation 2027',
        startDate: '2027-04-01',
        endDate: '2027-04-07',
        budget: 150000
      });
      assert(
        useTmplRes.status === 201 &&
        useTmplRes.data.data.trip.userId === regUserB.data.data.user.id &&
        useTmplRes.data.data.trip.id !== tTripId,
        'User B instantiates completely independent trip from template with new ID'
      );
      const bobTripId = useTmplRes.data.data.trip.id;

      // Verify template copyCount incremented
      const tmplDetails = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}`,
        method: 'GET'
      });
      assert(tmplDetails.data.data.template.copyCount >= 1, 'Template copyCount automatically increments on use');

      // 17.7 Data Independence: modifying Bob’s trip does not affect template or original trip
      await makeRequest(server, {
        path: `/api/trips/${bobTripId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        name: 'Bob Modified Independent Trip'
      });
      const originalTripCheck = await makeRequest(server, {
        path: `/api/trips/${tTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        originalTripCheck.data.data.trip.name === '7-Day Japan Adventure Original',
        'Modifying copied trip leaves original trip and template 100% unchanged'
      );

      // 17.8 Shorter trip duration trims content and returns warnings
      const shorterUseRes = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/use`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        tripName: 'Short 2-Day Trip',
        startDate: '2027-05-01',
        endDate: '2027-05-02'
      });
      assert(
        shorterUseRes.status === 201 &&
        shorterUseRes.data.data.warnings.length > 0,
        'Shorter trip duration trims excess content and returns descriptive warnings'
      );

      // 17.9 Longer trip duration creates valid additional days
      const longerUseRes = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/use`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        tripName: 'Extended 12-Day Trip',
        startDate: '2027-06-01',
        endDate: '2027-06-12'
      });
      assert(
        longerUseRes.status === 201 &&
        longerUseRes.data.data.trip.startDate === '2027-06-01' &&
        longerUseRes.data.data.trip.endDate === '2027-06-12',
        'Longer trip duration creates valid extended itinerary schedule'
      );

      // 17.10 Owner duplicates own trip
      const dupTripRes = await makeRequest(server, {
        path: `/api/trips/${tTripId}/duplicate`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Duplicated Japan Adventure 2028',
        startDate: '2028-01-01',
        endDate: '2028-01-07'
      });
      assert(
        dupTripRes.status === 201 &&
        dupTripRes.data.data.trip.name === 'Duplicated Japan Adventure 2028' &&
        dupTripRes.data.data.trip.id !== tTripId,
        'POST /api/trips/:tripId/duplicate clones entire trip structure under new IDs'
      );

      // 17.11 Copy Public Shared Trip
      // Create share link for User A's trip
      const shareTmplTripRes = await makeRequest(server, {
        path: `/api/trips/${tTripId}/share`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      const tmplShareToken = shareTmplTripRes.data.data.shareToken;

      const copySharedRes = await makeRequest(server, {
        path: `/api/shared/${tmplShareToken}/copy`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        copySharedRes.status === 201 &&
        copySharedRes.data.data.trip.userId === regUserB.data.data.user.id &&
        copySharedRes.data.data.trip.visibility === 'PRIVATE',
        'POST /api/shared/:shareToken/copy clones public shared trip into private personal trip'
      );

      // 17.12 Invalid share token rejected
      const invalidCopy = await makeRequest(server, {
        path: '/api/shared/invalid_non_existent_token_999/copy',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(invalidCopy.status === 404, 'Invalid share token rejected with 404 Not Found');

      // 17.13 Template Favorites (POST, DELETE, GET)
      const favRes = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/favorite`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(favRes.status === 201, 'User can favorite a public template');

      // Duplicate favorite rejected
      const dupFav = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/favorite`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(dupFav.status === 409, 'Duplicate template favorite rejected with 409 Conflict');

      // User favorites feed
      const myFavs = await makeRequest(server, {
        path: '/api/templates/favorites',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        myFavs.status === 200 &&
        myFavs.data.data.some(f => f.template.id === publicTmplId),
        'GET /api/templates/favorites returns user favorited templates'
      );

      // Unfavorite
      const unfavRes = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}/favorite`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(unfavRes.status === 200, 'DELETE /api/templates/:id/favorite removes template from favorites');

      // 17.14 Template Management Security: Only owner can edit/delete template
      const unauthorizedUpdate = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        name: 'Hacked Template'
      });
      assert(unauthorizedUpdate.status === 403, 'Non-owner cannot update template (403 Forbidden)');

      const ownerUpdate = await makeRequest(server, {
        path: `/api/templates/${publicTmplId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: '7-Day Golden Japan & Europe Route (Updated Edition)'
      });
      assert(
        ownerUpdate.status === 200 &&
        ownerUpdate.data.data.template.name.includes('(Updated Edition)'),
        'Owner can update template metadata'
      );

      const ownerDelete = await makeRequest(server, {
        path: `/api/templates/${privTmplId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(ownerDelete.status === 200, 'Owner can delete own template');

      // -------------------------------------------------------------
      // 18. GROUP EXPENSE SPLITTING & SETTLEMENT ENGINE
      // -------------------------------------------------------------
      // Setup: Create a fresh group trip with Owner (A), Editor (B), Viewer (C)
      const groupTripRes = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Alpine Squad Expedition',
        startDate: '2027-08-01',
        endDate: '2027-08-07',
        totalBudget: 300000
      });
      const gTripId = groupTripRes.data.data.trip.id;

      // Add User B as EDITOR
      await makeRequest(server, {
        path: `/api/trips/${gTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: regUserB.data.data.user.id,
        role: 'EDITOR'
      });

      // Add User C as VIEWER
      await makeRequest(server, {
        path: `/api/trips/${gTripId}/collaborators`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        userId: userC_Id,
        role: 'VIEWER'
      });

      const userA_Id = regUserA.data.data.user.id; // Alice
      const userB_Id = regUserB.data.data.user.id; // Bob

      // 18.1 Equal Split: User A pays 12,000 split equally among A, B, C (4,000 each)
      const equalExpenseRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Chalet Rental',
        amount: 12000,
        category: 'STAY',
        paidBy: userA_Id,
        splitType: 'EQUAL',
        participants: [userA_Id, userB_Id, userC_Id]
      });
      assert(
        equalExpenseRes.status === 201 &&
        equalExpenseRes.data.data.splits.length === 3 &&
        equalExpenseRes.data.data.splits.every(s => s.amount === 4000),
        'EQUAL split correctly calculates equal distribution across participants'
      );
      const chaletExpId = equalExpenseRes.data.data.id;

      // 18.2 Exact Split: User B (Editor) pays 6,000 (A: 3000, B: 2000, C: 1000)
      const exactExpenseRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        title: 'Mountain Passes & Tolls',
        amount: 6000,
        category: 'TRANSPORT',
        paidBy: userB_Id,
        splitType: 'EXACT',
        splits: [
          { userId: userA_Id, amount: 3000 },
          { userId: userB_Id, amount: 2000 },
          { userId: userC_Id, amount: 1000 }
        ]
      });
      assert(
        exactExpenseRes.status === 201 &&
        exactExpenseRes.data.data.splits.find(s => s.userId === userA_Id).amount === 3000,
        'EXACT split saves custom exact individual amounts'
      );

      // 18.3 Percentage Split: User A pays 10,000 (A: 50% = 5000, B: 30% = 3000, C: 20% = 2000)
      const pctExpenseRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Gourmet Dinner Feast',
        amount: 10000,
        category: 'FOOD',
        paidBy: userA_Id,
        splitType: 'PERCENTAGE',
        splits: [
          { userId: userA_Id, percentage: 50 },
          { userId: userB_Id, percentage: 30 },
          { userId: userC_Id, percentage: 20 }
        ]
      });
      assert(
        pctExpenseRes.status === 201 &&
        pctExpenseRes.data.data.splits.find(s => s.userId === userB_Id).amount === 3000,
        'PERCENTAGE split safely converts percentages to accurate amounts'
      );

      // 18.4 Validation: Invalid exact sum rejected
      const invalidExact = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Bad Exact Math',
        amount: 5000,
        paidBy: userA_Id,
        splitType: 'EXACT',
        splits: [
          { userId: userA_Id, amount: 2000 },
          { userId: userB_Id, amount: 2000 } // sum is 4000 != 5000
        ]
      });
      assert(invalidExact.status === 400, 'Exact split with mismatching sum is rejected (400 Bad Request)');

      // 18.5 Validation: Invalid percentage sum rejected
      const invalidPct = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Bad Pct Math',
        amount: 5000,
        paidBy: userA_Id,
        splitType: 'PERCENTAGE',
        splits: [
          { userId: userA_Id, percentage: 40 },
          { userId: userB_Id, percentage: 40 } // sum is 80% != 100%
        ]
      });
      assert(invalidPct.status === 400, 'Percentage split != 100% is rejected (400 Bad Request)');

      // 18.6 Validation: Non-collaborator User D cannot be added as participant
      const nonMemberSplit = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'External Guest Expense',
        amount: 3000,
        paidBy: userA_Id,
        splitType: 'EQUAL',
        participants: [userA_Id, 9999] // 9999 not a member
      });
      assert(nonMemberSplit.status === 400, 'Non-collaborator rejected from expense split (400 Bad Request)');

      // 18.7 Security: Viewer (User C) cannot create shared expense
      const viewerCreateExp = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        title: 'Viewer Unauthorized Expense',
        amount: 1000,
        paidBy: userC_Id,
        splitType: 'EQUAL',
        participants: [userA_Id, userC_Id]
      });
      assert(viewerCreateExp.status === 403, 'Viewer cannot create shared expense (403 Forbidden)');

      // 18.8 Balances Calculation
      // Current tallies:
      // Expense 1 (Chalet): 12000 paid by A -> A owes 4000, B owes 4000, C owes 4000
      // Expense 2 (Tolls): 6000 paid by B -> A owes 3000, B owes 2000, C owes 1000
      // Expense 3 (Dinner): 10000 paid by A -> A owes 5000, B owes 3000, C owes 2000
      // Totals:
      // A: paid 22000, owed 12000 -> net = +10000
      // B: paid 6000, owed 9000 -> net = -3000
      // C: paid 0, owed 7000 -> net = -7000
      const balancesRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/balances`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        balancesRes.status === 200 &&
        balancesRes.data.data.balances.find(b => b.userId === userA_Id).netBalance === 10000 &&
        balancesRes.data.data.balances.find(b => b.userId === userB_Id).netBalance === -3000 &&
        balancesRes.data.data.balances.find(b => b.userId === userC_Id).netBalance === -7000,
        'GET /api/trips/:tripId/balances accurately calculates totalPaid, totalOwed, and netBalances'
      );

      // 18.9 Settlement Optimization Engine
      // Debtors: C owes 7000, B owes 3000. Creditor: A receives 10000.
      // Optimized transactions:
      // 1. C pays A 7,000
      // 2. B pays A 3,000
      const settlementsRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/settlements`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        settlementsRes.status === 200 &&
        settlementsRes.data.data.totalTransactions === 2 &&
        settlementsRes.data.data.settlements.some(s => s.fromUser.id === userC_Id && s.toUser.id === userA_Id && s.amount === 7000) &&
        settlementsRes.data.data.settlements.some(s => s.fromUser.id === userB_Id && s.toUser.id === userA_Id && s.amount === 3000),
        'GET /api/trips/:tripId/settlements optimizes debts into minimal transactions'
      );

      // 18.10 Settlement Completion
      // Complete settlement: User B pays User A 3,000
      const completeBtoA = await makeRequest(server, {
        path: `/api/trips/${gTripId}/settlements/0/complete`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        fromUserId: userB_Id,
        toUserId: userA_Id,
        amount: 3000
      });
      assert(
        completeBtoA.status === 200 &&
        completeBtoA.data.data.settlement.status === 'COMPLETED',
        'PATCH /api/trips/:tripId/settlements/:id/complete marks settlement as COMPLETED'
      );
      const settlementRecordId = completeBtoA.data.data.settlement.id;

      // Duplicate completion rejected
      const duplicateComplete = await makeRequest(server, {
        path: `/api/trips/${gTripId}/settlements/${settlementRecordId}/complete`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(duplicateComplete.status === 400, 'Duplicate settlement completion is rejected');

      // Verify B's net balance is now 0 after completed settlement
      const balancesAfterSettlement = await makeRequest(server, {
        path: `/api/trips/${gTripId}/balances`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      assert(
        balancesAfterSettlement.data.data.balances.find(b => b.userId === userB_Id).netBalance === 0,
        'Balances update dynamically when settlement is completed (User B balance becomes 0)'
      );

      // 18.11 Settlement History
      const settlementHistory = await makeRequest(server, {
        path: `/api/trips/${gTripId}/settlements/history`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        settlementHistory.status === 200 &&
        settlementHistory.data.data.some(s => s.id === settlementRecordId && s.status === 'COMPLETED'),
        'GET /api/trips/:tripId/settlements/history returns settled transaction logs'
      );

      // 18.12 Personal Expense Summary
      const userCSummary = await makeRequest(server, {
        path: `/api/trips/${gTripId}/my-expense-summary`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenC}` }
      });
      assert(
        userCSummary.status === 200 &&
        userCSummary.data.data.netBalance === -7000 &&
        userCSummary.data.data.pendingPayments.length >= 1,
        'GET /api/trips/:tripId/my-expense-summary returns individual user paid/owed tallies and pending transactions'
      );

      // 18.13 Security: Unauthorized stranger User D cannot view shared expenses
      const strangerExpenses = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(strangerExpenses.status === 403, 'Unauthorized stranger blocked from trip shared expenses (403 Forbidden)');

      // 18.14 Deleting an expense recalculates balances
      const deleteChaletExp = await makeRequest(server, {
        path: `/api/trips/${gTripId}/shared-expenses/${chaletExpId}`,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(deleteChaletExp.status === 200, 'DELETE /api/trips/:tripId/shared-expenses/:id deletes expense');

      const balancesAfterDelete = await makeRequest(server, {
        path: `/api/trips/${gTripId}/balances`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        balancesAfterDelete.data.data.balances.find(b => b.userId === userC_Id).totalOwed === 3000,
        'Deleting shared expense automatically recalculates member owed amounts'
      );

      // -------------------------------------------------------------
      // 19. SMART PACKING & TRAVEL PREPARATION SYSTEM
      // -------------------------------------------------------------
      // 19.1 Owner adds packing item
      const ownerAddItem = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-list/items`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Passport & Travel Documents Folder',
        category: 'DOCUMENTS',
        quantity: 1,
        isEssential: true
      });
      assert(
        ownerAddItem.status === 201 &&
        ownerAddItem.data.data.item.name === 'Passport & Travel Documents Folder',
        'Owner can add packing item to trip checklist'
      );
      const docItem1Id = ownerAddItem.data.data.item.id;

      // 19.2 Editor adds packing item
      const editorAddItem = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-list/items`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        name: 'Warm Fleece Jacket',
        category: 'CLOTHING',
        quantity: 2,
        isEssential: true
      });
      assert(
        editorAddItem.status === 201 &&
        editorAddItem.data.data.item.name === 'Warm Fleece Jacket',
        'Editor can add packing items to trip checklist'
      );
      const fleeceItemId = editorAddItem.data.data.item.id;

      // 19.3 Viewer cannot add packing item
      const viewerAddItem = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-list/items`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenC}` }
      }, {
        name: 'Unauthorized Viewer Item',
        category: 'OTHER',
        quantity: 1
      });
      assert(viewerAddItem.status === 403, 'Viewer cannot add packing item (403 Forbidden)');

      // 19.4 Update single packing item
      const updateItemRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-list/items/${docItem1Id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        isPacked: true
      });
      assert(
        updateItemRes.status === 200 &&
        updateItemRes.data.data.item.isPacked === true,
        'PATCH /api/trips/:tripId/packing-list/items/:id marks item as packed'
      );

      // 19.5 Bulk update packing status
      const bulkUpdateRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-list/bulk`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        items: [
          { itemId: fleeceItemId, isPacked: true }
        ]
      });
      assert(
        bulkUpdateRes.status === 200 &&
        bulkUpdateRes.data.data.progress === 100,
        'PATCH /api/trips/:tripId/packing-list/bulk updates multiple packing items and calculates progress'
      );

      // 19.6 Smart packing suggestions based on trip metadata
      const suggestionsRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-suggestions`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        suggestionsRes.status === 200 &&
        Array.isArray(suggestionsRes.data.data.suggestions) &&
        suggestionsRes.data.data.suggestions.length >= 2 &&
        suggestionsRes.data.data.suggestions.some(s => s.category === 'ELECTRONICS'),
        'GET /api/trips/:tripId/packing-suggestions generates deterministic intelligent recommendations'
      );
      const sampleSugg = suggestionsRes.data.data.suggestions[0];

      // 19.7 Add suggestion directly to packing list
      const addSuggRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-suggestions/${sampleSugg.id}/add`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        addSuggRes.status === 201 &&
        addSuggRes.data.data.item.name === sampleSugg.name,
        'POST /api/trips/:tripId/packing-suggestions/:id/add converts suggestion into real packing item'
      );

      // 19.8 Duplicate suggestion addition prevented
      const dupSuggRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/packing-suggestions/${sampleSugg.id}/add`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(dupSuggRes.status === 409 || dupSuggRes.status === 404, 'Duplicate packing suggestion addition rejected');

      // 19.9 Travel Document Checklist CRUD
      const createDoc = await makeRequest(server, {
        path: `/api/trips/${gTripId}/travel-documents`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'International Passport',
        type: 'PASSPORT',
        isRequired: true,
        isReady: false,
        expiryDate: '2032-05-10'
      });
      assert(
        createDoc.status === 201 &&
        createDoc.data.data.document.type === 'PASSPORT',
        'POST /api/trips/:tripId/travel-documents creates required travel document checklist item'
      );
      const passportDocId = createDoc.data.data.document.id;

      const createDoc2 = await makeRequest(server, {
        path: `/api/trips/${gTripId}/travel-documents`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        name: 'Comprehensive Alpine Travel Insurance',
        type: 'TRAVEL_INSURANCE',
        isRequired: true,
        isReady: true
      });
      assert(createDoc2.status === 201, 'Creates travel insurance document item');
      const insuranceDocId = createDoc2.data.data.document.id;

      // Update doc: mark passport ready
      const updateDocRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/travel-documents/${passportDocId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        isReady: true
      });
      assert(
        updateDocRes.status === 200 &&
        updateDocRes.data.data.document.isReady === true,
        'PATCH /api/trips/:tripId/travel-documents/:id updates document readiness status'
      );

      // 19.10 Pre-Trip Preparation Tasks CRUD
      const createTask = await makeRequest(server, {
        path: `/api/trips/${gTripId}/preparation-tasks`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        title: 'Book Geneva Airport Shuttle Transfer',
        description: 'Arrange private van for 3 travelers',
        priority: 'CRITICAL',
        dueDate: '2027-07-28',
        isCompleted: false
      });
      assert(
        createTask.status === 201 &&
        createTask.data.data.task.priority === 'CRITICAL',
        'POST /api/trips/:tripId/preparation-tasks creates critical preparation task'
      );
      const shuttleTaskId = createTask.data.data.task.id;

      // Complete task
      const updateTaskRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/preparation-tasks/${shuttleTaskId}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        isCompleted: true
      });
      assert(
        updateTaskRes.status === 200 &&
        updateTaskRes.data.data.task.isCompleted === true,
        'PATCH /api/trips/:tripId/preparation-tasks/:id marks task as completed'
      );

      // 19.11 Trip Readiness Score & Breakdown
      const readinessRes = await makeRequest(server, {
        path: `/api/trips/${gTripId}/readiness`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        readinessRes.status === 200 &&
        typeof readinessRes.data.data.score === 'number' &&
        ['READY', 'ALMOST_READY', 'NEEDS_PREPARATION', 'NOT_READY'].includes(readinessRes.data.data.status) &&
        readinessRes.data.data.breakdown.packing >= 0 &&
        readinessRes.data.data.breakdown.documents >= 0 &&
        readinessRes.data.data.breakdown.tasks >= 0,
        'GET /api/trips/:tripId/readiness computes deterministic multi-component readiness score'
      );

      // 19.12 Security: Unauthorized stranger User D blocked
      const strangerReadiness = await makeRequest(server, {
        path: `/api/trips/${gTripId}/readiness`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(strangerReadiness.status === 403, 'Unauthorized stranger blocked from trip preparation and readiness (403 Forbidden)');

      // -------------------------------------------------------------
      // 20. TRIP INSIGHTS & ANALYTICS ENGINE
      // -------------------------------------------------------------
      // 20.1 Personal Travel Dashboard for User A
      const userADashboard = await makeRequest(server, {
        path: '/api/analytics/dashboard',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        userADashboard.status === 200 &&
        userADashboard.data.data.totalTrips >= 1 &&
        typeof userADashboard.data.data.averageTripDuration === 'number' &&
        userADashboard.data.data.totalEstimatedSpent >= 0,
        'GET /api/analytics/dashboard computes active user summary statistics'
      );

      // 20.2 Empty State Dashboard for brand new User D
      const userDDashboard = await makeRequest(server, {
        path: '/api/analytics/dashboard',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(
        userDDashboard.status === 200 &&
        userDDashboard.data.data.totalTrips === 0 &&
        userDDashboard.data.data.totalCitiesVisited === 0 &&
        userDDashboard.data.data.averageTripDuration === 0,
        'GET /api/analytics/dashboard gracefully returns zero-state for user without trips'
      );

      // 20.3 Spending Analytics grouped by category
      const spendingCategoryRes = await makeRequest(server, {
        path: '/api/analytics/spending?groupBy=CATEGORY',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        spendingCategoryRes.status === 200 &&
        spendingCategoryRes.data.data.totalSpent >= 0 &&
        Array.isArray(spendingCategoryRes.data.data.breakdown) &&
        spendingCategoryRes.data.data.groupBy === 'CATEGORY',
        'GET /api/analytics/spending?groupBy=CATEGORY aggregates chart-ready category breakdown'
      );

      // 20.4 Spending Analytics grouped by trip
      const spendingTripRes = await makeRequest(server, {
        path: '/api/analytics/spending?groupBy=TRIP',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        spendingTripRes.status === 200 &&
        spendingTripRes.data.data.groupBy === 'TRIP' &&
        Array.isArray(spendingTripRes.data.data.breakdown),
        'GET /api/analytics/spending?groupBy=TRIP aggregates spending by trip'
      );

      // 20.5 Travel Activity Insights
      const activityInsightsRes = await makeRequest(server, {
        path: '/api/analytics/activities',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        activityInsightsRes.status === 200 &&
        typeof activityInsightsRes.data.data.totalActivities === 'number' &&
        Array.isArray(activityInsightsRes.data.data.favoriteCategories),
        'GET /api/analytics/activities extracts activity distributions and favorites'
      );

      // 20.6 City Travel Insights
      const cityInsightsRes = await makeRequest(server, {
        path: '/api/analytics/cities',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        cityInsightsRes.status === 200 &&
        Array.isArray(cityInsightsRes.data.data.mostVisited) &&
        Array.isArray(cityInsightsRes.data.data.mostPlanned) &&
        typeof cityInsightsRes.data.data.averageCostPerCity === 'number',
        'GET /api/analytics/cities aggregates visited destinations and expenditure per city'
      );

      // 20.7 Travel Timeline
      const timelineRes = await makeRequest(server, {
        path: '/api/analytics/travel-timeline',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        timelineRes.status === 200 &&
        Array.isArray(timelineRes.data.data) &&
        timelineRes.data.data.length === 12 &&
        timelineRes.data.data[0].month === 'January',
        'GET /api/analytics/travel-timeline generates monthly travel velocity and spend histogram'
      );

      // 20.8 Multi-Trip Comparison Engine
      const compareRes = await makeRequest(server, {
        path: `/api/analytics/compare?tripIds=${gTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        compareRes.status === 200 &&
        Array.isArray(compareRes.data.data.trips) &&
        compareRes.data.data.trips.length === 1 &&
        typeof compareRes.data.data.trips[0].costPerDay === 'number' &&
        typeof compareRes.data.data.trips[0].healthScore === 'number' &&
        typeof compareRes.data.data.trips[0].readinessScore === 'number',
        'GET /api/analytics/compare side-by-side compares metrics, health, and readiness scores'
      );

      // 20.9 Comparison limit validation (> 5 trips rejected)
      const overLimitCompare = await makeRequest(server, {
        path: '/api/analytics/compare?tripIds=1,2,3,4,5,6',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(overLimitCompare.status === 400, 'Comparing more than 5 trips is rejected (400 Bad Request)');

      // 20.10 Comparison security: Unauthorized trip rejected
      const unauthorizedCompare = await makeRequest(server, {
        path: `/api/analytics/compare?tripIds=${gTripId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(unauthorizedCompare.status === 403, 'Unauthorized user blocked from comparing private trips (403 Forbidden)');

      // 20.11 Smart Travel Insights
      const smartInsightsRes = await makeRequest(server, {
        path: '/api/analytics/insights',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        smartInsightsRes.status === 200 &&
        Array.isArray(smartInsightsRes.data.data.insights) &&
        smartInsightsRes.data.data.insights.length > 0 &&
        smartInsightsRes.data.data.insights.every(i => i.type && i.title && i.description),
        'GET /api/analytics/insights derives deterministic behavioral observations'
      );

      // 20.12 Dynamic Travel Achievements
      const achievementsRes = await makeRequest(server, {
        path: '/api/analytics/achievements',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        achievementsRes.status === 200 &&
        typeof achievementsRes.data.data.totalUnlocked === 'number' &&
        achievementsRes.data.data.unlocked.some(a => a.code === 'FIRST_TRIP'),
        'GET /api/analytics/achievements dynamically calculates unlocked badges and milestone progress'
      );

      // 20.13 Trip-Specific Insights & Diagnostics
      const tripSpecificInsights = await makeRequest(server, {
        path: `/api/trips/${gTripId}/insights`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        tripSpecificInsights.status === 200 &&
        tripSpecificInsights.data.data.tripId === gTripId &&
        typeof tripSpecificInsights.data.data.costPerDay === 'number' &&
        tripSpecificInsights.data.data.budget &&
        typeof tripSpecificInsights.data.data.healthScore === 'number' &&
        typeof tripSpecificInsights.data.data.readinessScore === 'number',
        'GET /api/trips/:tripId/insights returns comprehensive single-trip diagnostics'
      );

      // 20.14 Unauthorized trip-specific insights rejected
      const strangerTripInsights = await makeRequest(server, {
        path: `/api/trips/${gTripId}/insights`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(strangerTripInsights.status === 403, 'Unauthorized stranger blocked from trip insights (403 Forbidden)');

      // -------------------------------------------------------------
      // 21. GLOBAL SEARCH & ADVANCED FILTERING ENGINE
      // -------------------------------------------------------------
      console.log('\n--- 21. Global Search & Advanced Filtering Suite ---');

      // 21.1 Global multi-resource search
      const globalSearchRes = await makeRequest(server, {
        path: '/api/search?q=Paris',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        globalSearchRes.status === 200 &&
        globalSearchRes.data.data.query === 'Paris' &&
        globalSearchRes.data.data.results &&
        Array.isArray(globalSearchRes.data.data.results.cities) &&
        globalSearchRes.data.data.summary.cities >= 1,
        'GET /api/search executes unified multi-resource search across cities, activities, and trips'
      );

      // 21.2 Global search filtered by type
      const cityTypeSearchRes = await makeRequest(server, {
        path: '/api/search?q=Paris&type=CITIES',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        cityTypeSearchRes.status === 200 &&
        cityTypeSearchRes.data.data.type === 'CITIES' &&
        Array.isArray(cityTypeSearchRes.data.data.results.cities) &&
        cityTypeSearchRes.data.data.pagination,
        'GET /api/search?type=CITIES filters solely to requested resource type with pagination'
      );

      // 21.3 User trip search
      const userTripSearchRes = await makeRequest(server, {
        path: '/api/trips/search?q=Squad',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        userTripSearchRes.status === 200 &&
        Array.isArray(userTripSearchRes.data.data.trips) &&
        userTripSearchRes.data.data.trips.some(t => t.name.includes('Squad')),
        'GET /api/trips/search returns accessible trips matching keyword query'
      );

      // 21.4 Privacy check: Stranger cannot search other users private trips
      const strangerTripSearchRes = await makeRequest(server, {
        path: '/api/trips/search?q=Euro',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(
        strangerTripSearchRes.status === 200 &&
        strangerTripSearchRes.data.data.trips.length === 0,
        'User trip search does not leak inaccessible private trips to strangers'
      );

      // 21.5 Advanced activity search with category & cost filter
      const activitySearchRes = await makeRequest(server, {
        path: '/api/activities/search?q=Tower&category=CULTURE&minCost=1000&maxCost=10000&sortBy=COST&order=DESC',
        method: 'GET'
      });
      assert(
        activitySearchRes.status === 200 &&
        Array.isArray(activitySearchRes.data.data.activities) &&
        activitySearchRes.data.data.activities.length >= 1 &&
        activitySearchRes.data.data.activities[0].category === 'CULTURE',
        'GET /api/activities/search filters by category, numeric cost bounds, and sorts by cost'
      );

      // 21.6 Advanced city search with country and popularity sorting
      const citySearchRes = await makeRequest(server, {
        path: '/api/cities/search?country=France&sortBy=POPULARITY&order=DESC',
        method: 'GET'
      });
      assert(
        citySearchRes.status === 200 &&
        Array.isArray(citySearchRes.data.data.cities) &&
        citySearchRes.data.data.cities.some(c => c.country === 'France'),
        'GET /api/cities/search filters by country and popularity'
      );

      // 21.7 Template search
      const templateSearchRes = await makeRequest(server, {
        path: '/api/templates/search?q=Classic',
        method: 'GET'
      });
      assert(
        templateSearchRes.status === 200 &&
        Array.isArray(templateSearchRes.data.data.templates),
        'GET /api/templates/search searches discoverable trip templates'
      );

      // 21.8 Community posts search
      const communitySearchRes = await makeRequest(server, {
        path: '/api/community/search?q=',
        method: 'GET'
      });
      assert(
        communitySearchRes.status === 200 &&
        Array.isArray(communitySearchRes.data.data.posts),
        'GET /api/community/search searches community posts'
      );

      // 21.9 Search suggestions
      const suggestRes = await makeRequest(server, {
        path: '/api/search/suggestions?q=Par',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        suggestRes.status === 200 &&
        Array.isArray(suggestRes.data.data.suggestions) &&
        suggestRes.data.data.suggestions.length >= 1 &&
        suggestRes.data.data.suggestions[0].label.includes('Paris'),
        'GET /api/search/suggestions returns instant suggestions prioritizing exact/prefix match'
      );

      // 21.10 Search suggestions rejection on short query (< 2 characters)
      const shortSuggestRes = await makeRequest(server, {
        path: '/api/search/suggestions?q=a',
        method: 'GET'
      });
      assert(shortSuggestRes.status === 400, 'Search suggestions rejects queries shorter than 2 chars (400 Bad Request)');

      // 21.11 Invalid sorting field rejected
      const invalidSortRes = await makeRequest(server, {
        path: '/api/activities/search?sortBy=INVALID_FIELD',
        method: 'GET'
      });
      assert(invalidSortRes.status === 400, 'Invalid sort field rejected by validation schema (400 Bad Request)');

      // 21.12 Recent search history tracking
      const recentRes = await makeRequest(server, {
        path: '/api/search/recent',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        recentRes.status === 200 &&
        Array.isArray(recentRes.data.data.recentSearches) &&
        recentRes.data.data.recentSearches.length >= 1,
        'GET /api/search/recent returns user recent search history'
      );

      // 21.13 Clear recent searches
      const clearRecentRes = await makeRequest(server, {
        path: '/api/search/recent',
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(clearRecentRes.status === 200, 'DELETE /api/search/recent clears user search history');

      const recentAfterClear = await makeRequest(server, {
        path: '/api/search/recent',
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        recentAfterClear.status === 200 &&
        recentAfterClear.data.data.recentSearches.length === 0,
        'Search history is completely empty after clear'
      );

      // 21.14 Popular searches endpoint
      const popularRes = await makeRequest(server, {
        path: '/api/search/popular',
        method: 'GET'
      });
      assert(
        popularRes.status === 200 &&
        Array.isArray(popularRes.data.data) &&
        popularRes.data.data.length >= 1 &&
        typeof popularRes.data.data[0].score === 'number',
        'GET /api/search/popular returns deterministic ranked trending recommendations'
      );

      // -------------------------------------------------------------
      // 22. SMART ROUTE PLANNING & ITINERARY OPTIMIZATION SUITE
      // -------------------------------------------------------------
      console.log('\n--- 22. Smart Route Planning & Itinerary Optimization Suite ---');

      // Create a dedicated multi-city expedition
      const routeTripRes = await makeRequest(server, { path: '/api/trips', method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        name: 'Grand Indian Route Expedition',
        startDate: '2027-10-01',
        endDate: '2027-10-12',
        totalBudget: 150000,
        visibility: 'PRIVATE'
      });
      const rTripId = routeTripRes.data.data.trip.id;

      // Add Mumbai (city 7), Delhi (city 6), Jaipur (city 8) sections
      const rSec1 = await makeRequest(server, { path: `/api/trips/${rTripId}/sections`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        cityId: testCity1Id,
        startDate: '2027-10-01',
        endDate: '2027-10-03',
        budget: 40000,
        order: 1
      });
      const rSec2 = await makeRequest(server, { path: `/api/trips/${rTripId}/sections`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        cityId: testCity2Id,
        startDate: '2027-10-04',
        endDate: '2027-10-06',
        budget: 40000,
        order: 2
      });
      const rSec3 = await makeRequest(server, { path: `/api/trips/${rTripId}/sections`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        cityId: testCity1Id,
        startDate: '2027-10-07',
        endDate: '2027-10-09',
        budget: 35000,
        order: 3
      });

      const rSec1Id = rSec1.data.data.section.id;
      const rSec2Id = rSec2.data.data.section.id;
      const rSec3Id = rSec3.data.data.section.id;

      // 22.1 Get Route Overview
      const routeOverviewRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        routeOverviewRes.status === 200 &&
        Array.isArray(routeOverviewRes.data.data.route) &&
        routeOverviewRes.data.data.route.length === 3 &&
        routeOverviewRes.data.data.summary.totalCities === 3,
        'GET /api/trips/:tripId/route returns complete multi-city itinerary route structure'
      );

      // 22.2 Reorder cities
      const reorderCitiesRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/reorder`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityOrder: [rSec1Id, rSec3Id, rSec2Id]
      });
      assert(
        reorderCitiesRes.status === 200 &&
        reorderCitiesRes.data.data.route[1].sectionId === rSec3Id,
        'PATCH /api/trips/:tripId/route/reorder reorders cities and adjusts schedule sequentially'
      );

      // 22.3 Reject invalid section ID
      const invalidSectionReorder = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/reorder`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityOrder: [rSec1Id, 99999, rSec2Id]
      });
      assert(invalidSectionReorder.status === 400, 'Reordering with invalid non-existent section ID rejected (400 Bad Request)');

      // 22.4 Reject duplicate section IDs
      const duplicateSectionReorder = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/reorder`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        cityOrder: [rSec1Id, rSec1Id, rSec2Id]
      });
      assert(duplicateSectionReorder.status === 400, 'Reordering with duplicate section IDs rejected (400 Bad Request)');

      // 22.5 Route optimization calculation
      const optimizeRouteRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/optimize`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        optimizeRouteRes.status === 200 &&
        Array.isArray(optimizeRouteRes.data.data.currentRoute) &&
        Array.isArray(optimizeRouteRes.data.data.optimizedRoute) &&
        optimizeRouteRes.data.data.estimatedImprovement,
        'POST /api/trips/:tripId/route/optimize calculates optimized route and estimated savings'
      );

      // 22.6 Apply route optimization
      const applyOptimizationRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/apply-optimization`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        sectionOrder: optimizeRouteRes.data.data.optimizedRoute.map(s => s.sectionId)
      });
      assert(
        applyOptimizationRes.status === 200 &&
        applyOptimizationRes.data.data.route.length === 3,
        'POST /api/trips/:tripId/route/apply-optimization applies optimal sequence and creates activity log'
      );

      // 22.7 Travel segments generation
      const segmentsRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/travel-segments`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        segmentsRes.status === 200 &&
        Array.isArray(segmentsRes.data.data) &&
        segmentsRes.data.data.length === 2 &&
        segmentsRes.data.data[0].recommendedMode,
        'GET /api/trips/:tripId/travel-segments computes consecutive inter-city travel segments'
      );
      const segment1Id = segmentsRes.data.data[0].id;

      // 22.8 Transport mode options comparison
      const optionsRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/travel-segments/${segment1Id}/options`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        optionsRes.status === 200 &&
        Array.isArray(optionsRes.data.data) &&
        optionsRes.data.data.some(o => o.mode === 'TRAIN') &&
        optionsRes.data.data.some(o => o.mode === 'FLIGHT'),
        'GET /api/trips/:tripId/travel-segments/:segmentId/options returns multi-modal transport comparisons'
      );

      // 22.9 Select transport option
      const selectTransportRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/travel-segments/${segment1Id}`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {
        selectedMode: 'TRAIN'
      });
      assert(
        selectTransportRes.status === 200 &&
        selectTransportRes.data.data.selectedMode === 'TRAIN',
        'PATCH /api/trips/:tripId/travel-segments/:segmentId selects transport mode and logs action'
      );

      // 22.10 Activity day optimization
      const rDay1Id = rSec1.data.data.section.days[0].id;
      // Add two activities to day 1
      await makeRequest(server, { path: `/api/days/${rDay1Id}/activities`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        activityId: testAct1Id,
        startTime: '10:00',
        endTime: '12:00'
      });
      await makeRequest(server, { path: `/api/days/${rDay1Id}/activities`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        activityId: testAct2Id,
        startTime: '14:00',
        endTime: '16:00'
      });

      const dayOptimizeRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/days/${rDay1Id}/optimize`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        dayOptimizeRes.status === 200 &&
        Array.isArray(dayOptimizeRes.data.data.currentOrder) &&
        Array.isArray(dayOptimizeRes.data.data.optimizedOrder),
        'POST /api/trips/:tripId/days/:dayId/optimize generates day schedule recommendations'
      );

      // 22.11 Apply day optimization
      const applyDayRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/days/${rDay1Id}/apply-optimization`,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` }
      }, {});
      assert(
        applyDayRes.status === 200 &&
        Array.isArray(applyDayRes.data.data),
        'POST /api/trips/:tripId/days/:dayId/apply-optimization applies optimized schedule'
      );

      // 22.12 Route conflict detection
      const conflictsRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/conflicts`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        conflictsRes.status === 200 &&
        Array.isArray(conflictsRes.data.data.conflicts),
        'GET /api/trips/:tripId/route/conflicts detects route, timing, and transport gaps'
      );

      // 22.13 Smart route recommendations
      const routeRecsRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/recommendations`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        routeRecsRes.status === 200 &&
        Array.isArray(routeRecsRes.data.data.recommendations),
        'GET /api/trips/:tripId/route/recommendations returns actionable route & pacing suggestions'
      );

      // 22.14 Route score & breakdown
      const routeScoreRes = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/score`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert(
        routeScoreRes.status === 200 &&
        typeof routeScoreRes.data.data.score === 'number' &&
        routeScoreRes.data.data.status &&
        routeScoreRes.data.data.breakdown.routeEfficiency !== undefined,
        'GET /api/trips/:tripId/route/score calculates multi-factor route quality score'
      );

      // 22.15 Viewer permissions: Viewer cannot reorder cities (403 Forbidden)
      await makeRequest(server, { path: `/api/trips/${rTripId}/collaborators`, method: 'POST', headers: { Authorization: `Bearer ${tokenA}` } }, {
        email: 'userb@pathpilot.com',
        role: 'VIEWER'
      });
      const viewerReorder = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route/reorder`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` }
      }, {
        cityOrder: [rSec1Id, rSec2Id, rSec3Id]
      });
      assert(viewerReorder.status === 403, 'Trip Viewer cannot reorder route (403 Forbidden)');

      // 22.16 Stranger access blocked (403 Forbidden)
      const strangerRoute = await makeRequest(server, {
        path: `/api/trips/${rTripId}/route`,
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      assert(strangerRoute.status === 403, 'Unauthorized stranger blocked from trip route (403 Forbidden)');

      // -------------------------------------------------------------
      // 23. FINAL HACKATHON STABILIZATION & 12-STEP DEMO FLOW SUITE
      // -------------------------------------------------------------
      console.log('\n--- 23. Final Hackathon Stabilization & 12-Step Demo Flow Suite ---');

      // 23.1 Health and API Gateway Info
      const healthRes = await makeRequest(server, { path: '/api/health', method: 'GET' });
      assert(
        healthRes.status === 200 &&
        healthRes.data.success === true &&
        healthRes.data.message === 'PathPilot backend is running' &&
        healthRes.data.timestamp,
        'GET /api/health returns exact standardized health response format'
      );

      const apiGatewayRes = await makeRequest(server, { path: '/api', method: 'GET' });
      assert(
        apiGatewayRes.status === 200 &&
        apiGatewayRes.data.success === true &&
        apiGatewayRes.data.message === 'Welcome to PathPilot API' &&
        apiGatewayRes.data.version === '1.0.0',
        'GET /api returns exact standardized welcome gateway response format'
      );

      // Step 1: Register Demo User
      const demoEmail = `hackathon_demo_${Date.now()}@pathpilot.com`;
      const regRes = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        name: 'Alex Hackathon',
        email: demoEmail,
        password: 'Password123!',
        homeCurrency: 'USD'
      });
      assert(regRes.status === 201 && regRes.data.data.token, 'Step 1: POST /api/auth/register registers new user and issues JWT');
      const demoToken = regRes.data.data.token;

      // Step 2: Login & Auth Me
      const loginRes = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: demoEmail,
        password: 'Password123!'
      });
      assert(loginRes.status === 200 && loginRes.data.data.user.email === demoEmail, 'Step 2a: POST /api/auth/login logs in user');

      const meRes = await makeRequest(server, { path: '/api/auth/me', method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(meRes.status === 200 && meRes.data.data.user.email === demoEmail, 'Step 2b: GET /api/auth/me returns authenticated user details');

      // Step 3: View & Patch Profile
      const getProfileRes = await makeRequest(server, { path: '/api/profile', method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(getProfileRes.status === 200 && getProfileRes.data.data.user.name === 'Alex Hackathon', 'Step 3a: GET /api/profile returns user profile');

      const patchProfileRes = await makeRequest(server, { path: '/api/profile', method: 'PATCH', headers: { Authorization: `Bearer ${demoToken}` } }, {
        bio: 'Solo adventurer & travel hacker',
        homeCurrency: 'EUR'
      });
      assert(patchProfileRes.status === 200 && patchProfileRes.data.data.user.homeCurrency === 'EUR', 'Step 3b: PATCH /api/profile updates user profile');

      // Step 4: Create Trip
      const createTripRes = await makeRequest(server, { path: '/api/trips', method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        name: 'Ultimate European Odyssey',
        startDate: '2028-06-01',
        endDate: '2028-06-15',
        totalBudget: 250000,
        visibility: 'PRIVATE'
      });
      assert(createTripRes.status === 201 && createTripRes.data.data.trip.id, 'Step 4: POST /api/trips creates new trip');
      const dTripId = createTripRes.data.data.trip.id;

      // Step 5: Add Multiple Itinerary Sections / Cities
      const sec1Res = await makeRequest(server, { path: `/api/trips/${dTripId}/sections`, method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        cityId: testCity1Id,
        startDate: '2028-06-01',
        endDate: '2028-06-05',
        budget: 100000,
        order: 1
      });
      const sec2Res = await makeRequest(server, { path: `/api/trips/${dTripId}/sections`, method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        cityId: testCity2Id,
        startDate: '2028-06-06',
        endDate: '2028-06-10',
        budget: 80000,
        order: 2
      });
      assert(sec1Res.status === 201 && sec2Res.status === 201, 'Step 5a: POST /api/trips/:tripId/sections adds multiple city sections');

      const dSec1Id = sec1Res.data.data.section.id;
      const patchSecRes = await makeRequest(server, { path: `/api/trips/${dTripId}/sections/${dSec1Id}`, method: 'PATCH', headers: { Authorization: `Bearer ${demoToken}` } }, {
        budget: 110000
      });
      assert(patchSecRes.status === 200 && patchSecRes.data.data.section.budget === 110000, 'Step 5b: PATCH /api/trips/:tripId/sections/:sectionId updates section');

      // Step 6: Generate / View Trip Days
      const daysRes = await makeRequest(server, { path: `/api/trips/${dTripId}/days`, method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(daysRes.status === 200 && Array.isArray(daysRes.data.data.days) && daysRes.data.data.days.length === 10, 'Step 6: GET /api/trips/:tripId/days returns all generated trip days');
      const dDay1Id = daysRes.data.data.days[0].id;

      // Step 7: Add, Patch, and Delete Activities
      const addActRes = await makeRequest(server, { path: `/api/trips/${dTripId}/days/${dDay1Id}/activities`, method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        activityId: testAct1Id,
        startTime: '09:00',
        endTime: '11:00',
        customCost: 3500,
        notes: 'Pre-booked fast-track ticket'
      });
      assert(addActRes.status === 201 && addActRes.data.data.dayActivity.id, 'Step 7a: POST /api/trips/:tripId/days/:dayId/activities schedules activity');
      const dActId = addActRes.data.data.dayActivity.id;

      const patchActRes = await makeRequest(server, { path: `/api/trips/${dTripId}/days/${dDay1Id}/activities/${dActId}`, method: 'PATCH', headers: { Authorization: `Bearer ${demoToken}` } }, {
        customCost: 4000
      });
      assert(patchActRes.status === 200 && patchActRes.data.data.dayActivity.customCost === 4000, 'Step 7b: PATCH /api/trips/:tripId/days/:dayId/activities/:activityId updates activity');

      // Step 8: Add Expenses
      const addExpRes = await makeRequest(server, { path: `/api/trips/${dTripId}/expenses`, method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        amount: 8500,
        category: 'FOOD',
        description: 'Bistro dinner in Le Marais',
        date: '2028-06-01'
      });
      assert(addExpRes.status === 201, 'Step 8a: POST /api/trips/:tripId/expenses logs manual expense');

      const getExpRes = await makeRequest(server, { path: `/api/trips/${dTripId}/expenses`, method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(getExpRes.status === 200 && getExpRes.data.data.expenses.length === 1, 'Step 8b: GET /api/trips/:tripId/expenses retrieves trip expenses');

      // Step 9: Verify Budget
      const dBudgetRes = await makeRequest(server, { path: `/api/trips/${dTripId}/budget`, method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(
        dBudgetRes.status === 200 &&
        dBudgetRes.data.data.totalBudget === 250000 &&
        dBudgetRes.data.data.totalSpent >= 8500,
        'Step 9: GET /api/trips/:tripId/budget calculates total budget vs actual spend correctly'
      );

      // Step 10: View Trip & My Trips
      const viewTripRes = await makeRequest(server, { path: `/api/trips/${dTripId}`, method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(viewTripRes.status === 200 && viewTripRes.data.data.trip.name === 'Ultimate European Odyssey', 'Step 10a: GET /api/trips/:tripId retrieves full trip details');

      const patchTripRes = await makeRequest(server, { path: `/api/trips/${dTripId}`, method: 'PATCH', headers: { Authorization: `Bearer ${demoToken}` } }, {
        name: 'Ultimate European Odyssey (Updated)'
      });
      assert(patchTripRes.status === 200 && patchTripRes.data.data.trip.name === 'Ultimate European Odyssey (Updated)', 'Step 10b: PATCH /api/trips/:tripId updates trip metadata');

      const myTripsRes = await makeRequest(server, { path: '/api/trips', method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(
        myTripsRes.status === 200 &&
        Array.isArray(myTripsRes.data.data) &&
        myTripsRes.data.data.length >= 1,
        'Step 10c: GET /api/trips lists user owned trips'
      );

      // Step 11: View Calendar
      const dCalRes = await makeRequest(server, { path: '/api/calendar?year=2028&month=6', method: 'GET', headers: { Authorization: `Bearer ${demoToken}` } });
      assert(dCalRes.status === 200 && Array.isArray(dCalRes.data.data.events) && dCalRes.data.data.events.length >= 1, 'Step 11: GET /api/calendar aggregates calendar timeline events');

      // Step 12: Community & Public Sharing
      const dPostRes = await makeRequest(server, { path: '/api/community', method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } }, {
        title: 'Top 5 Hidden Gems in Paris',
        content: 'Sharing my curated itinerary for an authentic Parisian getaway with fewer crowds.',
        city: 'Paris',
        tags: ['paris', 'tips', 'culture']
      });
      assert(dPostRes.status === 201 && dPostRes.data.data.post.id, 'Step 12a: POST /api/community publishes community post');

      const dCommunityListRes = await makeRequest(server, { path: '/api/community', method: 'GET' });
      assert(
        dCommunityListRes.status === 200 &&
        Array.isArray(dCommunityListRes.data.data) &&
        dCommunityListRes.data.data.length >= 1,
        'Step 12b: GET /api/community discovers community travel feed'
      );

      const dShareTripRes = await makeRequest(server, { path: `/api/trips/${dTripId}/share`, method: 'POST', headers: { Authorization: `Bearer ${demoToken}` } });
      assert((dShareTripRes.status === 200 || dShareTripRes.status === 201) && dShareTripRes.data.data.shareUrl, 'Step 12c: POST /api/trips/:tripId/share generates public share link');
      const dShareToken = dShareTripRes.data.data.shareToken;

      const dPublicSharedRes = await makeRequest(server, { path: `/api/shared/${dShareToken}`, method: 'GET' });
      assert(dPublicSharedRes.status === 200 && dPublicSharedRes.data.data.trip.name.includes('European Odyssey'), 'Step 12d: GET /api/shared/:shareId renders public read-only trip viewer');

      console.log(`\n=================================================================`);
      console.log(`🎉 BACKEND ACCEPTANCE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log(`=================================================================\n`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error('Integration test error:', err);
      server.close(() => process.exit(1));
    }
  });

}

runTests();





