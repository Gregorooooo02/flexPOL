import { SIMULATION_DURATION_MS } from './config';

export interface ReplayState {
  status: 'idle' | 'playing' | 'finished';
  dayIndex: number;
}

export function createReplay(): ReplayState {
  return { status: 'idle', dayIndex: 0 };
}

/** Absolute elapsed time, not tick counts: dialogs and background throttling cannot pause a run. */
export function advanceReplay(
  state: ReplayState,
  elapsedMs: number,
  lastIndex: number,
): ReplayState {
  if (state.status !== 'playing' || !Number.isFinite(elapsedMs)) return state;
  const progress = Math.min(1, Math.max(0, elapsedMs / SIMULATION_DURATION_MS));
  const dayIndex = Math.max(state.dayIndex, Math.floor(progress * lastIndex));
  return {
    ...state,
    dayIndex,
    status: progress === 1 ? 'finished' : 'playing',
  };
}
