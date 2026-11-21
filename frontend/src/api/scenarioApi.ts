import type { Scenario, ScenarioRunRequest, ScenarioRunResponse } from '@/model';
import { apiClient } from '@/config/axios';

/** Long horizons with several instruments take a few seconds to simulate and evaluate. */
const RUN_TIMEOUT_MS = 30_000;

/**
 * POST /api/scenarios/{scenarioId}/runs: simulates the allocation in the scenario's own market
 * (the same for every learner and retry) and returns the path, money needs and score.
 */
export async function runScenario(
  scenarioId: number,
  request: ScenarioRunRequest,
  signal?: AbortSignal,
): Promise<ScenarioRunResponse> {
  const { data } = await apiClient.post<ScenarioRunResponse>(`/scenarios/${scenarioId}/runs`, request, {
    signal,
    timeout: RUN_TIMEOUT_MS,
  });
  return data;
}

/** GET /api/scenarios: all sandbox scenarios in order, across chapters. */
export async function getScenarios(signal?: AbortSignal): Promise<Scenario[]> {
  const { data } = await apiClient.get<Scenario[]>('/scenarios', { signal });
  return data;
}

/** GET /api/scenarios/{scenarioId} */
export async function getScenario(scenarioId: number, signal?: AbortSignal): Promise<Scenario> {
  const { data } = await apiClient.get<Scenario>(`/scenarios/${scenarioId}`, { signal });
  return data;
}
