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
}

export const REGIONS_INFO: RegionInfo[] = [
  {
    id: 'europe',
    name: 'Europe',
    tagline: 'Historic charm, art, and romantic landscapes',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    cityCount: 3,
    costIndex: '$$$'
  },
  {
    id: 'asia',
    name: 'Asia & Pacific',
    tagline: 'Vibrant markets, ancient temples, and modern hubs',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    cityCount: 4,
    costIndex: '$$'
  },
  {
    id: 'americas',
    name: 'Americas',
    tagline: 'Iconic skylines, national parks, and cultural melting pots',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    cityCount: 1,
    costIndex: '$$$$'
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    tagline: 'Futuristic architecture, desert wonders, and luxury',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    cityCount: 1,
    costIndex: '$$$'
  },
  {
    id: 'oceania',
    name: 'Oceania',
    tagline: 'Sunny coastlines, harbor icons, and scenic reefs',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    cityCount: 1,
    costIndex: '$$$'
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

  createTrip: (tripData: CreateTripPayload & { initialCityId?: number }) => Promise<Trip>;
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
      if (res.success && Array.isArray(res.data)) {
        setTrips(res.data);
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

      if (citiesRes.success && Array.isArray(citiesRes.data)) {
        setCities(citiesRes.data);
      }
      if (activitiesRes.success && Array.isArray(activitiesRes.data)) {
        setActivities(activitiesRes.data);
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
    tripData: CreateTripPayload & { initialCityId?: number }
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
          cityId: Number(initialCityId),
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
        setTrips(prev => prev.filter(t => t.id !== Number(id)));
        if (activeTrip?.id === Number(id)) setActiveTrip(null);
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
