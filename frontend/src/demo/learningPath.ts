import type { Chapter } from '@/model';
import { content as capstoneContent } from '@/capstone/plan';

export type NodeKind = 'lesson' | 'checkpoint' | 'capstone';
export type NodeStatus = 'completed' | 'active' | 'locked';

interface LearningNodeBase {
  readonly id: string;
  readonly code: string;
  readonly title: string;
}

/** A subchapter: lesson text followed by its control questions. */
export interface LessonNode extends LearningNodeBase {
  readonly kind: 'lesson';
  readonly subchapterId: number;
}

/** The chapter's final quiz. */
export interface CheckpointNode extends LearningNodeBase {
  readonly kind: 'checkpoint';
  readonly quizId: number;
}

export interface CapstoneNode extends LearningNodeBase {
  readonly kind: 'capstone';
}

export type LearningNode = LessonNode | CheckpointNode | CapstoneNode;

interface TopicTheme {
  readonly bandClassName: string;
  readonly ambientGlow: string;
  readonly pipeColor: string;
  readonly pipeSecondary: string;
  /** Fill colour; text on it uses #07090a. */
  readonly accentHex: string;
  /** Accent for text drawn straight on the band or a card (darker in the light theme). */
  readonly accentTextHex: string;
  readonly spikyFillHex: string;
}

/** One chapter from the backend, with the look the learning path gives it. Its final test is the last node. */
export interface TopicDefinition extends TopicTheme {
  readonly id: string;
  readonly chapterId: number;
  readonly seriesNumber: string;
  readonly title: string;
  readonly metaLabel: string;
  readonly objective: string | null;
  readonly nodes: readonly LearningNode[];
}

export interface FlatNodeEntry {
  readonly topic: TopicDefinition;
  readonly node: LearningNode;
}

export interface LearningPath {
  readonly topics: readonly TopicDefinition[];
  /** Every node of every topic, in the order they unlock. */
  readonly flatNodes: readonly FlatNodeEntry[];
}

/** Colour bands, used in chapter order. Values are CSS variables from index.css, so they follow the light/dark theme. */
// Band classes are written out in full so Tailwind can find them.
const BAND_CLASSES = ['bg-[var(--topic-1-band)]', 'bg-[var(--topic-2-band)]', 'bg-[var(--topic-3-band)]'];

const TOPIC_THEMES: readonly TopicTheme[] = [1, 2, 3].map((n) => ({
  bandClassName: BAND_CLASSES[n - 1],
  ambientGlow: `radial-gradient(ellipse at 50% 0%, var(--topic-${n}-glow), transparent 100%)`,
  pipeColor: `var(--topic-${n}-pipe)`,
  pipeSecondary: `var(--topic-${n}-pipe-2)`,
  accentHex: `var(--topic-${n}-accent)`,
  accentTextHex: `var(--topic-${n}-accent-text)`,
  spikyFillHex: `var(--topic-${n}-spiky)`,
}));

/** A theme colour (possibly a CSS variable) at the given opacity. */
export function withAlpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function toTopic(chapter: Chapter, index: number): TopicDefinition {
  const theme = TOPIC_THEMES[index % TOPIC_THEMES.length];
  const subchapters = [...chapter.subchapters].sort((a, b) => a.sortOrder - b.sortOrder);

  const nodes: LearningNode[] = subchapters.map((subchapter) => ({
    kind: 'lesson',
    id: `lesson-${subchapter.id}`,
    code: subchapter.code,
    title: subchapter.title,
    subchapterId: subchapter.id,
  }));
  if (chapter.finalQuizId !== null) {
    nodes.push({
      kind: 'checkpoint',
      id: `final-${chapter.finalQuizId}`,
      code: `${chapter.sortOrder}.${subchapters.length + 1}`,
      title: `Final test: ${chapter.title}`,
      quizId: chapter.finalQuizId,
    });
  }

  const metaParts: string[] = [];
  if (subchapters.length === 1) {
    metaParts.push(`Lesson ${subchapters[0].code}`);
  } else if (subchapters.length > 1) {
    metaParts.push(`Lessons ${subchapters[0].code}–${subchapters[subchapters.length - 1].code}`);
  }
  if (chapter.finalQuizId !== null) {
    metaParts.push('Final test');
  }

  return {
    ...theme,
    id: `chapter-${chapter.id}`,
    chapterId: chapter.id,
    seriesNumber: String(chapter.sortOrder),
    title: chapter.title,
    metaLabel: metaParts.join(' · '),
    objective: chapter.objective,
    nodes,
  };
}

/** Turns the chapters from GET /api/chapters into the learning path. Chapters with nothing to do are left out. */
export function buildLearningPath(chapters: readonly Chapter[]): LearningPath {
  const topics = [...chapters]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toTopic)
    .filter((topic) => topic.nodes.length > 0);
  // This local, private reflection is not a backend quiz and has no saved attempt.
  if (topics.length > 0) {
    topics.push({
      ...TOPIC_THEMES[0],
      id: 'capstone',
      chapterId: -1,
      seriesNumber: 'Final',
      title: capstoneContent.title,
      metaLabel: 'Six questions · Your next step',
      objective: capstoneContent.objective,
      nodes: [{ kind: 'capstone', id: 'capstone', code: 'Final', title: capstoneContent.title }],
    });
  }
  const flatNodes = topics.flatMap((topic) => topic.nodes.map((node) => ({ topic, node })));
  return { topics, flatNodes };
}

function indexOfNode(path: LearningPath, nodeId: string): number {
  return path.flatNodes.findIndex((entry) => entry.node.id === nodeId);
}

export function getNodeStatus(
  path: LearningPath,
  nodeId: string,
  completedIds: ReadonlySet<string>,
): NodeStatus {
  if (completedIds.has(nodeId)) {
    return 'completed';
  }
  const index = indexOfNode(path, nodeId);
  if (index <= 0) {
    return 'active';
  }
  const previousNode = path.flatNodes[index - 1].node;
  return completedIds.has(previousNode.id) ? 'active' : 'locked';
}

/** A chapter is completed once every node, including its final test, is. */
export function isTopicCompleted(
  topic: TopicDefinition,
  completedIds: ReadonlySet<string>,
): boolean {
  return topic.nodes.every((node) => completedIds.has(node.id));
}

export function getTopicCompletedCount(
  topic: TopicDefinition,
  completedIds: ReadonlySet<string>,
): number {
  return topic.nodes.reduce((acc, node) => (completedIds.has(node.id) ? acc + 1 : acc), 0);
}

export function getFirstUnfinishedTopic(
  topics: readonly TopicDefinition[],
  completedIds: ReadonlySet<string>,
): TopicDefinition | undefined {
  return topics.find((topic) => !isTopicCompleted(topic, completedIds));
}

export function getNextNodeAfter(path: LearningPath, nodeId: string): FlatNodeEntry | undefined {
  const index = indexOfNode(path, nodeId);
  if (index < 0 || index + 1 >= path.flatNodes.length) {
    return undefined;
  }
  return path.flatNodes[index + 1];
}

export function getPreviousNodeBefore(path: LearningPath, nodeId: string): FlatNodeEntry | undefined {
  const index = indexOfNode(path, nodeId);
  return index > 0 ? path.flatNodes[index - 1] : undefined;
}

export function findNodeById(path: LearningPath, nodeId: string): FlatNodeEntry | undefined {
  return path.flatNodes.find((entry) => entry.node.id === nodeId);
}
