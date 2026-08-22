const http = require('http');
const app = require('./src/app');

const PORT = 5007;

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
    console.log(`\n🧪 Running Comprehensive PathPilot Backend Verification Suite on port ${PORT}...\n`);
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
      // 1. Health check
      const health = await makeRequest(server, { path: '/api/health', method: 'GET' });
      assert(health.status === 200 && health.data.data.status === 'healthy', 'GET /api/health returns 200 with status=healthy');

      // 2. API Gateway Catalog Overview
      const overview = await makeRequest(server, { path: '/api', method: 'GET' });
      assert(overview.status === 200 && overview.data.data.modules.length > 5, 'GET /api returns gateway catalog overview');

      // 3. Swagger Docs UI
      const docs = await makeRequest(server, { path: '/api/docs/', method: 'GET' });
      assert(docs.status === 200 || docs.status === 301, 'GET /api/docs serves OpenAPI interactive documentation');

      // 4. Admin login
      const adminLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: 'admin@pathpilot.com',
        password: 'AdminPassword123!'
      });
      assert(adminLogin.status === 200 && adminLogin.data.data.token, 'POST /api/auth/login (Admin authenticates)');
      const adminToken = adminLogin.data?.data?.token;

      // 5. User login
      const userLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: 'traveler@pathpilot.com',
        password: 'Password123!'
      });
      assert(userLogin.status === 200 && userLogin.data.data.token, 'POST /api/auth/login (User authenticates)');
      const userToken = userLogin.data?.data?.token;

      // 6. Invalid credentials rejection
      const invalidLogin = await makeRequest(server, { path: '/api/auth/login', method: 'POST' }, {
        email: 'traveler@pathpilot.com',
        password: 'WrongPassword999!'
      });
      assert(invalidLogin.status === 401 && invalidLogin.data.success === false, 'POST /api/auth/login rejects invalid password with 401');

      // 7. Register new traveler
      const newEmail = `sarah_${Date.now()}@example.com`;
      const reg = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: newEmail,
        password: 'Password123!',
        city: 'Los Angeles',
        country: 'United States'
      });
      assert(reg.status === 201 && reg.data.data.token, 'POST /api/auth/register creates user and returns JWT token');
      const sarahToken = reg.data?.data?.token;

      // 8. Duplicate registration rejection
      const duplicateReg = await makeRequest(server, { path: '/api/auth/register', method: 'POST' }, {
        firstName: 'Sarah',
        lastName: 'Connor',
        email: newEmail,
        password: 'Password123!'
      });
      assert(duplicateReg.status === 409 || duplicateReg.status === 400, 'POST /api/auth/register rejects duplicate email with 409 Conflict');

      // 9. Protected route without token
      const noTokenReq = await makeRequest(server, { path: '/api/users/profile', method: 'GET' });
      assert(noTokenReq.status === 401, 'GET /api/users/profile without token returns 401 Unauthorized');

      // 10. Protected route with malformed token
      const malformedTokenReq = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'GET',
        headers: { Authorization: 'Bearer invalid.fake.token' }
      });
      assert(malformedTokenReq.status === 401, 'GET /api/users/profile with malformed token returns 401 Unauthorized');

      // 11. Auth /me
      const me = await makeRequest(server, {
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(me.status === 200 && me.data.data.user.email === newEmail && !me.data.data.user.password, 'GET /api/auth/me returns profile without password');

      // 12. User profile update & privilege escalation prevention
      const updateProfile = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'PUT',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        firstName: 'Sarah Jane',
        phone: '+1-555-888999',
        additionalInfo: 'Photographer & trekker',
        role: 'ADMIN' // Malicious attempt to elevate role!
      });
      assert(
        updateProfile.status === 200 &&
        updateProfile.data.data.user.firstName === 'Sarah Jane' &&
        updateProfile.data.data.user.role === 'USER',
        'PUT /api/users/profile updates profile and ignores malicious role elevation attempt'
      );

      // 13. City search with pagination & minPopularity filter
      const cities = await makeRequest(server, { path: '/api/cities?country=India&minPopularity=80&page=1&limit=5', method: 'GET' });
      assert(
        cities.status === 200 &&
        cities.data.pagination &&
        cities.data.pagination.page === 1 &&
        cities.data.data.length >= 2,
        'GET /api/cities returns paginated and filtered cities'
      );

      // 14. City details with activities
      const cityDetail = await makeRequest(server, { path: '/api/cities/1', method: 'GET' });
      assert(cityDetail.status === 200 && cityDetail.data.data.city.activities.length > 0, 'GET /api/cities/:id includes city activities');

      // 15. Activity search with category & cost filter
      const activities = await makeRequest(server, { path: '/api/activities?category=ADVENTURE&maxCost=4000&page=1&limit=5', method: 'GET' });
      assert(
        activities.status === 200 &&
        activities.data.pagination &&
        activities.data.data.every(a => a.category === 'ADVENTURE' && a.estimatedCost <= 4000),
        'GET /api/activities filters by category and maxCost with pagination'
      );

      // 16. Trip creation
      const createTrip = await makeRequest(server, {
        path: '/api/trips',
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        name: 'Alpine Swiss Explorer',
        description: 'Spectacular alpine trails, scenic mountain trains, and serene lakes.',
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        totalBudget: 95000,
        visibility: 'PRIVATE'
      });
      assert(createTrip.status === 201 && createTrip.data.data.trip.status === 'UPCOMING', 'POST /api/trips creates trip with dynamic UPCOMING status');
      const tripId = createTrip.data?.data?.trip?.id;

      // 17. Trip listing with pagination
      const userTrips = await makeRequest(server, {
        path: '/api/trips?page=1&limit=10',
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(userTrips.status === 200 && userTrips.data.pagination.totalItems >= 1, 'GET /api/trips returns paginated user trips');

      // 18. Section date validation outside trip boundaries -> 400 Bad Request
      const invalidSectionDate = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        cityId: 5,
        startDate: '2026-12-01',
        endDate: '2026-12-15', // Trip ends Dec 8!
        budget: 45000
      });
      assert(invalidSectionDate.status === 400, 'POST /api/trips/:tripId/sections rejects dates outside trip boundary with 400');

      // 19. Trip Section creation & automated Day generation
      const createSection = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        cityId: 5, // Paris
        startDate: '2026-12-01',
        endDate: '2026-12-04',
        budget: 45000
      });
      assert(
        createSection.status === 201 &&
        createSection.data.data.section.days.length === 4,
        'POST /api/trips/:tripId/sections auto-generates 4 days for Dec 1 - Dec 4'
      );
      const dayId1 = createSection.data?.data?.section?.days[0]?.id;

      // 20. Section reorder validation (invalid IDs rejected)
      const invalidSectionReorder = await makeRequest(server, {
        path: `/api/trips/${tripId}/sections/reorder`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        sectionIds: [999, 888]
      });
      assert(invalidSectionReorder.status === 400, 'PUT /api/trips/:tripId/sections/reorder rejects invalid section IDs with 400');

      // 21. Day Activity assignment & Time Conflict Engine
      const act1 = await makeRequest(server, {
        path: `/api/days/${dayId1}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        activityId: 12, // Eiffel tower
        startTime: '10:00',
        endTime: '13:00',
        customCost: 7500,
        notes: 'Summit ticket reserved'
      });
      assert(act1.status === 201, 'POST /api/days/:dayId/activities schedules first activity (10:00 - 13:00)');

      // Overlapping activity -> 409 Conflict
      const actConflict = await makeRequest(server, {
        path: `/api/days/${dayId1}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        activityId: 13, // Louvre
        startTime: '11:00', // Overlaps with 10:00 - 13:00!
        endTime: '14:00'
      });
      assert(actConflict.status === 409, 'POST /api/days/:dayId/activities rejects overlapping time slot with 409 Conflict');

      // Non-overlapping activity
      const act2 = await makeRequest(server, {
        path: `/api/days/${dayId1}/activities`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        activityId: 13,
        startTime: '14:30',
        endTime: '17:30',
        customCost: 6000
      });
      assert(act2.status === 201, 'POST /api/days/:dayId/activities schedules non-overlapping activity (14:30 - 17:30)');

      // 22. Inconsistent expense relationship rejection (day not belonging to section)
      const invalidExpenseReq = await makeRequest(server, {
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        category: 'STAY',
        amount: 5000,
        description: 'Mismatched relationship test',
        sectionId: 1, // Section 1 belongs to Nishit's trip!
        dayId: dayId1
      });
      assert(invalidExpenseReq.status === 400, 'POST /api/trips/:tripId/expenses rejects foreign sectionId with 400 Bad Request');

      // Valid expense logging
      const expense1 = await makeRequest(server, {
        path: `/api/trips/${tripId}/expenses`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        category: 'STAY',
        amount: 25000,
        description: 'Paris Central Hotel (4 Nights)',
        date: '2026-12-01'
      });
      assert(expense1.status === 201, 'POST /api/trips/:tripId/expenses logs stay expense');

      // 23. Budget Analytics with dayBreakdown & percentageUsed
      const budget = await makeRequest(server, {
        path: `/api/trips/${tripId}/budget`,
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(
        budget.status === 200 &&
        budget.data.data.totalSpent === 25000 &&
        budget.data.data.remainingBudget === 70000 &&
        budget.data.data.percentageUsed > 0 &&
        budget.data.data.dayBreakdown.length >= 4,
        'GET /api/trips/:tripId/budget calculates totalSpent, remainingBudget, percentageUsed, and dayBreakdown'
      );

      // 24. Calendar date-mapped trips with validation
      const invalidCal = await makeRequest(server, {
        path: '/api/calendar?month=15', // Invalid month!
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(invalidCal.status === 400, 'GET /api/calendar?month=15 rejects invalid month with 400 Bad Request');

      const cal = await makeRequest(server, {
        path: '/api/calendar?month=12&year=2026',
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(cal.status === 200 && cal.data.data.trips.length >= 1, 'GET /api/calendar?month=12&year=2026 returns scheduled trip');

      // 25. Trip sharing
      const share = await makeRequest(server, {
        path: `/api/trips/${tripId}/share`,
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(share.status === 201 && share.data.data.shareToken, 'POST /api/trips/:tripId/share generates unique share token');
      const shareToken = share.data?.data?.shareToken;

      const sharedView = await makeRequest(server, {
        path: `/api/shared/${shareToken}`,
        method: 'GET'
      });
      assert(sharedView.status === 200 && sharedView.data.data.trip.name === 'Alpine Swiss Explorer', 'GET /api/shared/:shareToken reads public trip without auth');

      const invalidSharedView = await makeRequest(server, {
        path: '/api/shared/invalid_token_xyz_123',
        method: 'GET'
      });
      assert(invalidSharedView.status === 404, 'GET /api/shared/:invalidToken returns 404 Not Found');

      // 26. Community Posts & private trip linking check
      const unauthorizedPostLink = await makeRequest(server, {
        path: '/api/community/posts',
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` } // Nishit trying to link Sarah's private trip!
      }, {
        title: 'Unlawful Private Trip Link',
        content: 'Attempting to leak Sarah private itinerary to the public...',
        tripId: tripId
      });
      assert(unauthorizedPostLink.status === 403, 'POST /api/community/posts forbids linking another user private trip (403 Forbidden)');

      const post = await makeRequest(server, {
        path: '/api/community/posts',
        method: 'POST',
        headers: { Authorization: `Bearer ${sarahToken}` }
      }, {
        title: 'Winter Travel Essentials in Europe',
        content: 'Sharing must-pack thermal wear and photography tips for alpine winter expeditions.',
        tripId
      });
      assert(post.status === 201, 'POST /api/community/posts creates community post with owner trip link');

      const feed = await makeRequest(server, { path: '/api/community/posts?page=1&limit=5', method: 'GET' });
      assert(feed.status === 200 && feed.data.pagination && feed.data.data.length >= 2, 'GET /api/community/posts returns paginated feed');

      // 27. Authorization Barrier: User cannot edit another user's private trip
      const unauthorizedEdit = await makeRequest(server, {
        path: `/api/trips/${tripId}`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` } // Logged in as Nishit, trying to edit Sarah's trip!
      }, {
        name: 'Hacked Trip Name'
      });
      assert(unauthorizedEdit.status === 403, 'PUT /api/trips/:id forbids non-owner modification (HTTP 403 Forbidden)');

      // 28. Non-Admin blocked from Admin endpoints (403 Forbidden)
      const nonAdminReq = await makeRequest(server, {
        path: '/api/admin/users',
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(nonAdminReq.status === 403, 'GET /api/admin/users rejects non-admin users with 403 Forbidden');

      // 29. Admin user listing & analytics
      const adminUsers = await makeRequest(server, {
        path: '/api/admin/users?page=1&limit=10',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(adminUsers.status === 200 && adminUsers.data.pagination.totalItems >= 3, 'GET /api/admin/users lists paginated users');

      const analytics = await makeRequest(server, {
        path: '/api/admin/analytics',
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(
        analytics.status === 200 &&
        analytics.data.data.overview.totalUsers >= 3 &&
        analytics.data.data.overview.activeUsers >= 3,
        'GET /api/admin/analytics returns system analytics with activeUsers'
      );

      // 30. Admin cannot block own account
      const selfBlockReq = await makeRequest(server, {
        path: `/api/admin/users/1/block`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(selfBlockReq.status === 400, 'PATCH /api/admin/users/:self/block prevents admin self-blocking (400 Bad Request)');

      // 31. Admin block & unblock user
      const sarahUser = adminUsers.data.data.find(u => u.email === newEmail);
      const blockRes = await makeRequest(server, {
        path: `/api/admin/users/${sarahUser.id}/block`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(blockRes.status === 200, 'PATCH /api/admin/users/:id/block blocks user account');

      // Blocked user blocked from accessing protected routes
      const blockedAttempt = await makeRequest(server, {
        path: '/api/users/profile',
        method: 'GET',
        headers: { Authorization: `Bearer ${sarahToken}` }
      });
      assert(blockedAttempt.status === 403, 'Blocked user cannot access protected routes (HTTP 403 Forbidden)');

      // Unblock user
      const unblockRes = await makeRequest(server, {
        path: `/api/admin/users/${sarahUser.id}/unblock`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(unblockRes.status === 200, 'PATCH /api/admin/users/:id/unblock unblocks user');

      // 32. 404 Route handler
      const notFoundRes = await makeRequest(server, { path: '/api/non-existent-route', method: 'GET' });
      assert(notFoundRes.status === 404 && notFoundRes.data.success === false, 'GET /api/non-existent-route returns 404 JSON error');

      console.log(`\n======================================================`);
      console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log(`======================================================\n`);

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error('Test execution error:', err);
      server.close(() => process.exit(1));
    }
  });
}

runTests();
