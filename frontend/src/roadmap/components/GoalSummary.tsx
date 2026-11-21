import { formatMoney } from '@/workspace/portfolio/money';
import type { GoalBrief, GoalProfile } from '../types';
import { profileAnswerLabel } from '../profileOptions';

export function GoalSummary({ goal, profile }: { readonly goal: GoalBrief; readonly profile: GoalProfile | null }) {
  const money = (value: number | undefined) => value === undefined ? 'Not provided' : formatMoney(value);
  const facts = [
    ['Goal', goal.title || 'Not provided'], ['Target amount', money(goal.targetCents)],
    ['Goal date', goal.goalDate ?? 'Not provided'], ['Already set aside', money(goal.savedCents)],
    ['Monthly contribution', money(goal.monthlyContributionCents)],
    ['Access needs', profileAnswerLabel(profile, 'liquidity')], ['Loss capacity', profileAnswerLabel(profile, 'lossCapacity')],
    ['Comfort with uncertainty', profileAnswerLabel(profile, 'willingness')], ['Knowledge and experience', profileAnswerLabel(profile, 'knowledge')],
  ];
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
        {facts.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">{value}</dd></div>)}
      </dl>
      <div className="min-w-0"><h3 className="text-sm font-semibold">Questions to revisit</h3><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{profile?.reviewNotes || 'Not provided'}</p></div>
    </div>
  );
}
