import { JOURNEY_HANDOFFS, PRACTICAL_CONNECTIONS } from './connections.generated';
import type { JourneySource, PracticalConnection } from './types';
import { toolPath } from '@/tools/routes';

export function connectionsForSource(source: JourneySource): readonly PracticalConnection[] {
  return (PRACTICAL_CONNECTIONS as readonly PracticalConnection[]).filter((connection) => {
    switch (source.kind) {
      case 'lesson': return connection.lessonCodes.includes(source.code);
      case 'chapter': return connection.chapterNumbers.includes(source.number);
      case 'scenario': return connection.scenarioSlugs.includes(source.slug);
      default: return false;
    }
  });
}

export function connectionPath(connection: PracticalConnection): string {
  return connection.destination.kind === 'tool'
    ? toolPath(connection.destination.id)
    : `/roadmap/setup?${new URLSearchParams({ section: connection.destination.id })}`;
}

function sourceKey(source: JourneySource): string {
  return source.kind === 'lesson' ? `lesson:${source.code}` : source.kind === 'chapter' ? `chapter:${source.number}` : source.kind === 'scenario' ? `scenario:${source.slug}` : source.kind;
}

/** Authored primary destination, at most two alternatives; all references are build-time validated. */
export function handoffConnections(source: JourneySource): readonly PracticalConnection[] {
  const handoff = JOURNEY_HANDOFFS.find((candidate) => sourceKey(candidate.source) === sourceKey(source));
  return handoff?.actionIds.flatMap((id) => {
    const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === id);
    return action ? [action] : [];
  }) ?? [];
}
