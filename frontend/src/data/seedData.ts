import { Trip, City, Activity } from '../types';

export interface RegionInfo {
  id: string;
  name: string;
  image: string;
  cityCount: number;
  costIndex: string;
  tagline: string;
}

export const SEED_REGIONS: RegionInfo[] = [
  {
    id: 'europe',
    name: 'Europe',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
    cityCount: 4,
    costIndex: '$$$',
    tagline: 'Historic capitals, art & alpine landscapes'
  },
  {
    id: 'asia',
    name: 'Asia & Pacific',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    cityCount: 3,
    costIndex: '$$',
    tagline: 'Ancient temples, futuristic skylines & street food'
  },
  {
    id: 'americas',
    name: 'Americas',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80',
    cityCount: 2,
    costIndex: '$$$$',
    tagline: 'Vibrant metropolises & breathtaking coastlines'
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop&q=80',
    cityCount: 2,
    costIndex: '$$$',
    tagline: 'Modern marvels, luxury deserts & cultural heritage'
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&auto=format&fit=crop&q=80',
    cityCount: 3,
    costIndex: '$$$',
    tagline: 'Turquoise waters, island sunsets & coastal cuisine'
  }
];

export const SEED_CITIES: City[] = [
  {
    id: 'city-paris',
    name: 'Paris',
    country: 'France',
    region: 'Europe',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
    description: 'The City of Light, world-renowned for art, gastronomy, fashion, and romantic landmarks.',
    costIndex: '$$$',
    popularityScore: 98
  },
  {
    id: 'city-amsterdam',
    name: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&auto=format&fit=crop&q=80',
    description: 'Picturesque canal rings, rich artistic heritage, and bike-friendly scenic streets.',
    costIndex: '$$$',
    popularityScore: 94
  },
  {
    id: 'city-berlin',
    name: 'Berlin',
    country: 'Germany',
    region: 'Europe',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&auto=format&fit=crop&q=80',
    description: 'Dynamic cultural capital known for historical landmarks, vibrant art, and modern vibes.',
    costIndex: '$$',
    popularityScore: 91
  },
  {
    id: 'city-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Asia & Pacific',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    description: 'A mesmerizing blend of ultra-modern skyscrapers and historic sacred shrines.',
    costIndex: '$$$',
    popularityScore: 99
  },
  {
    id: 'city-kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'Asia & Pacific',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
    description: 'Japan’s cultural heart, famous for classical Buddhist temples, gardens, and imperial palaces.',
    costIndex: '$$',
    popularityScore: 96
  },
  {
    id: 'city-newyork',
    name: 'New York',
    country: 'United States',
    region: 'Americas',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80',
    description: 'The city that never sleeps, offering iconic skyline views, Broadway, and vibrant neighborhoods.',
    costIndex: '$$$$',
    popularityScore: 97
  },
  {
    id: 'city-dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    description: 'Futuristic architectural wonders, desert safaris, and luxury waterfront living.',
    costIndex: '$$$$',
    popularityScore: 95
  },
  {
    id: 'city-santorini',
    name: 'Santorini',
    country: 'Greece',
    region: 'Mediterranean',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
    description: 'Whitewashed cliffside villas, blue-domed churches, and world-famous Aegean sunsets.',
    costIndex: '$$$',
    popularityScore: 97
  }
];

export const SEED_ACTIVITIES: Activity[] = [
  {
    id: 'act-eiffel',
    cityId: 'city-paris',
    name: 'Eiffel Tower Summit & Garden Walk',
    category: 'Sightseeing',
    durationHours: 2.5,
    estimatedCost: 2500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&auto=format&fit=crop&q=80',
    description: 'Ascend to the top deck of the Eiffel Tower for panoramic 360-degree views of Paris.'
  },
  {
    id: 'act-louvre',
    cityId: 'city-paris',
    name: 'Louvre Museum Guided Tour',
    category: 'Culture',
    durationHours: 3.0,
    estimatedCost: 1800,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80',
    description: 'Marvel at the Mona Lisa, Venus de Milo, and thousands of world-class masterpieces.'
  },
  {
    id: 'act-canal-cruise',
    cityId: 'city-amsterdam',
    name: 'Amsterdam Canal Evening Cruise',
    category: 'Sightseeing',
    durationHours: 1.5,
    estimatedCost: 2200,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600&auto=format&fit=crop&q=80',
    description: 'Glide along illuminated 17th-century canal rings with drinks and Dutch cheeses.'
  },
  {
    id: 'act-brandenburg',
    cityId: 'city-berlin',
    name: 'Brandenburg Gate & Reichstag Dome',
    category: 'Sightseeing',
    durationHours: 2.0,
    estimatedCost: 1200,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&auto=format&fit=crop&q=80',
    description: 'Explore the historic symbol of German unity and the futuristic glass dome.'
  },
  {
    id: 'act-shibuya',
    cityId: 'city-tokyo',
    name: 'Shibuya Crossing & Harajuku Food Walk',
    category: 'Food',
    durationHours: 3.0,
    estimatedCost: 3200,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
    description: 'Experience the world’s busiest intersection and taste trendy street snacks.'
  }
];

