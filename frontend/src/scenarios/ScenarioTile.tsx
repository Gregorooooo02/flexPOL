import type { IconSvgElement } from '@hugeicons/react';
import {
  Calendar03Icon,
  Invoice01Icon,
  PieChartIcon,
  Shield01Icon,
  Target02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario } from '@/model';
import { describeInstrumentMix, formatAmount, formatPeriod } from './format';

/** One scenario as a tile: the person, their goal, the key numbers, money needs and rules. Not clickable yet. */
export function ScenarioTile({ scenario }: { readonly scenario: Scenario }) {
  const { persona, currency } = scenario;
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

      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-1 border-l-2 border-primary bg-secondary/60 px-3 py-2">
          <SectionLabel icon={Target02Icon}>Goal</SectionLabel>
          <p className="text-sm leading-snug text-foreground [overflow-wrap:anywhere]">{scenario.goal}</p>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <Stat icon={Wallet01Icon} label="Budget" value={formatAmount(scenario.budget, currency)} />
          <Stat
            icon={Calendar03Icon}
            label="Horizon"
            value={formatPeriod(scenario.durationDays)}
            hint={`${scenario.durationDays.toLocaleString('en-IE')} days`}
          />
          <Stat
            icon={PieChartIcon}
            label="Choices"
            value={`${scenario.instruments.length} + cash`}
            hint={describeInstrumentMix(scenario.instruments.map((instrument) => instrument.assetClass))}
          />
        </dl>
      </CardContent>

      <CardFooter className="mt-auto flex-col items-stretch gap-3 border-t border-border px-4 pt-3!">
        <div className="flex flex-col gap-1.5">
          <SectionLabel icon={Invoice01Icon}>Money needed along the way</SectionLabel>
          {scenario.moneyNeeds.length > 0 ? (
            <ul className="flex flex-col gap-1 text-xs">
              {scenario.moneyNeeds.map((need) => (
                <li key={`${need.day}-${need.label}`} className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="font-semibold tabular-nums">{formatAmount(need.amount, currency)}</span>{' '}
                    {need.label}
                  </span>
                  <span className="shrink-0 text-muted-foreground" title={`Day ${need.day}`}>
                    after {formatPeriod(need.day)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">None</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <SectionLabel icon={Shield01Icon}>Rules</SectionLabel>
          {scenario.rules.length > 0 ? (
            <ul className="flex flex-col gap-1 text-xs">
              {scenario.rules.map((rule) => (
                <li key={rule.label} className="[overflow-wrap:anywhere]">
                  {rule.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">None</p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function SectionLabel({ icon, children }: { readonly icon: IconSvgElement; readonly children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
      <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
      {children}
    </p>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  readonly icon: IconSvgElement;
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="flex items-center gap-1 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
        <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-heading text-base font-semibold tabular-nums [overflow-wrap:anywhere]">{value}</dd>
      {hint && <dd className="text-[0.6875rem] text-muted-foreground [overflow-wrap:anywhere]">{hint}</dd>}
    </div>
  );
}
