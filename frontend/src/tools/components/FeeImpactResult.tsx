import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney, formatSignedMoney } from '@/workspace/portfolio/money';
import type { FeeImpactResult as Result } from '../calculations/feeImpact';
import { ResultFacts } from './ResultFacts';

export function FeeImpactResult({ result, date }: { readonly result: Result; readonly date: string }) {
  const money = (value: number) => formatMoney(Math.round(value));
  const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;
  return <section aria-labelledby="calculation-result" className="flex min-w-0 flex-col gap-4">
    <h2 id="calculation-result" tabIndex={-1} className="font-heading text-2xl font-semibold">Your fee comparison</h2>
    <p>Calculated on {date}. {result.input.years} years / {result.months} monthly periods, with a shared {percent(result.input.annualReturn)} assumed annual gross return. No product is ranked as suitable or better.</p>
    <div className="grid gap-4 @2xl:grid-cols-2">
      {([['A', result.optionA, result.input.feeA], ['B', result.optionB, result.input.feeB]] as const).map(([label, option, fee]) => <Card key={label}>
        <CardHeader><CardTitle><h3>Option {label}</h3></CardTitle><CardDescription>{percent(fee)} annual percentage fee under the simplified model.</CardDescription></CardHeader>
        <CardContent><ResultFacts facts={[
          ['Illustrative ending value', money(option.endingValueCents)], ['Modelled fees deducted', money(option.feesDeductedCents)],
          ['Ending-value gap versus no fees', money(result.noFee.endingValueCents - option.endingValueCents)],
        ]} /></CardContent>
      </Card>)}
    </div>
    <Card><CardHeader><CardTitle><h3>Shared reference</h3></CardTitle><CardDescription>Changing fees alone does not compare the risks, exposure, service, taxes or protections of real products.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">
      <ResultFacts facts={[
        ['Ending value without fees', money(result.noFee.endingValueCents)], ['Ending value: A minus B', formatSignedMoney(Math.round(result.differenceCents))],
      ]} />
      <p className="text-sm text-muted-foreground">Modelled fees deducted are the sum of monthly deductions. The ending-value gap also reflects how those deductions changed later compounding; it is not labelled fees paid. Totals are rounded only for display and may differ by a cent.</p>
      <p className="text-sm text-muted-foreground">Each month grows the existing balance, deducts the monthly equivalent of the effective annual proportional fee, then adds your contribution. Transaction fees, spreads, fixed charges, entry/exit fees and taxes are excluded. Lower modelled fees do not establish suitability.</p>
    </CardContent></Card>
  </section>;
}
