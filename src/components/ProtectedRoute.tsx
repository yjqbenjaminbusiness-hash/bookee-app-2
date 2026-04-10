import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('player' | 'organizer' | 'admin')[];
  requireVerified?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user) {
    // Check role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their respective dashboard if they hit the wrong page
      const dashboardPath = user.role === 'user' || user.role === 'player' ? '/player/dashboard' : `/${user.role}/dashboard`;
      return <Navigate to={dashboardPath} replace />;
    }

    // Verification check removed — all logged-in users can organize
  }

  return <>{children}</>;
}
