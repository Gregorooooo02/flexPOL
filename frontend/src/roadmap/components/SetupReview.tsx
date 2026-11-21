import { Button } from '@/components/ui/button';
import { GoalSummary } from './GoalSummary';
import { ProfileObservations } from './ProfileObservations';
import { profileObservations } from '../profileObservations';
import type { GoalBrief, GoalProfile, ProfileSection } from '../types';

export function SetupReview({ goal, profile, today, onEdit }: {
  readonly goal: GoalBrief;
  readonly profile: GoalProfile;
  readonly today: string;
  readonly onEdit: (section: ProfileSection) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p>Review your facts and unanswered questions. Nothing here recommends an investment or confirms readiness.</p>
      <GoalSummary goal={goal} profile={profile} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => onEdit('goal')}>Edit goal</Button>
        <Button type="button" variant="outline" onClick={() => onEdit('liquidity')}>Edit constraints and questions</Button>
      </div>
      <ProfileObservations observations={profileObservations(goal, profile, today)} />
    </div>
  );
}
