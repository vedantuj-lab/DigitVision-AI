import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';

const AUTH_STORAGE_KEY = 'digitvision_auth_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Auto-initialize with a frictionless default session so the user never encounters a blocker
        const defaultUser: User = {
          id: 'usr_guest_demo',
          name: 'Vedant (Evaluator)',
          email: 'vedantuj@gmail.com',
          role: 'evaluator',
          createdAt: new Date().toISOString()
        };
        setUser(defaultUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.warn('LocalStorage error reading auth user:', e);
    }
  }, []);

  const login = (name: string, email: string, role: User['role'] = 'researcher') => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim() || 'Research Engineer',
      email: email.trim() || 'engineer@digitvision.ai',
      role,
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Failed to save user session:', e);
    }
  };

  const loginAsGuest = (customName?: string) => {
    login(customName || 'Guest Evaluator', 'guest@digitvision.ai', 'guest');
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove user session:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
