import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { JourneyPage } from '@/journey/JourneyPage';
import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { useJourneySession } from '@/journey/journeySessionContext';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { localToday } from './calendar';
import { profileObservations } from './profileObservations';
import { roadmapSuggestions } from './roadmapSuggestions';
import { ConfirmRoadmapDialog } from './components/ConfirmRoadmapDialog';
import { GoalSummary } from './components/GoalSummary';
import { ProfileObservations } from './components/ProfileObservations';
import { SuggestedActions } from './components/SuggestedActions';
import { RoadmapActionCard } from './components/RoadmapActionCard';
import { BufferSummary } from './components/BufferSummary';
import { SavedJourneySteps } from '@/journey/SavedJourneySteps';
import type { RoadmapAction } from './types';

const GROUPS: readonly { value: RoadmapAction['status']; label: string }[] = [
  { value: 'todo', label: 'To do' }, { value: 'stuck', label: 'I got stuck' },
  { value: 'later', label: 'Later' }, { value: 'checked', label: 'Checked' },
];

export function RoadmapPage() {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const source = readJourneySource(search) ?? state.roadmapSource ?? { kind: 'roadmap' as const };
  const [browse, setBrowse] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const focusStatus = useRef<string | null>(null);
  const goal = state.goal;
  const tasks = state.actions.filter((action) => action.goalId === goal?.id);
  const selectedIds = new Set(tasks.map((action) => action.actionId));
  const checkedCount = tasks.filter((task) => task.status === 'checked').length;
  const observations = goal ? profileObservations(goal, state.profile, localToday()) : [];
  const suggestions = roadmapSuggestions(observations, source, selectedIds);
  const setupPath = withJourneySource('/roadmap/setup', source);

  useEffect(() => {
    if (focusStatus.current) {
      document.getElementById(focusStatus.current)?.focus();
      focusStatus.current = null;
    }
  }, [state.actions]);

  function addAction(actionId: string) {
    if (!goal || selectedIds.has(actionId)) return;
    const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === actionId);
    if (!action) return;
    dispatch({ type: 'select-action', action: { goalId: goal.id, actionId, source, status: 'todo' } });
    setAnnouncement(`Added to your next steps: ${action.title}`);
  }

  return (
    <JourneyPage status="active" title="My Roadmap" description="Clarify one goal, understand your constraints, and choose a practical next step. Your plan stays in this session; it is not investment advice.">
      <p role="status" className="sr-only">{announcement}</p>
      <SavedJourneySteps />
      {state.setupDraft && (
        <Alert role="note">
          <AlertTitle>You have an unfinished worksheet</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>{goal ? 'Your saved plan is shown below. Draft changes do not affect it until you save.' : 'Your draft is kept while you move around HedgeFlex. Finish it whenever you are ready.'}</p>
            <Link to={withJourneySource('/roadmap/setup', state.setupDraft.source)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Continue editing</Link>
          </AlertDescription>
        </Alert>
      )}
      {!goal ? (
        <Empty>
          <EmptyHeader><EmptyTitle>Start with one goal</EmptyTitle><EmptyDescription>Only a name is required. You can leave amounts, dates, and profile questions open. No completed chapter or sandbox score is needed.</EmptyDescription></EmptyHeader>
          <EmptyContent><Link to={setupPath} className={buttonVariants()}>{state.setupDraft ? 'Continue my goal' : 'Create my goal'}</Link></EmptyContent>
        </Empty>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle><h2>My goal and profile</h2></CardTitle><CardDescription>These are your saved answers for this session, not a financial assessment.</CardDescription></CardHeader>
            <CardContent><GoalSummary goal={goal} profile={state.profile} /></CardContent>
            <CardFooter><Link to={setupPath} className={buttonVariants({ variant: 'outline' })}>{state.setupDraft ? 'Continue editing' : 'Edit goal/profile'}</Link></CardFooter>
          </Card>
          <section aria-labelledby="profile-observations" className="flex flex-col gap-4">
            <h2 id="profile-observations" className="font-heading text-2xl font-semibold">My constraints and questions</h2>
            <ProfileObservations observations={observations} />
            <BufferSummary plan={state.bufferPlan?.goalId === goal.id ? state.bufferPlan : null} />
          </section>
          <section aria-labelledby="suggested-actions" className="flex flex-col gap-4">
            <h2 id="suggested-actions" className="font-heading text-2xl font-semibold">Suggested next steps</h2>
            <p className="text-sm text-muted-foreground">Choose what is useful. Nothing is selected automatically, and none of these tasks requires buying or trading.</p>
            <SuggestedActions suggestions={suggestions} onAdd={addAction} />
            <div><Button type="button" variant="outline" aria-expanded={browse} aria-controls="practical-actions" onClick={() => setBrowse((value) => !value)}>{browse ? 'Hide practical actions' : 'Browse practical actions'}</Button></div>
            {browse && (
              <div id="practical-actions" className="grid gap-4 @2xl:grid-cols-2">
                {PRACTICAL_CONNECTIONS.map((action) => (
                  <Card key={action.id}>
                    <CardHeader><CardTitle><h3>{action.title}</h3></CardTitle><CardDescription>{action.description}</CardDescription></CardHeader>
                    <CardFooter className="mt-auto"><Button type="button" variant="outline" className="h-auto min-h-10 whitespace-normal" disabled={selectedIds.has(action.id)} onClick={() => addAction(action.id)}>{selectedIds.has(action.id) ? 'Already in my next steps' : 'Add to my next steps'}</Button></CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
          <section aria-labelledby="my-next-steps" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3"><h2 id="my-next-steps" className="font-heading text-2xl font-semibold">My next steps</h2><Badge variant="outline">{checkedCount} {checkedCount === 1 ? 'action' : 'actions'} checked · self-reported</Badge></div>
            {tasks.length === 0 && <Empty><EmptyHeader><EmptyTitle>No actions selected yet</EmptyTitle><EmptyDescription>Add a suggested task or browse the practical actions. Your roadmap does not require real-money activity.</EmptyDescription></EmptyHeader></Empty>}
            {GROUPS.map((group) => {
              const entries = tasks.filter((task) => task.status === group.value);
              if (!entries.length) return null;
              return (
                <section key={group.value} aria-label={group.label} className="flex flex-col gap-3">
                  <h3 className="font-heading text-lg font-semibold">{group.label}</h3>
                  {entries.map((task) => {
                    const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === task.actionId);
                    if (!action) return <Alert key={task.actionId} role="note"><AlertTitle>Action no longer available</AlertTitle><AlertDescription>Your saved note remains: <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{task.reflection || 'No reflection provided.'}</span></AlertDescription></Alert>;
                    return <RoadmapActionCard key={task.actionId} task={task} action={action} onUpdate={(changes) => {
                      dispatch({ type: 'update-action', goalId: goal.id, actionId: task.actionId, ...changes });
                      if (changes.status) focusStatus.current = `task-${task.actionId}-${changes.status}`;
                    }} />;
                  })}
                </section>
              );
            })}
          </section>
        </>
      )}
      <section aria-labelledby="explore-further" className="flex flex-col gap-3">
        <h2 id="explore-further" className="font-heading text-2xl font-semibold">Explore further</h2>
        <div className="flex flex-wrap gap-2"><Link to="/learning" className={buttonVariants({ variant: 'outline' })}>Learning path</Link><Link to="/scenarios" className={buttonVariants({ variant: 'outline' })}>Fictional scenarios</Link><Link to={withJourneySource('/tools', { kind: 'roadmap' })} className={buttonVariants({ variant: 'outline' })}>Practical tools</Link></div>
      </section>
      {(goal || state.setupDraft || state.savedSteps.length > 0) && <div><Button type="button" variant="ghost" onClick={() => setClearOpen(true)}>Clear my roadmap</Button></div>}
      <ConfirmRoadmapDialog open={clearOpen} onOpenChange={setClearOpen} title="Clear your personal roadmap?" description="This clears your goal, profile, worksheet draft, tasks, saved learning steps, reflections, and personal tool drafts for this session. Your learning progress will remain. This cannot be undone." confirmLabel="Clear my roadmap" cancelLabel="Keep my roadmap" onConfirm={() => { dispatch({ type: 'clear-roadmap' }); setClearOpen(false); setBrowse(false); setAnnouncement('Your personal roadmap was cleared. Learning progress was kept.'); }} />
    </JourneyPage>
  );
}
