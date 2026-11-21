import { Link } from 'react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRACTICAL_CONNECTIONS } from './connections.generated';
import { connectionPath } from './connections';
import { useJourneySession } from './journeySessionContext';
import { sourceLabel, withJourneySource } from './routes';
import { cn } from '@/lib/utils';

/** Learners can save a handoff without first leaving a sandbox to create a goal. */
export function SavedJourneySteps() {
  const { state, dispatch } = useJourneySession();
  if (!state.savedSteps.length) return null;
  return <section aria-labelledby="saved-journey-steps" className="flex flex-col gap-4">
    <h2 id="saved-journey-steps" className="font-heading text-2xl font-semibold">Saved from learning and practice</h2>
    <p className="text-sm text-muted-foreground">These steps were saved explicitly and last for this session. They are not checked tasks or proof of a completed chapter.</p>
    {state.savedSteps.map((step) => {
      const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === step.actionId);
      if (!action) return null;
      return <Card key={step.actionId}>
        <CardHeader><CardTitle><h3>{action.title}</h3></CardTitle><CardDescription>Saved from {sourceLabel(step.source)}.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3"><p>{action.description}</p><div className="flex flex-wrap gap-2">
          <Link to={withJourneySource(connectionPath(action), step.source)} className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-10 max-w-full whitespace-normal')}>Explore this next step</Link>
          {state.goal
            ? <Button type="button" variant="outline" className="h-auto min-h-10 max-w-full whitespace-normal" onClick={() => dispatch({ type: 'save-journey-step', actionId: step.actionId, source: step.source })}>Add to my goal’s next steps</Button>
            : <Link to={withJourneySource('/roadmap/setup', step.source)} className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-10 max-w-full whitespace-normal')}>Create a goal when ready</Link>}
          <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'dismiss-saved-step', actionId: step.actionId })}>Remove saved step</Button>
        </div></CardContent>
      </Card>;
    })}
  </section>;
}
