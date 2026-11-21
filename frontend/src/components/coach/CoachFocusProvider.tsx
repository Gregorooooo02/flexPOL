import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CoachAskContext, CoachFocusContext, SetCoachFocusContext } from './coachFocus';
import type { CoachAsk, CoachAskChannel, CoachFocus } from './coachFocus';

/**
 * Shares the learner's current focus between the screen they are on and the coach, and carries
 * messages a screen asks the coach to send (`useAskCoach`) to the coach sidebar.
 */
export function CoachFocusProvider({ children }: { readonly children: ReactNode }) {
  const [focus, setFocus] = useState<CoachFocus | null>(null);
  const [pending, setPending] = useState<CoachAsk | null>(null);
  const nextAskId = useRef(0);
  const showChat = useRef<(() => void) | null>(null);
  const ask = useCallback((text: string) => {
    nextAskId.current += 1;
    setPending({ id: nextAskId.current, text });
    showChat.current?.();
  }, []);
  const done = useCallback((id: number) => setPending((current) => (current?.id === id ? null : current)), []);
  const registerShowChat = useCallback((show: (() => void) | null) => {
    showChat.current = show;
  }, []);
  const channel = useMemo<CoachAskChannel>(
    () => ({ pending, ask, done, registerShowChat }),
    [pending, ask, done, registerShowChat],
  );

  return (
    <SetCoachFocusContext.Provider value={setFocus}>
      <CoachFocusContext.Provider value={focus}>
        <CoachAskContext.Provider value={channel}>{children}</CoachAskContext.Provider>
      </CoachFocusContext.Provider>
    </SetCoachFocusContext.Provider>
  );
}
