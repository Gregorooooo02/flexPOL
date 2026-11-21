import { getNodeStatus } from '@/demo/learningPath';
import type { LearningPath, FlatNodeEntry, TopicDefinition } from '@/demo/learningPath';

export function lessonPath(code: string): string {
  return `/learning?${new URLSearchParams({ lesson: code })}`;
}

export function chapterPath(number: number): string {
  return `/learning?${new URLSearchParams({ chapter: String(number) })}`;
}

/** Chapter number, not a database quiz ID. Used by the learning path's final-test nodes. */
export function finalTestPath(chapterNumber: number): string {
  return `/learning?${new URLSearchParams({ test: String(chapterNumber) })}`;
}

export type LearningLink =
  | { kind: 'path' }
  | { kind: 'lesson'; entry: FlatNodeEntry }
  | { kind: 'chapter'; topic: TopicDefinition }
  | { kind: 'invalid'; message: string }
  | { kind: 'locked'; message: string; prerequisite: FlatNodeEntry | null };

/** Called after loading the real path. Query parameters never grant completion/unlock access. */
export function resolveLearningLink(search: URLSearchParams, path: LearningPath, completed: ReadonlySet<string>): LearningLink {
  const lessons = search.getAll('lesson');
  const chapters = search.getAll('chapter');
  const tests = search.getAll('test');
  if (!lessons.length && !chapters.length && !tests.length) return { kind: 'path' };
  if (lessons.length + chapters.length + tests.length !== 1) {
    return { kind: 'invalid', message: 'Choose one lesson or chapter link. The learning path is shown instead.' };
  }
  if (chapters.length) {
    const topic = path.topics.find((candidate) => candidate.seriesNumber === chapters[0]);
    return topic ? { kind: 'chapter', topic }
      : { kind: 'invalid', message: 'That chapter is unavailable. Choose a chapter from the path.' };
  }
  const entry = tests.length
    ? path.flatNodes.find(({ node, topic }) => node.kind === 'checkpoint' && topic.seriesNumber === tests[0])
    : path.flatNodes.find(({ node }) => node.kind === 'lesson' && node.code === lessons[0]);
  if (!entry) return { kind: 'invalid', message: 'That lesson is unavailable. Choose a lesson from the path.' };
  if (getNodeStatus(path, entry.node.id, completed) === 'locked') {
    const prerequisite = path.flatNodes.find(({ node }) => getNodeStatus(path, node.id, completed) === 'active') ?? null;
    return {
      kind: 'locked',
      message: `Module ${entry.node.code} is locked. Complete the next available module first.`,
      prerequisite,
    };
  }
  return { kind: 'lesson', entry };
}
