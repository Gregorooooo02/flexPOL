import { apiClient } from '@/config/axios';
import type { HistoricalObservation, Instrument } from '@/model';

/** GET /api/instruments: catalogue metadata and simulation assumptions, without history. */
export async function getInstruments(signal?: AbortSignal): Promise<Instrument[]> {
  const { data } = await apiClient.get<Instrument[]>('/instruments', { signal });
  return data;
}

/** Historical index levels, not executable EUR prices. */
export async function getInstrumentHistory(
  id: number,
  signal?: AbortSignal,
): Promise<HistoricalObservation[]> {
  const { data } = await apiClient.get<HistoricalObservation[]>(`/instruments/${id}/history`, {
    signal,
  });
  return data;
}
