import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { recordEvent } from '../lib/eventLog';

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
      void recordEvent({
        type: 'shopping_started',
        entityType: 'courses_session',
        entityId: data.id,
        title: 'Courses commencées',
        detail: startedBy || 'Session familiale',
        payload: { after: data },
      });
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
      void recordEvent({
        type: 'shopping_finished',
        entityType: 'courses_session',
        entityId: activeSession.id,
        title: 'Courses terminées',
        detail: activeSession.started_by || 'Session familiale',
        payload: { before: activeSession },
      });
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
      void recordEvent({
        type: 'shopping_cancelled',
        entityType: 'courses_session',
        entityId: activeSession.id,
        title: 'Courses annulées',
        detail: activeSession.started_by || 'Session familiale',
        payload: { before: activeSession },
      });
      await fetchActiveSession();
    },
    [activeSession, fetchActiveSession]
  );

  const restoreSession = useCallback(async (id, fields) => {
    const { data, error: err } = await supabase
      .from('courses_sessions')
      .update(fields)
      .eq('id', id)
      .select('*')
      .single();
    if (err) throw new Error('Restauration de la session impossible : ' + err.message);
    void recordEvent({
      type: fields.status === 'active' ? 'shopping_reopened' : 'shopping_cancelled',
      entityType: 'courses_session',
      entityId: id,
      title: fields.status === 'active' ? 'Courses reprises' : 'Démarrage des courses annulé',
      detail: data.started_by || 'Session familiale',
      payload: { after: data },
    });
    await fetchActiveSession();
    return data;
  }, [fetchActiveSession]);

  return {
    activeSession,
    sessions,
    loading,
    error,
    startSession,
    finishSession,
    cancelSession,
    restoreSession,
    refresh: fetchActiveSession,
  };
}
