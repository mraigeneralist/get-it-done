/**
 * Session state for the whole app.
 *
 * Supabase persists the session to AsyncStorage, so the job here is to read
 * it once on launch and then stay subscribed to changes. Two rules matter:
 *
 *   `loading` starts true and only ever goes false once. Routing decisions
 *   depend on it — without it the app briefly believes nobody is signed in
 *   and bounces a returning user to the sign-in screen before their stored
 *   session has finished loading.
 *
 *   Nothing here blocks first render. The provider paints immediately and
 *   the session arrives a tick later.
 */

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { queryClient } from './query';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore whatever is already on disk.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Then follow every later change: sign in, sign out, token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === 'SIGNED_OUT') {
        // The cache is per-user and persisted to disk. Leaving it in place
        // would show the previous account's tasks to whoever signs in next.
        queryClient.clear();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },

      async signUp(email, password, displayName) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          // Read by the handle_new_user() trigger to name the profile row.
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw new Error(friendlyAuthError(error.message));
      },

      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/**
 * Supabase's messages are written for developers. These are written for the
 * person holding the phone: say what happened and what to do about it.
 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'That email and password do not match. Check both and try again.';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account already exists for that email. Sign in instead.';
  }
  if (m.includes('password') && m.includes('least')) {
    return 'Passwords need at least 8 characters.';
  }
  if (m.includes('unable to validate email') || m.includes('invalid format')) {
    return 'That email address does not look right.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'No connection. Check your internet and try again.';
  }
  return message;
}
