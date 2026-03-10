import * as React from 'react';
import { useState } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from '@shared/types';
import type { AuthState } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Define the initial state by checking localStorage immediately
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        return {
          token: savedToken,
          user: JSON.parse(savedUser),
          loading: false, // We already have the data, no need to "load"
        };
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    // Default state if nothing is found
    return {
      user: null,
      token: null,
      loading: false, // Set to false because we've finished the check
    };
  });

  const login = (newToken: string, newUser: User) => {
    setAuthState({ token: newToken, user: newUser, loading: false });    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setAuthState({ token: null, user: null, loading: false });
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const currentPath = window.location.pathname;
    window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

