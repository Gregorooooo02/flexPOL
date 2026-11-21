import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePanelRef } from 'react-resizable-panels';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { CoachPanel } from './CoachPanel';
import { useCoachFocus } from './coachFocus';
import type { CoachFocus } from './coachFocus';
import { hedgieImage } from './hedgie';
import { useCoachChat } from './useCoachChat';

const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
/** Width of the Hedgie sidebar the first time it opens; capped by the panel's maxSize (45%). */
const SIDEBAR_DEFAULT_WIDTH = '32rem';

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

interface CoachSidebarProps {
  readonly children: ReactNode;
}

export function CoachSidebar({ children }: CoachSidebarProps) {
  const focus = useCoachFocus();
  const focusScopeId = focus?.scopeId ?? 'general';
  const sidebarRef = usePanelRef();
  const transitionTimeout = useRef<number | undefined>(undefined);
  const hasOpenedSidebar = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState({ focusScopeId, open: false });
  const [isTransitioning, setIsTransitioning] = useState(false);
  if (mobileChat.focusScopeId !== focusScopeId) {
    setMobileChat({ focusScopeId, open: false });
  }
  const mobileChatOpen = mobileChat.focusScopeId === focusScopeId && mobileChat.open;

  function animatePanelChange(action: () => void) {
    if (transitionTimeout.current !== undefined) {
      window.clearTimeout(transitionTimeout.current);
    }

    setIsTransitioning(true);
    action();
    transitionTimeout.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionTimeout.current = undefined;
    }, 320);
  }

  function openSidebar() {
    setSidebarOpen(true);
    animatePanelChange(() => {
      // The first open uses the default width; later opens restore the width the learner left it at.
      if (hasOpenedSidebar.current) {
        sidebarRef.current?.expand();
      } else {
        hasOpenedSidebar.current = true;
        sidebarRef.current?.resize(SIDEBAR_DEFAULT_WIDTH);
      }
    });
  }

  function closeSidebar() {
    setSidebarOpen(false);
    animatePanelChange(() => sidebarRef.current?.collapse());
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleMediaChange = () => {
      setMobileChat((current) => ({ ...current, open: false }));
      if (!mediaQuery.matches) {
        sidebarRef.current?.collapse();
        setSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [sidebarRef]);

  useEffect(
    () => () => {
      if (transitionTimeout.current !== undefined) {
        window.clearTimeout(transitionTimeout.current);
      }
    },
    [],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ResizablePanelGroup
        orientation="horizontal"
        className={cn('min-h-0 flex-1', isTransitioning && 'fx-coach-sidebar-transition')}
      >
        <ResizablePanel defaultSize="100%" minSize="40%" className="min-w-0">
          <main className="relative flex h-full min-h-0 flex-col">{children}</main>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          disabled={!sidebarOpen}
          aria-label="Resize Hedgie chat"
          className={cn(
            'transition-opacity duration-200',
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
        <ResizablePanel
          id="coach-sidebar"
          defaultSize="0%"
          minSize="20rem"
          maxSize="45%"
          collapsedSize="0%"
          collapsible
          panelRef={sidebarRef}
          onResize={(size) => setSidebarOpen(size.asPercentage > 0)}
          className="min-w-0"
        >
          <CoachChatSession
            key={focusScopeId}
            focus={focus}
            sidebarOpen={sidebarOpen}
            mobileChatOpen={mobileChatOpen}
            onMobileChatOpenChange={(open) => setMobileChat({ focusScopeId, open })}
            onCloseSidebar={closeSidebar}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Button
        type="button"
        className="fixed right-4 bottom-4 z-40 shadow-md lg:hidden"
        onClick={() => setMobileChat({ focusScopeId, open: true })}
        aria-haspopup="dialog"
      >
        <img src={hedgieImage('greeting')} alt="" data-icon="inline-start" className="-my-1 size-6" />
        Ask Hedgie
      </Button>
      {!sidebarOpen && (
        <Button
          type="button"
          className="fixed right-4 bottom-4 z-40 hidden shadow-md lg:inline-flex"
          onClick={openSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="coach-sidebar"
        >
          <img src={hedgieImage('greeting')} alt="" data-icon="inline-start" className="-my-1 size-6" />
          Ask Hedgie
        </Button>
      )}
    </div>
  );
}

interface CoachChatSessionProps {
  readonly focus: CoachFocus | null;
  readonly sidebarOpen: boolean;
  readonly mobileChatOpen: boolean;
  readonly onMobileChatOpenChange: (open: boolean) => void;
  readonly onCloseSidebar: () => void;
}

function CoachChatSession({
  focus,
  sidebarOpen,
  mobileChatOpen,
  onMobileChatOpenChange,
  onCloseSidebar,
}: CoachChatSessionProps) {
  const chat = useCoachChat();
  const suggestions =
    focus?.questionId !== undefined ? QUESTION_SUGGESTIONS : focus ? LESSON_SUGGESTIONS : undefined;
  const panelProps = {
    chat,
    subchapterId: focus?.subchapterId,
    questionId: focus?.questionId,
    selectedOptionId: focus?.selectedOptionId,
    answerCorrect: focus?.answerCorrect,
    contextLabel: focus?.label,
    suggestions,
  };

  return (
    <>
      <aside
        aria-label="Ask Hedgie learning coach"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        className={cn(
          'h-full min-h-0 bg-card p-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          sidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0',
        )}
      >
        <CoachPanel {...panelProps} onClose={onCloseSidebar}
          className="h-full min-h-0 shadow-none ring-0"
        />
      </aside>
      <Dialog open={mobileChatOpen} onOpenChange={onMobileChatOpenChange}>
        <DialogContent className="h-[min(40rem,85svh)] p-0 lg:hidden" showCloseButton={false}>
          <DialogTitle className="sr-only">AI coach</DialogTitle>
          <CoachPanel
            {...panelProps}
            onClose={() => onMobileChatOpenChange(false)}
            className="h-full min-h-0"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
