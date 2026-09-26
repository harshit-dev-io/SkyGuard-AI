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
  isDemoSession: boolean;
  loginWithToken: (accessToken: string, refreshToken?: string) => Promise<void>;
  enterDemoSandbox: () => void;
  exitDemoSandbox: () => void;
  logout: () => void;
}
import { API_BASE_URL } from '../config/api';

import { DEMO_CREDENTIALS } from '../config/demoConfig';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sg_access_token'));
  const [isDemoSession, setIsDemoSession] = useState<boolean>(() => localStorage.getItem('sg_demo_session') === 'true');
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
    if (isDemoSession) {
      setUser(DEMO_CREDENTIALS.user);
      setIsLoading(false);
    } else if (token) {
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, [token, isDemoSession]);

  const enterDemoSandbox = async () => {
    localStorage.setItem('sg_demo_session', 'true');
    setIsDemoSession(true);

    // Attempt real backend authentication using admin credentials
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEMO_CREDENTIALS.email,
          password: DEMO_CREDENTIALS.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem('sg_access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('sg_refresh_token', data.refresh_token);
          }
          setToken(data.access_token);

          const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          if (meRes.ok) {
            const profile = await meRes.json();
            setUser(profile);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Backend login unavailable for demo credentials, using local admin fallback:', err);
    }

    // Fallback: local admin user
    setUser(DEMO_CREDENTIALS.user);
    setIsLoading(false);
  };

  const exitDemoSandbox = () => {
    localStorage.removeItem('sg_demo_session');
    setIsDemoSession(false);
    setUser(null);
  };

  const loginWithToken = async (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('sg_access_token', accessToken);
    localStorage.removeItem('sg_demo_session');
    setIsDemoSession(false);
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
    localStorage.removeItem('sg_demo_session');
    setIsDemoSession(false);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemoSession,
        loginWithToken,
        enterDemoSandbox,
        exitDemoSandbox,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};