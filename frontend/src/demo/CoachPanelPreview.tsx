import { CoachPanel } from '@/components/coach/CoachPanel';
import { useCoachFocus } from '@/components/coach/coachFocus';
import { hedgieImage } from '@/components/coach/hedgie';
import type { CoachFocus } from '@/components/coach/coachFocus';
import { useCoachChat } from '@/components/coach/useCoachChat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const QUESTION_SUGGESTIONS = [
  'Help me with this question',
  'What is this question asking?',
  'Can you give me a hint?',
] as const;

const LESSON_SUGGESTIONS = [
  'Can you sum up this lesson?',
  'Explain the key idea with an example',
  'What should I remember from this?',
] as const;

/**
 * Temporary test harness: a floating button that opens the coach in a dialog.
 * It passes on what the learner is looking at (lesson, quiz question, checked answer).
 * The conversation lives outside the dialog, so it survives closing and reopening;
 * a new screen (another lesson or test) starts a new conversation.
 * Remove it once CoachPanel is placed in the lesson or sandbox screens.
 */
export function CoachPanelPreview() {
  const focus = useCoachFocus();
  // Remounting per screen gives each lesson or test its own conversation
  return <CoachDialog key={focus?.scopeId ?? 'general'} focus={focus} />;
}

function CoachDialog({ focus }: { readonly focus: CoachFocus | null }) {
  const chat = useCoachChat();
  const suggestions =
    focus?.questionId !== undefined ? QUESTION_SUGGESTIONS : focus ? LESSON_SUGGESTIONS : undefined;

  return (
    <Dialog>
      <DialogTrigger render={<Button className="fixed right-4 bottom-4 z-30 shadow-md" />}>
        <img src={hedgieImage('greeting')} alt="" data-icon="inline-start" className="-my-1 size-6" />
        Ask Hedgie
      </DialogTrigger>
      <DialogContent className="p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">AI coach</DialogTitle>
        <CoachPanel
          chat={chat}
          subchapterId={focus?.subchapterId}
          questionId={focus?.questionId}
          selectedOptionId={focus?.selectedOptionId}
          answerCorrect={focus?.answerCorrect}
          contextLabel={focus?.label}
          suggestions={suggestions}
          className="h-[min(40rem,85svh)]"
        />
      </DialogContent>
    </Dialog>
  );
}
