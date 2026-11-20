import type { Ref } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { HoldingRow } from './HoldingRow';
import type { PortfolioPosition } from './HoldingRow';
import { MoneyValue } from './MoneyValue';

export function PortfolioList({
  positions,
  cashCents,
  totalCents,
  readOnly = false,
  titleRef,
  onOpen,
  onRemove,
}: {
  positions: PortfolioPosition[];
  cashCents: number;
  totalCents: number;
  readOnly?: boolean;
  titleRef: Ref<HTMLHeadingElement>;
  onOpen: (id: number, trigger: HTMLElement) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 ref={titleRef} tabIndex={-1}>
            Portfolio
          </h2>
        </CardTitle>
        <CardDescription>
          {positions.length} {positions.length === 1 ? 'position' : 'positions'} · your current
          allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Available cash</span>
          <MoneyValue cents={cashCents} className="min-w-0 text-right" />
        </div>
        {positions.length === 0 ? (
          <Empty className="px-2 py-8">
            <EmptyHeader>
              <EmptyTitle>{readOnly ? 'No open positions' : 'Make your first move'}</EmptyTitle>
              <EmptyDescription>
                {readOnly
                  ? 'Your ending balance is held as cash.'
                  : 'Choose an instrument and set an amount. Unallocated money stays as cash.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-5">
            {positions.map((position) => (
              <HoldingRow
                key={position.instrument.id}
                {...position}
                totalCents={totalCents}
                readOnly={readOnly}
                onOpen={onOpen}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Total value</span>
          <MoneyValue cents={totalCents} className="min-w-0 text-right" />
        </div>
      </CardContent>
    </Card>
  );
}
