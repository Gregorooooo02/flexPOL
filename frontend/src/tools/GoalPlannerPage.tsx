import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { useJourneySession } from '@/journey/journeySessionContext';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { localToday } from '@/roadmap/calendar';
import { createSetupDraft } from '@/roadmap/validation';
import type { GoalBrief } from '@/roadmap/types';
import { formatMoney } from '@/workspace/portfolio/money';
import { emptyGoalDraft, goalDraftFromSaved } from './drafts';
import { validateGoalTool } from './validation';
import type { ToolErrors } from './validation';
import type { GoalPlannerDraft } from './types';
import { calculateGoal } from './calculations/goalPlanner';
import type { GoalPlannerResult as Result } from './calculations/goalPlanner';
import { GoalPlannerFields } from './components/GoalPlannerFields';
import { GoalPlannerResult } from './components/GoalPlannerResult';
import { GoalApplyDialog } from './components/GoalApplyDialog';
import { ToolConfirmDialog } from './components/ToolConfirmDialog';
import { RelatedLearning } from './components/RelatedLearning';
import { ToolDraftConflict, ToolRoadmapActions } from './components/ToolRoadmapActions';
import { ResultFacts } from './components/ResultFacts';
import { TOOL_DEFINITIONS } from './toolDefinitions';

