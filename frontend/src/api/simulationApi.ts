import { apiClient } from '@/config/axios';
import type { SimulationRequest, SimulationResult } from '@/model';

/** One independent trajectory per instrument, in request order. Omit seeds for a fresh market. */
export async function simulateBatch(
  requests: SimulationRequest[],
  signal?: AbortSignal,
): Promise<SimulationResult[]> {
  const { data } = await apiClient.post<SimulationResult[]>('/simulations/batch', requests, {
    signal,
  });
  return data;
}
