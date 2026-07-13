import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function usePurchaseHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 180);
      const { data, error } = await supabase
        .from('historique_produits')
        .select('id, produit_id, nom, quantite_ajoutee, date_ajout, source_ajout, created_at')
        .gt('quantite_ajoutee', 0)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(400);
      if (active && !error) setHistory(data || []);
    };

    void fetchHistory();
    const channel = supabase
      .channel('v3-purchase-history-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historique_produits' }, fetchHistory)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return history;
}
