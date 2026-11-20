import { ChartLineData01Icon, Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '@/auth/authContext';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { CoachFocusProvider } from '@/components/coach/CoachFocusProvider';
import { CoachSidebar } from '@/components/coach/CoachSidebar';

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <CoachFocusProvider>
      <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-background text-foreground [--app-header-height:4rem]">
        <header className="sticky top-0 z-30 h-[var(--app-header-height)] shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4">
            <Link to="/" className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Badge className="gap-1.5 bg-primary px-2.5 py-0.5 text-primary-foreground">
                <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2.2} aria-hidden="true" />
                HedgeFlex
              </Badge>
            </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' })
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/demo"
              className={({ isActive }) =>
                buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' })
              }
            >
              Demo
            </NavLink>
            <NavLink
              to="/playground"
              className={({ isActive }) =>
                buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' })
              }
            >
              Playground
            </NavLink>
            {user && (
              <>
                <span
                  className="ml-2 hidden max-w-48 truncate text-sm text-muted-foreground sm:inline"
                  title={user.email}
                >
                  {user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" />
                  Log out
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

        <CoachSidebar>
          <Outlet />
        </CoachSidebar>
      </div>
    </CoachFocusProvider>
  );
}
