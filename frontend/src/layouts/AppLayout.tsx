import { Cancel01Icon, Logout01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/authContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { CoachFocusProvider } from '@/components/coach/CoachFocusProvider';
import { CoachSidebar } from '@/components/coach/CoachSidebar';
import { hedgieImage } from '@/components/coach/hedgie';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/theme/ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/learning', label: 'Learning', end: false },
  { to: '/scenarios', label: 'Scenarios', end: false },
  { to: '/playground', label: 'Playground', end: false },
];

const MOBILE_MENU_ID = 'mobile-navigation';

export function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  // The menu belongs to the path it was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const closeMenu = () => setMenuPath(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuPath(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <CoachFocusProvider>
      <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-background text-foreground [--app-header-height:4rem] md:[--app-header-height:4.5rem]">
        <header className="sticky top-0 z-30 h-[var(--app-header-height)] shrink-0 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                to="/"
                className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img src={hedgieImage('greeting')} alt="" className="size-11 md:size-14" />
                <span className="text-xl font-bold tracking-tight md:text-2xl">HedgeFlex</span>
              </Link>

              <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
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
              {!user && (
                <Link to="/login" className={buttonVariants({ size: 'sm' })}>
                  Log in
                </Link>
              )}
              {user && (
                <div className="hidden items-center gap-2 md:flex">
                  <span className="max-w-48 truncate text-sm text-muted-foreground" title={user.email}>
                    {user.username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" />
                    Log out
                  </Button>
                </div>
              )}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls={MOBILE_MENU_ID}
                onClick={() => setMenuPath(menuOpen ? null : pathname)}
              >
                {/* Both icons stay mounted and cross-fade with a quarter turn. */}
                <span className="relative size-5">
                  <HugeiconsIcon
                    icon={Menu01Icon}
                    strokeWidth={2}
                    className={cn(
                      'absolute inset-0 size-5 transition-[opacity,rotate,scale] duration-300 ease-out motion-reduce:transition-none',
                      menuOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
                    )}
                  />
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className={cn(
                      'absolute inset-0 size-5 transition-[opacity,rotate,scale] duration-300 ease-out motion-reduce:transition-none',
                      menuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
                    )}
                  />
                </span>
              </Button>
            </div>
          </div>

          {/* Stays mounted so closing can animate too; `inert` keeps it out of focus and the accessibility tree while closed. */}
          <div className="md:hidden" inert={!menuOpen}>
            {/* Backdrop: tapping outside the menu closes it. */}
            <div
              aria-hidden="true"
              className={cn(
                'fixed inset-x-0 top-[var(--app-header-height)] bottom-0 bg-background/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none',
                menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
              onClick={closeMenu}
            />
            <div
              id={MOBILE_MENU_ID}
              className={cn(
                'absolute inset-x-0 top-full origin-top border-b border-border bg-card shadow-lg transition-[opacity,translate,scale] duration-300 ease-out motion-reduce:transition-none',
                menuOpen
                  ? 'translate-y-0 scale-y-100 opacity-100'
                  : 'pointer-events-none -translate-y-2 scale-y-95 opacity-0',
              )}
            >
              <nav aria-label="Main navigation" className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map(({ to, label, end }, index) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={closeMenu}
                    // Links slide in one after another when opening, and leave together.
                    style={{ transitionDelay: menuOpen ? `${75 + index * 40}ms` : '0ms' }}
                    className={({ isActive }) =>
                      cn(
                        buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
                        'w-full justify-start transition-[opacity,translate,background-color,color] duration-300 ease-out motion-reduce:transition-none',
                        menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0',
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              {user && (
                <div
                  style={{ transitionDelay: menuOpen ? `${75 + NAV_ITEMS.length * 40}ms` : '0ms' }}
                  className={cn(
                    'flex items-center justify-between gap-3 border-t border-border px-4 py-3 transition-opacity duration-300 ease-out motion-reduce:transition-none',
                    menuOpen ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <span className="min-w-0 truncate text-sm text-muted-foreground" title={user.email}>
                    {user.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      closeMenu();
                      logout();
                    }}
                  >
                    <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" />
                    Log out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {user ? (
          <CoachSidebar>
            <Outlet />
          </CoachSidebar>
        ) : (
          <main className="relative flex min-h-0 flex-1 flex-col">
            <Outlet />
          </main>
        )}
      </div>
    </CoachFocusProvider>
  );
}
