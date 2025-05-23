import React, { ReactElement } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Assuming you'll use react-router-dom for navigation.
// If not, the Navigate component will need to be replaced with a different mechanism.
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  adminOnly?: boolean;
  children?: ReactElement; // Allow children for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ adminOnly = false, children }) => {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.isLoading) {
    // You can render a loading spinner or a blank screen while checking auth status
    return <div>Loading authentication status...</div>;
  }

  if (!authState.currentUser) {
    // User is not logged in, redirect to login page.
    // Pass the current location so we can redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    // User is logged in but does not have admin privileges for an admin-only route.
    // Redirect to a "not authorized" page or home.
    // For now, redirecting to home (or a generic path if home isn't defined).
    console.warn('Admin access denied for user:', authState.currentUser.username);
    return <Navigate to="/" state={{ from: location }} replace />; 
    // Or: return <div>Access Denied. You need admin privileges.</div>;
  }

  // If children are provided (for element-based routing in React Router v6), render them.
  // Otherwise, render <Outlet /> for nested routes.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
