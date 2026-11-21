import type { Scenario } from '@/model';
import { apiClient } from '@/config/axios';

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
