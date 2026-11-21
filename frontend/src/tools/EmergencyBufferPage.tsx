import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { useJourneySession } from '@/journey/journeySessionContext';
import { readJourneySource, withJourneySource } from '@/journey/routes';
import { localToday } from '@/roadmap/calendar';
import type { GoalBrief } from '@/roadmap/types';
import { emptyBufferDraft, bufferDraftFromSaved } from './drafts';
import type { BufferInput, EmergencyBufferDraft } from './types';
import { validateBufferTool } from './validation';
import type { ToolErrors } from './validation';
import { EmergencyBufferFields } from './components/EmergencyBufferFields';
import { EmergencyBufferResult } from './components/EmergencyBufferResult';
import { BufferApplyDialog } from './components/BufferApplyDialog';
import { ToolConfirmDialog } from './components/ToolConfirmDialog';
import { RelatedLearning } from './components/RelatedLearning';
import { ToolDraftConflict, ToolRoadmapActions } from './components/ToolRoadmapActions';
import { TOOL_DEFINITIONS } from './toolDefinitions';

export function EmergencyBufferPage() {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const [initialDraft] = useState(() => emptyBufferDraft(readJourneySource(search) ?? { kind: 'tools' }));
  const draft = state.toolDrafts['emergency-buffer'] ?? initialDraft;
  const [errors, setErrors] = useState<ToolErrors>({});
  const [calculation, setCalculation] = useState<{ input: BufferInput; date: string } | null>(null);
  const [applyTarget, setApplyTarget] = useState<GoalBrief | null>(null);
  const [loadOpen, setLoadOpen] = useState(false);
  const [notice, setNotice] = useState('');

  function change(changes: Partial<EmergencyBufferDraft>) {
    dispatch({ type: 'set-tool-draft', draft: { ...draft, ...changes } });
    setCalculation(null); setApplyTarget(null); setErrors({}); setNotice('Inputs changed. Calculate again before keeping this check.');
  }
  function calculate() {
    const result = validateBufferTool(draft);
    setErrors(result.errors); setNotice('');
    setCalculation(result.input ? { input: result.input, date: localToday() } : null);
    const first = Object.keys(result.errors)[0];
    requestAnimationFrame(() => document.getElementById(first ? `tool-${first}` : 'calculation-result')?.focus());
  }
  function loadBuffer() {
    const plan = state.bufferPlan;
    if (!plan || plan.goalId !== state.goal?.id) { setLoadOpen(false); return; }
    change(bufferDraftFromSaved(plan.source, plan.input)); setLoadOpen(false);
    setNotice('Your saved buffer inputs were loaded, not your goal savings. Recalculate and recheck money separation before saving changes.');
  }
  function fresh(): boolean {
    if (calculation?.date === localToday()) return true;
    setCalculation(null); setApplyTarget(null); setNotice('The calculation date changed. Recalculate before keeping this check.'); return false;
  }
  function save() {
    if (!fresh() || !calculation || !applyTarget) return;
    if (state.setupDraft || state.goal?.id !== applyTarget.id || state.goal.savedCents !== applyTarget.savedCents) {
      setApplyTarget(null); setNotice('Your roadmap or its savings changed. Finish worksheet edits and review the current goal before confirming separation again.'); return;
    }
    dispatch({ type: 'save-buffer', expectedGoalId: applyTarget.id, expectedGoalSavedCents: applyTarget.savedCents, input: calculation.input, source: draft.source, separationConfirmed: true });
    setApplyTarget(null); setNotice('Buffer input facts kept for this session. The main goal and task statuses were not changed.');
  }

  return (
    <JourneyPage status="active" activeLabel="Practical calculator" source={draft.source} title="Emergency buffer" description="Check how accessible money relates to essential expenses and your own target. You do not need a roadmap goal to calculate.">
      <Alert role="note"><AlertTitle>Keep money for different purposes separate</AlertTitle><AlertDescription>Goal savings are never automatically copied here. Exclude money assigned to other goals, and do not deduct a bill twice. There is no universal target or assessment of whether you should invest.</AlertDescription></Alert>
      {state.bufferPlan?.goalId === state.goal?.id && state.bufferPlan && <div><Button type="button" variant="outline" onClick={() => {
        if ([draft.monthlyExpenses, draft.accessibleSavings, draft.earmarkedExpenses, draft.targetMonths].some((value) => value.trim())) setLoadOpen(true); else loadBuffer();
      }}>Load saved buffer check</Button></div>}
      <Card>
        <CardHeader><CardTitle><h2>Your buffer inputs</h2></CardTitle><CardDescription>Enter every value explicitly, including zero where appropriate. Returning restores raw inputs; calculate again to see a result.</CardDescription></CardHeader>
        <CardContent>
          <form noValidate autoComplete="off" onSubmit={(event) => { event.preventDefault(); calculate(); }} className="flex flex-col gap-6">
            <EmergencyBufferFields draft={draft} errors={errors} onChange={change} />
            {Object.keys(errors).length > 0 && <Alert variant="destructive"><AlertTitle>Check your inputs</AlertTitle><AlertDescription>{Object.values(errors).join(' ')}</AlertDescription></Alert>}
            <div><Button type="submit">{calculation ? 'Recalculate buffer' : 'Calculate buffer'}</Button></div>
          </form>
        </CardContent>
      </Card>
      {notice && <p role="status">{notice}</p>}
      {calculation && <section aria-labelledby="calculation-result" className="flex flex-col gap-4">
        <h2 id="calculation-result" tabIndex={-1} className="font-heading text-2xl font-semibold">Your buffer result</h2>
        <EmergencyBufferResult input={calculation.input} asOfDate={calculation.date} />
        <ToolDraftConflict />
        {!state.setupDraft && (state.goal
          ? <div><Button type="button" onClick={() => { if (fresh() && state.goal) setApplyTarget({ ...state.goal }); }}>Keep this buffer check in my roadmap</Button></div>
          : <Alert role="note"><AlertTitle>Want to keep this alongside a goal?</AlertTitle><AlertDescription className="flex flex-col items-start gap-3"><p>Calculating does not require a goal. To keep the input facts in your roadmap, create a goal, then return here, recalculate and confirm. Your tool draft stays in this session.</p><Link to={withJourneySource('/roadmap/setup', draft.source)} className={buttonVariants({ variant: 'outline' })}>Create a roadmap goal</Link></AlertDescription></Alert>)}
        <ToolRoadmapActions actionId="check-withdrawal-conditions" source={draft.source} />
      </section>}
      <Alert role="note"><AlertTitle>What this check cannot establish</AlertTitle><AlertDescription>{TOOL_DEFINITIONS['emergency-buffer'].limitation}</AlertDescription></Alert>
      <RelatedLearning tool="emergency-buffer" source={draft.source} />
      {loadOpen && <ToolConfirmDialog open onOpenChange={setLoadOpen} title="Replace your buffer tool inputs?" description="This loads the saved buffer facts and clears the displayed calculation. No money is copied from the main goal, and no roadmap fact changes until a new confirmation." confirmLabel="Load buffer facts" onConfirm={loadBuffer} />}
      {applyTarget && calculation && <BufferApplyDialog goal={applyTarget} input={calculation.input} onCancel={() => setApplyTarget(null)} onConfirm={save} />}
    </JourneyPage>
  );
}
