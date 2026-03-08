import * as React from 'react';
import { useAuth } from '../context/UseAuth';
import { Navigate } from 'react-router-dom';

// A helper to wrap any route that needs a Login
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  
  if (authState.loading) return <div>Loading...</div>;
  
  // If no user, kick them to the login page
  if (!authState.user) return <Navigate to="/login" replace />;
  
  return children;
};
