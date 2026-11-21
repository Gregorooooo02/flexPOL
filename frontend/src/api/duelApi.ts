import type { DuelMatch, DuelMe, DuelPortfolioRequest, DuelQueue, DuelRealtimeTicket, DuelResult, DuelSettlement } from '@/model';
import { apiClient } from '@/config/axios';

const matchPath = (matchId: string) => `/duels/${encodeURIComponent(matchId)}`;

export async function getDuelQueue(signal?: AbortSignal): Promise<DuelQueue> {
  const { data } = await apiClient.get<DuelQueue>('/duels/queue', { signal });
  return data;
}

export async function joinDuelQueue(signal?: AbortSignal): Promise<DuelQueue> {
  const { data } = await apiClient.post<DuelQueue>('/duels/queue', undefined, { signal });
  return data;
}

export async function leaveDuelQueue(entryId: string, signal?: AbortSignal): Promise<DuelQueue> {
  const { data } = await apiClient.delete<DuelQueue>('/duels/queue', { params: { entryId }, signal });
  return data;
}

export async function heartbeatDuelQueue(entryId: string, signal?: AbortSignal): Promise<DuelQueue> {
  const { data } = await apiClient.post<DuelQueue>('/duels/queue/heartbeat', { entryId }, { signal });
  return data;
}

export async function getDuelRealtimeTicket(signal?: AbortSignal): Promise<DuelRealtimeTicket> {
  const { data } = await apiClient.post<DuelRealtimeTicket>('/duels/realtime-ticket', undefined, { signal });
  return data;
}

/** Current learner's points and recovery references; load the match for its current phase. */
export async function getDuelMe(signal?: AbortSignal): Promise<DuelMe> {
  const { data } = await apiClient.get<DuelMe>('/duels/me', { signal });
  return data;
}

export async function getDuel(matchId: string, signal?: AbortSignal): Promise<DuelMatch> {
  const { data } = await apiClient.get<DuelMatch>(matchPath(matchId), { signal });
  return data;
}

export async function saveDuelDraft(
  matchId: string,
  request: DuelPortfolioRequest,
  signal?: AbortSignal,
): Promise<DuelMatch> {
  const { data } = await apiClient.put<DuelMatch>(`${matchPath(matchId)}/draft`, request, { signal });
  return data;
}

export async function submitDuelPortfolio(
  matchId: string,
  request: DuelPortfolioRequest,
  signal?: AbortSignal,
): Promise<DuelMatch> {
  const { data } = await apiClient.post<DuelMatch>(`${matchPath(matchId)}/submit`, request, { signal });
  return data;
}

export async function getDuelResult(matchId: string, signal?: AbortSignal): Promise<DuelResult> {
  const { data } = await apiClient.get<DuelResult>(`${matchPath(matchId)}/result`, { signal });
  return data;
}

export async function getDuelSettlement(matchId: string, signal?: AbortSignal): Promise<DuelSettlement> {
  const { data } = await apiClient.get<DuelSettlement>(`${matchPath(matchId)}/settlement`, { signal });
  return data;
}
