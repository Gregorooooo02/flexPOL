import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen01Icon,
  Coins01Icon,
  Flag02Icon,
  FlaskConicalIcon,
  LockIcon,
  RefreshIcon,
  Tick02Icon,
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
import { ApiError } from '@/config/axios';
import {
  buildLearningPath,
  findNodeById,
  getFirstUnfinishedTopic,
  getNextNodeAfter,
  getNodeStatus,
  getPreviousNodeBefore,
  getTopicCompletedCount,
  isTopicSandboxUnlocked,
} from './learningPath';
import type { LearningNode, LearningPath, NodeStatus, TopicDefinition } from './learningPath';
import { DemoToolbar } from './DemoToolbar';
import { LessonPage } from './LessonModal';
import { SandboxPage } from './SandboxModal';

type ActiveView =
  | { readonly kind: 'path' }
  | { readonly kind: 'lesson'; readonly nodeId: string }
  | { readonly kind: 'sandbox'; readonly topicId: string };

interface BannerState {
  readonly tone: 'neutral' | 'gold' | 'locked';
  readonly message: string;
}

interface DemoProgressState {
  readonly completedList: readonly string[];
  readonly banner: BannerState;
}

type ProgressAction =
  | { readonly type: 'completeLesson'; readonly path: LearningPath; readonly nodeId: string }
  | { readonly type: 'completeTopic'; readonly path: LearningPath }
  | { readonly type: 'reset'; readonly path: LearningPath }
  | { readonly type: 'setBanner'; readonly banner: BannerState };

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
  readonly sandboxSlot: NodeLayoutSlot;
  /** pipeSegments[i] runs from node i to node i + 1, the last one to the sandbox. */
  readonly pipeSegments: readonly string[];
}

const STAGE_W = 340;
const NODE_SPACING = 140;
const FIRST_NODE_Y = 64;
const STAGE_BOTTOM_PADDING = 66;
const CENTER_X = 170;
const LEFT_X = 68;
const RIGHT_X = 272;
const PIPE_CORNER = 24;
const DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
const DESKTOP_FIRST_NODE_X = 96;
const DESKTOP_NODE_SPACING = 220;
const DESKTOP_TOP_NODE_Y = 64;
const DESKTOP_BOTTOM_NODE_Y = 264;
const DESKTOP_TOP_LABEL_TOP = 120;
const DESKTOP_BOTTOM_LABEL_TOP = 142;
const DESKTOP_LABEL_WIDTH = 180;
const DESKTOP_STAGE_RIGHT_PADDING = 96;
const DESKTOP_STAGE_HEIGHT = 330;

/** The path zig-zags: first node and sandbox in the centre, the nodes between alternate left and right. */
function slotAt(index: number, isSandbox: boolean, isDesktop: boolean): NodeLayoutSlot {
  if (isDesktop) {
    const cx = DESKTOP_FIRST_NODE_X + index * DESKTOP_NODE_SPACING;
    const isTopRow = index % 2 === 0;
    return {
      cx,
      cy: isTopRow ? DESKTOP_TOP_NODE_Y : DESKTOP_BOTTOM_NODE_Y,
      labelSide: 'center',
      labelLeft: cx - DESKTOP_LABEL_WIDTH / 2,
      labelTop: isTopRow ? DESKTOP_TOP_LABEL_TOP : DESKTOP_BOTTOM_LABEL_TOP,
      labelWidth: DESKTOP_LABEL_WIDTH,
    };
  }

  const cy = FIRST_NODE_Y + index * NODE_SPACING;
  const labelTop = cy - 34;
  if (index === 0 || isSandbox) {
    return { cx: CENTER_X, cy, labelSide: 'right', labelLeft: 224, labelTop, labelWidth: 112 };
  }
  if (index % 2 === 1) {
    return { cx: LEFT_X, cy, labelSide: 'right', labelLeft: 124, labelTop, labelWidth: 204 };
  }
  return { cx: RIGHT_X, cy, labelSide: 'left', labelLeft: 12, labelTop, labelWidth: 204 };
}

