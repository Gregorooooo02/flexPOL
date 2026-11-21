import type { DuelMatch, DuelMe, DuelPortfolioRequest, DuelResult, DuelSettlement } from '@/model';
import { apiClient } from '@/config/axios';

const matchPath = (matchId: string) => `/duels/${encodeURIComponent(matchId)}`;

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
