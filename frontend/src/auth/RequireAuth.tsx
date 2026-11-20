import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './authContext';

/** Sends signed-out visitors to /login and brings them back afterwards. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
