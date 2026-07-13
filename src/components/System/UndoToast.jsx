import { RotateCcw, X } from 'lucide-react';

export default function UndoToast({ entry, onUndo, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[55] px-4 pointer-events-none">
      <div className="max-w-app mx-auto pointer-events-auto bg-text text-bg rounded-card px-3 py-2.5 shadow-sheet flex items-center gap-2">
        <span className="text-sm font-medium flex-1">{entry.error || entry.label}</span>
        {!entry.error && <button type="button" disabled={entry.busy} onClick={onUndo} className="pressable min-h-9 px-2 text-sm font-semibold inline-flex items-center gap-1.5 text-accent-light"><RotateCcw size={15} />{entry.busy ? 'Annulation…' : 'Annuler'}</button>}
        <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center opacity-70"><X size={15} /></button>
      </div>
    </div>
  );
}
