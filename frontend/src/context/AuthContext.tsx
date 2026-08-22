import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi, LoginPayload, RegisterPayload } from '../api/authApi';
import { getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<boolean>;
  quickLogin: (type: 'traveler' | 'admin') => Promise<boolean>;
  register: (data: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const normalizeUser = (rawUser: any): User => {
    const fullName = rawUser.firstName && rawUser.lastName 
      ? `${rawUser.firstName} ${rawUser.lastName}`.trim()
      : rawUser.name || rawUser.firstName || rawUser.email.split('@')[0];

    const defaultAvatar = rawUser.profilePhoto || 
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=ffd5dc,ffdfbf,c0aede`;

    return {
      ...rawUser,
      name: fullName,
      avatar: defaultAvatar,
      currency: rawUser.currency || 'INR'
    };
  };

  const verifySession = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setCurrentUser(normalizeUser(response.data.user));
      } else {
        setStoredToken(null);
        setToken(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Session verification failed:', err);
      setStoredToken(null);
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    const handleUnauthorized = () => {
      setStoredToken(null);
      setToken(null);
      setCurrentUser(null);
    };

    window.addEventListener('pathpilot:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pathpilot:unauthorized', handleUnauthorized);
  }, [verifySession]);

  const login = async (credentials: LoginPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        const receivedToken = res.data.token;
        const loggedUser = normalizeUser(res.data.user);
        setStoredToken(receivedToken);
        setToken(receivedToken);
        setCurrentUser(loggedUser);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (type: 'traveler' | 'admin'): Promise<boolean> => {
    if (type === 'admin') {
      return login({
        email: 'admin@pathpilot.com',
        password: 'AdminPassword123!'
      });
    } else {
      return login({
        email: 'traveler@pathpilot.com',
        password: 'Password123!'
      });
    }
  };

  const register = async (data: RegisterPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        const receivedToken = res.data.token;
        const loggedUser = normalizeUser(res.data.user);
        setStoredToken(receivedToken);
        setToken(receivedToken);
        setCurrentUser(loggedUser);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
      setToken(null);
      setCurrentUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data?.user) {
        setCurrentUser(normalizeUser(response.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser && !!token,
        isLoading,
        login,
        quickLogin,
        register,
        logout,
        refreshUser
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
