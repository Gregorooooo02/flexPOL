import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen01Icon,
  ChartLineData01Icon,
  Coins01Icon,
  FastForwardIcon,
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
import {
  ALL_NODES_FLAT,
  INITIAL_COMPLETED_IDS,
  TOPICS,
  TOTAL_NODES_COUNT,
  findNodeById,
  getFirstUnfinishedTopic,
  getNextUnlockedNodeAfter,
  getNodeStatus,
  getTopicCompletedCount,
  isTopicSandboxUnlocked,
} from './demoData';
import type { LearningNode, NodeStatus, TopicDefinition } from './demoData';
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
  | { readonly type: 'completeLesson'; readonly nodeId: string }
  | { readonly type: 'completeTopic' }
  | { readonly type: 'reset' }
  | { readonly type: 'setBanner'; readonly banner: BannerState };

interface NodeLayoutSlot {
  readonly cx: number;
  readonly cy: number;
  readonly labelSide: 'left' | 'right';
  readonly labelLeft: number;
  readonly labelTop: number;
  readonly labelWidth: number;
}

const STAGE_W = 340;
const STAGE_H = 690;

const NODE_SLOTS: readonly [NodeLayoutSlot, NodeLayoutSlot, NodeLayoutSlot, NodeLayoutSlot] = [
  { cx: 170, cy: 64, labelSide: 'right', labelLeft: 224, labelTop: 28, labelWidth: 112 },
  { cx: 68, cy: 204, labelSide: 'right', labelLeft: 124, labelTop: 170, labelWidth: 204 },
  { cx: 272, cy: 344, labelSide: 'left', labelLeft: 12, labelTop: 310, labelWidth: 204 },
  { cx: 68, cy: 484, labelSide: 'right', labelLeft: 132, labelTop: 446, labelWidth: 196 },
];

const SANDBOX_SLOT: NodeLayoutSlot = {
  cx: 170,
  cy: 624,
  labelSide: 'right',
  labelLeft: 224,
  labelTop: 590,
  labelWidth: 112,
};

const PIPE_SEGMENTS: readonly [string, string, string, string] = [
  'M 170 64 L 170 110 Q 170 134 146 134 L 92 134 Q 68 134 68 158 L 68 204',
  'M 68 204 L 68 250 Q 68 274 92 274 L 248 274 Q 272 274 272 298 L 272 344',
  'M 272 344 L 272 390 Q 272 414 248 414 L 92 414 Q 68 414 68 438 L 68 484',
  'M 68 484 L 68 530 Q 68 554 92 554 L 146 554 Q 170 554 170 578 L 170 624',
];

const INITIAL_PROGRESS_STATE: DemoProgressState = {
  completedList: INITIAL_COMPLETED_IDS,
  banner: {
    tone: 'neutral',
    message:
      'Moduł 101 zaliczony — linia dotarła do 102. Kliknij kółko albo tytuł, żeby otworzyć lekcję.',
  },
};

