import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PROFILE_OPTIONS } from '../profileOptions';
import type { ProfileAnswerKey } from '../profileOptions';
import type { GoalProfile } from '../types';

function AnswerGroup({ field, title, description, sectionId, profile, onChange }: {
  readonly field: ProfileAnswerKey;
  readonly title: string;
  readonly description: string;
  readonly sectionId?: string;
  readonly profile: GoalProfile;
  readonly onChange: (profile: GoalProfile) => void;
}) {
  return (
    <FieldSet id={sectionId} tabIndex={-1}>
      <FieldLegend id={`${field}-legend`}>{title}</FieldLegend>
      <FieldDescription id={`${field}-help`}>{description}</FieldDescription>
      <ToggleGroup variant="outline" value={profile[field] ? [profile[field]] : []} onValueChange={(values) => onChange({ ...profile, [field]: values[0] })} aria-labelledby={`${field}-legend`} aria-describedby={`${field}-help`} className="max-w-full flex-wrap">
        {PROFILE_OPTIONS[field].map((option) => <ToggleGroupItem key={option.value} value={option.value} className="h-auto min-h-10 max-w-full whitespace-normal px-3 py-2">{option.label}</ToggleGroupItem>)}
      </ToggleGroup>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{profile[field] === undefined ? 'Not provided' : profile[field] === 'unknown' ? 'Not sure' : 'Answer selected'}</span>
        <Button type="button" size="sm" variant="ghost" disabled={profile[field] === undefined} onClick={() => onChange({ ...profile, [field]: undefined })}>Clear {title.toLowerCase()} answer</Button>
      </div>
    </FieldSet>
  );
}

export function ProfileFields({ profile, noteError, onChange }: {
  readonly profile: GoalProfile;
  readonly noteError?: string;
  readonly onChange: (profile: GoalProfile) => void;
}) {
  return (
    <FieldGroup>
      <p className="text-sm text-muted-foreground">Every question is optional. Not sure records an uncertainty; clearing an answer leaves it unanswered.</p>
      <AnswerGroup field="liquidity" title="Access needs" sectionId="section-liquidity" description="Could you need some of this money before your goal date?" profile={profile} onChange={onChange} />
      <AnswerGroup field="lossCapacity" title="Loss capacity" sectionId="section-risk" description="What could a loss mean for your needs or this goal?" profile={profile} onChange={onChange} />
      <AnswerGroup field="willingness" title="Comfort with uncertainty" description="Hypothetical example: how would a 20% fall feel? This is not a validated risk questionnaire or a measure of what you can afford to lose." profile={profile} onChange={onChange} />
      <AnswerGroup field="knowledge" title="Knowledge and experience" sectionId="section-knowledge" description="How familiar do you feel with investment concepts? This is self-report, not evidence of mastery or a quiz result." profile={profile} onChange={onChange} />
      <Field data-invalid={!!noteError}>
        <FieldLabel htmlFor="goal-reviewNotes">Questions to revisit (optional)</FieldLabel>
        <Textarea id="goal-reviewNotes" maxLength={500} value={profile.reviewNotes ?? ''} onChange={(event) => onChange({ ...profile, reviewNotes: event.target.value })} aria-invalid={!!noteError} aria-describedby={`reviewNotes-help${noteError ? ' reviewNotes-error' : ''}`} />
        <FieldDescription id="reviewNotes-help">Up to 500 characters. Avoid account numbers or other identifying details. This note is not analysed or automatically shared with Hedgie.</FieldDescription>
        {noteError && <FieldError id="reviewNotes-error">{noteError}</FieldError>}
      </Field>
    </FieldGroup>
  );
}
