import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { recordEvent } from '../lib/eventLog';
import {
  cacheShoppingItems,
  flushShoppingQueue,
  queueShoppingAdd,
  queueShoppingDelete,
  queueShoppingUpdate,
  readCachedShoppingItems,
  shoppingQueueSize,
} from '../lib/offlineShopping';

export function useShoppingList() {
  const [items, setItems] = useState(readCachedShoppingItems);
  const itemsRef = useRef(items);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const [syncing, setSyncing] = useState(false);
  const [offlinePending, setOfflinePending] = useState(shoppingQueueSize);

  const replaceItems = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
    cacheShoppingItems(next);
  }, []);

  const fetchItems = useCallback(async () => {
    if (navigator.onLine === false) {
      setOnline(false);
      setLoading(false);
      return;
    }
    setError(null);
    const { data, error: requestError } = await supabase
      .from('courses')
      .select('*')
      .order('coche', { ascending: true })
      .order('created_at', { ascending: true });

    if (requestError) {
      setError(itemsRef.current.length ? 'Liste affichée depuis le cache. Synchronisation indisponible.' : `Impossible de charger la liste : ${requestError.message}`);
      setLoading(false);
      return;
    }
    replaceItems(data ?? []);
    setOnline(true);
    setLoading(false);
  }, [replaceItems]);

  const syncPending = useCallback(async () => {
    if (navigator.onLine === false || shoppingQueueSize() === 0) return;
    setSyncing(true);
    setError(null);
    try {
      await flushShoppingQueue(supabase);
      setOfflinePending(0);
      await fetchItems();
    } catch (syncError) {
      setError(`Synchronisation en attente : ${syncError.message}`);
      setOfflinePending(shoppingQueueSize());
    } finally {
      setSyncing(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    fetchItems().then(syncPending);

    const channel = supabase
      .channel('courses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        if (navigator.onLine !== false && shoppingQueueSize() === 0) fetchItems();
      })
      .subscribe();

    const handleOnline = () => { setOnline(true); syncPending(); };
    const handleOffline = () => { setOnline(false); setLoading(false); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchItems, syncPending]);

  const offlineAdd = useCallback((payload) => {
    const id = queueShoppingAdd(payload);
    const local = { ...payload, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    replaceItems([...itemsRef.current, local]);
    setOfflinePending(shoppingQueueSize());
    setOnline(false);
    return local;
  }, [replaceItems]);

  const addItem = useCallback(async (item) => {
    const payload = normalizePayload(item);
    if (!payload.nom) throw new Error('Le nom du produit est obligatoire.');
    if (navigator.onLine === false) return offlineAdd(payload);

    const { data, error: requestError } = await supabase.from('courses').insert([payload]).select('*').single();
    if (requestError) {
      if (isNetworkError(requestError)) return offlineAdd(payload);
      throw new Error(`Ajout à la liste impossible : ${requestError.message}`);
    }
    replaceItems([...itemsRef.current, data]);
    void recordEvent({
      type: 'shopping_added',
      entityType: 'course',
      entityId: data.id,
      title: data.nom,
      detail: 'Ajouté à la liste de courses',
      payload: { after: data },
      undoSeconds: 8,
    });
    return data;
  }, [offlineAdd, replaceItems]);

  const updateItem = useCallback(async (id, fields) => {
    if (navigator.onLine === false || String(id).startsWith('offline-')) {
      queueShoppingUpdate(id, fields);
      replaceItems(itemsRef.current.map((item) => item.id === id ? { ...item, ...fields, updated_at: new Date().toISOString() } : item));
      setOfflinePending(shoppingQueueSize());
      return;
    }
    const before = itemsRef.current.find((item) => item.id === id);
    const { data, error: requestError } = await supabase.from('courses').update(fields).eq('id', id).select('*').single();
    if (requestError) {
      if (isNetworkError(requestError)) {
        queueShoppingUpdate(id, fields);
        replaceItems(itemsRef.current.map((item) => item.id === id ? { ...item, ...fields, updated_at: new Date().toISOString() } : item));
        setOfflinePending(shoppingQueueSize());
        setOnline(false);
        return;
      }
      throw new Error(`Mise à jour impossible : ${requestError.message}`);
    }
    replaceItems(itemsRef.current.map((item) => item.id === id ? data : item));
    if (before) {
      void recordEvent({
        type: fields.coche === true ? 'shopping_checked' : fields.coche === false ? 'shopping_unchecked' : 'shopping_updated',
        entityType: 'course',
        entityId: id,
        title: before.nom,
        detail: fields.coche === true ? 'Mis dans le chariot' : fields.coche === false ? 'Remis dans la liste' : 'Article modifié',
        payload: { before, fields },
        undoSeconds: 8,
      });
    }
  }, [replaceItems]);

  const deleteItem = useCallback(async (id) => {
    if (navigator.onLine === false || String(id).startsWith('offline-')) {
      queueShoppingDelete(id);
      replaceItems(itemsRef.current.filter((item) => item.id !== id));
      setOfflinePending(shoppingQueueSize());
      return;
    }
    const before = itemsRef.current.find((item) => item.id === id);
    const { error: requestError } = await supabase.from('courses').delete().eq('id', id);
    if (requestError) {
      if (isNetworkError(requestError)) {
        queueShoppingDelete(id);
        replaceItems(itemsRef.current.filter((item) => item.id !== id));
        setOfflinePending(shoppingQueueSize());
        setOnline(false);
        return;
      }
      throw new Error(`Suppression impossible : ${requestError.message}`);
    }
    replaceItems(itemsRef.current.filter((item) => item.id !== id));
    if (before) void recordEvent({
      type: 'shopping_removed',
      entityType: 'course',
      entityId: id,
      title: before.nom,
      detail: 'Retiré de la liste de courses',
      payload: { before },
      undoSeconds: 8,
    });
  }, [replaceItems]);

  const deleteItems = useCallback(async (ids) => {
    const cleanIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!cleanIds.length) return;
    if (navigator.onLine === false || cleanIds.some((id) => String(id).startsWith('offline-'))) {
      cleanIds.forEach(queueShoppingDelete);
      replaceItems(itemsRef.current.filter((item) => !cleanIds.includes(item.id)));
      setOfflinePending(shoppingQueueSize());
      return;
    }
    const before = itemsRef.current.filter((item) => cleanIds.includes(item.id));
    const { error: requestError } = await supabase.from('courses').delete().in('id', cleanIds);
    if (requestError) {
      if (isNetworkError(requestError)) {
        cleanIds.forEach(queueShoppingDelete);
        replaceItems(itemsRef.current.filter((item) => !cleanIds.includes(item.id)));
        setOfflinePending(shoppingQueueSize());
        setOnline(false);
        return;
      }
      throw new Error(`Suppression de la liste impossible : ${requestError.message}`);
    }
    replaceItems(itemsRef.current.filter((item) => !cleanIds.includes(item.id)));
    if (before.length) void recordEvent({
      type: 'shopping_removed',
      entityType: 'course',
      title: `${before.length} articles retirés`,
      detail: 'Liste de courses nettoyée',
      payload: { before },
      undoSeconds: 8,
    });
  }, [replaceItems]);

  const clearChecked = useCallback(async () => {
    const checkedIds = items.filter((item) => item.coche).map((item) => item.id);
    return deleteItems(checkedIds);
  }, [deleteItems, items]);

  return { items, loading, error, online, syncing, offlinePending, refresh: fetchItems, syncPending, addItem, updateItem, deleteItem, deleteItems, clearChecked };
}

function normalizePayload(item) {
  return {
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
}

function isNetworkError(error) {
  return navigator.onLine === false || /fetch|network|connexion/i.test(String(error?.message || ''));
}
