// Mirrors backend DTOs: CoachRequest, CoachResponse.
import type { Assignments } from './answer';
import type { ScenarioAllocation } from './scenarioRun';

/**
 * Body of POST /api/coach/messages. Everything except `message` is optional:
 * `subchapterId` gives the coach the lesson the learner is on, `questionId` the quiz question,
 * and `selectedOptionId`, `assignments` or `number` the answer they had checked.
 * `scenarioId` is the sandbox scenario, `allocations` the learner's plan (the rest is cash) and
 * `scenarioRun` whether they have run it and see the result; the server runs it again for the coach.
 * `conversationId` (from an earlier reply) continues that conversation instead of starting a new one.
 */
export interface CoachRequest {
  message: string;
  subchapterId?: number;
  questionId?: number;
  selectedOptionId?: number;
  assignments?: Assignments;
  number?: number;
  scenarioId?: number;
  allocations?: readonly ScenarioAllocation[];
  scenarioRun?: boolean;
  conversationId?: string;
}

/** The coach's reply. `aiAvailable` is false when the backend sent its fixed fallback text. */
export interface CoachResponse {
  reply: string;
  aiAvailable: boolean;
  /** Send this back with the next message to keep the conversation going. */
  conversationId: string;
}
