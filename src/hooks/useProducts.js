// src/hooks/useProducts.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Charge la liste des produits (triés par date d'expiration croissante)
 * et s'abonne aux changements en temps réel sur la table `produits`.
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('produits')
      .select('*')
      .order('date_expiration', { ascending: true, nullsFirst: false });

    if (err) {
      setError('Impossible de charger les produits : ' + err.message);
      setLoading(false);
      return;
    }
    setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();

    // Temps réel : toute modification de la table relance un rafraîchissement.
    const channel = supabase
      .channel('produits-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'produits' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  /** Ajoute un produit. */
  const addProduct = useCallback(
    async (product) => {
      const { error: err } = await supabase.from('produits').insert([product]);
      if (err) throw new Error("Ajout impossible : " + err.message);
      await fetchProducts();
    },
    [fetchProducts]
  );

  /** Ajoute plusieurs produits en une seule requête. */
  const addProducts = useCallback(
    async (list) => {
      if (!Array.isArray(list) || list.length === 0) return;
      const { error: err } = await supabase.from('produits').insert(list);
      if (err) throw new Error('Ajout en masse impossible : ' + err.message);
      await fetchProducts();
    },
    [fetchProducts]
  );

  /** Met à jour des champs d'un produit. */
  const updateProduct = useCallback(
    async (id, fields) => {
      const { error: err } = await supabase
        .from('produits')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw new Error('Mise à jour impossible : ' + err.message);
      await fetchProducts();
    },
    [fetchProducts]
  );

  /** Supprime un produit. */
  const deleteProduct = useCallback(
    async (id) => {
      const { error: err } = await supabase.from('produits').delete().eq('id', id);
      if (err) throw new Error('Suppression impossible : ' + err.message);
      await fetchProducts();
    },
    [fetchProducts]
  );

  return {
    products,
    loading,
    error,
    refresh: fetchProducts,
    addProduct,
    addProducts,
    updateProduct,
    deleteProduct,
  };
}
