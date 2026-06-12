import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('courses')
      .select('*')
      .order('coche', { ascending: true })
      .order('created_at', { ascending: true });

    if (err) {
      setError('Impossible de charger la liste de courses : ' + err.message);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel('courses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchItems)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const addItem = useCallback(
    async (item) => {
      const payload = {
        nom: item.nom?.trim(),
        marque: item.marque?.trim() || null,
        categorie: item.categorie || 'Autre',
        quantite: Number.isFinite(Number(item.quantite)) && Number(item.quantite) > 0 ? Number(item.quantite) : 1,
        unite: item.unite?.trim() || 'unité',
        priorite: item.priorite || 'normale',
        coche: Boolean(item.coche),
        source: item.source || 'manuel',
        ajoute_par: item.ajoute_par ?? null,
      };

      if (!payload.nom) throw new Error('Le nom du produit est obligatoire.');

      const { error: err } = await supabase.from('courses').insert([payload]);
      if (err) throw new Error('Ajout à la liste impossible : ' + err.message);
      await fetchItems();
    },
    [fetchItems]
  );

  const updateItem = useCallback(
    async (id, fields) => {
      const { error: err } = await supabase.from('courses').update(fields).eq('id', id);
      if (err) throw new Error('Mise à jour impossible : ' + err.message);
      await fetchItems();
    },
    [fetchItems]
  );

  const deleteItem = useCallback(
    async (id) => {
      const { error: err } = await supabase.from('courses').delete().eq('id', id);
      if (err) throw new Error('Suppression impossible : ' + err.message);
      await fetchItems();
    },
    [fetchItems]
  );

  const deleteItems = useCallback(
    async (ids) => {
      const cleanIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (cleanIds.length === 0) return;

      const { error: err } = await supabase.from('courses').delete().in('id', cleanIds);
      if (err) throw new Error('Suppression de la liste impossible : ' + err.message);
      await fetchItems();
    },
    [fetchItems]
  );

  const clearChecked = useCallback(async () => {
    const { error: err } = await supabase.from('courses').delete().eq('coche', true);
    if (err) throw new Error('Suppression des produits cochés impossible : ' + err.message);
    await fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    addItem,
    updateItem,
    deleteItem,
    deleteItems,
    clearChecked,
  };
}
