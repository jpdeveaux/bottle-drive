import { AccessDenied } from './AccessDenied';
import { useAuth } from '@context/UseAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

// A helper to wrap any route that needs a Login
export const ProtectedRoute = ({ children, adminOnly=false } : ProtectedProps ) => {
  const { authState } = useAuth();
  
  // Capture current path (e.g., /admin or /map)
  const currentPath = window.location.pathname;
  const target = `/login?redirectTo=${encodeURIComponent(currentPath)}`;

  // If no user, kick them to the login page
  if (authState.user) {
    const isAuthorized = adminOnly ? (authState.user?.role === 'admin') : true;
    
    if (!isAuthorized) {
      return <AccessDenied 
        code={403} 
        message={adminOnly ? "Admin Access Required" : "Account Not Approved"} 
      />;
    }

    return <>{children}</>;
  } else {
    return <Navigate to={target} replace />;
  }
};
