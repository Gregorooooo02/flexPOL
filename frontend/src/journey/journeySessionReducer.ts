import type { BufferPlan, GoalBrief, GoalProfile, RoadmapAction, RoadmapSetupDraft } from '@/roadmap/types';
import { preserveBufferPlan } from '@/roadmap/bufferPlan';
import { isBufferInput, isGoalInput } from '@/tools/validation';
import type { BufferInput, GoalPlannerInput, ToolDraft, ToolDrafts } from '@/tools/types';
import type { JourneySource, LearningCompletion, LearningSessionState } from './types';

export interface JourneySessionState {
  readonly goal: GoalBrief | null;
  readonly profile: GoalProfile | null;
  readonly toolDrafts: ToolDrafts;
  readonly actions: readonly RoadmapAction[];
  readonly learning: LearningSessionState;
  readonly setupDraft: RoadmapSetupDraft | null;
  readonly roadmapSource: JourneySource | null;
  readonly bufferPlan: BufferPlan | null;
}

export type JourneySessionAction =
  | { type: 'set-goal'; goal: GoalBrief }
  | { type: 'set-profile'; profile: GoalProfile }
  | { type: 'start-setup'; draft: RoadmapSetupDraft }
  | { type: 'update-setup'; goalId: string; changes: Partial<Omit<RoadmapSetupDraft, 'goalId' | 'source'>> }
  | { type: 'discard-setup' }
  | { type: 'save-roadmap'; goal: GoalBrief; profile: GoalProfile }
  | { type: 'clear-roadmap' }
  | { type: 'set-tool-draft'; draft: ToolDraft }
  | { type: 'apply-goal-inputs'; expectedGoalId: string; input: GoalPlannerInput; today: string }
  | { type: 'save-buffer'; expectedGoalId: string; expectedGoalSavedCents: number | undefined; input: BufferInput; source: JourneySource; separationConfirmed: true }
  | { type: 'select-action'; action: RoadmapAction }
  | { type: 'update-action'; goalId: string; actionId: string; status?: RoadmapAction['status']; reflection?: string }
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
    setupDraft: null,
    roadmapSource: null,
    bufferPlan: null,
  };
}

/** Session memory only: no persistence, API calls, calculations, or chat side effects. */
export function journeySessionReducer(state: JourneySessionState, action: JourneySessionAction): JourneySessionState {
  switch (action.type) {
    case 'start-setup':
      return state.setupDraft ? state : { ...state, setupDraft: action.draft };
    case 'update-setup':
      return state.setupDraft?.goalId === action.goalId
        ? { ...state, setupDraft: { ...state.setupDraft, ...action.changes } } : state;
    case 'discard-setup':
      return { ...state, setupDraft: null };
    case 'save-roadmap':
      if (state.setupDraft?.goalId !== action.goal.id || action.profile.goalId !== action.goal.id) return state;
      return { ...state, goal: action.goal, profile: action.profile, roadmapSource: state.setupDraft.source, setupDraft: null, bufferPlan: preserveBufferPlan(state.bufferPlan, action.goal) };
    case 'clear-roadmap':
      return { ...createJourneySession(), learning: state.learning };
    case 'set-goal':
      return { ...state, goal: action.goal, profile: state.profile?.goalId === action.goal.id ? state.profile : null, bufferPlan: preserveBufferPlan(state.bufferPlan, action.goal) };
    case 'set-profile':
      return action.profile.goalId === state.goal?.id ? { ...state, profile: action.profile } : state;
    case 'set-tool-draft':
      return { ...state, toolDrafts: { ...state.toolDrafts, [action.draft.tool]: action.draft } };
    case 'apply-goal-inputs': {
      if (state.setupDraft || state.goal?.id !== action.expectedGoalId || !isGoalInput(action.input, action.today)) return state;
      const goal = { ...state.goal, targetCents: action.input.targetCents, goalDate: action.input.goalDate, savedCents: action.input.savedCents, monthlyContributionCents: action.input.monthlyContributionCents };
      return { ...state, goal, bufferPlan: preserveBufferPlan(state.bufferPlan, goal) };
    }
    case 'save-buffer':
      if (state.setupDraft || state.goal?.id !== action.expectedGoalId || state.goal.savedCents !== action.expectedGoalSavedCents || action.separationConfirmed !== true || !isBufferInput(action.input)) return state;
      return { ...state, bufferPlan: {
        goalId: state.goal.id,
        input: { monthlyExpensesCents: action.input.monthlyExpensesCents, accessibleSavingsCents: action.input.accessibleSavingsCents, earmarkedExpensesCents: action.input.earmarkedExpensesCents, targetMonths: action.input.targetMonths },
        source: state.bufferPlan?.goalId === state.goal.id ? state.bufferPlan.source : action.source,
        goalSavedCentsAtConfirmation: action.expectedGoalSavedCents, separationNeedsReview: false,
      } };
    case 'select-action':
      if (action.action.goalId !== state.goal?.id || state.actions.some((existing) =>
        existing.goalId === action.action.goalId && existing.actionId === action.action.actionId)) return state;
      return { ...state, actions: [...state.actions, action.action] };
    case 'update-action':
      if (action.goalId !== state.goal?.id) return state;
      return {
        ...state,
        actions: state.actions.map((existing) => existing.goalId === action.goalId && existing.actionId === action.actionId
          ? { ...existing, status: action.status ?? existing.status, reflection: action.reflection ?? existing.reflection }
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
