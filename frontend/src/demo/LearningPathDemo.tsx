import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Activity01Icon,
  AlarmClockIcon,
  Analytics01Icon,
  Award01Icon,
  BadgePercentIcon,
  BalanceScaleIcon,
  BankIcon,
  BarChartIcon,
  BookOpen01Icon,
  Coins01Icon,
  Compass01Icon,
  Fire02Icon,
  Flag02Icon,
  GroupLayersIcon,
  Home01Icon,
  HourglassIcon,
  Layers01Icon,
  MoneySafeIcon,
  PiggyBankIcon,
  Plant01Icon,
  RefreshIcon,
  Route01Icon,
  SquareLock02Icon,
  Target02Icon,
  Tick02Icon,
  TrophyIcon,
  UmbrellaDollarIcon,
} from '@hugeicons/core-free-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from 'cn';
import { getChapters } from '@/api';
import { useAuth } from '@/auth/authContext';
import { ApiError } from '@/config/axios';
import {
  buildLearningPath,
  findNodeById,
  getFirstUnfinishedTopic,
  getNextNodeAfter,
  getNodeStatus,
  getPreviousNodeBefore,
  getTopicCompletedCount,
  isTopicCompleted,
  withAlpha,
} from './learningPath';
import type { LearningNode, LearningPath, NodeStatus } from './learningPath';
import {
  getLearningProgressStorageKey,
  readStoredLearningProgress,
  writeStoredLearningProgress,
} from './learningProgress';
import { DemoToolbar } from './DemoToolbar';
import type { DemoBanner } from './DemoToolbar';
import { LessonPage } from './LessonModal';
import { CapstoneLesson } from '@/capstone/CapstoneLesson';

type ActiveView =
  | { readonly kind: 'path' }
  | { readonly kind: 'lesson'; readonly nodeId: string };

interface DemoProgressState {
  readonly completedList: readonly string[];
  readonly banner: DemoBanner | null;
}

type ProgressAction =
  | { readonly type: 'completeLesson'; readonly path: LearningPath; readonly nodeId: string }
  | { readonly type: 'completeTopic'; readonly path: LearningPath }
  | { readonly type: 'reset'; readonly path: LearningPath }
  | { readonly type: 'setBanner'; readonly banner: DemoBanner }
  | { readonly type: 'dismissBanner' };

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly path: LearningPath };

interface NodeLayoutSlot {
  readonly cx: number;
  readonly cy: number;
  readonly labelSide: 'left' | 'right' | 'center';
  readonly labelLeft: number;
  readonly labelTop: number;
  readonly labelWidth: number;
}

interface StageLayout {
  readonly width: number;
  readonly height: number;
  readonly nodeSlots: readonly NodeLayoutSlot[];
  /** The chapter's last node (its final test), where the pipe to the next chapter starts. */
  readonly lastSlot: NodeLayoutSlot;
  /** pipeSegments[i] runs from node i to node i + 1. */
  readonly pipeSegments: readonly string[];
}

const STAGE_W = 340;
const DESKTOP_STAGE_MAX_W = 768;
const NODE_SPACING = 140;
const FIRST_NODE_Y_SIDE = 76;
const FIRST_NODE_Y_STACKED = 116;
const STAGE_BOTTOM_PADDING = 76;
const CENTER_X = 170;
const LEFT_X = 68;
const RIGHT_X = 272;
const PIPE_CORNER = 24;
const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';

/** The path zig-zags: first and last node in the centre, the nodes between alternate left and right. */
function slotAt(
  index: number,
  isLast: boolean,
  isDesktop: boolean,
  stageWidth: number,
  firstNodeY: number,
): NodeLayoutSlot {
  const cy = firstNodeY + index * NODE_SPACING;
  if (isDesktop) {
    const centerX = stageWidth / 2;
    const leftX = stageWidth * 0.28;
    const rightX = stageWidth * 0.72;
    const labelWidth = stageWidth * 0.34;
    if (index === 0 || isLast) {
      return {
        cx: centerX,
        cy,
        labelSide: 'right',
        labelLeft: centerX + 54,
        labelTop: cy - 34,
        labelWidth: stageWidth - centerX - 70,
      };
    }
    if (index % 2 === 1) {
      return {
        cx: leftX,
        cy,
        labelSide: 'right',
        labelLeft: leftX + 56,
        labelTop: cy - 34,
        labelWidth,
      };
    }
    return {
      cx: rightX,
      cy,
      labelSide: 'left',
      labelLeft: rightX - 56 - labelWidth,
      labelTop: cy - 34,
      labelWidth,
    };
  }

  const labelTop = cy - 34;
  if (index === 0 || isLast) {
    return { cx: CENTER_X, cy, labelSide: 'right', labelLeft: 224, labelTop, labelWidth: 112 };
  }
  if (index % 2 === 1) {
    return { cx: LEFT_X, cy, labelSide: 'right', labelLeft: 124, labelTop, labelWidth: 204 };
  }
  return { cx: RIGHT_X, cy, labelSide: 'left', labelLeft: 12, labelTop, labelWidth: 204 };
}

