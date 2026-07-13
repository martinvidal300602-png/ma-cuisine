// src/components/UI/PwaInstallHint.jsx
import { useState } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';

const DISMISS_KEY = 'ma-cuisine:pwa-hint-dismissed';

function estStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true
  );
}

/**
 * Invite à installer l'app sur l'écran d'accueil iPhone (Safari).
 * Ne s'affiche pas si l'app est déjà installée ou si l'invite a été fermée.
 */
export default function PwaInstallHint() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed || estStandalone()) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // stockage indisponible : l'invite reviendra, sans gravité
    }
  };

  return (
    <section className="bg-accent-light rounded-card p-4 relative">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Masquer cette astuce"
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-card/70 flex items-center justify-center text-muted pressable"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
      <h2 className="font-display font-bold text-sm text-accent pr-8">
        Installer Ma Cuisine sur l'iPhone
      </h2>
      <ol className="text-sm text-text mt-2 space-y-1.5">
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-card flex items-center justify-center shrink-0">
            <Share size={13} strokeWidth={2.2} className="text-accent" />
          </span>
          Dans Safari, touchez le bouton Partager.
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-card flex items-center justify-center shrink-0">
            <SquarePlus size={13} strokeWidth={2.2} className="text-accent" />
          </span>
          Choisissez « Sur l'écran d'accueil ».
        </li>
      </ol>
      <p className="text-xs text-muted mt-2">
        L'app s'ouvrira en plein écran, comme une application native.
      </p>
    </section>
  );
}
