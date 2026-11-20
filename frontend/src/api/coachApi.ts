import type { CoachRequest, CoachResponse } from '@/model';
import { apiClient } from '@/config/axios';

/** Model replies can take a while, so this call waits longer than the client's default 10 s. */
const COACH_TIMEOUT_MS = 60_000;

/** POST /api/coach/messages: asks the AI coach one question, optionally about a lesson. */
export async function askCoach(request: CoachRequest, signal?: AbortSignal): Promise<CoachResponse> {
  const { data } = await apiClient.post<CoachResponse>('/coach/messages', request, {
    signal,
    timeout: COACH_TIMEOUT_MS,
  });
  return data;
}
