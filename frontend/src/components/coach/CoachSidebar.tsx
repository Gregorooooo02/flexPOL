import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { usePanelRef } from 'react-resizable-panels';
import { cn } from 'cn';
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
import { CoachLauncher } from './CoachLauncher';
import { useCoachFocus } from './coachFocus';
import type { CoachFocus } from './coachFocus';
import { useCoachChat } from './useCoachChat';

const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
const COACH_SIDEBAR_ID = 'coach-sidebar';

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
  const launcherRef = useRef<HTMLButtonElement>(null);
  const transitionTimeout = useRef<number | undefined>(undefined);
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches);
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
    animatePanelChange(() => sidebarRef.current?.expand());
  }

  function closeSidebar() {
    animatePanelChange(() => sidebarRef.current?.collapse());
    window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleMediaChange = () => {
      setDesktop(mediaQuery.matches);
      setMobileChat((current) => ({ ...current, open: false }));
      if (!mediaQuery.matches) {
        sidebarRef.current?.collapse();
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
    <div className="group/coach relative flex min-h-0 flex-1 flex-col">
      <ResizablePanelGroup
        orientation="horizontal"
        onLayoutChange={(layout) => setSidebarOpen(layout[COACH_SIDEBAR_ID] > 0)}
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
          id={COACH_SIDEBAR_ID}
          defaultSize="0%"
          minSize="20rem"
          maxSize="45%"
          collapsedSize="0%"
          collapsible
          panelRef={sidebarRef}
          className="min-w-0"
        >
          <CoachChatSession
            key={focusScopeId}
            focus={focus}
            sidebarOpen={sidebarOpen}
            mobileChatOpen={mobileChatOpen}
            launcherRef={launcherRef}
            onMobileChatOpenChange={(open) => setMobileChat({ focusScopeId, open })}
            onCloseSidebar={closeSidebar}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <CoachLauncher
        buttonRef={launcherRef}
        desktop={desktop}
        chatOpen={desktop ? sidebarOpen : mobileChatOpen}
        onOpen={() => {
          if (desktop) openSidebar();
          else setMobileChat({ focusScopeId, open: true });
        }}
      />
    </div>
  );
}

interface CoachChatSessionProps {
  readonly focus: CoachFocus | null;
  readonly sidebarOpen: boolean;
  readonly mobileChatOpen: boolean;
  readonly launcherRef: RefObject<HTMLButtonElement | null>;
  readonly onMobileChatOpenChange: (open: boolean) => void;
  readonly onCloseSidebar: () => void;
}

function CoachChatSession({
  focus,
  sidebarOpen,
  mobileChatOpen,
  launcherRef,
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
          'h-full min-h-0 p-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          sidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0',
        )}
      >
        <CoachPanel {...panelProps} onClose={onCloseSidebar} className="h-full min-h-0" />
      </aside>
      <Dialog open={mobileChatOpen} onOpenChange={onMobileChatOpenChange}>
        <DialogContent
          className="h-[min(40rem,85svh)] p-0 lg:hidden"
          finalFocus={launcherRef}
          showCloseButton={false}
        >
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
