import type { GoalBrief, GoalProfile, RoadmapAction } from '@/roadmap/types';
import type { ToolDraft, ToolDrafts } from '@/tools/types';
import type { LearningCompletion, LearningSessionState } from './types';

export interface JourneySessionState {
  readonly goal: GoalBrief | null;
  readonly profile: GoalProfile | null;
  readonly toolDrafts: ToolDrafts;
  readonly actions: readonly RoadmapAction[];
  readonly learning: LearningSessionState;
}

export type JourneySessionAction =
  | { type: 'set-goal'; goal: GoalBrief }
  | { type: 'set-profile'; profile: GoalProfile }
  | { type: 'set-tool-draft'; draft: ToolDraft }
  | { type: 'select-action'; action: RoadmapAction }
  | { type: 'update-action'; goalId: string; actionId: string; status: RoadmapAction['status']; reflection?: string }
  | { type: 'complete-learning'; completions: readonly LearningCompletion[] }
  | { type: 'resume-learning'; nodeId: string }
  | { type: 'reset-learning' };

export function createJourneySession(): JourneySessionState {
  return {
    goal: null,
    profile: null,
    toolDrafts: {},
    actions: [],
    learning: { completions: {}, resumeNodeId: null },
  };
}

/** Session memory only: no persistence, API calls, calculations, or chat side effects. */
export function journeySessionReducer(state: JourneySessionState, action: JourneySessionAction): JourneySessionState {
  switch (action.type) {
    case 'set-goal':
      return { ...state, goal: action.goal, profile: state.profile?.goalId === action.goal.id ? state.profile : null };
    case 'set-profile':
      return action.profile.goalId === state.goal?.id ? { ...state, profile: action.profile } : state;
    case 'set-tool-draft':
      return { ...state, toolDrafts: { ...state.toolDrafts, [action.draft.tool]: action.draft } };
    case 'select-action':
      if (action.action.goalId !== state.goal?.id || state.actions.some((existing) =>
        existing.goalId === action.action.goalId && existing.actionId === action.action.actionId)) return state;
      return { ...state, actions: [...state.actions, action.action] };
    case 'update-action':
      return {
        ...state,
        actions: state.actions.map((existing) => existing.goalId === action.goalId && existing.actionId === action.actionId
          ? { ...existing, status: action.status, reflection: action.reflection ?? existing.reflection }
          : existing),
      };
    case 'complete-learning': {
      const completions = { ...state.learning.completions };
      for (const completion of action.completions) {
        const previous = completions[completion.nodeId];
        if (!previous || previous.provenance === 'demo') completions[completion.nodeId] = completion;
      }
      return { ...state, learning: { ...state.learning, completions } };
    }
    case 'resume-learning':
      return state.learning.resumeNodeId === action.nodeId ? state
        : { ...state, learning: { ...state.learning, resumeNodeId: action.nodeId } };
    case 'reset-learning':
      return { ...state, learning: { completions: {}, resumeNodeId: null } };
  }
}
