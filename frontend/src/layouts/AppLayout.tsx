import { ChartLineData01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, NavLink, Outlet } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { CoachFocusProvider } from '@/components/coach/CoachFocusProvider';
import { CoachSidebar } from '@/components/coach/CoachSidebar';

export function AppLayout() {
  return (
    <CoachFocusProvider>
      <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-background text-foreground [--app-header-height:4rem]">
        <header className="sticky top-0 z-30 h-[var(--app-header-height)] shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4">
            <Link to="/" className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Badge className="gap-1.5 bg-primary px-2.5 py-0.5 text-primary-foreground">
                <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2.2} aria-hidden="true" />
                flexPOL
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
