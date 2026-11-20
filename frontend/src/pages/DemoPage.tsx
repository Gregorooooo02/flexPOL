import { CoachFocusProvider } from '@/components/coach/CoachFocusProvider';
import { CoachPanelPreview } from '@/demo/CoachPanelPreview';
import { LearningPathDemo } from '@/demo/LearningPathDemo';

export function DemoPage() {
  return (
    // Lets the coach know which lesson and question the learner is on
    <CoachFocusProvider>
      <LearningPathDemo />
      {/* Temporary: lets us try the AI coach until it is placed in the lesson screens */}
      <CoachPanelPreview />
    </CoachFocusProvider>
  );
}
