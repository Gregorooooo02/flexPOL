import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { JourneySessionAction, JourneySessionState } from './journeySessionReducer';

export const JourneySessionContext = createContext<{
  state: JourneySessionState;
  dispatch: Dispatch<JourneySessionAction>;
} | null>(null);

export function useJourneySession() {
  const context = useContext(JourneySessionContext);
  if (!context) throw new Error('useJourneySession requires a signed-in journey session');
  return context;
}
