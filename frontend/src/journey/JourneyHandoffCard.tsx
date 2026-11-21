import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TOOL_DEFINITIONS } from '@/tools/toolDefinitions';
import { connectionPath, handoffConnections } from './connections';
import { useJourneySession } from './journeySessionContext';
import { withJourneySource } from './routes';
import type { JourneySource, PracticalConnection } from './types';

export function JourneyHandoffCard({ source, sandbox = false, chapterEarned = false }: {
  readonly source: JourneySource;
  readonly sandbox?: boolean;
  readonly chapterEarned?: boolean;
}) {
  const { state, dispatch } = useJourneySession();
  const connections = handoffConnections(source);
  const [leaving, setLeaving] = useState<PracticalConnection | null>(null);
  const [notice, setNotice] = useState('');
  const leaveTrigger = useRef<HTMLButtonElement | null>(null);
  if (!connections.length) return <Card><CardHeader><CardTitle><h2>Choose your next step</h2></CardTitle><CardDescription>A specific connection is not available for this content version. Your existing plan and progress are unchanged.</CardDescription></CardHeader><CardContent className="flex flex-col items-start gap-3">{sandbox && <p>Leaving discards this allocation and replay. A return link opens the brief, not this run.</p>}<Link to="/roadmap" className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-10 max-w-full whitespace-normal')}>{sandbox ? 'Leave run and explore My Roadmap' : 'Explore My Roadmap'}</Link></CardContent></Card>;
  const destinationLabel = (action: PracticalConnection) => action.destination.kind === 'tool'
    ? `Open ${TOOL_DEFINITIONS[action.destination.id].title.toLowerCase()}` : 'Open the goal and risk worksheet';
  return (
    <Card>
      <CardHeader>
        <CardTitle><h2>{chapterEarned ? 'Chapter complete — apply it to your life' : 'Apply this to your life'}</h2></CardTitle>
        <CardDescription>{sandbox ? 'Use the concept, not the fictional allocation or result. Practical tools are available at every star rating.' : 'Choose a practical next step. Keep learning whenever you prefer; nothing is selected or opened automatically.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-5">
        {connections.map((action, index) => {
          const taskExists = state.actions.some((task) => task.goalId === state.goal?.id && task.actionId === action.id);
          const pending = state.savedSteps.some((step) => step.actionId === action.id);
          const saved = taskExists || (!state.goal && pending);
          return <section key={action.id} className="flex min-w-0 flex-col items-start gap-2">
            <h3 className="font-heading font-semibold">{index === 0 ? 'Suggested next step: ' : 'Or explore: '}{action.title}</h3>
            <p className="text-sm text-muted-foreground">{action.relevance}</p>
            <div className="flex max-w-full flex-wrap gap-2">
              {sandbox
                ? <Button type="button" variant={index === 0 ? 'default' : 'outline'} className="h-auto min-h-10 max-w-full whitespace-normal" onClick={(event) => {
                  leaveTrigger.current = event.currentTarget;
                  setLeaving(action);
                  requestAnimationFrame(() => document.getElementById('sandbox-leave-confirmation')?.focus());
                }}>{destinationLabel(action)}</Button>
                : <Link to={withJourneySource(connectionPath(action), source)} className={cn(buttonVariants({ variant: index === 0 ? 'default' : 'outline' }), 'h-auto min-h-10 max-w-full whitespace-normal')}>{destinationLabel(action)}</Link>}
              <Button type="button" variant="outline" className="h-auto min-h-10 max-w-full whitespace-normal" disabled={saved} aria-label={`Save next step: ${action.title}`} onClick={() => {
                dispatch({ type: 'save-journey-step', actionId: action.id, source });
                setNotice(state.goal ? `Saved to your goal’s next steps: ${action.title}. Existing status and reflection are kept.` : `Saved for this session: ${action.title}. Find it in My Roadmap; you can create a goal later.`);
              }}>{saved ? 'Next step saved' : sandbox ? 'Save next step and stay here' : 'Save next step'}</Button>
            </div>
          </section>;
        })}
        {notice && <p role="status">{notice}</p>}
        {leaving && <Alert role="note" id="sandbox-leave-confirmation" tabIndex={-1}>
          <AlertTitle>Leave this sandbox result?</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>Leaving discards this page’s allocation and replay. A return link opens the brief, not this run. No fictional money, holdings, stars or outcomes will be copied into your roadmap.</p>
            <div className="flex max-w-full flex-wrap gap-2"><Link to={withJourneySource(connectionPath(leaving), source)} className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-10 max-w-full whitespace-normal')}>Leave run and continue</Link><Button type="button" variant="ghost" onClick={() => { setLeaving(null); leaveTrigger.current?.focus(); }}>Keep my result</Button></div>
          </AlertDescription>
        </Alert>}
        <p className="text-xs text-muted-foreground">Saved steps last until refresh, logout or account change. Saving a next step is not evidence that you completed it.</p>
      </CardContent>
    </Card>
  );
}
