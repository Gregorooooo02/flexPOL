// Mirrors backend DTOs: CoachRequest, CoachResponse.

/** Body of POST /api/coach/messages. `subchapterId` gives the coach the lesson the learner is on. */
export interface CoachRequest {
  message: string;
  subchapterId?: number;
}

/** The coach's reply. `aiAvailable` is false when the backend sent its fixed fallback text. */
export interface CoachResponse {
  reply: string;
  aiAvailable: boolean;
}
