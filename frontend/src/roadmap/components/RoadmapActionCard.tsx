import { useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { connectionPath } from '@/journey/connections';
import { lessonPath } from '@/journey/learningLinks';
import { sourceLabel, withJourneySource } from '@/journey/routes';
import type { PracticalConnection } from '@/journey/types';
import type { RoadmapAction } from '../types';

const STATUSES = [
  { value: 'todo', label: 'To do' }, { value: 'checked', label: 'Checked' },
  { value: 'later', label: 'Later' }, { value: 'stuck', label: 'I got stuck' },
] as const;

export function RoadmapActionCard({ task, action, onUpdate }: {
  readonly task: RoadmapAction;
  readonly action: PracticalConnection;
  readonly onUpdate: (changes: { status?: RoadmapAction['status']; reflection?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(task.reflection ?? '');
  return (
    <Card>
      <CardHeader><CardTitle><h4>{action.title}</h4></CardTitle><CardDescription>Added from {sourceLabel(task.source)}. Completion is self-reported.</CardDescription></CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <p>{action.description}</p>
        <FieldSetStatus actionId={action.id} title={action.title} status={task.status} onChange={(status) => onUpdate({ status })} />
        {task.status === 'stuck' && <p className="text-sm text-muted-foreground">Start with the instructions above or review a related concept below. Lessons may have prerequisites; no calculator or AI is needed to work on this task.</p>}
        {task.reflection && <div><h5 className="font-semibold">What I discovered</h5><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{task.reflection}</p></div>}
        <div className="flex flex-wrap gap-2" aria-label="Related learning">
          {action.lessonCodes.map((code) => <Link key={code} to={lessonPath(code)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Review lesson {code}</Link>)}
        </div>
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" variant="outline" />} onClick={() => setNote(task.reflection ?? '')}>{task.reflection ? 'Edit reflection' : 'Add reflection'}</DialogTrigger>
          <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
            <DialogHeader><DialogTitle>What did you discover?</DialogTitle><DialogDescription>{action.title}. Your note stays in this session and is not automatically sent to Hedgie.</DialogDescription></DialogHeader>
            <form onSubmit={(event) => { event.preventDefault(); onUpdate({ reflection: note.trim() }); setOpen(false); }} className="flex min-w-0 flex-col gap-5">
              <FieldGroup><Field><FieldLabel htmlFor={`reflection-${action.id}`}>Reflection (optional)</FieldLabel><Textarea id={`reflection-${action.id}`} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /><FieldDescription>Up to 1,000 characters. Clear the text and save to remove a reflection. Avoid identifying account details.</FieldDescription></Field></FieldGroup>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save reflection</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Link to={withJourneySource(connectionPath(action), task.source)} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{action.destination.kind === 'tool' ? 'Preview related calculator' : 'Review worksheet section'}</Link>
      </CardFooter>
    </Card>
  );
}

function FieldSetStatus({ actionId, title, status, onChange }: { readonly actionId: string; readonly title: string; readonly status: RoadmapAction['status']; readonly onChange: (status: RoadmapAction['status']) => void }) {
  return (
    <FieldSet>
      <FieldLegend>Task status</FieldLegend>
      <ToggleGroup variant="outline" value={[status]} onValueChange={(values) => { const selected = STATUSES.find((candidate) => candidate.value === values[0]); if (selected) onChange(selected.value); }} aria-label={`Status for ${title}`} className="max-w-full flex-wrap">
        {STATUSES.map(({ value, label }) => <ToggleGroupItem key={value} id={`task-${actionId}-${value}`} value={value}>{label}</ToggleGroupItem>)}
      </ToggleGroup>
    </FieldSet>
  );
}
