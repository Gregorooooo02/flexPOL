import type { AssetClass, HistoricalObservation, Instrument, RiskLevel } from '@/model';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_LABELS, RISK_LABELS } from '../instruments';
import type { InstrumentFilters, LoadState } from '../instruments';
import { ChoiceField } from './ChoiceField';
import { InstrumentRow } from './InstrumentRow';

interface InstrumentListProps {
  catalogue: LoadState<Instrument[]>;
  instruments: Instrument[];
  filters: InstrumentFilters;
  histories: Record<number, LoadState<HistoricalObservation[]>>;
  allocations: Record<number, number>;
  onFiltersChange: (filters: InstrumentFilters) => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onRequestHistory: (id: number) => void;
  onRetryHistory: (id: number) => void;
  onOpen: (id: number, trigger: HTMLElement) => void;
}

export function InstrumentList({
  catalogue,
  instruments,
  filters,
  histories,
  allocations,
  onFiltersChange,
  onClearFilters,
  onRetry,
  onRequestHistory,
  onRetryHistory,
  onOpen,
}: InstrumentListProps) {
  const classes =
    catalogue.status === 'ready'
      ? [...new Set(catalogue.data.map((item) => item.assetClass))].sort()
      : [];
  const filtered = filters.search !== '' || filters.assetClass !== 'ALL' || filters.risk !== 'ALL';
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Instruments</h2>
        </CardTitle>
        <CardDescription>
          Explore the market. Allocate virtual money, not real savings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {catalogue.status === 'loading' ? (
          <div role="status" className="flex flex-col gap-4">
            <span className="sr-only">Loading instruments</span>
            {[0, 1, 2, 3].map((id) => (
              <Skeleton key={id} className="h-24 w-full motion-reduce:animate-none" />
            ))}
          </div>
        ) : catalogue.status === 'error' ? (
          <Alert>
            <AlertTitle>Couldn’t load the instruments</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              <p>{catalogue.message}</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : catalogue.data.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No instruments yet</EmptyTitle>
              <EmptyDescription>The catalogue is empty. Try loading it again.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="outline" onClick={onRetry}>
                Reload catalogue
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <FieldGroup className="gap-3">
              <Field className="gap-1">
                <FieldLabel htmlFor="instrument-search">Search instruments</FieldLabel>
                <Input
                  id="instrument-search"
                  type="search"
                  value={filters.search}
                  placeholder="Search by name"
                  onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
                />
              </Field>
              <FieldGroup className="grid grid-cols-2 gap-3">
                <ChoiceField
                  label="Asset class"
                  value={filters.assetClass}
                  options={[
                    { value: 'ALL', label: 'All classes' },
                    ...classes.map((value) => ({ value, label: ASSET_LABELS[value] })),
                  ]}
                  onChange={(value) =>
                    onFiltersChange({ ...filters, assetClass: value as AssetClass | 'ALL' })
                  }
                />
                <ChoiceField
                  label="Risk"
                  value={filters.risk}
                  options={[
                    { value: 'ALL', label: 'All risk levels' },
                    ...Object.entries(RISK_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                  onChange={(value) =>
                    onFiltersChange({ ...filters, risk: value as RiskLevel | 'ALL' })
                  }
                />
              </FieldGroup>
            </FieldGroup>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <p role="status">
                {instruments.length} of {catalogue.data.length} instruments
              </p>
              {filtered && (
                <Button type="button" variant="ghost" size="xs" onClick={onClearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
            {instruments.length === 0 ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyTitle>No matches</EmptyTitle>
                  <EmptyDescription>Try a different name or clear the filters.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
                    Show all instruments
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <ul>
                {instruments.map((instrument) => (
                  <InstrumentRow
                    key={instrument.id}
                    instrument={instrument}
                    allocatedCents={allocations[instrument.id] ?? 0}
                    history={histories[instrument.id]}
                    onRequestHistory={onRequestHistory}
                    onRetryHistory={onRetryHistory}
                    onOpen={onOpen}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