function pipeBetween(from: NodeLayoutSlot, to: NodeLayoutSlot, isDesktop: boolean): string {
  if (isDesktop) {
    const midX = (from.cx + to.cx) / 2;
    const verticalDirection = to.cy > from.cy ? 1 : -1;
    return [
      `M ${from.cx} ${from.cy}`,
      `L ${midX - PIPE_CORNER} ${from.cy}`,
      `Q ${midX} ${from.cy} ${midX} ${from.cy + verticalDirection * PIPE_CORNER}`,
      `L ${midX} ${to.cy - verticalDirection * PIPE_CORNER}`,
      `Q ${midX} ${to.cy} ${midX + PIPE_CORNER} ${to.cy}`,
      `L ${to.cx} ${to.cy}`,
    ].join(' ');
  }
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

function buildStageLayout(nodeCount: number, isDesktop: boolean): StageLayout {
  const nodeSlots = Array.from({ length: nodeCount }, (_, index) =>
    slotAt(index, false, isDesktop),
  );
  const sandboxSlot = slotAt(nodeCount, true, isDesktop);
  const pipeSegments = nodeSlots.map((slot, index) =>
    pipeBetween(slot, nodeSlots[index + 1] ?? sandboxSlot, isDesktop),
  );
  if (isDesktop) {
    return {
      width: sandboxSlot.cx + DESKTOP_STAGE_RIGHT_PADDING,
      height: DESKTOP_STAGE_HEIGHT,
      nodeSlots,
      sandboxSlot,
      pipeSegments,
    };
  }

  return {
    width: STAGE_W,
    height: sandboxSlot.cy + STAGE_BOTTOM_PADDING,
    nodeSlots,
    sandboxSlot,
    pipeSegments,
  };
}

function createInitialProgress(path: LearningPath): DemoProgressState {
  const first = path.flatNodes[0]?.node;
  return {
    completedList: [],
    banner: {
      tone: 'neutral',
      message: first
        ? `Start with module ${first.code}, “${first.title}”. Click the circle or the title to open the lesson.`
        : 'The learning path is empty.',
    },
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
      const topicDone = isTopicSandboxUnlocked(entry.topic, nextSet);
      const nextStep = getNextNodeAfter(action.path, action.nodeId);

      let nextBanner = state.banner;
      if (topicDone) {
        nextBanner = {
          tone: 'gold',
          message: nextStep
            ? `Chapter ${entry.topic.title} completed. The “${entry.topic.sandboxShortLabel}” sandbox is open.`
            : `All chapters completed. The “${entry.topic.sandboxShortLabel}” sandbox is open.`,
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
            ? `Chapter ${target.title} completed. The “${target.sandboxShortLabel}” sandbox is open, and module ${nextStep.node.code} is next.`
            : 'All chapters and sandboxes are unlocked.',
        },
      };
    }
    case 'reset':
      return createInitialProgress(action.path);
    case 'setBanner':
      return { ...state, banner: action.banner };
  }
}

function renderNodeIcon(node: LearningNode, status: NodeStatus) {
  if (status === 'completed') {
    return <HugeiconsIcon icon={Tick02Icon} className="size-7" strokeWidth={2.5} />;
  }
  if (status === 'locked') {
    return <HugeiconsIcon icon={LockIcon} className="size-5" strokeWidth={2} />;
  }
  if (node.kind === 'checkpoint') {
    return <HugeiconsIcon icon={Flag02Icon} className="size-6" strokeWidth={2.2} />;
  }
  return <HugeiconsIcon icon={BookOpen01Icon} className="size-6" strokeWidth={2.2} />;
}

