import { useState } from 'react';
import type { ReactNode } from 'react';
import { CoachFocusContext, SetCoachFocusContext } from './coachFocus';
import type { CoachFocus } from './coachFocus';

/** Shares the learner's current focus between the screen they are on and the coach. */
export function CoachFocusProvider({ children }: { readonly children: ReactNode }) {
  const [focus, setFocus] = useState<CoachFocus | null>(null);
  return (
    <SetCoachFocusContext.Provider value={setFocus}>
      <CoachFocusContext.Provider value={focus}>{children}</CoachFocusContext.Provider>
    </SetCoachFocusContext.Provider>
  );
}
