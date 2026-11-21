// Mirrors backend DTOs: CoachRequest, CoachResponse.
import type { Assignments } from './answer';

/**
 * Body of POST /api/coach/messages. Everything except `message` is optional:
 * `subchapterId` gives the coach the lesson the learner is on, `questionId` the quiz question,
 * and `selectedOptionId`, `assignments` or `number` the answer they had checked.
 * `conversationId` (from an earlier reply) continues that conversation instead of starting a new one.
 */
export interface CoachRequest {
  message: string;
  subchapterId?: number;
  questionId?: number;
  selectedOptionId?: number;
  assignments?: Assignments;
  number?: number;
  conversationId?: string;
}

/** The coach's reply. `aiAvailable` is false when the backend sent its fixed fallback text. */
export interface CoachResponse {
  reply: string;
  aiAvailable: boolean;
  /** Send this back with the next message to keep the conversation going. */
  conversationId: string;
}
