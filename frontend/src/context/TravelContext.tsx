import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip, City, Activity } from '../types';
import { tripsApi, CreateTripPayload } from '../api/tripsApi';
import { citiesApi } from '../api/citiesApi';
import { activitiesApi } from '../api/activitiesApi';
import { useAuth } from './AuthContext';

export type GroupByOption = 'none' | 'region' | 'status' | 'year';
export type SortByOption = 'date-desc' | 'date-asc' | 'budget-desc' | 'duration-desc' | 'name-asc';

export interface RegionInfo {
  id: string;
  name: string;
  tagline: string;
  image: string;
  cityCount: number;
  costIndex: string;
  description: string;
  bestSeason: string;
  avgCostPerDay: string;
  recommendedDuration: string;
  travelVibe: string[];
  topCities: { name: string; country: string; image: string; highlight: string }[];
  popularActivities: { name: string; category: string; cost: string; duration: string }[];
}

export const REGIONS_INFO: RegionInfo[] = [
  {
    id: 'europe',
    name: 'Europe',
    tagline: 'Historic charm, art treasures, and romantic landscapes',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    cityCount: 5,
    costIndex: '$$$',
    description: 'Embark on a fairytale journey through grand Gothic architecture, world-renowned museums, sun-drenched Mediterranean beaches, and snow-capped Alpine vistas.',
    bestSeason: 'May – September',
    avgCostPerDay: '₹12,000 / day',
    recommendedDuration: '7 – 14 Days',
    travelVibe: ['Art & History', 'Romantic Escapes', 'Gourmet Dining', 'Alpine Nature'],
    topCities: [
      { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80', highlight: 'Eiffel Tower & Louvre Museum' },
      { name: 'Rome', country: 'Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80', highlight: 'Colosseum & Vatican City' },
      { name: 'Barcelona', country: 'Spain', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80', highlight: 'Sagrada Família & Tapas' },
      { name: 'Zurich', country: 'Switzerland', image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80', highlight: 'Lake Zurich & Swiss Alps' },
      { name: 'London', country: 'United Kingdom', image: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&w=600&q=80', highlight: 'Tower Bridge & Royal Palaces' }
    ],
    popularActivities: [
      { name: 'Eiffel Tower Summit Access & Seine Cruise', category: 'Sightseeing', cost: '₹7,500', duration: '3.5 Hours' },
      { name: 'Louvre Museum Masterpieces Guided Tour', category: 'Culture', cost: '₹6,000', duration: '3 Hours' },
      { name: 'Colosseum & Roman Forum Gladiator Tour', category: 'History', cost: '₹5,500', duration: '3.5 Hours' },
      { name: 'Sagrada Família & Park Güell Experience', category: 'Architecture', cost: '₹5,200', duration: '4 Hours' }
    ]
  },
  {
    id: 'asia',
    name: 'Asia & Pacific',
    tagline: 'Vibrant markets, ancient temples, and modern hubs',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    cityCount: 15,
    costIndex: '$$',
    description: 'Immerse yourself in rich heritage traditions, royal palaces of Rajasthan, high-altitude Himalayan thrill, serene backwaters of Kerala, and vibrant street food alleys across Tokyo and Bangkok.',
    bestSeason: 'October – March',
    avgCostPerDay: '₹4,500 / day',
    recommendedDuration: '5 – 12 Days',
    travelVibe: ['Heritage & Temples', 'Mountain Treks', 'Street Food', 'Tropical Beaches'],
    topCities: [
      { name: 'Jaipur', country: 'India', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80', highlight: 'Amer Fort & Hawa Mahal' },
      { name: 'Goa', country: 'India', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80', highlight: 'Golden Beaches & Latin Quarter' },
      { name: 'Manali', country: 'India', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80', highlight: 'Solang Paragliding & Cedar Trails' },
      { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80', highlight: 'Shibuya Crossing & Senso-ji' },
      { name: 'Bangkok', country: 'Thailand', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80', highlight: 'Floating Markets & Shrines' }
    ],
    popularActivities: [
      { name: 'Red Fort & Old Delhi Heritage Walk', category: 'Culture', cost: '₹1,200', duration: '4 Hours' },
      { name: 'Solang Valley Paragliding & Zorbing', category: 'Adventure', cost: '₹3,500', duration: '2.5 Hours' },
      { name: 'Mandovi River Sunset Folk Cruise', category: 'Entertainment', cost: '₹1,500', duration: '2 Hours' },
      { name: 'Shibuya Crossing & Harajuku Tour', category: 'Culture', cost: '₹5,000', duration: '3 Hours' }
    ]
  },
  {
    id: 'americas',
    name: 'Americas',
    tagline: 'Iconic skylines, national parks, and cultural melting pots',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    cityCount: 4,
    costIndex: '$$$$',
    description: 'Experience non-stop energy, legendary Broadway shows, Central Park leisure, soaring skyscrapers, and world-renowned entertainment capitals.',
    bestSeason: 'April – October',
    avgCostPerDay: '₹18,000 / day',
    recommendedDuration: '6 – 10 Days',
    travelVibe: ['City Skylines', 'Broadway Shows', 'Iconic Landmarks', 'National Parks'],
    topCities: [
      { name: 'New York', country: 'United States', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80', highlight: 'Times Square & Central Park' },
      { name: 'Los Angeles', country: 'United States', image: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=600&q=80', highlight: 'Hollywood Sign & Santa Monica' },
      { name: 'San Francisco', country: 'United States', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80', highlight: 'Golden Gate Bridge & Cable Cars' }
    ],
    popularActivities: [
      { name: 'Broadway Evening Musical Show', category: 'Entertainment', cost: '₹12,000', duration: '3 Hours' },
      { name: 'Central Park Bike Tour & Picnic', category: 'Relaxation', cost: '₹4,000', duration: '2.5 Hours' },
      { name: 'Statue of Liberty & Ellis Island Cruise', category: 'Sightseeing', cost: '₹5,500', duration: '4 Hours' }
    ]
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    tagline: 'Futuristic architecture, desert wonders, and luxury',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    cityCount: 3,
    costIndex: '$$$',
    description: 'Discover ultra-modern architectural marvels, world-record observation decks, sunset luxury yacht cruises, and thrill-filled desert dune bashing.',
    bestSeason: 'November – March',
    avgCostPerDay: '₹14,000 / day',
    recommendedDuration: '4 – 7 Days',
    travelVibe: ['Luxury & Shopping', 'Futuristic Wonders', 'Desert Safaris', 'Yacht Sailing'],
    topCities: [
      { name: 'Dubai', country: 'United Arab Emirates', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80', highlight: 'Burj Khalifa & Desert Dune Safari' },
      { name: 'Abu Dhabi', country: 'United Arab Emirates', image: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=600&q=80', highlight: 'Sheikh Zayed Mosque & Louvre' }
    ],
    popularActivities: [
      { name: 'Red Dune Desert Safari & BBQ Dinner', category: 'Adventure', cost: '₹5,000', duration: '6 Hours' },
      { name: 'Burj Khalifa At the Top Observation Access', category: 'Sightseeing', cost: '₹6,500', duration: '2 Hours' },
      { name: 'Dubai Marina Sunset Yacht Cruise', category: 'Luxury', cost: '₹8,000', duration: '2.5 Hours' }
    ]
  },
  {
    id: 'oceania',
    name: 'Oceania',
    tagline: 'Sunny coastlines, harbor icons, and scenic reefs',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    cityCount: 3,
    costIndex: '$$$',
    description: 'Relax along pristine ocean shores, climb iconic harbor bridge arches, dive into coral reefs, and journey through breathtaking alpine fjords.',
    bestSeason: 'December – March',
    avgCostPerDay: '₹15,000 / day',
    recommendedDuration: '7 – 12 Days',
    travelVibe: ['Coastal Living', 'Harbor Views', 'Coral Reefs', 'Outdoor Nature'],
    topCities: [
      { name: 'Sydney', country: 'Australia', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80', highlight: 'Opera House & Harbour Bridge' },
      { name: 'Melbourne', country: 'Australia', image: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=600&q=80', highlight: 'Laneway Coffee & Yarra River' }
    ],
    popularActivities: [
      { name: 'Sydney Harbour Bridge Sunset Climb', category: 'Adventure', cost: '₹15,000', duration: '3.5 Hours' },
      { name: 'Sydney Opera House Guided Heritage Tour', category: 'Culture', cost: '₹4,200', duration: '2 Hours' }
    ]
  }
];

interface TravelContextType {
  trips: Trip[];
  cities: City[];
  activities: Activity[];
  regions: RegionInfo[];
  activeTrip: Trip | null;
  isLoadingTrips: boolean;
  isLoadingCatalog: boolean;
  tripsError: string | null;
  searchQuery: string;
  selectedRegion: string | null;
  groupBy: GroupByOption;
  sortBy: SortByOption;
  statusFilter: string;
  isCreateTripModalOpen: boolean;

  // Actions
  fetchTrips: () => Promise<void>;
  fetchCatalog: () => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedRegion: (regionId: string | null) => void;
  setGroupBy: (option: GroupByOption) => void;
  setSortBy: (option: SortByOption) => void;
  setStatusFilter: (status: string) => void;
  setIsCreateTripModalOpen: (open: boolean) => void;

  createTrip: (tripData: CreateTripPayload & { initialCityId?: number | string }) => Promise<Trip>;
  updateTrip: (id: number | string, updates: Partial<Trip>) => Promise<Trip | null>;
  deleteTrip: (id: number | string) => Promise<boolean>;
  getFilteredTrips: () => Trip[];
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

export const TravelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const [isLoadingTrips, setIsLoadingTrips] = useState<boolean>(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [tripsError, setTripsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortBy, setSortBy] = useState<SortByOption>('date-desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!isAuthenticated) {
      setTrips([]);
      return;
    }
    setIsLoadingTrips(true);
    setTripsError(null);
    try {
      const res = await tripsApi.getTrips({ limit: 50 });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.trips || []);
        setTrips(list);
      }
    } catch (err: any) {
      console.error('Failed to fetch trips:', err);
      setTripsError(err.message || 'Could not load your trips');
    } finally {
      setIsLoadingTrips(false);
    }
  }, [isAuthenticated]);

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const [citiesRes, activitiesRes] = await Promise.all([
        citiesApi.getCities({ limit: 50 }),
        activitiesApi.getActivities({ limit: 100 })
      ]);

      if (citiesRes.success) {
        const cList = Array.isArray(citiesRes.data) ? citiesRes.data : ((citiesRes.data as any)?.cities || []);
        if (cList.length > 0) setCities(cList);
      }
      if (activitiesRes.success) {
        const aList = Array.isArray(activitiesRes.data) ? activitiesRes.data : ((activitiesRes.data as any)?.activities || []);
        if (aList.length > 0) setActivities(aList);
      }
    } catch (err) {
      console.warn('Catalog fetch notice:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    } else {
      setTrips([]);
      setActiveTrip(null);
    }
  }, [isAuthenticated, fetchTrips]);

  const createTrip = async (
    tripData: CreateTripPayload & { initialCityId?: number | string }
  ): Promise<Trip> => {
    const { initialCityId, ...createPayload } = tripData;
    
    // 1. Create base trip
    const res = await tripsApi.createTrip(createPayload);
    if (!res.success || !res.data?.trip) {
      throw new Error(res.message || 'Failed to create trip');
    }
    const created = res.data.trip;

    // 2. If an initial destination was selected, create the first section automatically
    if (initialCityId) {
      try {
        await tripsApi.createSection(created.id, {
          cityId: initialCityId as any,
          startDate: created.startDate,
          endDate: created.endDate,
          budget: created.totalBudget
        });
      } catch (err) {
        console.warn('Auto section creation warning:', err);
      }
    }

    // Refresh trips list
    await fetchTrips();
    setActiveTrip(created);
    return created;
  };

  const updateTrip = async (id: number | string, updates: Partial<Trip>): Promise<Trip | null> => {
    try {
      const res = await tripsApi.updateTrip(id, updates as any);
      if (res.success && res.data?.trip) {
        await fetchTrips();
        return res.data.trip;
      }
    } catch (err) {
      console.error('Update trip error:', err);
    }
    return null;
  };

  const deleteTrip = async (id: number | string): Promise<boolean> => {
    try {
      const res = await tripsApi.deleteTrip(id);
      if (res.success) {
        setTrips(prev => prev.filter(t => String(t.id) !== String(id)));
        if (activeTrip && String(activeTrip.id) === String(id)) setActiveTrip(null);
        return true;
      }
    } catch (err) {
      console.error('Delete trip error:', err);
    }
    return false;
  };

  const getFilteredTrips = (): Trip[] => {
    return trips
      .filter(trip => {
        const tripName = trip.name || trip.title || '';
        const tripDesc = trip.description || '';

        const matchesSearch =
          !searchQuery ||
          tripName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tripDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (trip.sections &&
            trip.sections.some(
              s =>
                s.city?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.city?.country.toLowerCase().includes(searchQuery.toLowerCase())
            ));

        let matchesRegion = true;
        if (selectedRegion) {
          const regionObj = REGIONS_INFO.find(r => r.id === selectedRegion);
          if (regionObj) {
            matchesRegion =
              trip.sections?.some(s =>
                s.city?.region.toLowerCase().includes(regionObj.name.toLowerCase())
              ) ?? true;
          }
        }

        const matchesStatus =
          statusFilter === 'all' ||
          trip.status?.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesRegion && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc')
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        if (sortBy === 'date-asc')
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        if (sortBy === 'budget-desc') return (b.totalBudget || 0) - (a.totalBudget || 0);
        if (sortBy === 'duration-desc') {
          const durA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
          const durB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
          return durB - durA;
        }
        if (sortBy === 'name-asc') {
          const nameA = a.name || a.title || '';
          const nameB = b.name || b.title || '';
          return nameA.localeCompare(nameB);
        }
        return 0;
      });
  };

  return (
    <TravelContext.Provider
      value={{
        trips,
        cities,
        activities,
        regions: REGIONS_INFO,
        activeTrip,
        isLoadingTrips,
        isLoadingCatalog,
        tripsError,
        searchQuery,
        selectedRegion,
        groupBy,
        sortBy,
        statusFilter,
        isCreateTripModalOpen,
        fetchTrips,
        fetchCatalog,
        setActiveTrip,
        setSearchQuery,
        setSelectedRegion,
        setGroupBy,
        setSortBy,
        setStatusFilter,
        setIsCreateTripModalOpen,
        createTrip,
        updateTrip,
        deleteTrip,
        getFilteredTrips
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravel = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravel must be used within a TravelProvider');
  }
  return context;
};