function pipeBetween(from: NodeLayoutSlot, to: NodeLayoutSlot): string {
  if (from.cx === to.cx) {
    return `M ${from.cx} ${from.cy} L ${to.cx} ${to.cy}`;
  }
  if (from.cy === to.cy) {
    return `M ${from.cx} ${from.cy} L ${to.cx} ${to.cy}`;
  }
  const midY = (from.cy + to.cy) / 2;
  const dir = to.cx > from.cx ? 1 : -1;
  return [
    `M ${from.cx} ${from.cy}`,
    `L ${from.cx} ${midY - PIPE_CORNER}`,
    `Q ${from.cx} ${midY} ${from.cx + dir * PIPE_CORNER} ${midY}`,
    `L ${to.cx - dir * PIPE_CORNER} ${midY}`,
    `Q ${to.cx} ${midY} ${to.cx} ${midY + PIPE_CORNER}`,
    `L ${to.cx} ${to.cy}`,
  ].join(' ');
}

function buildStageLayout(
  nodeCount: number,
  isDesktop: boolean,
  desktopStageWidth: number,
  firstNodeY: number,
): StageLayout {
  const width = isDesktop ? desktopStageWidth : STAGE_W;
  const nodeSlots = Array.from({ length: nodeCount }, (_, index) =>
    slotAt(index, index === nodeCount - 1, isDesktop, width, firstNodeY),
  );
  const lastSlot = nodeSlots[nodeSlots.length - 1];
  const pipeSegments = nodeSlots
    .slice(0, -1)
    .map((slot, index) => pipeBetween(slot, nodeSlots[index + 1]));

  return {
    width,
    height: lastSlot.cy + STAGE_BOTTOM_PADDING,
    nodeSlots,
    lastSlot,
    pipeSegments,
  };
}

function createInitialProgress(
  path: LearningPath,
  completedList: readonly string[] = [],
  warningMessage: string | null = null,
): DemoProgressState {
  const first = path.flatNodes[0]?.node;
  const completedSet = new Set(completedList);
  const nextEntry = path.flatNodes.find(({ node }) => !completedSet.has(node.id));
  const banner: BannerState = warningMessage
    ? { tone: 'locked', message: warningMessage }
    : nextEntry
      ? completedList.length > 0
        ? {
            tone: 'gold',
            message: `Welcome back. Continue with module ${nextEntry.node.code}, “${nextEntry.node.title}”.`,
          }
        : {
            tone: 'neutral',
            message: first
              ? `Start with ${first.code} “${first.title}”.`
              : 'The learning path is empty.',
          }
      : {
          tone: 'gold',
          message: path.flatNodes.length > 0 ? 'All chapters completed.' : 'The learning path is empty.',
        };

  return {
    completedList: [...completedList],
    banner,
  };
}

