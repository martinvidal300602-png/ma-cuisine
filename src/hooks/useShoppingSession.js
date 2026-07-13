import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useShoppingSession() {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveSession = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('courses_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(12);

    if (err) {
      setError('Impossible de charger la session courses : ' + err.message);
      setLoading(false);
      return;
    }

    const recent = data ?? [];
    setSessions(recent);
    setActiveSession(recent.find((item) => item.active && item.status === 'active') ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveSession();

    const channel = supabase
      .channel('courses-sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses_sessions' }, fetchActiveSession)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveSession]);

  const startSession = useCallback(
    async (startedBy) => {
      const { data: current, error: currentErr } = await supabase
        .from('courses_sessions')
        .select('*')
        .eq('active', true)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentErr) throw new Error('Vérification de session impossible : ' + currentErr.message);
      if (current) {
        setActiveSession(current);
        await fetchActiveSession();
        return current;
      }

      const { data, error: err } = await supabase
        .from('courses_sessions')
        .insert([{ started_by: startedBy ?? null }])
        .select('*')
        .single();

      if (err) throw new Error('Démarrage des courses impossible : ' + err.message);
      setActiveSession(data);
      return data;
    },
    [fetchActiveSession]
  );

  const finishSession = useCallback(
    async () => {
      if (!activeSession) return;
      const { error: err } = await supabase
        .from('courses_sessions')
        .update({ active: false, status: 'finished', ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      if (err) throw new Error('Impossible de terminer les courses : ' + err.message);
      await fetchActiveSession();
    },
    [activeSession, fetchActiveSession]
  );

  const cancelSession = useCallback(
    async () => {
      if (!activeSession) return;
      const { error: err } = await supabase
        .from('courses_sessions')
        .update({ active: false, status: 'cancelled', ended_at: new Date().toISOString() })
        .eq('id', activeSession.id);

      if (err) throw new Error("Impossible d'annuler les courses : " + err.message);
      await fetchActiveSession();
    },
    [activeSession, fetchActiveSession]
  );

  return {
    activeSession,
    sessions,
    loading,
    error,
    startSession,
    finishSession,
    cancelSession,
    refresh: fetchActiveSession,
  };
}
