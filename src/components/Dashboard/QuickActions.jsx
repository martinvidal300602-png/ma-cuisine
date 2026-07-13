// src/components/Dashboard/QuickActions.jsx
import { Camera, Barcode, ReceiptText, PencilLine } from 'lucide-react';

const ACTIONS = [
  { id: 'barcode', label: 'Scanner un produit', icon: Barcode },
  { id: 'photo', label: 'Photographier un emplacement', icon: Camera },
  { id: 'receipt', label: 'Scanner un ticket', icon: ReceiptText },
  { id: 'manual', label: 'Ajouter manuellement', icon: PencilLine },
];

/**
 * Raccourcis d'ajout : les 4 modes en un toucher depuis l'accueil.
 */
export default function QuickActions({ onSelect }) {
  return (
    <section aria-label="Ajouter au stock">
      <h2 className="font-display font-bold text-base mb-2">Ajouter au stock</h2>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ id, label, icon: IconCmp }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="pressable min-h-[88px] bg-card rounded-card border border-border py-3 px-2 flex flex-col items-center justify-center gap-1.5"
          >
            <span className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <IconCmp size={18} strokeWidth={1.9} />
            </span>
            <span className="text-xs font-semibold leading-tight text-center px-1">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
