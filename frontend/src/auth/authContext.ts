import { createContext, useContext } from 'react';
import type { LoginRequest, User } from '@/model';

/**
 * The signed-in learner. This is a mock login for the hackathon: there is no
 * password or token, the email simply tells learners apart.
 */
export interface AuthContextValue {
  readonly user: User | null;
  /** Logs in through the backend. Rejects with `ApiError` if it fails. */
  readonly login: (request: LoginRequest) => Promise<void>;
  readonly logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
