import { useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { JourneySessionContext } from './journeySessionContext';
import { createJourneySession, journeySessionReducer } from './journeySessionReducer';

export function JourneySessionProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(journeySessionReducer, undefined, createJourneySession);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <JourneySessionContext value={value}>{children}</JourneySessionContext>;
}
