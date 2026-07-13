import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'ma-cuisine:v3-activity';
const MAX_EVENTS = 80;

function readStoredEvents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    // L'activité reste disponible en mémoire si le stockage privé iOS est saturé.
  }
}

function event(type, title, detail, timestamp, entityId, source = 'history') {
  return {
    id: `${source}:${type}:${entityId || title}:${timestamp || Date.now()}`,
    type,
    title,
    detail,
    timestamp: timestamp || new Date().toISOString(),
  };
}

function mergeEvents(current, incoming) {
  const byId = new Map();
  [...incoming, ...current].forEach((item) => {
    if (item?.id && item?.timestamp && !byId.has(item.id)) byId.set(item.id, item);
  });
  return Array.from(byId.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, MAX_EVENTS);
}

function initialEvents(products, shoppingItems, sessions) {
  const productEvents = products.map((product) => {
    const created = product.created_at;
    const updated = product.updated_at;
    const changed = updated && created && Math.abs(new Date(updated) - new Date(created)) > 2000;
    return changed
      ? event('product_updated', product.nom, `${product.emplacement || 'Stock'} · quantité ${product.quantite ?? '—'}`, updated, product.id)
      : event('product_added', product.nom, `Ajouté dans ${product.emplacement || 'la cuisine'}`, created || updated, product.id);
  });

  const shoppingEvents = shoppingItems.map((item) =>
    event(
      item.coche ? 'shopping_checked' : 'shopping_added',
      item.nom,
      item.coche ? 'Mis dans le chariot' : 'Ajouté à la liste de courses',
      item.updated_at || item.created_at,
      item.id,
    ),
  );

  const sessionEvents = sessions.flatMap((session) => {
    const entries = [
      event('shopping_started', 'Courses commencées', session.started_by || 'Session familiale', session.started_at, session.id),
    ];
    if (session.ended_at) {
      entries.push(
        event(
          session.status === 'cancelled' ? 'shopping_cancelled' : 'shopping_finished',
          session.status === 'cancelled' ? 'Courses annulées' : 'Courses terminées',
          session.started_by || 'Session familiale',
          session.ended_at,
          session.id,
        ),
      );
    }
    return entries;
  });

  return mergeEvents([], [...productEvents, ...shoppingEvents, ...sessionEvents]);
}

function mapById(list) {
  return new Map(list.map((item) => [item.id, item]));
}

/**
 * Chronologie locale alimentée par les données Supabase déjà présentes.
 * Les comparaisons de snapshots capturent aussi les changements Realtime reçus
 * depuis un autre iPhone, sans nécessiter de table d'audit supplémentaire.
 */
export function useActivityFeed({ products, productsLoading, shoppingItems, shoppingLoading, sessions, sessionsLoading }) {
  const [events, setEvents] = useState(readStoredEvents);
  const productSnapshot = useRef(null);
  const shoppingSnapshot = useRef(null);
  const sessionSnapshot = useRef(null);
  const seeded = useRef(false);

  const addEvents = useCallback((incoming) => {
    if (!incoming.length) return;
    setEvents((current) => {
      const next = mergeEvents(current, incoming);
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (productsLoading || shoppingLoading || sessionsLoading || seeded.current) return;
    seeded.current = true;
    productSnapshot.current = mapById(products);
    shoppingSnapshot.current = mapById(shoppingItems);
    sessionSnapshot.current = mapById(sessions);
    if (events.length === 0) addEvents(initialEvents(products, shoppingItems, sessions));
  }, [addEvents, events.length, products, productsLoading, sessions, sessionsLoading, shoppingItems, shoppingLoading]);

  useEffect(() => {
    if (!seeded.current || productsLoading) return;
    const before = productSnapshot.current || new Map();
    const after = mapById(products);
    const changes = [];

    for (const product of products) {
      const previous = before.get(product.id);
      if (!previous) {
        changes.push(event('product_added', product.nom, `Ajouté dans ${product.emplacement}`, null, product.id, 'live'));
        continue;
      }
      const oldQuantity = Number(previous.quantite || 0);
      const newQuantity = Number(product.quantite || 0);
      if (newQuantity < oldQuantity) {
        changes.push(event('product_consumed', product.nom, `${oldQuantity} → ${newQuantity} ${product.unite || ''}`.trim(), null, product.id, 'live'));
      } else if (newQuantity > oldQuantity) {
        changes.push(event('product_restocked', product.nom, `${oldQuantity} → ${newQuantity} ${product.unite || ''}`.trim(), null, product.id, 'live'));
      } else if (previous.emplacement !== product.emplacement) {
        changes.push(event('product_moved', product.nom, `${previous.emplacement} → ${product.emplacement}`, null, product.id, 'live'));
      }
    }
    for (const previous of before.values()) {
      if (!after.has(previous.id)) {
        changes.push(event('product_deleted', previous.nom, 'Retiré du stock', null, previous.id, 'live'));
      }
    }

    productSnapshot.current = after;
    addEvents(changes);
  }, [addEvents, products, productsLoading]);

  useEffect(() => {
    if (!seeded.current || shoppingLoading) return;
    const before = shoppingSnapshot.current || new Map();
    const after = mapById(shoppingItems);
    const changes = [];

    for (const item of shoppingItems) {
      const previous = before.get(item.id);
      if (!previous) {
        changes.push(event('shopping_added', item.nom, 'Ajouté à la liste de courses', null, item.id, 'live'));
      } else if (Boolean(previous.coche) !== Boolean(item.coche)) {
        changes.push(
          event(
            item.coche ? 'shopping_checked' : 'shopping_unchecked',
            item.nom,
            item.coche ? 'Mis dans le chariot' : 'Remis dans la liste',
            null,
            item.id,
            'live',
          ),
        );
      }
    }
    for (const previous of before.values()) {
      if (!after.has(previous.id)) {
        changes.push(event('shopping_removed', previous.nom, 'Retiré de la liste de courses', null, previous.id, 'live'));
      }
    }

    shoppingSnapshot.current = after;
    addEvents(changes);
  }, [addEvents, shoppingItems, shoppingLoading]);

  useEffect(() => {
    if (!seeded.current || sessionsLoading) return;
    const before = sessionSnapshot.current || new Map();
    const after = mapById(sessions);
    const changes = [];

    for (const session of sessions) {
      const previous = before.get(session.id);
      if (!previous) {
        changes.push(event('shopping_started', 'Courses commencées', session.started_by || 'Session familiale', session.started_at, session.id, 'live'));
      } else if (previous.status !== session.status) {
        changes.push(
          event(
            session.status === 'cancelled' ? 'shopping_cancelled' : 'shopping_finished',
            session.status === 'cancelled' ? 'Courses annulées' : 'Courses terminées',
            session.started_by || 'Session familiale',
            session.ended_at,
            session.id,
            'live',
          ),
        );
      }
    }

    sessionSnapshot.current = after;
    addEvents(changes);
  }, [addEvents, sessions, sessionsLoading]);

  const clear = useCallback(() => {
    setEvents([]);
    persist([]);
  }, []);

  return { events, clear };
}
