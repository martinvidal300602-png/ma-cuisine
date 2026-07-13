import { CloudOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner({ online, pending = 0, syncing = false, onSync }) {
  if (online && pending === 0 && !syncing) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[60] pt-safe pointer-events-none">
      <div className="max-w-app mx-auto px-4">
        <div className="pointer-events-auto tabbar-blur border border-border rounded-card px-3 py-2 flex items-center gap-2 shadow-card text-xs">
          {syncing ? <RefreshCw size={15} className="text-accent animate-spin" /> : <CloudOff size={15} className="text-fresh-soon" />}
          <span className="flex-1 font-medium">
            {syncing ? 'Synchronisation des courses…' : online ? `${pending} action${pending > 1 ? 's' : ''} à synchroniser` : `Hors connexion · ${pending} action${pending > 1 ? 's' : ''} en attente`}
          </span>
          {online && pending > 0 && !syncing && <button type="button" onClick={onSync} className="text-accent font-semibold min-h-8 px-2">Synchroniser</button>}
        </div>
      </div>
    </div>
  );
}
