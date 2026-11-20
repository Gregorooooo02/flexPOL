import { HugeiconsIcon } from '@hugeicons/react';
import { AiChat02Icon } from '@hugeicons/core-free-icons';
import { CoachPanel } from '@/components/coach/CoachPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

/**
 * Temporary test harness: a floating button that opens the coach in a dialog.
 * Remove it once CoachPanel is placed in the lesson or sandbox screens.
 */
export function CoachPanelPreview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="fixed right-4 bottom-4 z-30 shadow-md" />}>
        <HugeiconsIcon icon={AiChat02Icon} strokeWidth={2} data-icon="inline-start" />
        Ask Hedgie
      </DialogTrigger>
      <DialogContent className="p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">AI coach</DialogTitle>
        <CoachPanel className="h-[min(40rem,85svh)]" />
      </DialogContent>
    </Dialog>
  );
}
