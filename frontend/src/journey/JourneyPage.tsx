import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JourneySourceNotice } from './JourneySourceNotice';

export function JourneyPage({ title, description, children }: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="@container min-w-0 flex-1">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col items-start gap-3">
          <Badge variant="secondary">In development · Preview only</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        </header>
        <JourneySourceNotice />
        {children}
        <Alert role="note">
          <AlertTitle>Session only, not financial advice</AlertTitle>
          <AlertDescription>
            Learning progress stays while you move around HedgeFlex, but resets on refresh, logout, or account change.
            Personal planning forms and device saving are not available yet. No financial figures are collected by these previews.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
