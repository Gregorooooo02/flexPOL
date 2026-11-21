import { PRACTICAL_CONNECTIONS } from '@/journey/connections.generated';
import { connectionsForSource } from '@/journey/connections';
import type { JourneySource, PracticalConnection } from '@/journey/types';
import { ROADMAP_GUIDANCE } from './guidance.generated';
import type { ProfileObservation } from './profileObservations';

export interface RoadmapSuggestion { readonly action: PracticalConnection; readonly reason: string }

export function roadmapSuggestions(observations: readonly ProfileObservation[], source: JourneySource | null, selectedIds: ReadonlySet<string>): RoadmapSuggestion[] {
  const candidates = new Map<string, { action: PracticalConnection; reason: string; priority: number }>();
  const contextualIds = new Set(source ? connectionsForSource(source).map((action) => action.id) : []);
  function offer(action: PracticalConnection, reason: string, priority: number) {
    if (selectedIds.has(action.id)) return;
    const previous = candidates.get(action.id);
    if (!previous || priority < previous.priority) candidates.set(action.id, { action, reason, priority });
  }
  for (const observation of observations) {
    const guidance = ROADMAP_GUIDANCE[observation.id];
    const action = PRACTICAL_CONNECTIONS.find((candidate) => candidate.id === guidance.actionId);
    if (action) offer(action, guidance.reason, observation.category === 'tradeoff' || observation.category === 'review' ? 0 : 1);
  }
  for (const action of PRACTICAL_CONNECTIONS) {
    if (contextualIds.has(action.id)) offer(action, action.relevance, 2);
    // General research actions are available without assuming a particular risk profile.
    if (action.id === 'research-holdings' || action.id === 'find-annual-charges') offer(action, action.relevance, 3);
  }
  return [...candidates.values()].sort((a, b) => a.priority - b.priority
    || Number(contextualIds.has(b.action.id)) - Number(contextualIds.has(a.action.id))
    || a.action.id.localeCompare(b.action.id)).slice(0, 3);
}
