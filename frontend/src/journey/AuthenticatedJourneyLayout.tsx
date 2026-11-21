import { Outlet } from 'react-router';
import { useAuth } from '@/auth/authContext';
import { JourneySessionProvider } from './JourneySessionProvider';

/** Wrap the shell too: visiting public Home must not discard a signed-in learning session. */
export function AuthenticatedJourneyLayout() {
  const { user } = useAuth();
  if (!user) return <Outlet />;
  return (
    <JourneySessionProvider key={user.email.trim().toLowerCase()}>
      <Outlet />
    </JourneySessionProvider>
  );
}
