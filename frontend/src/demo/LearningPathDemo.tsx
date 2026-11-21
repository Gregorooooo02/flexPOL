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
  BookOpen01Icon,
  Coins01Icon,
  Flag02Icon,
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
  isTopicCompleted,
} from './learningPath';
import type { LearningNode, LearningPath, NodeStatus } from './learningPath';
import { DemoToolbar } from './DemoToolbar';
import { LessonPage } from './LessonModal';

type ActiveView =
  | { readonly kind: 'path' }
  | { readonly kind: 'lesson'; readonly nodeId: string };

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
  /** The chapter's last node (its final test), where the pipe to the next chapter starts. */
  readonly lastSlot: NodeLayoutSlot;
  /** pipeSegments[i] runs from node i to node i + 1. */
  readonly pipeSegments: readonly string[];
}

const STAGE_W = 340;
const DESKTOP_STAGE_MAX_W = 768;
const NODE_SPACING = 140;
const FIRST_NODE_Y = 64;
const STAGE_BOTTOM_PADDING = 66;
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
): NodeLayoutSlot {
  const cy = FIRST_NODE_Y + index * NODE_SPACING;
  if (isDesktop) {
    const centerX = stageWidth / 2;
    const leftX = stageWidth * 0.2;
    const rightX = stageWidth * 0.8;
    const labelWidth = stageWidth * 0.46;
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
): StageLayout {
  const width = isDesktop ? desktopStageWidth : STAGE_W;
  const nodeSlots = Array.from({ length: nodeCount }, (_, index) =>
    slotAt(index, index === nodeCount - 1, isDesktop, width),
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
  const [pathTrackWidth, setPathTrackWidth] = useState(DESKTOP_STAGE_MAX_W + 32);
  const [burstNodeId, setBurstNodeId] = useState<string | null>(null);
  const [shakeNodeId, setShakeNodeId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pathTrackRef = useRef<HTMLDivElement>(null);
  const wrongAnswerCount = useRef(0);
  const getNextWrongAnswerIndex = useCallback(() => wrongAnswerCount.current++, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useLayoutEffect(() => {
    if (!isDesktop || activeView.kind !== 'path') {
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
  }, [activeView.kind, isDesktop]);

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
      return (
        <LessonPage
          key={entry.node.id}
          node={entry.node}
          topic={entry.topic}
          isCompleted={completedSet.has(entry.node.id)}
          isTopicCompleted={isTopicCompleted(entry.topic, completedSet)}
          nextNodeSummary={nextEntry ? `${nextEntry.node.code} (${nextEntry.node.title})` : null}
          getNextWrongAnswerIndex={getNextWrongAnswerIndex}
          onComplete={handleCompleteLesson}
          onBack={() => goToView({ kind: 'path' })}
        />
      );
    }
  }

  return (
    <div
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
          className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain"
          role="region"
          aria-label="Learning path"
          tabIndex={isDesktop ? 0 : undefined}
        >
          {path.topics.map((topic, topicIndex) => {
            const {
              width: stageWidth,
              height: stageHeight,
              nodeSlots,
              lastSlot,
              pipeSegments,
            } = buildStageLayout(topic.nodes.length, isDesktop, desktopStageWidth);
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

            return (
              <section
                key={topic.id}
                aria-labelledby={`topic-heading-${topic.id}`}
                className={cn(
                  'border-b border-border px-4 py-8 lg:flex lg:w-full lg:flex-none lg:flex-col lg:px-4 lg:py-8',
                  topic.bandClassName,
                )}
                style={{
                  backgroundImage: topic.ambientGlow,
                  backgroundSize: isDesktop ? '100% 100%' : undefined,
                  backgroundRepeat: isDesktop ? 'no-repeat' : undefined,
                }}
              >
                <div className="mx-auto flex w-full max-w-md flex-col items-center lg:max-w-3xl">
                  <Card
                    size="sm"
                    className="w-full border border-border bg-card/85 py-3.5 backdrop-blur-xs"
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
                    className="relative mt-2 shrink-0 lg:mt-12"
                    style={{ width: `${stageWidth}px`, height: `${stageHeight}px` }}
                  >
                    <svg
                      className="pointer-events-none absolute inset-0 size-full"
                      viewBox={`0 0 ${stageWidth} ${stageHeight}`}
                      aria-hidden="true"
                    >
                      {topicIndex > 0 && (
                        <>
                          <line
                            x1={isDesktop ? desktopStageWidth / 2 : CENTER_X}
                            y1={0}
                            x2={isDesktop ? desktopStageWidth / 2 : CENTER_X}
                            y2={FIRST_NODE_Y}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {entryPipeColored && (
                            <line
                              x1={isDesktop ? desktopStageWidth / 2 : CENTER_X}
                              y1={0}
                              x2={isDesktop ? desktopStageWidth / 2 : CENTER_X}
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

                      {nextTopic && (
                        <>
                          <line
                            x1={lastSlot.cx}
                            y1={lastSlot.cy}
                            x2={lastSlot.cx}
                            y2={stageHeight}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {exitPipeColored && (
                            <line
                              x1={lastSlot.cx}
                              y1={lastSlot.cy}
                              x2={lastSlot.cx}
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
