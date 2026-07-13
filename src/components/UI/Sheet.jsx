// src/components/UI/Sheet.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Feuille modale ancrée en bas (style iOS).
 * Ferme au toucher du fond, au bouton ou à Échap.
 */
export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="sheet-backdrop absolute inset-0 bg-black/45 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel relative w-full max-w-app bg-bg rounded-t-[22px] shadow-sheet px-4 pt-3 pb-6 pb-safe max-h-[88vh] overflow-y-auto"
      >
        <div className="w-10 h-1.5 rounded-full bg-border mx-auto mb-3" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display font-extrabold text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted pressable"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