/** Loads the chapters from the backend, then shows the learning path built from them. */
export function LearningPathDemo() {
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
    return <LearningPathView path={loadState.path} />;
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

function LearningPathView({ path }: { readonly path: LearningPath }) {
  const [{ completedList, banner }, dispatch] = useReducer(
    progressReducer,
    path,
    createInitialProgress,
  );
  const [activeView, setActiveView] = useState<ActiveView>({ kind: 'path' });
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
  );
  const [burstNodeId, setBurstNodeId] = useState<string | null>(null);
  const [shakeNodeId, setShakeNodeId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pathPageRef = useRef<HTMLDivElement>(null);
  const pathTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isDesktop || activeView.kind !== 'path') {
      return;
    }

    const pathPage = pathPageRef.current;
    const pathTrack = pathTrackRef.current;
    if (!pathPage || !pathTrack) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }
      event.preventDefault();
      const verticalDelta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 40
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * pathTrack.clientWidth
            : event.deltaY;
      pathTrack.scrollLeft += verticalDelta;
    };

    pathPage.addEventListener('wheel', handleWheel, { passive: false });
    return () => pathPage.removeEventListener('wheel', handleWheel);
  }, [activeView.kind, isDesktop]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const completedSet = useMemo(() => new Set(completedList), [completedList]);

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

  const handleOpenSandbox = useCallback(
    (topic: TopicDefinition) => {
      const effectId = `sandbox-${topic.id}`;
      if (!isTopicSandboxUnlocked(topic, completedSet)) {
        triggerLockedShake(effectId);
        dispatch({
          type: 'setBanner',
          banner: {
            tone: 'locked',
            message: `The “${topic.sandboxShortLabel}” sandbox opens once you complete ${topic.nodes[topic.nodes.length - 1].code}.`,
          },
        });
        return;
      }
      triggerNavBurst(effectId, { kind: 'sandbox', topicId: topic.id });
    },
    [completedSet, triggerLockedShake, triggerNavBurst],
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
      return (
        <LessonPage
          key={entry.node.id}
          node={entry.node}
          topic={entry.topic}
          isCompleted={completedSet.has(entry.node.id)}
          isTopicSandboxUnlocked={isTopicSandboxUnlocked(entry.topic, completedSet)}
          nextNodeSummary={nextEntry ? `${nextEntry.node.code} (${nextEntry.node.title})` : null}
          onComplete={handleCompleteLesson}
          onBack={() => goToView({ kind: 'path' })}
          onOpenSandbox={() => goToView({ kind: 'sandbox', topicId: entry.topic.id })}
        />
      );
    }
  }

  if (activeView.kind === 'sandbox') {
    const topic = path.topics.find((t) => t.id === activeView.topicId);
    if (topic) {
      return <SandboxPage topic={topic} onBack={() => goToView({ kind: 'path' })} />;
    }
  }

  return (
    <div
      ref={pathPageRef}
      className="flex flex-1 flex-col lg:h-[calc(100svh-var(--app-header-height))] lg:min-h-0"
    >
      <DemoToolbar
        completedCount={completedList.length}
        totalCount={path.flatNodes.length}
        firstUnfinishedTopicTitle={firstUnfinishedTopic?.title ?? null}
        onCompleteCurrentTopic={handleCompleteCurrentTopic}
        onReset={handleReset}
      />

      <div className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
        <div className="border-b border-border bg-card/60 px-4 py-3 lg:shrink-0">
          <div className="mx-auto max-w-md lg:max-w-7xl lg:px-8">
            <Card
              size="sm"
              className={cn(
                'border py-2.5 transition-colors',
                banner.tone === 'gold'
                  ? 'border-[#e17101] bg-[#973b00]/20'
                  : banner.tone === 'locked'
                    ? 'border-[#ba4d00] bg-[#973b00]/15'
                    : 'border-border bg-card',
              )}
              role="status"
              aria-live="polite"
            >
              <CardContent className="px-3.5 text-xs leading-relaxed text-foreground/90">
                {banner.message}
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          ref={pathTrackRef}
          className="flex flex-col lg:min-h-[calc(100svh-var(--app-header-height)-8rem)] lg:flex-1 lg:flex-row lg:items-stretch lg:overflow-x-auto lg:overflow-y-hidden lg:overscroll-x-contain"
          role="region"
          aria-label="Learning path"
          tabIndex={isDesktop ? 0 : undefined}
        >
          {path.topics.map((topic, topicIndex) => {
            const {
              width: stageWidth,
              height: stageHeight,
              nodeSlots,
              sandboxSlot,
              pipeSegments,
            } = buildStageLayout(topic.nodes.length, isDesktop);
            const doneCount = getTopicCompletedCount(topic, completedSet);
            const sandboxUnlocked = isTopicSandboxUnlocked(topic, completedSet);
            const progressPct = Math.round((doneCount / topic.nodes.length) * 100);
            const firstNodeStatus = getNodeStatus(path, topic.nodes[0].id, completedSet);
            const entryPipeColored = topicIndex > 0 && firstNodeStatus !== 'locked';
            const nextTopic = path.topics[topicIndex + 1];
            const exitPipeColored =
              Boolean(nextTopic) &&
              sandboxUnlocked &&
              getNodeStatus(path, nextTopic.nodes[0].id, completedSet) !== 'locked';

            const sandboxEffectId = `sandbox-${topic.id}`;
            const isSandboxBursting = burstNodeId === sandboxEffectId;
            const isSandboxShaking = shakeNodeId === sandboxEffectId;

            return (
              <section
                key={topic.id}
                aria-labelledby={`topic-heading-${topic.id}`}
                className={cn(
                  'border-b border-border px-4 py-8 lg:flex lg:h-full lg:min-h-[calc(100svh-var(--app-header-height)-8rem)] lg:flex-none lg:flex-col lg:border-r lg:border-b-0 lg:px-8 lg:py-4',
                  topic.bandClassName,
                )}
                style={{
                  backgroundImage: topic.ambientGlow,
                  backgroundSize: isDesktop ? '100% 100%' : undefined,
                  backgroundRepeat: isDesktop ? 'no-repeat' : undefined,
                  width: isDesktop ? `max(100vw, ${stageWidth + 65}px)` : undefined,
                }}
              >
                <div className="mx-auto flex w-full max-w-md flex-col items-center lg:mx-0 lg:max-w-none lg:items-center">
                  <Card
                    size="sm"
                    className="w-full border border-border bg-card/85 py-3.5 backdrop-blur-xs lg:sticky lg:left-8 lg:self-start lg:max-w-[calc(100vw_-_4rem)]"
                  >
                    <CardHeader className="min-w-0 px-4">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Badge
                            className="px-2 py-0.5 text-[#07090a]"
                            style={{ backgroundColor: topic.accentHex }}
                          >
                            {topic.seriesNumber}
                          </Badge>
                          <CardTitle
                            id={`topic-heading-${topic.id}`}
                            className="min-w-0 break-words"
                          >
                            {topic.title}
                          </CardTitle>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border border-border px-2 py-0.5 tabular-nums"
                          style={{ color: topic.accentHex }}
                        >
                          {doneCount}/{topic.nodes.length}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{topic.metaLabel}</CardDescription>
                      <Progress
                        value={progressPct}
                        aria-label={`${topic.title} progress`}
                        className="mt-1.5 [&_[data-slot=progress-track]]:h-1.5"
                        style={
                          {
                            '--primary': topic.accentHex,
                          } as Record<string, string>
                        }
                      />
                    </CardHeader>
                  </Card>

                  <div
                    className="relative mt-2 shrink-0 lg:mx-auto lg:mt-16 lg:scale-95"
                    style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
                  >
                    <svg
                      className="pointer-events-none absolute inset-0 size-full"
                      viewBox={`0 0 ${stageWidth} ${stageHeight}`}
                      aria-hidden="true"
                    >
                      {topicIndex > 0 && !isDesktop && (
                        <>
                          <line
                            x1={CENTER_X}
                            y1={0}
                            x2={CENTER_X}
                            y2={FIRST_NODE_Y}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {entryPipeColored && (
                            <line
                              x1={CENTER_X}
                              y1={0}
                              x2={CENTER_X}
                              y2={FIRST_NODE_Y}
                              pathLength={100}
                              stroke={topic.pipeColor}
                              strokeWidth="12"
                              strokeLinecap="round"
                              className="fx-pipe-fill"
                              style={{ filter: `drop-shadow(0 0 6px ${topic.pipeColor}66)` }}
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
                              stroke="#2d3234"
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
                                style={{ filter: `drop-shadow(0 0 6px ${topic.pipeColor}66)` }}
                              />
                            )}
                          </g>
                        );
                      })}

                      {nextTopic && !isDesktop && (
                        <>
                          <line
                            x1={sandboxSlot.cx}
                            y1={sandboxSlot.cy}
                            x2={sandboxSlot.cx}
                            y2={stageHeight}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {exitPipeColored && (
                            <line
                              x1={sandboxSlot.cx}
                              y1={sandboxSlot.cy}
                              x2={sandboxSlot.cx}
                              y2={stageHeight}
                              pathLength={100}
                              stroke={topic.pipeColor}
                              strokeWidth="12"
                              strokeLinecap="round"
                              className="fx-pipe-fill"
                              style={{ filter: `drop-shadow(0 0 6px ${topic.pipeColor}66)` }}
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
                                : '#2d3234';

                        return (
                          <li key={node.id}>
                            <div
                              className="absolute -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${slot.cx}px`, top: `${slot.cy}px` }}
                            >
                              <div
                                className={cn(
                                  'relative flex size-[86px] items-center justify-center rounded-full p-2 transition-transform',
                                  isBursting && 'fx-node-punch',
                                  isShaking && 'fx-shake',
                                )}
                                style={{
                                  backgroundColor: ringColor,
                                  boxShadow:
                                    status === 'active'
                                      ? `0 0 24px -4px ${topic.accentHex}70`
                                      : isBursting
                                        ? `0 0 32px ${topic.accentHex}`
                                        : undefined,
                                }}
                              >
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={status === 'locked' ? 'secondary' : 'default'}
                                  aria-disabled={status === 'locked' ? 'true' : undefined}
                                  aria-label={`Module ${node.code}: ${node.title} — ${statusText}`}
                                  onClick={() => handleOpenNode(node)}
                                  className={cn(
                                    'relative z-10 size-full overflow-hidden rounded-full border-0 shadow-none transition-transform active:scale-90',
                                    isBursting && 'fx-sheen',
                                    status === 'completed' && 'bg-card hover:bg-secondary',
                                    status === 'active' && 'bg-[#07090a] hover:bg-card',
                                    status === 'locked' &&
                                      'cursor-not-allowed bg-[#21292b] text-muted-foreground hover:bg-[#21292b]',
                                  )}
                                  style={
                                    status !== 'locked' ? { color: topic.accentHex } : undefined
                                  }
                                >
                                  {renderNodeIcon(node, status)}
                                </Button>

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
                              </div>
                            </div>

                            <div
                              className={cn(
                                'absolute flex flex-col gap-0.5',
                                slot.labelSide === 'center'
                                  ? 'items-center text-center'
                                  : slot.labelSide === 'left'
                                    ? 'items-end text-right'
                                    : 'items-start text-left',
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
                                  status !== 'locked' ? { color: topic.accentHex } : undefined
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
                                  'h-auto p-0 text-sm leading-snug font-normal tracking-normal whitespace-normal normal-case underline underline-offset-4 transition-transform active:scale-95',
                                  slot.labelSide === 'left'
                                    ? 'text-right'
                                    : slot.labelSide === 'center'
                                      ? 'text-center'
                                      : 'text-left',
                                  status === 'locked'
                                    ? 'cursor-not-allowed text-muted-foreground no-underline hover:no-underline'
                                    : 'text-foreground',
                                )}
                              >
                                {node.title}
                              </Button>
                            </div>
                          </li>
                        );
                      })}

                      <li>
                        <div
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${sandboxSlot.cx}px`, top: `${sandboxSlot.cy}px` }}
                        >
                          <div
                            className={cn(
                              'relative flex size-[86px] items-center justify-center rounded-full p-2 transition-transform',
                              isSandboxBursting && 'fx-node-punch',
                              isSandboxShaking && 'fx-shake',
                            )}
                            style={{
                              backgroundColor: sandboxUnlocked
                                ? topic.accentHex
                                : isSandboxShaking
                                  ? '#ba4d00'
                                  : '#2d3234',
                              boxShadow: sandboxUnlocked
                                ? `0 0 24px -4px ${topic.accentHex}70`
                                : undefined,
                            }}
                          >
                            <Button
                              type="button"
                              size="icon"
                              variant={sandboxUnlocked ? 'default' : 'secondary'}
                              aria-disabled={!sandboxUnlocked ? 'true' : undefined}
                              aria-label={`Sandbox ${topic.title}: ${topic.sandboxTitle} — ${
                                sandboxUnlocked ? 'Open' : 'Locked'
                              }`}
                              onClick={() => handleOpenSandbox(topic)}
                              className={cn(
                                'relative z-10 size-full overflow-hidden rounded-full border-0 text-[#07090a] shadow-none transition-transform active:scale-90',
                                isSandboxBursting && 'fx-sheen',
                                !sandboxUnlocked &&
                                  'cursor-not-allowed bg-[#21292b] text-muted-foreground hover:bg-[#21292b]',
                              )}
                              style={
                                sandboxUnlocked ? { backgroundColor: topic.accentHex } : undefined
                              }
                            >
                              {sandboxUnlocked ? (
                                <HugeiconsIcon
                                  icon={FlaskConicalIcon}
                                  className="size-7"
                                  strokeWidth={2.2}
                                />
                              ) : (
                                <HugeiconsIcon
                                  icon={LockIcon}
                                  className="size-5"
                                  strokeWidth={2}
                                />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'absolute flex flex-col gap-0.5',
                            sandboxSlot.labelSide === 'center'
                              ? 'items-center text-center'
                              : 'items-start text-left',
                          )}
                          style={{
                            left: `${sandboxSlot.labelLeft}px`,
                            top: `${sandboxSlot.labelTop}px`,
                            width: `${sandboxSlot.labelWidth}px`,
                          }}
                        >
                          <span
                            className={cn(
                              'font-heading text-xs font-bold tracking-wider uppercase',
                              !sandboxUnlocked && 'text-muted-foreground',
                            )}
                            style={sandboxUnlocked ? { color: topic.accentHex } : undefined}
                          >
                            Sandbox
                          </span>
                          <Button
                            type="button"
                            variant="link"
                            aria-disabled={!sandboxUnlocked ? 'true' : undefined}
                            onClick={() => handleOpenSandbox(topic)}
                            className={cn(
                              'h-auto p-0 text-sm leading-snug font-normal tracking-normal whitespace-normal normal-case underline underline-offset-4 transition-transform active:scale-95',
                              sandboxSlot.labelSide === 'center' ? 'text-center' : 'text-left',
                              sandboxUnlocked
                                ? 'text-foreground'
                                : 'cursor-not-allowed text-muted-foreground no-underline hover:no-underline',
                            )}
                          >
                            {topic.sandboxShortLabel}
                          </Button>
                        </div>
                      </li>
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
