export type UserRole = 'USER' | 'ADMIN' | 'traveler' | 'admin';

export interface User {
  id: number | string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  additionalInfo?: string | null;
  profilePhoto?: string | null;
  avatar?: string;
  role: UserRole;
  isBlocked?: boolean;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  bio?: string;
  travelInterests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  id: number;
  name: string;
  country: string;
  region: string;
  description: string;
  imageUrl: string;
  popularity: number;
  costIndex: number;
  activities?: Activity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: number;
  cityId: number;
  name: string;
  description: string;
  category: 'SIGHTSEEING' | 'CULTURE' | 'ADVENTURE' | 'FOOD' | 'NATURE' | 'NIGHTLIFE' | 'SHOPPING' | string;
  estimatedCost: number;
  durationMinutes: number;
  imageUrl: string;
  rating: number;
  city?: {
    id: number;
    name: string;
    country: string;
  };
}

export interface DayActivity {
  id: number;
  dayId: number;
  activityId: number;
  startTime: string;
  endTime: string;
  customCost: number;
  notes?: string | null;
  order: number;
  activity?: Activity;
}

export interface TripDay {
  id: number;
  sectionId: number;
  dayNumber: number;
  date: string;
  dayActivities?: DayActivity[];
}

export interface TripSection {
  id: number;
  tripId: number;
  cityId: number;
  startDate: string;
  endDate: string;
  budget: number;
  order: number;
  notes?: string | null;
  city?: City;
  days?: TripDay[];
}

export interface TripExpense {
  id: number;
  tripId: number;
  sectionId?: number | null;
  dayId?: number | null;
  category: 'TRANSPORT' | 'STAY' | 'ACTIVITIES' | 'MEALS' | 'SHOPPING' | 'OTHER' | string;
  amount: number;
  description: string;
  date: string;
  createdAt?: string;
}

export interface Trip {
  id: number;
  userId: number;
  name: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  status: 'PLANNING' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'SHARED' | string;
  coverImage?: string | null;
  shareToken?: string | null;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string | null;
  };
  sections?: TripSection[];
  expenses?: TripExpense[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetBreakdown {
  tripId: number;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  isOverBudget: boolean;
  categoryBreakdown: Record<string, number>;
  sectionBreakdown: Array<{
    sectionId: number;
    cityName: string;
    allocatedBudget: number;
    spent: number;
    percentageUsed: number;
  }>;
  dayBreakdown: Array<{
    date: string;
    dayNumber: number;
    cityName: string;
    totalCost: number;
    activityCost: number;
    expenseCost: number;
  }>;
}

export interface CommunityPost {
  id: number;
  userId: number;
  tripId?: number | null;
  activityId?: number | null;
  title: string;
  content: string;
  likesCount?: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhoto?: string | null;
  };
  trip?: Trip;
  activity?: Activity;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    totalTrips: number;
    publicTrips: number;
    totalCities: number;
    totalActivities: number;
    totalExpensesLogged: number;
    totalExpenseAmount: number;
  };
  tripStatusDistribution: Record<string, number>;
  topCities: Array<{
    id: number;
    name: string;
    country: string;
    visitCount: number;
  }>;
  topActivities: Array<{
    id: number;
    name: string;
    category: string;
    scheduledCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    tripsCreated: number;
    userSignups: number;
  }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationMeta;
  errors?: Record<string, string[]>;
}
