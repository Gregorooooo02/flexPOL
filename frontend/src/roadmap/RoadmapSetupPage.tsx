import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { useJourneySession } from '@/journey/journeySessionContext';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { GoalFields } from './components/GoalFields';
import { ProfileFields } from './components/ProfileFields';
import { SetupReview } from './components/SetupReview';
import { ConfirmRoadmapDialog } from './components/ConfirmRoadmapDialog';
import { localToday } from './calendar';
import { createSetupDraft, draftHasChanges, validateDraft } from './validation';
import type { SetupErrors } from './validation';
import { readProfileSection, sectionStep } from './routes';
import type { ProfileSection, RoadmapSetupDraft, SetupStep } from './types';

export function RoadmapSetupPage() {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const [initialDraft] = useState(() => createSetupDraft(
    state.goal?.id ?? crypto.randomUUID(),
    readJourneySource(search) ?? state.roadmapSource ?? { kind: 'roadmap' }, state.goal, state.profile,
  ));
  useEffect(() => { dispatch({ type: 'start-setup', draft: initialDraft }); }, [dispatch, initialDraft]);

  if (!state.setupDraft) return <JourneyPage status="active" title="Your goal and risk worksheet" description="A few questions to clarify your goal and constraints."><p role="status">Preparing your session worksheet…</p></JourneyPage>;
  return <SetupForm key={state.setupDraft.goalId} draft={state.setupDraft} />;
}

function SetupForm({ draft }: { readonly draft: RoadmapSetupDraft }) {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const section = readProfileSection(search);
  const step = section ? sectionStep(section) : draft.step;
  const [errors, setErrors] = useState<SetupErrors>({});
  const focusField = useRef<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const today = localToday();
  const parsed = validateDraft(draft, today, state.goal);
  const visibleErrors = step === 'review' ? parsed.errors : errors;

  useEffect(() => {
    if (draft.step !== step) dispatch({ type: 'update-setup', goalId: draft.goalId, changes: { step } });
  }, [draft.step, draft.goalId, step, dispatch]);

  useEffect(() => {
    const invalidField = focusField.current ? document.getElementById(`goal-${focusField.current}`) : null;
    const element = invalidField ?? (section ? document.getElementById(`section-${section}`) : headingRef.current);
    element?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'nearest' });
  }, [section, location.key, errors]);

  function update(changes: Partial<RoadmapSetupDraft>) {
    dispatch({ type: 'update-setup', goalId: draft.goalId, changes });
  }
  function goTo(section: ProfileSection, fieldToFocus: string | null = null) {
    focusField.current = fieldToFocus;
    update({ step: sectionStep(section) });
    navigate(withJourneySource(`/roadmap/setup?section=${section}`, draft.source));
  }
  function showErrors(nextErrors: SetupErrors) {
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (!first) return;
    goTo(first === 'reviewNotes' ? 'knowledge' : 'goal', first);
  }
  function next() {
    const currentErrors = Object.fromEntries(Object.entries(parsed.errors).filter(([field]) => step === 'goal' ? field !== 'reviewNotes' : field === 'reviewNotes'));
    if (Object.keys(currentErrors).length) { showErrors(currentErrors); return; }
    setErrors({});
    goTo(step === 'goal' ? 'liquidity' : 'review');
  }
  function save() {
    // Validate again at confirmation, including the current local date.
    const result = validateDraft(draft, localToday(), state.goal);
    if (!result.valid) { showErrors(result.errors); return; }
    dispatch({ type: 'save-roadmap', goal: result.goal, profile: result.profile });
    navigate(withJourneySource('/roadmap', draft.source));
  }
  function discard() {
    dispatch({ type: 'discard-setup' });
    navigate('/roadmap');
  }
  const titles: Record<SetupStep, string> = { goal: '1. Your goal', constraints: '2. Your constraints', review: '3. Review your plan' };

  return (
    <JourneyPage status="active" source={draft.source} title="Your goal and risk worksheet" description="Only a goal name is required. Leave other details open, or choose Not sure. Draft edits stay separate from your saved plan until you confirm.">
      <nav aria-label="Worksheet steps" className="flex flex-wrap gap-2">
        {(['goal', 'constraints', 'review'] as const).map((value) => (
          <Button key={value} type="button" variant={step === value ? 'secondary' : 'outline'} aria-current={step === value ? 'step' : undefined} onClick={() => goTo(value === 'constraints' ? 'liquidity' : value)}>{titles[value]}</Button>
        ))}
      </nav>
      {Object.keys(visibleErrors).length > 0 && <Alert variant="destructive"><AlertTitle>Check the highlighted fields</AlertTitle><AlertDescription><ul className="list-disc pl-5">{Object.entries(visibleErrors).map(([field, message]) => <li key={field}>{message}</li>)}</ul></AlertDescription></Alert>}
      <Card>
        <CardHeader><CardTitle><h2 ref={headingRef} id={step === 'constraints' ? 'section-constraints' : `section-${step}`} tabIndex={-1}>{titles[step]}</h2></CardTitle></CardHeader>
        <CardContent>
          <form noValidate autoComplete="off" onSubmit={(event) => { event.preventDefault(); if (step === 'review') save(); else next(); }} className="flex min-w-0 flex-col gap-7">
            {step === 'goal' && <GoalFields draft={draft} errors={errors} today={today} onChange={update} />}
            {step === 'constraints' && <ProfileFields profile={draft.profile} noteError={errors.reviewNotes} onChange={(profile) => update({ profile })} />}
            {step === 'review' && <SetupReview goal={parsed.goal} profile={parsed.profile} today={today} onEdit={goTo} />}
            <div className="flex flex-wrap gap-2">
              {step !== 'goal' && <Button type="button" variant="outline" onClick={() => goTo(step === 'review' ? 'liquidity' : 'goal')}>Back</Button>}
              <Button type="submit">{step === 'review' ? 'Save for this session' : step === 'goal' ? 'Continue to constraints' : 'Review my plan'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Link to={withJourneySource('/roadmap', draft.source)} className={buttonVariants({ variant: 'outline' })}>Return to roadmap, keep draft</Link>
        <Button type="button" variant="ghost" onClick={() => draftHasChanges(draft, state.goal, state.profile) ? setDiscardOpen(true) : discard()}>Discard changes</Button>
      </div>
      <ConfirmRoadmapDialog open={discardOpen} onOpenChange={setDiscardOpen} title="Discard worksheet changes?" description="Your unsaved edits will be cleared. Your last saved goal, profile, tasks, and learning progress will remain." confirmLabel="Discard changes" onConfirm={discard} />
    </JourneyPage>
  );
}
