const ITEMS_KEY = 'ma-cuisine:v3-shopping-cache';
const QUEUE_KEY = 'ma-cuisine:v3-shopping-queue';

export function readCachedShoppingItems() {
  return readJson(ITEMS_KEY, []);
}

export function cacheShoppingItems(items) {
  writeJson(ITEMS_KEY, items);
}

export function readShoppingQueue() {
  return readJson(QUEUE_KEY, []);
}

export function queueShoppingAdd(payload) {
  const localId = `offline-${safeRandomId()}`;
  updateQueue((queue) => [...queue, operation('add', localId, payload)]);
  return localId;
}

export function queueShoppingUpdate(targetId, fields) {
  updateQueue((queue) => {
    if (String(targetId).startsWith('offline-')) {
      return queue.map((item) => item.type === 'add' && item.targetId === targetId
        ? { ...item, payload: { ...item.payload, ...fields } }
        : item);
    }
    const existing = queue.find((item) => item.type === 'update' && item.targetId === targetId);
    if (existing) {
      return queue.map((item) => item.id === existing.id ? { ...item, payload: { ...item.payload, ...fields } } : item);
    }
    return [...queue, operation('update', targetId, fields)];
  });
}

export function queueShoppingDelete(targetId) {
  updateQueue((queue) => {
    if (String(targetId).startsWith('offline-')) {
      return queue.filter((item) => item.targetId !== targetId);
    }
    return [...queue.filter((item) => !(item.type === 'update' && item.targetId === targetId)), operation('delete', targetId)];
  });
}

export async function flushShoppingQueue(supabase) {
  const queue = readShoppingQueue();
  let completed = 0;
  for (const item of queue) {
    let error;
    if (item.type === 'add') {
      ({ error } = await supabase.from('courses').insert([item.payload]));
    } else if (item.type === 'update') {
      ({ error } = await supabase.from('courses').update(item.payload).eq('id', item.targetId));
    } else if (item.type === 'delete') {
      ({ error } = await supabase.from('courses').delete().eq('id', item.targetId));
    }
    if (error) {
      updateQueue((current) => current.slice(completed));
      throw error;
    }
    completed += 1;
  }
  writeJson(QUEUE_KEY, []);
  return completed;
}

export function shoppingQueueSize() {
  return readShoppingQueue().length;
}

function operation(type, targetId, payload = null) {
  return { id: safeRandomId(), type, targetId, payload, createdAt: new Date().toISOString() };
}

function updateQueue(updater) {
  const next = updater(readShoppingQueue());
  writeJson(QUEUE_KEY, next);
  return next;
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
}

function safeRandomId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
