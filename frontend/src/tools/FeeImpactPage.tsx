import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JourneyPage } from '@/journey/JourneyPage';
import { useJourneySession } from '@/journey/journeySessionContext';
import { readJourneySource } from '@/journey/routes';
import { localToday } from '@/roadmap/calendar';
import { emptyFeeDraft } from './drafts';
import type { FeeImpactDraft } from './types';
import { validateFeeTool } from './validation';
import type { ToolErrors } from './validation';
import { calculateFees } from './calculations/feeImpact';
import type { FeeImpactResult as Result } from './calculations/feeImpact';
import { FeeImpactFields } from './components/FeeImpactFields';
import { FeeImpactResult } from './components/FeeImpactResult';
import { RelatedLearning } from './components/RelatedLearning';
import { ToolRoadmapActions } from './components/ToolRoadmapActions';

export function FeeImpactPage() {
  const { state, dispatch } = useJourneySession();
  const [search] = useSearchParams();
  const [initial] = useState(() => emptyFeeDraft(readJourneySource(search) ?? { kind: 'tools' }));
  const draft = state.toolDrafts['fee-impact'] ?? initial;
  const source = readJourneySource(search) ?? draft.source;
  const [errors, setErrors] = useState<ToolErrors>({});
  const [calculation, setCalculation] = useState<{ result: Result; date: string } | null>(null);
  const [calculationError, setCalculationError] = useState('');
  const [changed, setChanged] = useState(false);
  function change(changes: Partial<FeeImpactDraft>) {
    dispatch({ type: 'set-tool-draft', draft: { ...draft, ...changes, source } });
    setCalculation(null); setErrors({}); setCalculationError(''); setChanged(true);
  }
  function calculate() {
    const validation = validateFeeTool(draft);
    setErrors(validation.errors); setCalculation(null); setCalculationError(''); setChanged(false);
    if (validation.input) {
      try { setCalculation({ result: calculateFees(validation.input), date: localToday() }); }
      catch (error) { setCalculationError(error instanceof Error ? error.message : 'The fee comparison could not be calculated.'); }
    }
    const first = Object.keys(validation.errors)[0];
    requestAnimationFrame(() => document.getElementById(first ? `tool-${first}` : 'calculation-result')?.focus());
  }
  return <JourneyPage status="active" activeLabel="Practical calculator" source={source} title="Fee impact" description="Compare two annual percentage fees with the same contributions, horizon and assumed gross return. These are illustrations, not product recommendations.">
    <Alert role="note"><AlertTitle>A simplified comparison, not a product ranking</AlertTitle><AlertDescription>Only annual proportional fees differ. No live products, transaction fees, spreads, fixed charges, entry/exit fees or taxes are modelled. Enter every assumption explicitly, including zero.</AlertDescription></Alert>
    <Card><CardHeader><CardTitle><h2>Your comparison inputs</h2></CardTitle><CardDescription>Drafts stay in this session. Returning restores inputs but not a stored calculation; edits clear displayed results.</CardDescription></CardHeader><CardContent>
      <form noValidate autoComplete="off" onSubmit={(event) => { event.preventDefault(); calculate(); }} className="flex flex-col gap-6">
        <FeeImpactFields draft={draft} errors={errors} onChange={change} />
        {Object.keys(errors).length > 0 && <Alert variant="destructive"><AlertTitle>Check your inputs</AlertTitle><AlertDescription>{Object.values(errors).join(' ')}</AlertDescription></Alert>}
        <div><Button type="submit">{calculation ? 'Recalculate fees' : 'Compare fees'}</Button></div>
      </form>
    </CardContent></Card>
    {changed && <p role="status">Inputs changed. Compare again to see current results.</p>}
    {calculationError && <Alert variant="destructive" role="alert"><AlertTitle>Comparison unavailable</AlertTitle><AlertDescription>{calculationError}</AlertDescription></Alert>}
    {calculation && <><FeeImpactResult result={calculation.result} date={calculation.date} /><ToolRoadmapActions actionId="find-annual-charges" source={source} /></>}
    <RelatedLearning tool="fee-impact" source={source} />
  </JourneyPage>;
}
