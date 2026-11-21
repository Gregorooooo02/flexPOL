import { useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { useJourneySession } from '@/journey/journeySessionContext';
import { withJourneySource } from '@/journey/routes';
import type { JourneySource } from '@/journey/types';

export function ToolDraftConflict() {
  const { state } = useJourneySession();
  if (!state.setupDraft) return null;
  return <Alert role="note"><AlertTitle>Finish your worksheet edits first</AlertTitle><AlertDescription className="flex flex-col items-start gap-3"><p>Calculations remain available, but inputs cannot be applied over an unfinished worksheet. Resume it and save or discard your edits first.</p><Link to={withJourneySource('/roadmap/setup', state.setupDraft.source)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Resume worksheet</Link></AlertDescription></Alert>;
}

export function ToolRoadmapActions({ actionId, source }: { readonly actionId: string; readonly source: JourneySource }) {
  const { state, dispatch } = useJourneySession();
  const [added, setAdded] = useState(false);
  const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === actionId);
  if (!action) return null;
  const selected = state.actions.some((task) => task.goalId === state.goal?.id && task.actionId === actionId);
  return (
    <section aria-labelledby="practical-next-step" className="flex flex-col items-start gap-3">
      <h2 id="practical-next-step" className="font-heading text-xl font-semibold">A practical next step</h2>
      <p className="font-semibold">{action.title}</p><p>{action.description}</p>
      {state.goal
        ? <Button type="button" variant="outline" disabled={selected} onClick={() => { if (state.goal) { dispatch({ type: 'select-action', action: { goalId: state.goal.id, actionId, source, status: 'todo' } }); setAdded(true); } }}>{selected ? 'Already in my next steps' : 'Add to my next steps'}</Button>
        : <Link to={withJourneySource('/roadmap/setup', source)} className={buttonVariants({ variant: 'outline' })}>Create a goal to keep this task</Link>}
      {added && <p role="status">Added as To do. A calculator result does not mark the task checked.</p>}
    </section>
  );
}