export function GoalPlannerPage() {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [initialDraft] = useState(() => emptyGoalDraft(readJourneySource(search) ?? { kind: 'tools' }));
  const draft = state.toolDrafts['goal-planner'] ?? initialDraft;
  const [errors, setErrors] = useState<ToolErrors>({});
  const [calculation, setCalculation] = useState<{ result: Result; assumptionError: string | null } | null>(null);
  const [loadTarget, setLoadTarget] = useState<GoalBrief | null>(null);
  const [applyTarget, setApplyTarget] = useState<GoalBrief | null>(null);
  const [notice, setNotice] = useState('');

  function change(changes: Partial<GoalPlannerDraft>) {
    dispatch({ type: 'set-tool-draft', draft: { ...draft, ...changes } });
    setCalculation(null); setApplyTarget(null); setErrors({}); setNotice('Inputs changed. Calculate again to see a current result.');
  }
  function calculate() {
    const today = localToday();
    const validation = validateGoalTool(draft, today);
    setErrors(validation.errors); setNotice('');
    setCalculation(validation.input ? { result: calculateGoal(validation.input, today, validation.assumptions), assumptionError: validation.assumptionError } : null);
    const first = Object.keys(validation.errors)[0];
    requestAnimationFrame(() => document.getElementById(first ? `tool-${first}` : 'calculation-result')?.focus());
  }
  function loadGoal(goal: GoalBrief) {
    change(goalDraftFromSaved(draft, goal)); setLoadTarget(null);
    setNotice('Saved target, date, savings, and contribution loaded. Missing facts stay blank. Calculate to explore them; your roadmap has not changed.');
  }
  function freshResult(): Result | null {
    const result = calculation?.result;
    if (!result || result.asOfDate !== localToday()) {
      setCalculation(null); setApplyTarget(null); setNotice('The calculation date has changed. Recalculate before applying goal inputs.'); return null;
    }
    return result;
  }
  function apply() {
    const result = freshResult();
    if (!result || !applyTarget) return;
    if (state.setupDraft || state.goal?.id !== applyTarget.id) { setApplyTarget(null); setNotice('Your roadmap changed. Finish any worksheet edits and review the current goal before applying.'); return; }
    dispatch({ type: 'apply-goal-inputs', expectedGoalId: applyTarget.id, input: result.input, today: localToday() });
    setApplyTarget(null); setNotice('Entered goal facts applied for this session. Profile, task statuses, and reflections were kept.');
  }
  function startRoadmap() {
    const result = freshResult();
    if (!result || state.setupDraft || state.goal) return;
    const setup = createSetupDraft(crypto.randomUUID(), draft.source, null, null);
    dispatch({ type: 'start-setup', draft: { ...setup, targetAmount: (result.input.targetCents / 100).toFixed(2), goalDate: result.input.goalDate, savedAmount: (result.input.savedCents / 100).toFixed(2), monthlyContribution: (result.input.monthlyContributionCents / 100).toFixed(2) } });
    navigate(withJourneySource('/roadmap/setup', draft.source));
  }

  return (
    <JourneyPage status="active" activeLabel="Practical calculator" source={draft.source} title="Goal planner" description="Explore what a target, date, savings, and monthly contributions add up to. Start with contributions alone; no roadmap or return assumption is required.">
      <Alert role="note"><AlertTitle>Your inputs stay exploratory</AlertTitle><AlertDescription>Returning restores inputs, not a saved calculation. Calculate again after changes or returning. Nothing updates your roadmap until you explicitly apply it.</AlertDescription></Alert>
      {state.goal && <div className="flex flex-col items-start gap-2"><p className="text-sm text-muted-foreground">Optionally copy the saved target, date, savings, and contribution. Unsaved worksheet edits are never loaded.</p><Button type="button" variant="outline" onClick={() => {
        const goal = state.goal;
        if (!goal) return;
        if ([draft.target, draft.goalDate, draft.saved, draft.monthlyContribution].some((value) => value.trim()) || draft.dateInputInvalid) setLoadTarget(goal);
        else loadGoal(goal);
      }}>Load my saved goal</Button></div>}
      <Card>
        <CardHeader><CardTitle><h2>Your goal inputs</h2></CardTitle><CardDescription>All four baseline fields need explicit values. Zero is valid; blank means unknown.</CardDescription></CardHeader>
        <CardContent>
          <form noValidate autoComplete="off" onSubmit={(event) => { event.preventDefault(); calculate(); }} className="flex flex-col gap-6">
            <GoalPlannerFields draft={draft} errors={errors} today={localToday()} onChange={change} />
            {Object.keys(errors).length > 0 && <Alert variant="destructive"><AlertTitle>Check your inputs</AlertTitle><AlertDescription>{Object.values(errors).join(' ')}</AlertDescription></Alert>}
            <div><Button type="submit">{calculation ? 'Recalculate goal' : 'Calculate goal'}</Button></div>
          </form>
        </CardContent>
      </Card>
      {notice && <p role="status">{notice}</p>}
      {calculation && <>
        <GoalPlannerResult result={calculation.result} assumptionError={calculation.assumptionError} />
        <ToolDraftConflict />
        {!state.setupDraft && <div><Button type="button" onClick={() => { if (!freshResult()) return; if (state.goal) setApplyTarget({ ...state.goal }); else startRoadmap(); }}>{state.goal ? 'Use these inputs in my roadmap' : 'Create a roadmap from these inputs'}</Button></div>}
        <ToolRoadmapActions actionId="define-one-goal" source={draft.source} />
      </>}
      <Alert role="note"><AlertTitle>Know what is not modelled</AlertTitle><AlertDescription>{TOOL_DEFINITIONS['goal-planner'].limitation} Changing a contribution or timeline is an idea to explore, not a recommendation.</AlertDescription></Alert>
      <RelatedLearning tool="goal-planner" source={draft.source} />
      {loadTarget && <ToolConfirmDialog open onOpenChange={(open) => { if (!open) setLoadTarget(null); }} title="Replace these tool inputs?" description="This replaces target, date, savings, and contribution in the calculator, not your saved roadmap. Optional assumptions are kept. Any displayed result is cleared." confirmLabel="Load saved goal values" onConfirm={() => loadGoal(loadTarget)}>
        <ResultFacts facts={[
          ['Saved target', loadTarget.targetCents === undefined ? 'Not provided' : formatMoney(loadTarget.targetCents)], ['Saved date', loadTarget.goalDate ?? 'Not provided'],
          ['Saved savings', loadTarget.savedCents === undefined ? 'Not provided' : formatMoney(loadTarget.savedCents)], ['Saved monthly contribution', loadTarget.monthlyContributionCents === undefined ? 'Not provided' : formatMoney(loadTarget.monthlyContributionCents)],
        ]} />
      </ToolConfirmDialog>}
      {applyTarget && calculation && <GoalApplyDialog goal={applyTarget} input={calculation.result.input} onCancel={() => setApplyTarget(null)} onConfirm={apply} />}
    </JourneyPage>
  );
}
