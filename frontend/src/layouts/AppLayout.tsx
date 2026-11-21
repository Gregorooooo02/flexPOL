import { Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '@/auth/authContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { CoachFocusProvider } from '@/components/coach/CoachFocusProvider';
import { CoachSidebar } from '@/components/coach/CoachSidebar';
import { hedgieImage } from '@/components/coach/hedgie';
import { ThemeToggle } from '@/theme/ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/learning', label: 'Learning', end: false },
  { to: '/scenarios', label: 'Scenarios', end: false },
  { to: '/playground', label: 'Playground', end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <CoachFocusProvider>
      <div className="h-svh min-h-svh bg-background">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground [--app-header-height:4.5rem]">
        <header className="sticky top-0 z-30 h-[var(--app-header-height)] shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                to="/"
                className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img src={hedgieImage('greeting')} alt="" className="size-14" />
                <span className="text-2xl font-bold tracking-tight">HedgeFlex</span>
              </Link>

              {/* Scrolls sideways on narrow screens instead of cutting off the last links. */}
              <nav
                aria-label="Main navigation"
                className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none]"
              >
                {NAV_ITEMS.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' })
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {user && (
                <>
                  <span
                    className="hidden max-w-48 truncate text-sm text-muted-foreground sm:inline"
                    title={user.email}
                  >
                    {user.username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" />
                    <span className="hidden sm:inline">Log out</span>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
      </header>

        <CoachSidebar>
          <Outlet />
        </CoachSidebar>
      </div>
      </div>
    </CoachFocusProvider>
  );
}
