import * as React from 'react';
import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { authFetch } from '@auth';
import type { User } from '@types';
import type { AuthState } from './AuthContext';
import { socket } from '@hooks/useSocket';

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
        };
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    // Default state if nothing is found
    return {
      user: null,
      token: null,
    };
  });

  const clearState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ token: null, user: null });
    socket.disconnect();
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setAuthState({ token: newToken, user: newUser });    
  };

  const logout = () => {
    clearState();
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  const refreshUser = async () => {
    // We hit the 'me' endpoint which returns the current user based on the JWT
    console.log('refreshing user...');
    const response = await authFetch('/auth/me');

    if (response.ok) {
      const data = await response.json();
      console.log('refreshed data: '+data);
      login(data.token, data.user);
    } 
    else {
      console.log('refresh failed');
      throw new Error('Failed to refresh user data');
    }
  };

  return (
    <AuthContext.Provider value={{ authState, clearState, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

