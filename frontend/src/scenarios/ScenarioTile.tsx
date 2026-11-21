import { Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario } from '@/model';

/** One scenario as a tile: code, lessons, title, the person and their goal. Not clickable yet. */
export function ScenarioTile({ scenario }: { readonly scenario: Scenario }) {
  const { persona } = scenario;
  const titleId = `scenario-${scenario.id}-title`;
  const lessonCodes = scenario.lessons.map((lesson) => lesson.code);

  return (
    <Card size="sm" className="h-full gap-4 border border-border bg-card py-4" role="group" aria-labelledby={titleId}>
      <CardHeader className="gap-2 px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Badge className="bg-primary px-2 py-0.5 text-primary-foreground tabular-nums">{scenario.code}</Badge>
          {lessonCodes.length > 0 && (
            <Badge variant="secondary" title={scenario.lessons.map((l) => `${l.code} ${l.title}`).join('\n')}>
              {lessonCodes.length === 1 ? 'Lesson' : 'Lessons'} {lessonCodes.join(' · ')}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base [overflow-wrap:anywhere]">
          <h3 id={titleId}>{scenario.title}</h3>
        </CardTitle>
        <CardDescription className="text-xs">
          <span className="font-semibold text-foreground">
            {persona.name}
            {persona.age !== null && `, ${persona.age}`}
          </span>
          {persona.situation && ` · ${persona.situation}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto px-4">
        <div className="flex flex-col gap-1 border-l-2 border-primary bg-secondary/60 px-3 py-2">
          <p className="flex items-center gap-1.5 text-[0.75rem] font-semibold tracking-widest text-muted-foreground uppercase">
            <HugeiconsIcon icon={Target02Icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            Goal
          </p>
          <p className="text-sm leading-snug text-foreground [overflow-wrap:anywhere]">{scenario.goal}</p>
        </div>
      </CardContent>
    </Card>
  );
}
