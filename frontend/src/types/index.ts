export type UserRole = 'traveler' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phone?: string;
  city?: string;
  country?: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  bio?: string;
  travelInterests?: string[];
  createdAt?: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  region: 'Europe' | 'Asia & Pacific' | 'Americas' | 'Middle East' | 'Mediterranean' | 'Africa';
  image: string;
  description: string;
  costIndex: '$' | '$$' | '$$$' | '$$$$';
  popularityScore: number;
}

export interface Activity {
  id: string;
  cityId: string;
  name: string;
  category: 'Sightseeing' | 'Food' | 'Adventure' | 'Shopping' | 'Culture' | 'Nature' | 'Nightlife';
  durationHours: number;
  estimatedCost: number;
  rating: number;
  image: string;
  description: string;
}

export interface TripActivity {
  id: string;
  sectionId: string;
  dayNumber: number;
  date: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  cost: number;
  notes?: string;
}

export interface TripSection {
  id: string;
  tripId: string;
  cityId: string;
  cityName: string;
  country: string;
  startDate: string;
  endDate: string;
  budgetLimit: number;
  order: number;
  activities: TripActivity[];
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'draft';
  visibility: 'private' | 'public';
  sections: TripSection[];
  createdAt: string;
  updatedAt: string;
}
