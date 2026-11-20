import { ChartLineData01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link, NavLink, Outlet } from 'react-router';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/playground', label: 'Playground', end: false },
  { to: '/demo', label: 'Demo', end: false },
] as const;

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground [--app-header-height:4rem]">
      <header className="sticky top-0 z-30 h-[var(--app-header-height)] shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-2 px-3 min-[375px]:px-4 sm:gap-3">
          <Link to="/" className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Badge className="gap-1.5 bg-primary px-2.5 py-0.5 text-primary-foreground">
              <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2.2} aria-hidden="true" />
              {/* Icon only on narrow screens, so the three nav links fit */}
              <span className="sr-only sm:not-sr-only">flexPOL</span>
            </Badge>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }),
                    'px-1.5 min-[375px]:px-2 sm:px-4',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
