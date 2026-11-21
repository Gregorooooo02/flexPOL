import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/workspace/portfolio/money';
import type { GoalPlannerResult as Result } from '../calculations/goalPlanner';
import { ResultFacts } from './ResultFacts';

export function GoalPlannerResult({ result, assumptionError }: { readonly result: Result; readonly assumptionError: string | null }) {
  const illustration = result.illustration;
  return (
    <section aria-labelledby="calculation-result" className="flex min-w-0 flex-col gap-4">
      <h2 id="calculation-result" tabIndex={-1} className="font-heading text-2xl font-semibold">Your goal calculation</h2>
      <Card>
        <CardHeader><CardTitle><h3>Contributions only</h3></CardTitle><CardDescription>No investment return, fees, or taxes assumed. This is arithmetic, not a forecast or advice.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ResultFacts facts={[
            ['Ending value', formatMoney(result.endingValueCents)], ['Gap to nominal target', formatMoney(result.gapCents)],
            ['Monthly contribution needed, without returns', result.monthlyNeededCents === null ? 'No contribution date before this goal' : formatMoney(result.monthlyNeededCents)],
            ['Your entered monthly contribution', formatMoney(result.input.monthlyContributionCents)],
            ['Calculation date', result.asOfDate], ['Goal date', result.input.goalDate], ['Monthly contributions included', String(result.months)],
            ['First contribution', result.firstContributionDate ?? 'None before the goal date'], ['Last contribution', result.lastContributionDate ?? 'None before the goal date'],
          ]} />
          {result.monthlyNeededCents === 0 && <p>No further contribution is needed to reach this nominal target from the savings entered. This is not a financial-readiness assessment.</p>}
          {result.months === 0 && <p>No monthly contribution anniversary occurs before this goal. Only the savings already entered count toward the result.</p>}
          <p className="text-sm text-muted-foreground">Contributions are added at period end, starting one month after the calculation date. Month-end anniversaries are clamped independently. Partial months are omitted.</p>
        </CardContent>
      </Card>
      {(assumptionError || result.illustrationError) && <Alert role="note"><AlertTitle>Optional illustration unavailable</AlertTitle><AlertDescription>{assumptionError ?? result.illustrationError}</AlertDescription></Alert>}
      {illustration && <Card>
        <CardHeader><CardTitle><h3>Illustration using your assumptions</h3></CardTitle><CardDescription>Smooth arithmetic compounding is not a simulated market path, probability, expected return, or prediction.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ResultFacts facts={[
            ['Assumed annual return', illustration.assumptions.annualReturn === null ? 'Disabled (0% in this illustration)' : `${Number((illustration.assumptions.annualReturn * 100).toFixed(4))}%`],
            ['Illustrative nominal ending value', formatMoney(Math.round(illustration.endingValueCents))],
            ['Assumed annual inflation', illustration.assumptions.annualInflation === null ? 'Disabled' : `${Number((illustration.assumptions.annualInflation * 100).toFixed(4))}%`],
            ['Illustrative ending value in today’s money', illustration.todaysMoneyCents === null ? 'Inflation comparison disabled' : formatMoney(Math.round(illustration.todaysMoneyCents))],
          ]} />
          <p className="text-sm text-muted-foreground">The target remains nominal at the goal date. Growth happens before each contribution; inflation uses completed months / 12. Values are rounded only for display. Assumptions are never copied into your roadmap as outcomes.</p>
        </CardContent>
      </Card>}
    </section>
  );
}