function progressReducer(state: DemoProgressState, action: ProgressAction): DemoProgressState {
  switch (action.type) {
    case 'completeLesson': {
      if (state.completedList.includes(action.nodeId)) {
        return state;
      }
      const nextList = [...state.completedList, action.nodeId];
      const nextSet = new Set(nextList);
      const entry = findNodeById(action.path, action.nodeId);
      if (!entry) {
        return { ...state, completedList: nextList };
      }
      const topicDone = isTopicCompleted(entry.topic, nextSet);
      const nextStep = getNextNodeAfter(action.path, action.nodeId);

      let nextBanner = state.banner;
      if (topicDone) {
        nextBanner = {
          tone: 'gold',
          message: nextStep
            ? `Chapter ${entry.topic.title} completed. The path has moved on to module ${nextStep.node.code}.`
            : 'All chapters completed.',
        };
      } else if (nextStep) {
        nextBanner = {
          tone: 'gold',
          message: `Completed: ${entry.node.code}. The path has moved on to module ${nextStep.node.code}.`,
        };
      }
      return { completedList: nextList, banner: nextBanner };
    }
    case 'completeTopic': {
      const currentSet = new Set(state.completedList);
      const target = getFirstUnfinishedTopic(action.path.topics, currentSet);
      if (!target) {
        return state;
      }
      const nextSet = new Set(state.completedList);
      for (const node of target.nodes) {
        nextSet.add(node.id);
      }
      const lastNode = target.nodes[target.nodes.length - 1];
      const nextStep = getNextNodeAfter(action.path, lastNode.id);

      return {
        completedList: Array.from(nextSet),
        banner: {
          tone: 'gold',
          message: nextStep
            ? `Chapter ${target.title} completed. Module ${nextStep.node.code} is next.`
            : 'All chapters completed.',
        },
      };
    }
    case 'reset':
      return createInitialProgress(action.path);
    case 'setBanner':
      return { ...state, banner: action.banner };
    case 'dismissBanner':
      return { ...state, banner: null };
  }
}

type NodeIcon = typeof BookOpen01Icon;

const LESSON_ICONS_BY_CODE: Readonly<Record<string, NodeIcon>> = {
  '1.1': Analytics01Icon,
  '1.2': Target02Icon,
  '1.3': HourglassIcon,
  '1.4': Activity01Icon,
  '1.5': Layers01Icon,
  '2.1': PiggyBankIcon,
  '2.2': BankIcon,
  '2.3': BarChartIcon,
  '2.4': GroupLayersIcon,
  '2.5': BadgePercentIcon,
  '2.6': Fire02Icon,
  '2.7': BalanceScaleIcon,
  '3.1': Route01Icon,
  '3.2': Plant01Icon,
  '3.3': Home01Icon,
  '3.4': UmbrellaDollarIcon,
  '3.5': AlarmClockIcon,
  '3.6': MoneySafeIcon,
  '3.7': Compass01Icon,
};

function getNodeIcon(node: LearningNode): NodeIcon {
  if (node.kind === 'capstone') return Compass01Icon;
  if (node.kind === 'checkpoint') {
    if (node.code.startsWith('2.')) return Award01Icon;
    if (node.code.startsWith('3.')) return TrophyIcon;
    return Flag02Icon;
  }
  return LESSON_ICONS_BY_CODE[node.code] ?? BookOpen01Icon;
}

function renderNodeIcon(node: LearningNode, status: NodeStatus) {
  return (
    <HugeiconsIcon
      icon={getNodeIcon(node)}
      className={cn('size-6', status === 'locked' && 'opacity-55')}
      strokeWidth={2.2}
    />
  );
}

