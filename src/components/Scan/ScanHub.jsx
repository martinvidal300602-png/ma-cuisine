// src/components/Scan/ScanHub.jsx
import { Camera, Barcode, ReceiptText, PencilLine, ChevronRight } from 'lucide-react';
import Sheet from '../UI/Sheet';

const MODES = [
  {
    id: 'barcode',
    icon: Barcode,
    title: 'Code-barres',
    desc: 'Fiche pré-remplie depuis OpenFoodFacts.',
  },
  {
    id: 'photo',
    icon: Camera,
    title: 'Photo d’un emplacement',
    desc: 'Détectez plusieurs produits, puis vérifiez-les.',
  },
  {
    id: 'receipt',
    icon: ReceiptText,
    title: 'Ticket de caisse',
    desc: 'Ajoute les achats au stock et met à jour la liste.',
  },
  {
    id: 'manual',
    icon: PencilLine,
    title: 'Saisie manuelle',
    desc: 'Remplissez la fiche vous-même.',
  },
];

/**
 * Hub de scan : la feuille qui s'ouvre depuis le bouton central.
 */
export default function ScanHub({ onSelect, onClose }) {
  return (
    <Sheet title="Scanner" onClose={onClose}>
      <p className="text-sm text-muted -mt-1 mb-3">Choisissez ce que vous avez devant vous.</p>
      <div className="space-y-2">
        {MODES.map(({ id, icon: IconCmp, title, desc }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="pressable w-full bg-card rounded-card border border-border shadow-card p-3.5 flex items-center gap-3.5 text-left"
          >
            <span className="w-11 h-11 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
              <IconCmp size={21} strokeWidth={1.9} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-sm">{title}</span>
              <span className="block text-xs text-muted mt-0.5">{desc}</span>
            </span>
            <ChevronRight size={16} className="text-muted shrink-0" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
