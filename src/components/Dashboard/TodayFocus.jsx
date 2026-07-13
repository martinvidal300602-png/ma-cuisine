// src/components/Dashboard/TodayFocus.jsx
import { PartyPopper, ChevronRight } from 'lucide-react';
import DecisionCard from './DecisionCard';

/**
 * « À faire maintenant » : au plus trois décisions, sans carrousel tronqué.
 */
export default function TodayFocus({ perimes, expirentBientot, actions, onSeeAll }) {
  const urgents = [...perimes, ...expirentBientot];
  const priorites = urgents.slice(0, 3);

  return (
    <section aria-label="À faire maintenant">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-base">À faire maintenant</h2>
        {urgents.length > 0 && (
          <button
            type="button"
            onClick={onSeeAll}
            className="pressable inline-flex items-center gap-0.5 text-accent text-xs font-semibold"
          >
            Tout voir <ChevronRight size={14} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {urgents.length === 0 ? (
        <div className="bg-card rounded-card border border-border shadow-card p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-fresh-ok-bg text-fresh-ok flex items-center justify-center shrink-0">
            <PartyPopper size={19} strokeWidth={1.9} />
          </span>
          <div>
            <p className="font-semibold text-sm">Rien ne presse aujourd'hui</p>
            <p className="text-xs text-muted">Aucun produit ne périme dans les 3 prochains jours.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {priorites.map((p) => (
            <DecisionCard key={p.id} product={p} actions={actions} />
          ))}
        </div>
      )}
    </section>
  );
}
