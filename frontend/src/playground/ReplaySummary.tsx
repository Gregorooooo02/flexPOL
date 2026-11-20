import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoneyValue, SignedMoney } from '@/workspace/components/MoneyValue';
import { SignedChange } from '@/workspace/components/SignedChange';

export interface Contribution {
  id: number;
  name: string;
  cents: number;
}

export function ReplaySummary({
  finalCents,
  budgetCents,
  best,
  worst,
}: {
  finalCents: number;
  budgetCents: number;
  best?: Contribution;
  worst?: Contribution;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Simulation complete</h2>
        </CardTitle>
        <CardDescription>
          Your final result includes realised trades and remaining investments. Use Start over for a
          fresh market.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4 [&>div]:min-w-0">
          <div>
            <dt className="text-xs text-muted-foreground">Final value</dt>
            <dd>
              <MoneyValue cents={finalCents} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Overall profit / loss</dt>
            <dd className="flex flex-col gap-1">
              <SignedMoney cents={finalCents - budgetCents} />
              <SignedChange value={(finalCents - budgetCents) / budgetCents} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Largest gain contribution</dt>
            <dd>
              {best ? (
                <>
                  <p className="text-sm [overflow-wrap:anywhere]">{best.name}</p>
                  <SignedMoney cents={best.cents} />
                </>
              ) : (
                <span className="text-sm">No gains</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Largest loss contribution</dt>
            <dd>
              {worst ? (
                <>
                  <p className="text-sm [overflow-wrap:anywhere]">{worst.name}</p>
                  <SignedMoney cents={worst.cents} />
                </>
              ) : (
                <span className="text-sm">No losses</span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Includes closed positions. A single independent-market simulation is not evidence that a
          strategy will work in real life.
        </p>
      </CardContent>
    </Card>
  );
}