function progressReducer(state: DemoProgressState, action: ProgressAction): DemoProgressState {
  switch (action.type) {
    case 'completeLesson': {
      if (state.completedList.includes(action.nodeId)) {
        return state;
      }
      const nextList = [...state.completedList, action.nodeId];
      const nextSet = new Set(nextList);
      const entry = findNodeById(action.nodeId);
      if (!entry) {
        return { ...state, completedList: nextList };
      }
      const topicDone = isTopicSandboxUnlocked(entry.topic, nextSet);
      const nextStep = getNextUnlockedNodeAfter(action.nodeId);

      let nextBanner = state.banner;
      if (topicDone) {
        nextBanner = {
          tone: 'gold',
          message: nextStep
            ? `Dział ${entry.topic.title} zaliczony. Sandbox „${entry.topic.sandboxShortLabel}” otwarty.`
            : `Wszystkie działy zaliczone. Sandbox „${entry.topic.sandboxShortLabel}” otwarty.`,
        };
      } else if (nextStep) {
        nextBanner = {
          tone: 'gold',
          message: `Zaliczone: ${entry.node.code}. Linia przeszła do modułu ${nextStep.node.code}.`,
        };
      }
      return { completedList: nextList, banner: nextBanner };
    }
    case 'completeTopic': {
      const currentSet = new Set(state.completedList);
      const target = getFirstUnfinishedTopic(TOPICS, currentSet);
      if (!target) {
        return state;
      }
      const nextSet = new Set(state.completedList);
      for (const node of target.nodes) {
        nextSet.add(node.id);
      }
      const lastNode = target.nodes[target.nodes.length - 1];
      const nextStep = getNextUnlockedNodeAfter(lastNode.id);

      return {
        completedList: Array.from(nextSet),
        banner: {
          tone: 'gold',
          message: nextStep
            ? `Dział ${target.title} zaliczony. Sandbox „${target.sandboxShortLabel}” otwarty, startuje ${nextStep.node.code}.`
            : 'Wszystkie 3 działy i sandboxy zostały odblokowane.',
        },
      };
    }
    case 'reset':
      return INITIAL_PROGRESS_STATE;
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

export function LearningPathDemo() {
  const [{ completedList, banner }, dispatch] = useReducer(
    progressReducer,
    INITIAL_PROGRESS_STATE,
  );
  const [activeView, setActiveView] = useState<ActiveView>({ kind: 'path' });
  const [burstNodeId, setBurstNodeId] = useState<string | null>(null);
  const [shakeNodeId, setShakeNodeId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const completedSet = useMemo(() => new Set(completedList), [completedList]);

  const firstUnfinishedTopic = useMemo(
    () => getFirstUnfinishedTopic(TOPICS, completedSet),
    [completedSet],
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
      const status = getNodeStatus(node.id, completedSet);
      if (status === 'locked') {
        const nodeIdx = ALL_NODES_FLAT.findIndex((entry) => entry.node.id === node.id);
        const prevEntry = nodeIdx > 0 ? ALL_NODES_FLAT[nodeIdx - 1] : undefined;
        triggerLockedShake(node.id);
        dispatch({
          type: 'setBanner',
          banner: {
            tone: 'locked',
            message: prevEntry
              ? `Moduł ${node.code} jest zablokowany. Najpierw zalicz ${prevEntry.node.code} (${prevEntry.topic.title}).`
              : `Moduł ${node.code} jest zablokowany.`,
          },
        });
        return;
      }
      triggerNavBurst(node.id, { kind: 'lesson', nodeId: node.id });
    },
    [completedSet, triggerLockedShake, triggerNavBurst],
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
            message: `Sandbox „${topic.sandboxShortLabel}” otworzy się po zaliczeniu testu ${topic.nodes[topic.nodes.length - 1].code}.`,
          },
        });
        return;
      }
      triggerNavBurst(effectId, { kind: 'sandbox', topicId: topic.id });
    },
    [completedSet, triggerLockedShake, triggerNavBurst],
  );

  const handleCompleteLesson = useCallback((nodeId: string) => {
    dispatch({ type: 'completeLesson', nodeId });
  }, []);

  const handleCompleteCurrentTopic = useCallback(() => {
    dispatch({ type: 'completeTopic' });
  }, []);

  const handleReset = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setBurstNodeId(null);
    setShakeNodeId(null);
    setActiveView({ kind: 'path' });
    dispatch({ type: 'reset' });
  }, []);

  if (activeView.kind === 'lesson') {
    const entry = findNodeById(activeView.nodeId);
    if (entry) {
      const nextEntry = getNextUnlockedNodeAfter(entry.node.id);
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
    const topic = TOPICS.find((t) => t.id === activeView.topicId);
    if (topic) {
      return <SandboxPage topic={topic} onBack={() => goToView({ kind: 'path' })} />;
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Badge className="gap-1.5 bg-primary px-2.5 py-0.5 text-primary-foreground">
              <HugeiconsIcon icon={ChartLineData01Icon} strokeWidth={2.2} />
              flexPOL
            </Badge>

            <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">
              Postęp kursu
            </h1>

            <Badge
              variant="outline"
              className="gap-1.5 border border-border bg-secondary px-2 py-0.5 tabular-nums"
            >
              <span>
                {completedList.length}/{TOTAL_NODES_COUNT}
              </span>
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ffd22e] text-[#07090a]">
                <HugeiconsIcon icon={Coins01Icon} className="size-3!" strokeWidth={2.4} />
              </span>
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              disabled={!firstUnfinishedTopic}
              onClick={handleCompleteCurrentTopic}
              className="flex-1 transition-transform active:scale-95"
            >
              <HugeiconsIcon icon={FastForwardIcon} strokeWidth={2} />
              {firstUnfinishedTopic ? `Zalicz ${firstUnfinishedTopic.title}` : 'Komplet'}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={handleReset}
              className="transition-transform active:scale-95"
            >
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main>
        <div className="border-b border-border bg-card/60 px-4 py-3">
          <div className="mx-auto max-w-md">
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

        <div className="flex flex-col">
          {TOPICS.map((topic, topicIndex) => {
            const doneCount = getTopicCompletedCount(topic, completedSet);
            const sandboxUnlocked = isTopicSandboxUnlocked(topic, completedSet);
            const progressPct = Math.round((doneCount / topic.nodes.length) * 100);
            const firstNodeStatus = getNodeStatus(topic.nodes[0].id, completedSet);
            const entryPipeColored = topicIndex > 0 && firstNodeStatus !== 'locked';
            const nextTopic = TOPICS[topicIndex + 1];
            const exitPipeColored =
              Boolean(nextTopic) &&
              sandboxUnlocked &&
              getNodeStatus(nextTopic.nodes[0].id, completedSet) !== 'locked';

            const sandboxEffectId = `sandbox-${topic.id}`;
            const isSandboxBursting = burstNodeId === sandboxEffectId;
            const isSandboxShaking = shakeNodeId === sandboxEffectId;

            return (
              <section
                key={topic.id}
                aria-labelledby={`topic-heading-${topic.id}`}
                className={cn('border-b border-border px-4 py-8', topic.bandClassName)}
                style={{ backgroundImage: topic.ambientGlow }}
              >
                <div className="mx-auto flex w-full max-w-md flex-col items-center">
                  <Card
                    size="sm"
                    className="w-full border border-border bg-card/85 py-3.5 backdrop-blur-xs"
                  >
                    <CardHeader className="px-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            className="px-2 py-0.5 text-[#07090a]"
                            style={{ backgroundColor: topic.accentHex }}
                          >
                            {topic.seriesNumber}
                          </Badge>
                          <CardTitle id={`topic-heading-${topic.id}`}>{topic.title}</CardTitle>
                        </div>
                        <Badge
                          variant="outline"
                          className="border border-border px-2 py-0.5 tabular-nums"
                          style={{ color: topic.accentHex }}
                        >
                          {doneCount}/{topic.nodes.length}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{topic.metaLabel}</CardDescription>
                      <Progress
                        value={progressPct}
                        aria-label={`Postęp ${topic.title}`}
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
                    className="relative mt-2 shrink-0"
                    style={{ width: `${STAGE_W}px`, height: `${STAGE_H}px` }}
                  >
                    <svg
                      className="pointer-events-none absolute inset-0 size-full"
                      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
                      aria-hidden="true"
                    >
                      {topicIndex > 0 && (
                        <>
                          <line
                            x1={170}
                            y1={0}
                            x2={170}
                            y2={64}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {entryPipeColored && (
                            <line
                              x1={170}
                              y1={0}
                              x2={170}
                              y2={64}
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

                      {PIPE_SEGMENTS.map((pathD, index) => {
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
                            x1={170}
                            y1={624}
                            x2={170}
                            y2={STAGE_H}
                            stroke="#2d3234"
                            strokeWidth="12"
                            strokeLinecap="round"
                          />
                          {exitPipeColored && (
                            <line
                              x1={170}
                              y1={624}
                              x2={170}
                              y2={STAGE_H}
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
                        const slot = NODE_SLOTS[index];
                        const status = getNodeStatus(node.id, completedSet);
                        const isBursting = burstNodeId === node.id;
                        const isShaking = shakeNodeId === node.id;

                        const statusText =
                          status === 'completed'
                            ? 'Zaliczone'
                            : status === 'active'
                              ? 'Aktywna'
                              : 'Zablokowana';

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
                                  aria-label={`Moduł ${node.code}: ${node.title} — ${statusText}`}
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
                                slot.labelSide === 'left'
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
                                  slot.labelSide === 'left' ? 'text-right' : 'text-left',
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
                          style={{ left: `${SANDBOX_SLOT.cx}px`, top: `${SANDBOX_SLOT.cy}px` }}
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
                                sandboxUnlocked ? 'Otwarty' : 'Zablokowany'
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
                          className="absolute flex flex-col items-start gap-0.5 text-left"
                          style={{
                            left: `${SANDBOX_SLOT.labelLeft}px`,
                            top: `${SANDBOX_SLOT.labelTop}px`,
                            width: `${SANDBOX_SLOT.labelWidth}px`,
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
                              'h-auto p-0 text-left text-sm leading-snug font-normal tracking-normal whitespace-normal normal-case underline underline-offset-4 transition-transform active:scale-95',
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
      </main>
    </div>
  );
}
