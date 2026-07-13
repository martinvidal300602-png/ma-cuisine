// src/components/UI/MobileHeader.jsx
import { ChevronLeft } from 'lucide-react';

/**
 * En-tête d'écran : grand titre, sous-titre, retour optionnel, action à droite.
 */
export default function MobileHeader({ title, subtitle, onBack, right }) {
  return (
    <header className="mb-4 flex items-start gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-9 h-9 mt-0.5 -ml-1 rounded-full border border-border bg-card flex items-center justify-center text-text pressable shrink-0"
        >
          <ChevronLeft size={19} strokeWidth={2} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-extrabold text-[26px] leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 pt-1">{right}</div>}
    </header>
  );
}
