// src/hooks/useProducts.js
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getConsumeMode, quantiteConsommation } from '../lib/productConsumption';
import { recordEvent, recordProductHistory } from '../lib/eventLog';
import { recordStockEvidence } from '../lib/stockEvidencePersistence';

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
      const { data, error: err } = await supabase.from('produits').insert([product]).select('*').single();
      if (err) throw new Error("Ajout impossible : " + err.message);
      void recordEvent({
        type: 'product_added',
        entityType: 'produit',
        entityId: data?.id,
        title: data?.nom || product.nom,
        detail: `Ajouté dans ${data?.emplacement || product.emplacement || 'la cuisine'}`,
        payload: { after: data || product },
        undoSeconds: 8,
      });
      void recordProductHistory({
        product: data || product,
        added: data?.quantite ?? product.quantite ?? 1,
        source: product.source || inferSource(product),
      });
      void recordStockEvidence(data?.id, product.source || inferSource(product));
      await fetchProducts();
      return data;
    },
    [fetchProducts]
  );

  /** Ajoute plusieurs produits en une seule requête. */
  const addProducts = useCallback(
    async (list, options = {}) => {
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
      void recordEvent({
        type: 'products_added',
        entityType: 'produit',
        title: `${data?.length || list.length} produits ajoutés`,
        detail: sourceDetail(options.source || inferSource(list[0])),
        payload: { ids: (data || []).map((product) => product.id), source: options.source || inferSource(list[0]) },
        undoSeconds: 8,
      });
      for (const product of data || list) {
        void recordProductHistory({
          product,
          added: product.quantite ?? 1,
          source: options.source || product.source || inferSource(product),
        });
        void recordStockEvidence(product.id, normalizeEvidenceSource(options.source || product.source || inferSource(product)));
      }
      await fetchProducts();
      return data ?? [];
    },
    [fetchProducts]
  );

  /** Met à jour des champs d'un produit. */
  const updateProduct = useCallback(
    async (id, fields) => {
      const before = products.find((product) => product.id === id);
      const { error: err } = await supabase
        .from('produits')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (err) throw new Error('Mise à jour impossible : ' + err.message);
      const oldQuantity = Number(before?.quantite || 0);
      const hasQuantity = Object.prototype.hasOwnProperty.call(fields, 'quantite');
      const newQuantity = hasQuantity ? Number(fields.quantite || 0) : oldQuantity;
      const delta = newQuantity - oldQuantity;
      void recordEvent({
        type: delta < 0 ? 'product_consumed' : delta > 0 ? 'product_restocked' : 'product_updated',
        entityType: 'produit',
        entityId: id,
        title: before?.nom || 'Produit modifié',
        detail: hasQuantity ? `${oldQuantity} → ${newQuantity} ${before?.unite || ''}`.trim() : 'Informations mises à jour',
        payload: { before, fields },
        undoSeconds: 8,
      });
      if (hasQuantity && delta !== 0 && before) {
        void recordProductHistory({
          product: before,
          added: Math.max(0, delta),
          consumed: Math.max(0, -delta),
          result: newQuantity <= 0 ? 'consomme' : 'corrige',
          source: delta > 0 ? 'manuel' : 'consommation',
          metadata: { previousQuantity: oldQuantity, newQuantity },
        });
        void recordStockEvidence(id, delta < 0 ? 'consumed' : 'manual', { quantite: newQuantity });
      } else if (!hasQuantity) {
        void recordStockEvidence(id, 'manual');
      }
      await fetchProducts();
    },
    [fetchProducts, products]
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
      const before = products.find((product) => product.id === id);
      const { error: err } = await supabase.from('produits').delete().eq('id', id);
      if (err) throw new Error('Suppression impossible : ' + err.message);
      if (before) {
        void recordEvent({
          type: 'product_deleted',
          entityType: 'produit',
          entityId: id,
          title: before.nom,
          detail: 'Retiré du stock',
          payload: { before },
          undoSeconds: 8,
        });
        void recordProductHistory({
          product: before,
          consumed: Math.max(0, Number(before.quantite || 0)),
          result: isExpired(before.date_expiration) ? 'gaspille' : 'consomme',
          source: 'suppression',
        });
      }
      await fetchProducts();
    },
    [fetchProducts, products]
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

function inferSource(product) {
  if (product?.code_barres) return 'code_barres';
  if (product?.photo_url || product?.confidence) return 'photo';
  return 'manuel';
}

function sourceDetail(source) {
  if (source === 'photo') return 'Ajoutés après validation d’une photo';
  if (source === 'receipt') return 'Ajoutés depuis un ticket validé';
  if (source === 'barcode' || source === 'code_barres') return 'Ajoutés après scan';
  return 'Ajoutés au stock';
}

function normalizeEvidenceSource(source) {
  if (source === 'receipt') return 'receipt';
  if (source === 'photo') return 'photo';
  return 'manual';
}

function isExpired(value) {
  if (!value) return false;
  const expiration = new Date(`${value}T23:59:59`);
  return !Number.isNaN(expiration.getTime()) && expiration < new Date();
}
