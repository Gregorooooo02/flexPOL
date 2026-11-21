import { PUBLIC_CONTENT } from './connections.generated';
import { chapterPath, lessonPath } from './learningLinks';
import type { JourneySource } from './types';

/** Invalid or repeated context is ignored, never reflected or used as a destination. */
export function readJourneySource(search: URLSearchParams): JourneySource | null {
  const kinds = search.getAll('from');
  const refs = search.getAll('ref');
  if (kinds.length !== 1 || refs.length > 1) return null;
  const kind = kinds[0];
  const ref = refs[0];
  if (kind === 'home' || kind === 'roadmap' || kind === 'tools') return ref === undefined ? { kind } : null;
  if (ref === undefined) return null;
  if (kind === 'lesson' && PUBLIC_CONTENT.lessons.some(({ code }) => code === ref)) return { kind, code: ref };
  if (kind === 'chapter' && PUBLIC_CONTENT.chapters.some(({ number }) => String(number) === ref)) return { kind, number: Number(ref) };
  if (kind === 'scenario' && PUBLIC_CONTENT.scenarios.some(({ slug }) => slug === ref)) return { kind, slug: ref };
  return null;
}

export function withJourneySource(path: string, source: JourneySource | null): string {
  if (!source) return path;
  const [pathname, query = ''] = path.split('?');
  const search = new URLSearchParams(query);
  search.set('from', source.kind);
  search.delete('ref');
  if (source.kind === 'lesson') search.set('ref', source.code);
  if (source.kind === 'chapter') search.set('ref', String(source.number));
  if (source.kind === 'scenario') search.set('ref', source.slug);
  return `${pathname}?${search}`;
}

export function sourceLabel(source: JourneySource): string {
  switch (source.kind) {
    case 'lesson': return `Lesson ${source.code} · ${PUBLIC_CONTENT.lessons.find(({ code }) => code === source.code)?.title ?? 'Learning'}`;
    case 'chapter': return `Chapter ${source.number} · ${PUBLIC_CONTENT.chapters.find(({ number }) => number === source.number)?.title ?? 'Learning'}`;
    case 'scenario': return PUBLIC_CONTENT.scenarios.find(({ slug }) => slug === source.slug)?.title ?? 'Scenario';
    case 'home': return 'Home';
    case 'roadmap': return 'My Roadmap';
    case 'tools': return 'Practical tools';
  }
}

/** Scenario numeric IDs are resolved separately from current API briefs, not from query strings. */
export function sourceReturnPath(source: Exclude<JourneySource, { kind: 'scenario' }>): string {
  switch (source.kind) {
    case 'home': return '/';
    case 'roadmap': return '/roadmap';
    case 'tools': return '/tools';
    case 'lesson': return lessonPath(source.code);
    case 'chapter': return chapterPath(source.number);
  }
}
