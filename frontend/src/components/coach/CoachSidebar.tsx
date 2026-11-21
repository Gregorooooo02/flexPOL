import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { usePanelRef } from 'react-resizable-panels';
import { useLocation } from 'react-router';
import { cn } from 'cn';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { CoachPanel } from './CoachPanel';
import { CoachLauncher } from './CoachLauncher';
import { useCoachAskChannel, useCoachFocus } from './coachFocus';
import type { CoachFocus } from './coachFocus';
import { moodForReply } from './hedgie';
import { useCoachChat } from './useCoachChat';
import type { CoachMessageContext } from './useCoachChat';

const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
/** Width of the Hedgie sidebar the first time it opens; capped by the panel's maxSize (45%). */
const SIDEBAR_DEFAULT_WIDTH = '32rem';
const COACH_SIDEBAR_ID = 'coach-sidebar';

const QUESTION_SUGGESTIONS = [
  'Help me with this question',
  'What is this question asking?',
  'Can you give me a hint?',
] as const;

const SCENARIO_PLANNING_SUGGESTIONS = [
  'What does this goal need from my plan?',
  'How should I prepare for the money needs?',
  'What are the risks in my current plan?',
] as const;

const SCENARIO_RESULT_SUGGESTIONS = [
  'Give me feedback on my plan and this result',
  'Why did I get this rating?',
  'What could I try next time?',
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
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const transitionTimeout = useRef<number | undefined>(undefined);
  const hasOpenedSidebar = useRef(false);
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
    animatePanelChange(() => sidebarRef.current?.collapse());
    window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }

  // A new route starts at the top. The content panel around <main> is what scrolls, and it
  // would otherwise keep the previous page's position (e.g. a scenario opened from far down the list).
  useLayoutEffect(() => {
    mainRef.current?.parentElement?.scrollTo({ top: 0 });
  }, [pathname]);

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

  // When a screen asks Hedgie something (useAskCoach, e.g. feedback on a run), show the chat from that
  // click; CoachChatSession sends the message. Re-registered after every render so it sees current state.
  const { registerShowChat } = useCoachAskChannel();
  useEffect(() => {
    registerShowChat(() => {
      if (desktop) {
        if (!sidebarOpen) openSidebar();
      } else {
        setMobileChat({ focusScopeId, open: true });
      }
    });
    return () => registerShowChat(null);
  });

  return (
    // group/coach: a page with a sticky footer marked data-coach-footer lifts the floating launcher above it.
    <div className="group/coach relative flex min-h-0 flex-1 flex-col">
      <ResizablePanelGroup
        orientation="horizontal"
        onLayoutChange={(layout) => setSidebarOpen(layout[COACH_SIDEBAR_ID] > 0)}
        className={cn('min-h-0 flex-1', isTransitioning && 'fx-coach-sidebar-transition')}
      >
        <ResizablePanel defaultSize="100%" minSize="40%" className="min-w-0">
          <main ref={mainRef} className="relative flex h-full min-h-0 flex-col">
            {children}
          </main>
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
        docked={!desktop && focus?.dockLauncher === true}
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
    focus?.scenarioId !== undefined
      ? focus.scenarioRun
        ? SCENARIO_RESULT_SUGGESTIONS
        : SCENARIO_PLANNING_SUGGESTIONS
      : focus?.questionId !== undefined
        ? QUESTION_SUGGESTIONS
        : focus
          ? LESSON_SUGGESTIONS
          : undefined;
  const context: CoachMessageContext = {
    subchapterId: focus?.subchapterId,
    questionId: focus?.questionId,
    selectedOptionId: focus?.selectedOptionId,
    assignments: focus?.assignments,
    number: focus?.number,
    scenarioId: focus?.scenarioId,
    allocations: focus?.allocations,
    scenarioRun: focus?.scenarioRun,
  };
  const panelProps = {
    chat,
    ...context,
    answerCorrect: focus?.answerCorrect,
    scenarioStars: focus?.scenarioStars,
    contextLabel: focus?.label,
    suggestions,
  };

  // Send what a screen asked for (useAskCoach) once no reply is pending, with the current focus as context.
  const { pending: ask, done: askDone } = useCoachAskChannel();
  const sentAskId = useRef<number | null>(null);
  const sendAsk = useEffectEvent((id: number, text: string) => {
    sentAskId.current = id;
    chat.send(
      text,
      context,
      moodForReply({ questionId: focus?.questionId, answerCorrect: focus?.answerCorrect, scenarioStars: focus?.scenarioStars }),
    );
    askDone(id);
  });
  useEffect(() => {
    if (ask && !chat.pending && sentAskId.current !== ask.id) sendAsk(ask.id, ask.text);
  }, [ask, chat.pending]);

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
      <Drawer open={mobileChatOpen} onOpenChange={onMobileChatOpenChange} showSwipeHandle>
        <DrawerContent className="h-[85svh] lg:hidden" finalFocus={launcherRef}>
          <DrawerTitle className="sr-only">AI coach</DrawerTitle>
          <CoachPanel
            {...panelProps}
            onClose={() => onMobileChatOpenChange(false)}
            className="min-h-0 flex-1 rounded-none shadow-none ring-0"
          />
        </DrawerContent>
      </Drawer>
    </>
  );
}
