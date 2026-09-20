import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: 'operator' | 'admin';
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithToken: (accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
}
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sg_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user session');
      }

      const profile: UserProfile = await response.json();
      setUser(profile);
    } catch (err) {
      console.error('Session expired or invalid:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loginWithToken = async (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('sg_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('sg_refresh_token', refreshToken);
    }
    setToken(accessToken);
    setIsLoading(true);
    await fetchUserProfile(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('sg_access_token');
    localStorage.removeItem('sg_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};