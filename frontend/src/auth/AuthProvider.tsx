import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { loginUser } from '@/api';
import { setApiUserEmail, setUnauthorizedHandler } from '@/config/axios';
import type { LoginRequest, User } from '@/model';
import { AuthContext } from './authContext';

const STORAGE_KEY = 'financeQuest.mockUser';

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'username' in parsed &&
      'email' in parsed &&
      typeof parsed.id === 'number' &&
      typeof parsed.username === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return { id: parsed.id, username: parsed.username, email: parsed.email };
    }
  } catch {
    // Storage blocked or corrupted: start signed out.
  }
  return null;
}

function writeStoredUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage blocked: the session just won't survive a reload.
  }
}

/**
 * Mock login: the backend finds or creates the user by email, and the result is kept in memory
 * and in localStorage. Every API request then carries the email in the `X-User-Email` header.
 */
export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = readStoredUser();
    // Set before any child renders, so their first requests already carry the header.
    setApiUserEmail(stored?.email ?? null);
    return stored;
  });
  const userRef = useRef(user);

  const saveUser = useCallback((next: User | null) => {
    writeStoredUser(next);
    setApiUserEmail(next?.email ?? null);
    userRef.current = next;
    setUser(next);
  }, []);

  // The backend database is in memory, so a restart forgets users and requests come back 401.
  // Log the same learner in again and let the client retry; if that fails, log them out.
  useEffect(() => {
    let pending: Promise<boolean> | null = null;
    setUnauthorizedHandler(() => {
      const current = userRef.current;
      if (!current) return Promise.resolve(false);
      // Several requests may fail at once; they share one login.
      pending ??= loginUser({ username: current.username, email: current.email })
        .then((fresh) => {
          saveUser(fresh);
          return true;
        })
        .catch(() => {
          saveUser(null);
          return false;
        })
        .finally(() => {
          pending = null;
        });
      return pending;
    });
    return () => setUnauthorizedHandler(null);
  }, [saveUser]);

  const login = useCallback(
    async (request: LoginRequest) => {
      saveUser(await loginUser(request));
    },
    [saveUser],
  );

  const logout = useCallback(() => saveUser(null), [saveUser]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
