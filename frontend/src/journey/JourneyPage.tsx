import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JourneySourceNotice } from './JourneySourceNotice';
import type { JourneySource } from './types';

export function JourneyPage({ title, description, children, status = 'preview', source, activeLabel = 'Personal roadmap' }: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
  readonly status?: 'preview' | 'active';
  readonly source?: JourneySource | null;
  readonly activeLabel?: string;
}) {
  return (
    <div className="@container min-w-0 flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col items-start gap-3">
          <Badge variant="secondary">{status === 'preview' ? 'In development · Preview only' : `${activeLabel} · This session only`}</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        </header>
        <JourneySourceNotice source={source} />
        {children}
        <Alert role="note">
          <AlertTitle>Session only, not financial advice</AlertTitle>
          <AlertDescription>
            Roadmap entries, tool drafts, and learning progress stay in browser memory while you move around HedgeFlex.
            Refresh, logout, or account change clears this session. Personal planning entries are not automatically sent to the server or Hedgie.
            {status === 'preview' ? ' Calculators on this page are previews, not working tools.' : ' Saving here means saving for this session, not a future login.'}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
