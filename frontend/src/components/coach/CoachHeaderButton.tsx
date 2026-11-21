import type { RefObject } from 'react';
import { BubbleChatQuestionIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

interface CoachHeaderButtonProps {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly chatOpen: boolean;
  readonly onOpen: () => void;
}

/**
 * Opens the coach drawer from the header below 800px (`coach-sidebar`), where a floating Hedgie would cover page
 * controls. Shaped like a chat bubble (one sharp corner as its tail) so it reads as "chat". It shows a chat icon rather than Hedgie's face, which the logo already uses.
 */
export function CoachHeaderButton({ buttonRef, chatOpen, onOpen }: CoachHeaderButtonProps) {
  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      aria-label="Ask Hedgie"
      title="Ask Hedgie"
      aria-haspopup="dialog"
      aria-expanded={chatOpen}
      onClick={onOpen}
      className={cn(
        'h-10 min-w-10 gap-1.5 rounded-2xl rounded-br-sm border-primary/40 bg-primary/10 px-2.5 normal-case tracking-normal coach-sidebar:hidden',
        'text-sm text-foreground hover:bg-primary/20 aria-expanded:bg-primary/20',
      )}
    >
      <HugeiconsIcon icon={BubbleChatQuestionIcon} strokeWidth={2} className="size-5 text-primary" />
      <span aria-hidden="true" className="hidden sm:inline">Ask</span>
    </Button>
  );
}
