// src/hooks/useProducts.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getConsumeMode, quantiteConsommation } from '../lib/productConsumption';

const isDev = import.meta.env.DEV;

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

      const { data, error: err } = await supabase.from('produits').insert(list).select('*');

      if (isDev) {
        console.log('[supabase-stock] addProducts payload', list);
        console.log('[supabase-stock] addProducts response', data);
        console.log('[supabase-stock] addProducts error', err);
      }

      if (err) {
        const details = [err.message, err.details, err.hint].filter(Boolean).join(' ');
        throw new Error('Ajout en masse impossible : ' + details);
      }
      await fetchProducts();
      return data ?? [];
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

  const updateProductQuantity = useCallback(
    async (id, newQuantity, options = {}) => {
      const quantity = quantiteConsommation(newQuantity, options.mode);
      await updateProduct(id, { quantite: quantity });
      return quantity;
    },
    [updateProduct]
  );

  const decrementProduct = useCallback(
    async (id, amount = 1) => {
      const product = products.find((item) => item.id === id);
      if (!product) throw new Error('Produit introuvable.');

      const mode = getConsumeMode(product);
      const current = Number(product.quantite || 0);
      const next = quantiteConsommation(current - Number(amount || 1), 'count');
      await updateProductQuantity(id, next, { mode });
      return next;
    },
    [products, updateProductQuantity]
  );

  const consumeProduct = useCallback(
    async (product, options = {}) => {
      if (!product?.id) throw new Error('Produit introuvable.');

      const mode = getConsumeMode(product);
      const current = Number(product.quantite || 0);
      const next =
        options.remainingQuantity !== undefined
          ? quantiteConsommation(options.remainingQuantity, mode)
          : quantiteConsommation(current - Number(options.amount || 1), mode);

      if (next <= 0) {
        return { previousQuantity: current, newQuantity: 0, needsConfirmation: true };
      }

      await updateProductQuantity(product.id, next, { mode });
      return { previousQuantity: current, newQuantity: next, needsConfirmation: false };
    },
    [updateProductQuantity]
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
    updateProductQuantity,
    decrementProduct,
    consumeProduct,
    deleteProduct,
  };
}