export const SEED_TRIPS: Trip[] = [
  {
    id: 'trip-europe-1',
    userId: 'user-traveler-1',
    title: 'Europe Explorer',
    description: 'A classic 14-day multi-city journey across Paris, Amsterdam, and Berlin discovering art, canals, and architecture.',
    coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-09-12',
    endDate: '2026-09-25',
    totalBudget: 125000,
    status: 'ongoing',
    visibility: 'public',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-20T14:30:00Z',
    sections: [
      {
        id: 'sec-paris',
        tripId: 'trip-europe-1',
        cityId: 'city-paris',
        cityName: 'Paris',
        country: 'France',
        startDate: '2026-09-12',
        endDate: '2026-09-16',
        budgetLimit: 45000,
        order: 1,
        activities: [
          {
            id: 'ta-1',
            sectionId: 'sec-paris',
            dayNumber: 1,
            date: '2026-09-12',
            title: 'Eiffel Tower Visit',
            category: 'Sightseeing',
            startTime: '10:30',
            endTime: '12:30',
            cost: 2500,
            notes: 'Book summit tickets in advance'
          },
          {
            id: 'ta-2',
            sectionId: 'sec-paris',
            dayNumber: 1,
            date: '2026-09-12',
            title: 'Louvre Museum Tour',
            category: 'Culture',
            startTime: '15:00',
            endTime: '18:00',
            cost: 1800,
            notes: 'Enter through Carrousel entrance'
          }
        ]
      },
      {
        id: 'sec-amsterdam',
        tripId: 'trip-europe-1',
        cityId: 'city-amsterdam',
        cityName: 'Amsterdam',
        country: 'Netherlands',
        startDate: '2026-09-16',
        endDate: '2026-09-20',
        budgetLimit: 40000,
        order: 2,
        activities: [
          {
            id: 'ta-3',
            sectionId: 'sec-amsterdam',
            dayNumber: 5,
            date: '2026-09-16',
            title: 'Canal Evening Cruise',
            category: 'Sightseeing',
            startTime: '18:00',
            endTime: '19:30',
            cost: 2200
          }
        ]
      },
      {
        id: 'sec-berlin',
        tripId: 'trip-europe-1',
        cityId: 'city-berlin',
        cityName: 'Berlin',
        country: 'Germany',
        startDate: '2026-09-20',
        endDate: '2026-09-25',
        budgetLimit: 40000,
        order: 3,
        activities: [
          {
            id: 'ta-4',
            sectionId: 'sec-berlin',
            dayNumber: 9,
            date: '2026-09-20',
            title: 'Brandenburg Gate & Reichstag',
            category: 'Sightseeing',
            startTime: '11:00',
            endTime: '13:00',
            cost: 1200
          }
        ]
      }
    ]
  },
  {
    id: 'trip-japan-2',
    userId: 'user-traveler-1',
    title: 'Tokyo & Kyoto Cherry Blossom',
    description: 'Experiencing modern innovation and traditional shrines during the spring cherry blossom bloom.',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-10-05',
    endDate: '2026-10-15',
    totalBudget: 180000,
    status: 'upcoming',
    visibility: 'private',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-18T11:00:00Z',
    sections: [
      {
        id: 'sec-tokyo',
        tripId: 'trip-japan-2',
        cityId: 'city-tokyo',
        cityName: 'Tokyo',
        country: 'Japan',
        startDate: '2026-10-05',
        endDate: '2026-10-10',
        budgetLimit: 100000,
        order: 1,
        activities: [
          {
            id: 'ta-5',
            sectionId: 'sec-tokyo',
            dayNumber: 1,
            date: '2026-10-05',
            title: 'Shibuya Crossing & Food Tour',
            category: 'Food',
            startTime: '14:00',
            endTime: '17:00',
            cost: 3200
          }
        ]
      },
      {
        id: 'sec-kyoto',
        tripId: 'trip-japan-2',
        cityId: 'city-kyoto',
        cityName: 'Kyoto',
        country: 'Japan',
        startDate: '2026-10-10',
        endDate: '2026-10-15',
        budgetLimit: 80000,
        order: 2,
        activities: []
      }
    ]
  },
  {
    id: 'trip-mediterranean-3',
    userId: 'user-traveler-1',
    title: 'Mediterranean Coast & Greek Islands',
    description: 'Sun-kissed coastal escape exploring Athens, Santorini, and Greek coastal villages.',
    coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
    startDate: '2026-06-01',
    endDate: '2026-06-12',
    totalBudget: 150000,
    status: 'completed',
    visibility: 'public',
    createdAt: '2026-05-10T12:00:00Z',
    updatedAt: '2026-06-13T18:00:00Z',
    sections: [
      {
        id: 'sec-santorini',
        tripId: 'trip-mediterranean-3',
        cityId: 'city-santorini',
        cityName: 'Santorini',
        country: 'Greece',
        startDate: '2026-06-01',
        endDate: '2026-06-12',
        budgetLimit: 150000,
        order: 1,
        activities: []
      }
    ]
  }
];
