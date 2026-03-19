import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { migrateLocalDataToSupabase } from '../lib/supabaseSync';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean; // true if Supabase env vars are set
  error: string | null;
};

type AuthActions = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isConfigured: isSupabaseConfigured,
    error: null,
  });

  // Initialize: check for existing session
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    // Get initial session
    sb.auth.getSession().then(({ data }) => {
      setState(s => ({
        ...s,
        user: data.session?.user ?? null,
        session: data.session,
        loading: false,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setState(s => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');

    setState(s => ({ ...s, loading: true, error: null }));
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return;
    }
    setState(s => ({ ...s, loading: false }));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase not configured');

    setState(s => ({ ...s, loading: true, error: null }));
    const { error } = await sb.auth.signUp({ email, password });
    if (error) {
      setState(s => ({ ...s, loading: false, error: error.message }));
      return;
    }

    // Auto-migrate localStorage data on first sign-up
    try {
      const count = await migrateLocalDataToSupabase();
      if (count > 0) {
        console.log(`[auth] Migrated ${count} items from localStorage to Supabase`);
      }
    } catch (err) {
      console.warn('[auth] Migration failed:', err);
    }

    setState(s => ({ ...s, loading: false }));
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    setState(s => ({ ...s, user: null, session: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
