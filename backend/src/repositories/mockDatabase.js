const bcrypt = require('bcryptjs');

// Salt rounds for password hashing
const SALT_ROUNDS = 10;
const hashSync = (password) => bcrypt.hashSync(password, SALT_ROUNDS);

/**
 * In-Memory Mock Database for PathPilot
 * Central store for all application data prior to PostgreSQL integration.
 */
class MockDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = [
      {
        id: 1,
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@pathpilot.com',
        password: hashSync('AdminPassword123!'),
        phone: '+1-555-0100',
        city: 'San Francisco',
        country: 'United States',
        additionalInfo: 'System Administrator account',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        role: 'ADMIN',
        isBlocked: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        firstName: 'Nishit',
        lastName: 'Traveler',
        email: 'traveler@pathpilot.com',
        password: hashSync('Password123!'),
        phone: '+91-9876543210',
        city: 'Mumbai',
        country: 'India',
        additionalInfo: 'Globetrotter & mountain enthusiast',
        profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        role: 'USER',
        isBlocked: false,
        createdAt: '2026-01-10T12:00:00.000Z',
        updatedAt: '2026-01-10T12:00:00.000Z'
      }
    ];

    this.cities = [
      {
        id: 1,
        name: 'Delhi',
        country: 'India',
        region: 'Asia',
        description: 'India’s historic capital featuring monumental Mughal architecture, vibrant street bazaars, and exquisite cuisine.',
        imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
        popularity: 92,
        costIndex: 40
      },
      {
        id: 2,
        name: 'Manali',
        country: 'India',
        region: 'Asia',
        description: 'A high-altitude Himalayan resort town known for snow-capped peaks, paragliding, and pine-scented valleys.',
        imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
        popularity: 88,
        costIndex: 35
      },
      {
        id: 3,
        name: 'Goa',
        country: 'India',
        region: 'Asia',
        description: 'Tropical paradise renowned for sun-drenched beaches, Portuguese colonial architecture, and lively nightlife.',
        imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        popularity: 95,
        costIndex: 45
      },
      {
        id: 4,
        name: 'Tokyo',
        country: 'Japan',
        region: 'Asia',
        description: 'Ultra-modern metropolis blending futuristic skyscrapers, neon alleys, historic temples, and world-class gastronomy.',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        popularity: 98,
        costIndex: 85
      },
      {
        id: 5,
        name: 'Paris',
        country: 'France',
        region: 'Europe',
        description: 'The City of Light, famed for the Eiffel Tower, the Louvre, romantic boulevards, and haute couture.',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
        popularity: 99,
        costIndex: 90
      },
      {
        id: 6,
        name: 'Rome',
        country: 'Italy',
        region: 'Europe',
        description: 'The Eternal City packed with ancient ruins like the Colosseum, the Pantheon, and the Vatican.',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
        popularity: 94,
        costIndex: 75
      },
      {
        id: 7,
        name: 'New York',
        country: 'United States',
        region: 'North America',
        description: 'The city that never sleeps, with Times Square, Central Park, Broadway shows, and iconic skyline views.',
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
        popularity: 97,
        costIndex: 95
      },
      {
        id: 8,
        name: 'Dubai',
        country: 'United Arab Emirates',
        region: 'Middle East',
        description: 'Glamorous desert metropolis celebrated for luxury shopping, ultramodern architecture like Burj Khalifa, and nightlife.',
        imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        popularity: 93,
        costIndex: 88
      },
      {
        id: 9,
        name: 'London',
        country: 'United Kingdom',
        region: 'Europe',
        description: 'Historic and cosmopolitan capital with Big Ben, Tower Bridge, royal palaces, and rich theater scene.',
        imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
        popularity: 96,
        costIndex: 92
      },
      {
        id: 10,
        name: 'Sydney',
        country: 'Australia',
        region: 'Oceania',
        description: 'Harbor city famous for the Sydney Opera House, Bondi Beach surfing, and sunny coastal living.',
        imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
        popularity: 90,
        costIndex: 82
      },
      {
        id: 11,
        name: 'Bangkok',
        country: 'Thailand',
        region: 'Asia',
        description: 'Vibrant capital boasting ornate shrines, bustling floating markets, and legendary street food.',
        imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
        popularity: 91,
        costIndex: 38
      },
      {
        id: 12,
        name: 'Barcelona',
        country: 'Spain',
        region: 'Europe',
        description: 'Catalan jewel celebrated for Gaudí’s Sagrada Família, Mediterranean beaches, and tapas bars.',
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
        popularity: 93,
        costIndex: 70
      },
      {
        id: 13,
        name: 'Cape Town',
        country: 'South Africa',
        region: 'Africa',
        description: 'Spectacular coastal city backdropped by Table Mountain, penguin colonies, and scenic vineyards.',
        imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
        popularity: 87,
        costIndex: 50
      },
      {
        id: 14,
        name: 'Singapore',
        country: 'Singapore',
        region: 'Asia',
        description: 'Futuristic garden city featuring Marina Bay Sands, Supertree Grove, and clean, green urban spaces.',
        imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
        popularity: 95,
        costIndex: 86
      },
      {
        id: 15,
        name: 'Jaipur',
        country: 'India',
        region: 'Asia',
        description: 'The Pink City of Rajasthan, steeped in royal palaces, majestic forts, and colorful traditional crafts.',
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
        popularity: 89,
        costIndex: 35
      }
    ];

    this.activities = [
      // Delhi (City 1)
      {
        id: 1,
        cityId: 1,
        name: 'Red Fort & Old Delhi Heritage Walk',
        description: 'Explore the 17th-century Mughal fortress followed by a rickshaw tour through Chandni Chowk street food stalls.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1592635196078-9fdc757f27f4?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 1200,
        duration: 240, // in minutes
        popularity: 94
      },
      {
        id: 2,
        cityId: 1,
        name: 'Qutub Minar & Mehrauli Archaeological Park',
        description: 'Visit the UNESCO World Heritage minaret and discover ancient ruins and stepwells.',
        category: 'SIGHTSEEING',
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 800,
        duration: 180,
        popularity: 90
      },
      {
        id: 3,
        cityId: 1,
        name: 'Street Food Tasting in Chandni Chowk',
        description: 'Savor parathas, jalebis, and kebabs in historical culinary alleys.',
        category: 'FOOD',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 600,
        duration: 120,
        popularity: 96
      },
      // Manali (City 2)
      {
        id: 4,
        cityId: 2,
        name: 'Solang Valley Paragliding & Zorbing',
        description: 'High-adrenaline tandem paragliding overlooking lush cedar forests and snowy peaks.',
        category: 'ADVENTURE',
        imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 3500,
        duration: 150,
        popularity: 95
      },
      {
        id: 5,
        cityId: 2,
        name: 'Rohtang Pass Snow Excursion',
        description: 'Spectacular mountain pass trip with snow scooter rides and panoramic Himalayan views.',
        category: 'SIGHTSEEING',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 4500,
        duration: 360,
        popularity: 92
      },
      {
        id: 6,
        cityId: 2,
        name: 'Jogini Waterfall Trek & Cafe Hopping in Old Manali',
        description: 'Scenic forest hike to natural waterfalls followed by live music in cozy wooden cafes.',
        category: 'RELAXATION',
        imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 500,
        duration: 210,
        popularity: 88
      },
      // Goa (City 3)
      {
        id: 7,
        cityId: 3,
        name: 'Scuba Diving & Watersports at Grand Island',
        description: 'Discover underwater marine life, corals, and experience jet skiing and parasailing.',
        category: 'ADVENTURE',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 4000,
        duration: 300,
        popularity: 97
      },
      {
        id: 8,
        cityId: 3,
        name: 'Old Goa Churches & Latin Quarter Heritage Walk',
        description: 'Wander through colourful Portuguese villas in Fontainhas and visit Basilica of Bom Jesus.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 1000,
        duration: 180,
        popularity: 89
      },
      {
        id: 9,
        cityId: 3,
        name: 'Sunset Cruise on the Mandovi River',
        description: 'Enjoy traditional Goan folk performances and breathtaking golden hour coastal views.',
        category: 'ENTERTAINMENT',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 1500,
        duration: 120,
        popularity: 91
      },
      // Tokyo (City 4)
      {
        id: 10,
        cityId: 4,
        name: 'Shibuya Crossing & Harajuku Culture Tour',
        description: 'Walk the world’s busiest pedestrian crossing and immerse in quirky pop culture along Takeshita Street.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 5000,
        duration: 180,
        popularity: 98
      },
      {
        id: 11,
        cityId: 4,
        name: 'Tsukiji Outer Market Food Tour',
        description: 'Taste authentic sashimi, tamagoyaki, wagyu skewers, and fresh matcha sweets.',
        category: 'FOOD',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 6500,
        duration: 150,
        popularity: 96
      },
      // Paris (City 5)
      {
        id: 12,
        cityId: 5,
        name: 'Eiffel Tower Summit Access & Seine River Cruise',
        description: 'Ascend to the top of the Eiffel Tower for panoramic cityscapes and cruise along the Seine.',
        category: 'SIGHTSEEING',
        imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 7500,
        duration: 210,
        popularity: 99
      },
      {
        id: 13,
        cityId: 5,
        name: 'Louvre Museum Masterpieces Guided Tour',
        description: 'Skip the line to see the Mona Lisa, Venus de Milo, and iconic classical art treasures.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 6000,
        duration: 180,
        popularity: 97
      },
      // Rome (City 6)
      {
        id: 14,
        cityId: 6,
        name: 'Colosseum & Roman Forum Gladiator Tour',
        description: 'Step inside the ancient amphitheatre and walk the streets of the Roman Empire.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 5500,
        duration: 200,
        popularity: 96
      },
      // New York (City 7)
      {
        id: 15,
        cityId: 7,
        name: 'Central Park Bike Tour & Picnic',
        description: 'Pedal through iconic Central Park film locations and enjoy lunch by the lake.',
        category: 'RELAXATION',
        imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 4000,
        duration: 150,
        popularity: 92
      },
      {
        id: 16,
        cityId: 7,
        name: 'Broadway Musical Evening Show',
        description: 'Experience premier Broadway theatrical performances in the heart of Times Square.',
        category: 'ENTERTAINMENT',
        imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 12000,
        duration: 180,
        popularity: 98
      },
      // Dubai (City 8)
      {
        id: 17,
        cityId: 8,
        name: 'Desert Safari with Dune Bashing & BBQ Dinner',
        description: 'Ride 4x4 dunes, sandboard, ride camels, and enjoy belly dance shows under starlit skies.',
        category: 'ADVENTURE',
        imageUrl: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 5000,
        duration: 360,
        popularity: 97
      },
      // London (City 9)
      {
        id: 18,
        cityId: 9,
        name: 'Tower of London & Crown Jewels Discovery',
        description: 'Explore royal history, armor collections, and the world-famous Crown Jewels.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 4500,
        duration: 180,
        popularity: 94
      },
      // Sydney (City 10)
      {
        id: 19,
        cityId: 10,
        name: 'Sydney Harbour Bridge Climb & Sunset View',
        description: 'Climb the iconic bridge arches for unmatched views of the Opera House and harbor.',
        category: 'ADVENTURE',
        imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 15000,
        duration: 210,
        popularity: 95
      },
      // Bangkok (City 11)
      {
        id: 20,
        cityId: 11,
        name: 'Damnoen Saduak Floating Market Longtail Boat Tour',
        description: 'Navigate scenic canals filled with wooden boats selling tropical fruits, pad thai, and souvenirs.',
        category: 'SHOPPING',
        imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 2200,
        duration: 240,
        popularity: 93
      },
      // Barcelona (City 12)
      {
        id: 21,
        cityId: 12,
        name: 'Sagrada Família & Park Güell Gaudí Immersion',
        description: 'Marvel at Antoni Gaudí’s architectural wonders and colorful mosaic viewpoints.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 5200,
        duration: 240,
        popularity: 96
      },
      // Cape Town (City 13)
      {
        id: 22,
        cityId: 13,
        name: 'Table Mountain Cable Car & Boulders Beach Penguins',
        description: 'Ride the rotating cable car to the summit and visit the endangered African penguin colony.',
        category: 'SIGHTSEEING',
        imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 4800,
        duration: 300,
        popularity: 94
      },
      // Singapore (City 14)
      {
        id: 23,
        cityId: 14,
        name: 'Gardens by the Bay & Cloud Forest Dome',
        description: 'Step into futuristic bio-domes with massive indoor waterfalls and evening light shows.',
        category: 'SIGHTSEEING',
        imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 3200,
        duration: 180,
        popularity: 97
      },
      // Jaipur (City 15)
      {
        id: 24,
        cityId: 15,
        name: 'Amber Fort Elephant Ridge & Hawa Mahal Discovery',
        description: 'Explore the grand hilltop fort, Sheesh Mahal mirror halls, and the iconic Palace of Winds.',
        category: 'CULTURE',
        imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 1500,
        duration: 240,
        popularity: 91
      },
      {
        id: 25,
        cityId: 15,
        name: 'Johari Bazaar Jewelry & Textile Shopping',
        description: 'Shop authentic Rajasthani textiles, handcrafted gemstones, and block-printed fabrics.',
        category: 'SHOPPING',
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
        estimatedCost: 2000,
        duration: 150,
        popularity: 88
      }
    ];

    this.trips = [
      {
        id: 1,
        userId: 2,
        name: 'India Golden Triangle & Himalayan Retreat',
        description: 'An unforgettable 10-day expedition spanning Delhi heritage, Manali peaks, and coastal Goa vibes.',
        coverPhoto: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        totalBudget: 75000,
        visibility: 'PUBLIC',
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-01T10:00:00.000Z'
      },
      {
        id: 2,
        userId: 2,
        name: 'Summer in Southern Europe',
        description: 'Exploring Paris art museums and Barcelona Mediterranean architecture.',
        coverPhoto: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
        startDate: '2026-07-15',
        endDate: '2026-07-25',
        totalBudget: 150000,
        visibility: 'PRIVATE',
        createdAt: '2026-02-15T14:00:00.000Z',
        updatedAt: '2026-02-15T14:00:00.000Z'
      }
    ];

    this.tripSections = [
      {
        id: 1,
        tripId: 1,
        cityId: 1, // Delhi
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        budget: 20000,
        order: 1,
        createdAt: '2026-02-01T10:05:00.000Z',
        updatedAt: '2026-02-01T10:05:00.000Z'
      },
      {
        id: 2,
        tripId: 1,
        cityId: 2, // Manali
        startDate: '2026-10-04',
        endDate: '2026-10-07',
        budget: 30000,
        order: 2,
        createdAt: '2026-02-01T10:10:00.000Z',
        updatedAt: '2026-02-01T10:10:00.000Z'
      },
      {
        id: 3,
        tripId: 1,
        cityId: 3, // Goa
        startDate: '2026-10-08',
        endDate: '2026-10-10',
        budget: 25000,
        order: 3,
        createdAt: '2026-02-01T10:15:00.000Z',
        updatedAt: '2026-02-01T10:15:00.000Z'
      }
    ];

    this.days = [
      // Section 1: Delhi (Oct 1 to Oct 3)
      { id: 1, sectionId: 1, tripId: 1, date: '2026-10-01', dayNumber: 1 },
      { id: 2, sectionId: 1, tripId: 1, date: '2026-10-02', dayNumber: 2 },
      { id: 3, sectionId: 1, tripId: 1, date: '2026-10-03', dayNumber: 3 },
      // Section 2: Manali (Oct 4 to Oct 7)
      { id: 4, sectionId: 2, tripId: 1, date: '2026-10-04', dayNumber: 1 },
      { id: 5, sectionId: 2, tripId: 1, date: '2026-10-05', dayNumber: 2 },
      { id: 6, sectionId: 2, tripId: 1, date: '2026-10-06', dayNumber: 3 },
      { id: 7, sectionId: 2, tripId: 1, date: '2026-10-07', dayNumber: 4 },
      // Section 3: Goa (Oct 8 to Oct 10)
      { id: 8, sectionId: 3, tripId: 1, date: '2026-10-08', dayNumber: 1 },
      { id: 9, sectionId: 3, tripId: 1, date: '2026-10-09', dayNumber: 2 },
      { id: 10, sectionId: 3, tripId: 1, date: '2026-10-10', dayNumber: 3 }
    ];

    this.dayActivities = [
      {
        id: 1,
        dayId: 1,
        activityId: 1, // Red Fort
        startTime: '10:00',
        endTime: '13:00',
        customCost: 1200,
        notes: 'Meet the guide at the Lahori Gate',
        order: 1,
        createdAt: '2026-02-01T10:20:00.000Z'
      },
      {
        id: 2,
        dayId: 1,
        activityId: 3, // Street food
        startTime: '13:30',
        endTime: '15:30',
        customCost: 750,
        notes: 'Try famous parathas and rabri jalebi',
        order: 2,
        createdAt: '2026-02-01T10:25:00.000Z'
      },
      {
        id: 3,
        dayId: 4,
        activityId: 4, // Solang Valley
        startTime: '10:00',
        endTime: '12:30',
        customCost: 3500,
        notes: 'High flight tandem paragliding with GoPro recording',
        order: 1,
        createdAt: '2026-02-01T10:30:00.000Z'
      },
      {
        id: 4,
        dayId: 8,
        activityId: 7, // Scuba diving
        startTime: '09:00',
        endTime: '14:00',
        customCost: 4200,
        notes: 'Grand Island boat trip & diving',
        order: 1,
        createdAt: '2026-02-01T10:35:00.000Z'
      }
    ];

    this.expenses = [
      {
        id: 1,
        tripId: 1,
        sectionId: 1,
        dayId: 1,
        category: 'FOOD',
        amount: 1500,
        description: 'Old Delhi traditional lunch & snacks',
        date: '2026-10-01',
        createdAt: '2026-02-01T11:00:00.000Z'
      },
      {
        id: 2,
        tripId: 1,
        sectionId: 1,
        dayId: 1,
        category: 'TRANSPORT',
        amount: 850,
        description: 'Metro and cab fares across New Delhi',
        date: '2026-10-01',
        createdAt: '2026-02-01T11:05:00.000Z'
      },
      {
        id: 3,
        tripId: 1,
        sectionId: 2,
        dayId: 4,
        category: 'STAY',
        amount: 12000,
        description: 'Mountain resort booking in Old Manali (4 nights)',
        date: '2026-10-04',
        createdAt: '2026-02-01T11:10:00.000Z'
      },
      {
        id: 4,
        tripId: 1,
        sectionId: 2,
        dayId: 4,
        category: 'ACTIVITY',
        amount: 3500,
        description: 'Solang Valley Paragliding ticket',
        date: '2026-10-04',
        createdAt: '2026-02-01T11:15:00.000Z'
      }
    ];

    this.communityPosts = [
      {
        id: 1,
        userId: 2,
        tripId: 1,
        title: 'Essential 10-Day Itinerary: Heritage, Mountains & Goan Sun',
        content: 'Sharing our complete roadmap combining Old Delhi street culture, paragliding in Solang Valley, and unwinding at South Goa beaches! Highly recommended to book your paragliding early.',
        imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
        createdAt: '2026-02-02T12:00:00.000Z',
        updatedAt: '2026-02-02T12:00:00.000Z'
      }
    ];

    this.sharedTrips = [
      {
        id: 1,
        tripId: 1,
        shareToken: 'share_demo_token_india_trip_9928374',
        createdAt: '2026-02-02T15:00:00.000Z'
      }
    ];

    // Sequence counters for ID generation
    this.counters = {
      users: 2,
      cities: 15,
      activities: 25,
      trips: 2,
      tripSections: 3,
      days: 10,
      dayActivities: 4,
      expenses: 4,
      communityPosts: 1,
      sharedTrips: 1
    };
  }

  getNextId(table) {
    if (!this.counters[table]) {
      this.counters[table] = 0;
    }
    this.counters[table] += 1;
    return this.counters[table];
  }
}

// Export singleton instance
const mockDb = new MockDatabase();
module.exports = mockDb;
