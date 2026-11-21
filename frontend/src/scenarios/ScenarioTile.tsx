import { ArrowRight01Icon, Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario } from '@/model';
import { scenarioPath } from './routes';

/** One scenario as a tile: code, lessons, title, the person and their goal. Opens the scenario's page. */
export function ScenarioTile({ scenario }: { readonly scenario: Scenario }) {
  const { persona } = scenario;
  const codeId = `scenario-${scenario.id}-code`;
  const titleId = `scenario-${scenario.id}-title`;
  const goalId = `scenario-${scenario.id}-goal`;
  const lessonCodes = scenario.lessons.map((lesson) => lesson.code);

  return (
    <Link
      to={scenarioPath(scenario.id)}
      aria-labelledby={`${codeId} ${titleId}`}
      aria-describedby={goalId}
      className="group/tile block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        size="sm"
        className="h-full gap-4 border border-border bg-card py-4 transition-colors group-hover/tile:border-primary/60 group-hover/tile:bg-muted/40"
      >
        <CardHeader className="gap-2 px-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <Badge id={codeId} className="bg-primary px-2 py-0.5 text-primary-foreground tabular-nums">
                {scenario.code}
              </Badge>
              {lessonCodes.length > 0 && (
                <Badge variant="secondary" title={scenario.lessons.map((l) => `${l.code} ${l.title}`).join('\n')}>
                  {lessonCodes.length === 1 ? 'Lesson' : 'Lessons'} {lessonCodes.join(' · ')}
                </Badge>
              )}
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/tile:translate-x-0.5 group-hover/tile:text-primary"
              strokeWidth={2}
              aria-hidden="true"
            />
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
            <p className="flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-widest text-muted-foreground uppercase">
              <HugeiconsIcon icon={Target02Icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              Goal
            </p>
            <p id={goalId} className="text-sm leading-snug text-foreground [overflow-wrap:anywhere]">
              {scenario.goal}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
