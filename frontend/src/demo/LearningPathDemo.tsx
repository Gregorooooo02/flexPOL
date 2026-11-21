import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
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
import { Button, buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useJourneySession } from '@/journey/journeySessionContext';
import { finalTestPath, lessonPath, resolveLearningLink } from '@/journey/learningLinks';
import type { LearningCompletion } from '@/journey/types';
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
  withAlpha,
} from './learningPath';
import type { LearningNode, LearningPath, NodeStatus } from './learningPath';
import { DemoToolbar } from './DemoToolbar';
import type { DemoBanner } from './DemoToolbar';
import { LessonPage } from './LessonModal';

type ActiveView =
  | { readonly kind: 'path' }
  | { readonly kind: 'lesson'; readonly nodeId: string };

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
const FIRST_NODE_Y_STACKED = 144;
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

function createInitialBanner(path: LearningPath): DemoBanner {
  const first = path.flatNodes[0]?.node;
  return {
    tone: 'neutral',
    message: first
      ? `Start with ${first.code} “${first.title}”. Progress lasts for this session, until refresh or logout.`
      : 'The learning path is empty.',
  };
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
  const { state, dispatch } = useJourneySession();
  const [banner, setBanner] = useState<DemoBanner | null>(() =>
    path.flatNodes.some(({ node }) => Object.hasOwn(state.learning.completions, node.id))
      ? { tone: 'neutral', message: 'Your completed modules are still marked for this session. Choose a module to continue; refresh or logout resets this progress.' }
      : createInitialBanner(path));
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const completedSet = useMemo(() => new Set(path.flatNodes
    .filter(({ node }) => Object.hasOwn(state.learning.completions, node.id))
    .map(({ node }) => node.id)), [path, state.learning.completions]);
  const link = resolveLearningLink(search, path, completedSet);
  const prerequisiteEntry = link.kind === 'locked' ? link.prerequisite : null;
  const activeView: ActiveView = link.kind === 'lesson'
    ? { kind: 'lesson', nodeId: link.entry.node.id } : { kind: 'path' };
  const resumeEntry = state.learning.resumeNodeId ? findNodeById(path, state.learning.resumeNodeId) : null;
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

  // Only metadata survives leaving the route, never question/answer/attempt UI state.
  const openedNodeId = activeView.kind === 'lesson' ? activeView.nodeId : null;
  useEffect(() => {
    if (openedNodeId) dispatch({ type: 'resume-learning', nodeId: openedNodeId });
  }, [openedNodeId, dispatch]);

  const chapterId = link.kind === 'chapter' ? link.topic.id : null;
  useLayoutEffect(() => {
    if (chapterId) document.getElementById(`path-${chapterId}`)?.scrollIntoView({ block: 'start' });
  }, [chapterId, location.key]);

  // Browser history/search navigation must cancel a pending animated node transition.
  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, [location.key]);

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

  const desktopStageWidth = Math.min(DESKTOP_STAGE_MAX_W, Math.max(0, pathTrackWidth - 32));

  const firstUnfinishedTopic = useMemo(
    () => getFirstUnfinishedTopic(path.topics, completedSet),
    [path, completedSet],
  );

  const goToView = useCallback((nextView: ActiveView) => {
    setBurstNodeId(null);
    setShakeNodeId(null);
    if (nextView.kind === 'path') {
      navigate('/learning');
    } else {
      const entry = findNodeById(path, nextView.nodeId);
      if (!entry) return;
      navigate(entry.node.kind === 'lesson' ? lessonPath(entry.node.code) : finalTestPath(Number(entry.topic.seriesNumber)));
    }
    window.scrollTo({ top: 0 });
  }, [navigate, path]);

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
        setBanner({
          tone: 'locked',
          message: prevEntry
            ? `Module ${node.code} is locked. Complete ${prevEntry.node.code} (${prevEntry.topic.title}) first.`
            : `Module ${node.code} is locked.`,
        });
        return;
      }
      triggerNavBurst(node.id, { kind: 'lesson', nodeId: node.id });
    },
    [path, completedSet, triggerLockedShake, triggerNavBurst],
  );

  const handleCompleteLesson = useCallback(
    (nodeId: string, provenance: LearningCompletion['provenance']) => {
      const entry = findNodeById(path, nodeId);
      if (!entry) return;
      dispatch({ type: 'complete-learning', completions: [{ nodeId, provenance }] });
      const nextSet = new Set([...completedSet, nodeId]);
      const nextStep = getNextNodeAfter(path, nodeId);
      setBanner({
        tone: 'gold',
        message: provenance === 'demo'
          ? `Demo shortcut: module ${entry.node.code} unlocked as completed, not recorded as a passed lesson or test.`
          : isTopicCompleted(entry.topic, nextSet)
          ? `Chapter ${entry.topic.title} completed.${nextStep ? ` Module ${nextStep.node.code} is next.` : ''}`
          : `Completed: ${entry.node.code}.${nextStep ? ` Module ${nextStep.node.code} is next.` : ''}`,
      });
    },
    [path, dispatch, completedSet],
  );

  const handleCompleteCurrentTopic = useCallback(() => {
    const target = getFirstUnfinishedTopic(path.topics, completedSet);
    if (!target) return;
    dispatch({ type: 'complete-learning', completions: target.nodes.map((node) => ({ nodeId: node.id, provenance: 'demo' })) });
    setBanner({ tone: 'gold', message: `Demo shortcut: ${target.title} unlocked as completed. This is not evidence of passing its lessons or test.` });
  }, [path, completedSet, dispatch]);

  const handleReset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setBurstNodeId(null);
    setShakeNodeId(null);
    navigate('/learning', { replace: true });
    dispatch({ type: 'reset-learning' });
    setBanner(createInitialBanner(path));
  }, [path, dispatch, navigate]);

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
      className="relative flex h-[calc(100svh-var(--app-header-height))] min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DemoToolbar
        completedCount={completedSet.size}
        totalCount={path.flatNodes.length}
        firstUnfinishedTopicTitle={firstUnfinishedTopic?.title ?? null}
        banner={banner}
        onCompleteCurrentTopic={handleCompleteCurrentTopic}
        onReset={handleReset}
        onDismissBanner={() => setBanner(null)}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={pathTrackRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-24"
          role="region"
          aria-label="Learning path"
          tabIndex={isDesktop ? 0 : undefined}
        >
          {(link.kind === 'invalid' || link.kind === 'locked') && (
            <Alert role="status" className="mx-auto my-4 max-w-3xl">
              <AlertTitle>{link.kind === 'locked' ? 'Complete the prerequisite first' : 'Learning link unavailable'}</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-2">
                <p>{link.message}</p>
                {prerequisiteEntry && (
                  <Button variant="outline" size="sm" onClick={() => handleOpenNode(prerequisiteEntry.node)}>
                    Open {prerequisiteEntry.node.code}: {prerequisiteEntry.node.title}
                  </Button>
                )}
                <Link to="/learning" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Show the learning path</Link>
              </AlertDescription>
            </Alert>
          )}
          {link.kind === 'path' && resumeEntry && getNodeStatus(path, resumeEntry.node.id, completedSet) !== 'locked' && (
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-4">
              <Button variant="outline" size="sm" onClick={() => handleOpenNode(resumeEntry.node)}>Reopen {resumeEntry.node.code}: {resumeEntry.node.title}</Button>
              <span className="text-xs text-muted-foreground">Lesson view restarts; completed modules stay marked for this session.</span>
            </div>
          )}
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
                id={`path-${topic.id}`}
                aria-labelledby={`topic-heading-${topic.id}`}
                className="relative bg-background px-4 py-0 lg:flex lg:w-full lg:flex-none lg:flex-col lg:px-4 lg:py-0"
              >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="fx-orb-drift absolute -top-16 left-1/2 h-[28rem] w-[38rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl dark:opacity-20"
                    style={{
                      background: `radial-gradient(circle, ${topic.pipeColor} 0%, transparent 70%)`,
                    }}
                  />
                  <div
                    className="fx-orb-drift absolute bottom-8 left-1/4 h-[22rem] w-[28rem] rounded-full opacity-20 blur-3xl dark:opacity-15"
                    style={{
                      background: `radial-gradient(circle, ${topic.accentHex} 0%, transparent 70%)`,
                      animationDelay: '-8s',
                    }}
                  />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
                  <div className="pointer-events-none sticky top-4 z-20 flex h-0 w-full justify-start">
                    <div className="pointer-events-auto h-fit w-fit max-w-[18rem] border border-border bg-card/92 px-3.5 py-2.5 shadow-sm backdrop-blur-md transition-all sm:max-w-xs">
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
                            className="truncate font-heading text-base font-semibold tracking-tight text-foreground"
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
                      <p className="mt-1 truncate text-xs text-muted-foreground">{topic.metaLabel}</p>
                      <Progress
                        value={progressPct}
                        aria-label={`${topic.title} progress`}
                        className="mt-2 [&_[data-slot=progress-track]]:h-1"
                        style={{ '--primary': topic.accentHex } as Record<string, string>}
                      />
                    </div>
                  </div>

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
                          <li key={node.id}>
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
                                  'relative flex size-[86px] items-center justify-center rounded-full p-2 transition-transform',
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
                                    'relative z-10 size-full overflow-hidden rounded-full border-0 shadow-none transition-transform active:scale-90',
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
