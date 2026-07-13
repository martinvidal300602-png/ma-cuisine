import { useCallback, useEffect, useRef, useState } from 'react';

export function useUndoManager() {
  const [entry, setEntry] = useState(null);
  const timeoutRef = useRef(null);

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setEntry(null);
  }, []);

  const offer = useCallback((label, undo, duration = 8000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = globalThis.crypto?.randomUUID?.() || String(Date.now());
    setEntry({ id, label, undo, busy: false, error: null });
    timeoutRef.current = setTimeout(() => setEntry((current) => current?.id === id ? null : current), duration);
  }, []);

  const undo = useCallback(async () => {
    if (!entry?.undo || entry.busy) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setEntry((current) => current ? { ...current, busy: true, error: null } : current);
    try {
      await entry.undo();
      setEntry(null);
    } catch (error) {
      setEntry((current) => current ? { ...current, busy: false, error: error.message || 'Annulation impossible.' } : current);
    }
  }, [entry]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  return { entry, offer, undo, clear };
}
