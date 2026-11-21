import { RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScenarios } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/config/axios';
import type { Scenario } from '@/model';
import { ScenarioTile } from './ScenarioTile';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly scenarios: readonly Scenario[] };

interface ChapterGroup {
  readonly chapterId: number;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly scenarios: readonly Scenario[];
}

/**
 * Tiles grid: each chapter has two scenarios, so at most two columns, one row per chapter. Container
 * queries, because the coach sidebar changes the content width.
 */
const GRID_CLASS = 'grid gap-4 @2xl:grid-cols-2';

/** Skeleton layout while loading: chapter groups of two tiles, like the seeded scenarios. */
const LOADING_GROUPS = 2;
const LOADING_TILES_PER_GROUP = 2;

/** Lists the sandbox scenarios as tiles, grouped by chapter; a tile opens `/scenarios/:scenarioId`. */
export function ScenariosPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getScenarios(controller.signal)
      .then((scenarios) => setLoadState({ status: 'ready', scenarios }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadState({
          status: 'error',
          message: error instanceof ApiError ? error.message : 'Unknown error.',
        });
      });
    return () => controller.abort();
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setLoadState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  const chapters = useMemo(
    () => (loadState.status === 'ready' ? groupByChapter(loadState.scenarios) : []),
    [loadState],
  );

  return (
    <div className="@container flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
        <h1 className="sr-only">Scenarios</h1>

        {loadState.status === 'loading' && <LoadingTiles />}

        {loadState.status === 'error' && (
          <div className="flex justify-center py-6">
            <Card size="sm" className="w-full max-w-md border border-border bg-card py-5" role="alert">
              <CardHeader className="items-center px-5 text-center">
                <CardTitle className="normal-case tracking-normal">Couldn&apos;t load the scenarios</CardTitle>
                <CardDescription className="text-xs">
                  {loadState.message} Check that the backend is running on port 8080.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center px-5 pt-2">
                <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {loadState.status === 'ready' && chapters.length === 0 && (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>No scenarios yet</EmptyTitle>
              <EmptyDescription>Scenarios appear here once they are added to the backend.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {chapters.map((chapter) => (
          <section
            key={chapter.chapterId}
            aria-labelledby={`scenario-chapter-${chapter.chapterId}`}
            className="flex flex-col gap-4"
          >
            <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-border pb-2">
              <h2
                id={`scenario-chapter-${chapter.chapterId}`}
                className="min-w-0 font-heading text-base font-semibold tracking-tight [overflow-wrap:anywhere]"
              >
                <span className="text-muted-foreground">Chapter {chapter.chapterNumber} · </span>
                {chapter.chapterTitle}
              </h2>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {chapter.scenarios.length} {chapter.scenarios.length === 1 ? 'scenario' : 'scenarios'}
              </span>
            </div>
            <ul role="list" className={GRID_CLASS}>
              {chapter.scenarios.map((scenario) => (
                <li key={scenario.id} className="min-w-0">
                  <ScenarioTile scenario={scenario} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Keeps the backend order and starts a new group whenever the chapter changes. */
function groupByChapter(scenarios: readonly Scenario[]): ChapterGroup[] {
  const groups: { chapterId: number; chapterNumber: number; chapterTitle: string; scenarios: Scenario[] }[] = [];
  for (const scenario of scenarios) {
    const last = groups.at(-1);
    if (last?.chapterId === scenario.chapterId) {
      last.scenarios.push(scenario);
    } else {
      groups.push({
        chapterId: scenario.chapterId,
        chapterNumber: scenario.chapterNumber,
        chapterTitle: scenario.chapterTitle,
        scenarios: [scenario],
      });
    }
  }
  return groups;
}

function LoadingTiles() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">Loading scenarios…</span>
      {Array.from({ length: LOADING_GROUPS }, (_, group) => (
        <div key={group} className="flex flex-col gap-4" aria-hidden="true">
          <Skeleton className="h-6 w-64" />
          <div className={GRID_CLASS}>
            {Array.from({ length: LOADING_TILES_PER_GROUP }, (_, index) => (
              <Skeleton key={index} className="h-56" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