/** Loads the chapters from the backend, then shows the learning path built from them. */
export function LearningPathDemo() {
  const { user } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getChapters(controller.signal)
      .then((chapters) => {
        setLoadState({ status: 'ready', path: buildLearningPath(chapters) });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadState({
          status: 'error',
          message: error instanceof ApiError ? error.message : 'Unknown error.',
        });
      });
    return () => controller.abort();
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setLoadState({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  if (loadState.status === 'ready' && loadState.path.topics.length > 0) {
    return user ? (
      <LearningPathView key={user.email} path={loadState.path} userEmail={user.email} />
    ) : null;
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      <Card size="sm" className="w-full max-w-md border border-border bg-card py-5" role="status" aria-live="polite">
        <CardHeader className="items-center px-5 text-center">
          <CardTitle className="normal-case tracking-normal">
            {loadState.status === 'loading'
              ? 'Loading the learning path…'
              : loadState.status === 'error'
                ? "Couldn't load the learning path"
                : 'The learning path is empty'}
          </CardTitle>
          {loadState.status === 'error' && (
            <CardDescription className="text-xs">
              {loadState.message} Check that the backend is running on port 8080.
            </CardDescription>
          )}
        </CardHeader>
        {loadState.status !== 'loading' && (
          <CardContent className="flex justify-center px-5 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              Try again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function LearningPathView({
  path,
  userEmail,
}: {
  readonly path: LearningPath;
  readonly userEmail: string;
}) {
  const storageKey = getLearningProgressStorageKey(userEmail);
  const [{ completedList, banner }, dispatch] = useReducer(
    progressReducer,
    { path, storageKey },
    ({ path: initialPath, storageKey: initialStorageKey }) => {
      const savedProgress = readStoredLearningProgress(
        initialStorageKey,
        initialPath.flatNodes.map(({ node }) => node.id),
      );
      return createInitialProgress(
        initialPath,
        savedProgress.completedNodeIds,
        savedProgress.warningMessage,
      );
    },
  );
  const [activeView, setActiveView] = useState<ActiveView>({ kind: 'path' });
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
  );
  const [pathTrackWidth, setPathTrackWidth] = useState(DESKTOP_STAGE_MAX_W + 32);
  const [burstNodeId, setBurstNodeId] = useState<string | null>(null);
  const [shakeNodeId, setShakeNodeId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pathTrackRef = useRef<HTMLDivElement>(null);
  const wrongAnswerCount = useRef(0);
  const getNextWrongAnswerIndex = useCallback(() => wrongAnswerCount.current++, []);

  useEffect(() => {
    if (!writeStoredLearningProgress(storageKey, completedList)) {
      dispatch({
        type: 'setBanner',
        banner: {
          tone: 'locked',
          message: 'Your learning progress could not be saved in this browser. It may be lost when you leave.',
        },
      });
    }
  }, [completedList, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useLayoutEffect(() => {
    if (activeView.kind !== 'path') {
      return;
    }

    const pathTrack = pathTrackRef.current;
    if (!pathTrack) {
      return;
    }

    const updateWidth = () => setPathTrackWidth(pathTrack.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(pathTrack);
    return () => observer.disconnect();
  }, [activeView.kind]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const completedSet = useMemo(() => new Set(completedList), [completedList]);
  const desktopStageWidth = Math.min(DESKTOP_STAGE_MAX_W, Math.max(0, pathTrackWidth - 32));

  const firstUnfinishedTopic = useMemo(
    () => getFirstUnfinishedTopic(path.topics, completedSet),
    [path, completedSet],
  );

  const goToView = useCallback((nextView: ActiveView) => {
    setBurstNodeId(null);
    setShakeNodeId(null);
    setActiveView(nextView);
    window.scrollTo({ top: 0 });
  }, []);

  const triggerNavBurst = useCallback(
    (effectId: string, nextView: ActiveView) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setBurstNodeId(effectId);
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const delay = reducedMotion ? 40 : 250;
      timerRef.current = window.setTimeout(() => {
        goToView(nextView);
      }, delay);
    },
    [goToView],
  );

  const triggerLockedShake = useCallback((effectId: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setShakeNodeId(effectId);
    timerRef.current = window.setTimeout(() => {
      setShakeNodeId(null);
    }, 340);
  }, []);

  const handleOpenNode = useCallback(
    (node: LearningNode) => {
      const status = getNodeStatus(path, node.id, completedSet);
      if (status === 'locked') {
        const prevEntry = getPreviousNodeBefore(path, node.id);
        triggerLockedShake(node.id);
        dispatch({
          type: 'setBanner',
          banner: {
            tone: 'locked',
            message: prevEntry
              ? `Module ${node.code} is locked. Complete ${prevEntry.node.code} (${prevEntry.topic.title}) first.`
              : `Module ${node.code} is locked.`,
          },
        });
        return;
      }
      triggerNavBurst(node.id, { kind: 'lesson', nodeId: node.id });
    },
    [path, completedSet, triggerLockedShake, triggerNavBurst],
  );

  const handleCompleteLesson = useCallback(
    (nodeId: string) => {
      dispatch({ type: 'completeLesson', path, nodeId });
    },
    [path],
  );

  const handleCompleteCurrentTopic = useCallback(() => {
    dispatch({ type: 'completeTopic', path });
  }, [path]);

  const handleReset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setBurstNodeId(null);
    setShakeNodeId(null);
    setActiveView({ kind: 'path' });
    dispatch({ type: 'reset', path });
  }, [path]);

  if (activeView.kind === 'lesson') {
    const entry = findNodeById(path, activeView.nodeId);
    if (entry) {
      const nextEntry = getNextNodeAfter(path, entry.node.id);
      if (entry.node.kind === 'capstone') {
        return (
          <CapstoneLesson
            isCompleted={completedSet.has(entry.node.id)}
            onComplete={() => handleCompleteLesson(entry.node.id)}
            onBack={() => goToView({ kind: 'path' })}
          />
        );
      }
      return (
        <LessonPage
          key={entry.node.id}
          node={entry.node}
          topic={entry.topic}
          isCompleted={completedSet.has(entry.node.id)}
          nextNodeKind={nextEntry?.node.kind ?? null}
          getNextWrongAnswerIndex={getNextWrongAnswerIndex}
          onComplete={handleCompleteLesson}
          onNext={nextEntry ? () => goToView({ kind: 'lesson', nodeId: nextEntry.node.id }) : null}
          onBack={() => goToView({ kind: 'path' })}
        />
      );
    }
  }

  return (
    <div
      className="relative flex h-[calc(100svh-var(--app-header-height))] min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DemoToolbar
        completedCount={completedList.length}
        totalCount={path.flatNodes.length}
        firstUnfinishedTopicTitle={firstUnfinishedTopic?.title ?? null}
        banner={banner}
        onCompleteCurrentTopic={handleCompleteCurrentTopic}
        onReset={handleReset}
        onDismissBanner={() => dispatch({ type: 'dismissBanner' })}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={pathTrackRef}
          className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain pb-32"
          role="region"
          aria-label="Learning path"
          tabIndex={isDesktop ? 0 : undefined}
        >
          {path.topics.map((topic, topicIndex) => {
            const firstNodeY =
              isDesktop && pathTrackWidth >= 680 ? FIRST_NODE_Y_SIDE : FIRST_NODE_Y_STACKED;
            const {
              width: stageWidth,
              height: stageHeight,
              nodeSlots,
              lastSlot,
              pipeSegments,
            } = buildStageLayout(topic.nodes.length, isDesktop, desktopStageWidth, firstNodeY);
            const doneCount = getTopicCompletedCount(topic, completedSet);
            const topicCompleted = isTopicCompleted(topic, completedSet);
            const progressPct = Math.round((doneCount / topic.nodes.length) * 100);
            const firstNodeStatus = getNodeStatus(path, topic.nodes[0].id, completedSet);
            const entryPipeColored = topicIndex > 0 && firstNodeStatus !== 'locked';
            const nextTopic = path.topics[topicIndex + 1];
            const exitPipeColored =
              Boolean(nextTopic) &&
              topicCompleted &&
              getNodeStatus(path, nextTopic.nodes[0].id, completedSet) !== 'locked';
            const centerLineX = isDesktop ? desktopStageWidth / 2 : CENTER_X;

            return (
              <section
                key={topic.id}
                aria-labelledby={`topic-heading-${topic.id}`}
                className={cn(
                  'relative border-b border-border px-4 py-0 lg:flex lg:w-full lg:flex-none lg:flex-col lg:px-4 lg:py-0',
                  topic.bandClassName,
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={{
                    backgroundImage: `radial-gradient(ellipse 70% 42% at 50% 50%, ${withAlpha(topic.pipeColor, 18)}, transparent 75%)`,
                  }}
                />

                <div className="pointer-events-none absolute inset-x-3 inset-y-3 z-20 lg:inset-x-4 lg:inset-y-4">
                  <div className="pointer-events-auto sticky top-3 w-fit max-w-[calc(100%-1.5rem)] border border-border bg-card px-3 py-2 shadow-sm lg:top-4 lg:w-64 lg:bg-card/95 lg:px-3.5 lg:py-2.5 lg:backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge
                          className="shrink-0 px-2 py-0.5 text-xs font-bold text-[#07090a]"
                          style={{ backgroundColor: topic.accentHex }}
                        >
                          {topic.seriesNumber}
                        </Badge>
                        <h2
                          id={`topic-heading-${topic.id}`}
                          className="font-heading text-base leading-snug font-semibold tracking-tight text-foreground"
                        >
                          {topic.title}
                        </h2>
                      </div>
                      <span
                        className="shrink-0 font-heading text-xs font-semibold tabular-nums"
                        style={{ color: topic.accentTextHex }}
                      >
                        {doneCount}/{topic.nodes.length}
                      </span>
                    </div>
                    <p className="mt-1 hidden truncate text-xs text-muted-foreground lg:block">{topic.metaLabel}</p>
                    <Progress
                      value={progressPct}
                      aria-label={`${topic.title} progress`}
                      className="mt-1.5 lg:mt-2 [&_[data-slot=progress-track]]:h-1"
                      style={{ '--primary': topic.accentHex } as Record<string, string>}
                    />
                  </div>
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">

                  <div
                    className="relative z-10 shrink-0"
                    style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
                  >
                    <svg
                      className="pointer-events-none absolute inset-0 size-full overflow-visible"
                      viewBox={`0 0 ${stageWidth} ${stageHeight}`}
                      aria-hidden="true"
                    >
                      {topicIndex > 0 && (
                        <>
                          <line
                            x1={centerLineX}
                            y1={-2}
                            x2={centerLineX}
                            y2={firstNodeY}
                            stroke="var(--border)"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {entryPipeColored && (
                            <line
                              x1={centerLineX}
                              y1={-2}
                              x2={centerLineX}
                              y2={firstNodeY}
                              pathLength={100}
                              stroke={topic.pipeColor}
                              strokeWidth="12"
                              strokeLinecap="round"
                              className="fx-pipe-fill"
                              style={{ filter: `drop-shadow(0 0 6px ${withAlpha(topic.pipeColor, 40)})` }}
                            />
                          )}
                        </>
                      )}

                      {pipeSegments.map((pathD, index) => {
                        const isSegmentColored = completedSet.has(topic.nodes[index].id);
                        return (
                          <g key={topic.nodes[index].id}>
                            <path
                              d={pathD}
                              fill="none"
                              stroke="var(--border)"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {isSegmentColored && (
                              <path
                                d={pathD}
                                fill="none"
                                pathLength={100}
                                stroke={topic.pipeColor}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="fx-pipe-fill"
                                style={{ filter: `drop-shadow(0 0 6px ${withAlpha(topic.pipeColor, 40)})` }}
                              />
                            )}
                          </g>
                        );
                      })}

                      {nextTopic && (
                        <>
                          <line
                            x1={lastSlot.cx}
                            y1={lastSlot.cy}
                            x2={lastSlot.cx}
                            y2={stageHeight + 2}
                            stroke="var(--border)"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {exitPipeColored && (
                            <line
                              x1={lastSlot.cx}
                              y1={lastSlot.cy}
                              x2={lastSlot.cx}
                              y2={stageHeight + 2}
                              pathLength={100}
                              stroke={topic.pipeColor}
                              strokeWidth="12"
                              strokeLinecap="round"
                              className="fx-pipe-fill"
                              style={{ filter: `drop-shadow(0 0 6px ${withAlpha(topic.pipeColor, 40)})` }}
                            />
                          )}
                        </>
                      )}
                    </svg>

                    <ol className="relative m-0 size-full list-none p-0" role="list">
                      {topic.nodes.map((node, index) => {
                        const slot = nodeSlots[index];
                        const status = getNodeStatus(path, node.id, completedSet);
                        const isBursting = burstNodeId === node.id;
                        const isShaking = shakeNodeId === node.id;

                        const statusText =
                          status === 'completed'
                            ? 'Completed'
                            : status === 'active'
                              ? 'Available'
                              : 'Locked';

                        const ringColor =
                          status === 'completed'
                            ? topic.pipeColor
                            : status === 'active'
                              ? topic.accentHex
                              : isShaking
                                ? '#ba4d00'
                                : 'var(--border)';

                        return (
                          <li key={node.id} className="group/node">
                            <div
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${slot.cx}px`, top: `${slot.cy}px` }}
                            >
                              {status === 'active' && (
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute -inset-12 rounded-full opacity-25 blur-2xl"
                                  style={{ backgroundColor: topic.accentHex }}
                                />
                              )}
                              <div
                                className={cn(
                                  'relative flex size-[86px] origin-center items-center justify-center rounded-full p-2 transition-[scale,box-shadow] duration-[350ms] ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none',
                                  status !== 'locked' &&
                                    'group-hover/node:scale-110 group-hover/node:shadow-[0_0_0_4px_var(--background),0_0_0_7px_var(--ring),0_0_32px_4px_var(--ring)] has-focus-visible:scale-110',
                                  status === 'locked' && 'group-hover/node:scale-105',
                                  isBursting && 'fx-node-punch',
                                  isShaking && 'fx-shake',
                                )}
                                style={{
                                  backgroundColor: ringColor,
                                  boxShadow:
                                    status === 'active'
                                      ? `0 0 24px -4px ${withAlpha(topic.accentHex, 44)}`
                                      : isBursting
                                        ? `0 0 32px ${topic.accentHex}`
                                        : undefined,
                                }}
                              >
                                {status === 'active' && (
                                  <span
                                    aria-hidden="true"
                                    className="fx-active-beacon pointer-events-none absolute inset-0 rounded-full"
                                    style={{ border: `2px solid ${topic.accentHex}` }}
                                  />
                                )}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={status === 'locked' ? 'secondary' : 'default'}
                                  aria-disabled={status === 'locked' ? 'true' : undefined}
                                  aria-label={`Module ${node.code}: ${node.title} — ${statusText}`}
                                  onClick={() => handleOpenNode(node)}
                                  className={cn(
                                    'relative z-10 size-full cursor-pointer overflow-hidden rounded-full border-0 shadow-none transition-transform active:scale-90',
                                    isBursting && 'fx-sheen',
                                    status === 'completed' && 'bg-card hover:bg-secondary',
                                    status === 'active' && 'bg-background hover:bg-card',
                                    status === 'locked' &&
                                      'cursor-not-allowed bg-secondary text-muted-foreground hover:bg-secondary',
                                  )}
                                  style={
                                    status !== 'locked' ? { color: topic.accentTextHex } : undefined
                                  }
                                >
                                  {renderNodeIcon(node, status)}
                                </Button>

                                {status === 'completed' && (
                                  <Badge
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -bottom-2.5 left-1/2 z-20 size-6 -translate-x-1/2 justify-center rounded-full border-2 border-background text-[#07090a]"
                                    style={{ backgroundColor: topic.pipeColor }}
                                  >
                                    <HugeiconsIcon
                                      icon={Tick02Icon}
                                      className="size-3.5!"
                                      strokeWidth={2.6}
                                    />
                                  </Badge>
                                )}
                                {status === 'active' && (
                                  <Badge
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -bottom-2.5 left-1/2 z-20 size-6 -translate-x-1/2 justify-center rounded-full border-2 border-background text-[#07090a]"
                                    style={{ backgroundColor: topic.accentHex }}
                                  >
                                    <HugeiconsIcon
                                      icon={Coins01Icon}
                                      className="size-3.5!"
                                      strokeWidth={2.4}
                                    />
                                  </Badge>
                                )}
                                {status === 'locked' && (
                                  <Badge
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -bottom-2.5 left-1/2 z-20 size-6 -translate-x-1/2 justify-center rounded-full border-2 border-background bg-secondary text-muted-foreground"
                                  >
                                    <HugeiconsIcon
                                      icon={SquareLock02Icon}
                                      className="size-3.5!"
                                      strokeWidth={2.2}
                                    />
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div
                              className={cn(
                                'absolute flex flex-col gap-0.5 transition-[translate] duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none',
                                slot.labelSide === 'center'
                                  ? 'items-center text-center'
                                  : slot.labelSide === 'left'
                                    ? 'items-end text-right'
                                    : 'items-start text-left',
                                status !== 'locked' &&
                                  (slot.labelSide === 'left'
                                    ? 'group-hover/node:-translate-x-1.5'
                                    : slot.labelSide === 'center'
                                      ? 'group-hover/node:-translate-y-1.5'
                                      : 'group-hover/node:translate-x-1.5'),
                              )}
                              style={{
                                left: `${slot.labelLeft}px`,
                                top: `${slot.labelTop}px`,
                                width: `${slot.labelWidth}px`,
                              }}
                            >
                              <span
                                className={cn(
                                  'font-heading text-sm font-bold tabular-nums',
                                  status === 'locked' && 'text-muted-foreground',
                                )}
                                style={
                                  status !== 'locked' ? { color: topic.accentTextHex } : undefined
                                }
                              >
                                {node.code}
                              </span>
                              <Button
                                type="button"
                                variant="link"
                                aria-disabled={status === 'locked' ? 'true' : undefined}
                                onClick={() => handleOpenNode(node)}
                                className={cn(
                                  'h-auto p-0 text-sm leading-snug font-normal tracking-normal whitespace-normal normal-case underline underline-offset-4 transition-[scale,color] duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-none active:scale-95',
                                  slot.labelSide === 'left'
                                    ? 'text-right'
                                    : slot.labelSide === 'center'
                                      ? 'text-center'
                                      : 'text-left',
                                  status === 'locked'
                                    ? 'cursor-not-allowed text-muted-foreground no-underline hover:no-underline'
                                    : 'cursor-pointer text-foreground group-hover/node:font-semibold group-hover/node:text-primary group-hover/node:decoration-2',
                                )}
                              >
                                {node.title}
                              </Button>
                            </div>
                          </li>
                        );
                      })}

                    </ol>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
