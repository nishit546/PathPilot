import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<boolean>;
  quickLogin: (type: 'traveler' | 'admin') => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const STORAGE_KEY = 'pathpilot_current_user';

export const CARTOON_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=ffd5dc,ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=c0aede,d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4,c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffdfbf,ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=d1d4f9,b6e3f4'
];

// Pre-seeded demo user with stylish cartoon avatars
export const DEMO_USERS: Record<'traveler' | 'admin', User> = {
  traveler: {
    id: 'user-traveler-1',
    name: 'Tapan (Traveler)',
    email: 'traveler@pathpilot.io',
    avatar: CARTOON_AVATARS[0],
    role: 'traveler',
    phone: '+91 98765 43210',
    city: 'Mumbai',
    country: 'India',
    currency: 'INR',
    bio: 'Passionate multi-city traveler and explorer! Always searching for scenic views and cultural heritage.',
    travelInterests: ['Sightseeing', 'Adventure', 'Food', 'Culture']
  },
  admin: {
    id: 'user-admin-99',
    name: 'PathPilot Admin',
    email: 'admin@pathpilot.io',
    avatar: CARTOON_AVATARS[4],
    role: 'admin',
    phone: '+91 99999 88888',
    city: 'Bangalore',
    country: 'India',
    currency: 'INR',
    bio: 'System Administrator managing platform analytics, trending destinations, and verified travel itineraries.',
    travelInterests: ['Nature', 'Nightlife', 'Sightseeing']
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const login = async (email: string, _password?: string, role: UserRole = 'traveler'): Promise<boolean> => {
    if (email.toLowerCase().includes('traveler') || email.toLowerCase().includes('tapan')) {
      setCurrentUser(DEMO_USERS.traveler);
      return true;
    }
    if (email.toLowerCase().includes('admin')) {
      setCurrentUser(DEMO_USERS.admin);
      return true;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0] || 'Traveler',
      email,
      avatar: CARTOON_AVATARS[0],
      role,
      currency: 'INR',
      country: 'India',
      city: 'Delhi',
      travelInterests: ['Sightseeing', 'Food']
    };
    setCurrentUser(newUser);
    return true;
  };

  const quickLogin = (type: 'traveler' | 'admin') => {
    setCurrentUser(DEMO_USERS[type]);
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name || 'Explorer',
      email: userData.email || 'traveler@pathpilot.io',
      avatar: userData.avatar || CARTOON_AVATARS[0],
      role: userData.role || 'traveler',
      phone: userData.phone || '',
      city: userData.city || 'Mumbai',
      country: userData.country || 'India',
      currency: userData.currency || 'INR',
      bio: userData.bio || 'Ready for multi-city discoveries!',
      travelInterests: userData.travelInterests || ['Sightseeing', 'Culture'],
      createdAt: new Date().toISOString()
    };
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, ...updates });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        quickLogin,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
