// src/hooks/useAuth.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Gère la session Supabase Auth (persistée en localStorage).
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: err }) => {
        if (!mounted) return;
        if (err) setError(err.message);
        setSession(data?.session ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      const message =
        err.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : err.message;
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: err } = await supabase.auth.signOut();
    if (err) {
      setError(err.message);
      throw new Error(err.message);
    }
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    error,
    signIn,
    signOut,
  };
}
