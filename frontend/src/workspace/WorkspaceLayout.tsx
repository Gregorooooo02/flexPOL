import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface WorkspaceLayoutProps {
  /** Mode-specific information and controls, kept together in the sticky header. */
  header: ReactNode;
  /** Optional banner shown under the header, for example a load error. */
  notice?: ReactNode;
  instruments: ReactNode;
  portfolio: ReactNode;
  /** Actions kept visible in modes that render them below the workspace. */
  actionBar?: ReactNode;
}

type Section = 'instruments' | 'portfolio';

const SECTIONS: readonly { id: Section; label: string }[] = [
  { id: 'instruments', label: 'Instruments' },
  { id: 'portfolio', label: 'Portfolio' },
];

/**
 * The shared workspace page shell: a sticky header and two columns (instruments and portfolio).
 * On narrow screens only one column shows at a time. It knows nothing about
 * which mode it is used in.
 * The content scroll pane starts below the app navigation, so its sticky header uses top: 0.
 */
export function WorkspaceLayout({
  header,
  notice,
  instruments,
  portfolio,
  actionBar,
}: WorkspaceLayoutProps) {
  const [visibleSection, setVisibleSection] = useState<Section>('instruments');

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm [@media(max-height:650px)]:static">
        <div className="@container/workspace-header mx-auto w-full max-w-7xl px-4 py-2">{header}</div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4">
        {notice}

        <div role="group" aria-label="Show section" className="grid grid-cols-2 gap-1 lg:hidden">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              type="button"
              size="sm"
              variant={visibleSection === section.id ? 'secondary' : 'ghost'}
              aria-pressed={visibleSection === section.id}
              onClick={() => setVisibleSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </div>

        <div className="grid flex-1 content-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section
            aria-label="Instruments"
            className={cn('min-w-0', visibleSection !== 'instruments' && 'hidden lg:block')}
          >
            {instruments}
          </section>
          <section
            aria-label="Portfolio"
            className={cn('min-w-0', visibleSection !== 'portfolio' && 'hidden lg:block')}
          >
            {portfolio}
          </section>
        </div>
      </div>
      {actionBar && (
        <div data-coach-footer className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-7xl px-4 py-3">{actionBar}</div>
        </div>
      )}
    </div>
  );
}
