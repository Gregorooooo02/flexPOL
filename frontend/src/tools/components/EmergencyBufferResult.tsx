import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/workspace/portfolio/money';
import type { BufferInput } from '../types';
import { calculateBuffer } from '../calculations/emergencyBuffer';
import { ResultFacts } from './ResultFacts';

export function EmergencyBufferResult({ input, asOfDate }: { readonly input: BufferInput; readonly asOfDate?: string }) {
  const result = calculateBuffer(input);
  return (
    <Card>
      <CardHeader><CardTitle><h3>Emergency buffer calculation</h3></CardTitle><CardDescription>{asOfDate ? `Calculated on ${asOfDate}. ` : ''}Based only on the figures entered, not an assessment of an appropriate target or retirement income.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResultFacts facts={[
          ['Available after earmarked expenses', formatMoney(result.availableBufferCents)],
          ['Upcoming-expense shortfall', formatMoney(result.expenseShortfallCents)],
          ['Approximate months of essentials covered', result.monthsCovered === null ? 'Undefined — enter monthly expenses above zero to estimate coverage' : `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 2 }).format(result.monthsCovered)} months`],
          ['Your chosen target', `${input.targetMonths} months`], ['Target amount', formatMoney(result.targetAmountCents)], ['Buffer gap', formatMoney(result.bufferGapCents)],
        ]} />
        <p className="text-sm text-muted-foreground">A shortfall on upcoming expenses is separate from the buffer gap. Both may exist. Zero expenses or a zero-month target is not evidence that you are financially safe.</p>
      </CardContent>
    </Card>
  );
}
