import { ChartLineData01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, NavLink, Outlet } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
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

      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
