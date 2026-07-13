// src/components/Dashboard/KitchenOverview.jsx
import { Refrigerator, Archive, LayoutPanelTop, FlaskConical, ChevronRight } from 'lucide-react';
import { EMPLACEMENTS } from '../Add/ManualForm';
import { joursRestants } from '../../hooks/useAlerts';

const LOCATION_ICONS = {
  Frigo: Refrigerator,
  'Placard sous fenêtre': Archive,
  'Plan de travail': LayoutPanelTop,
  'Placard épices': FlaskConical,
};

/**
 * « Ma cuisine » : les 4 emplacements officiels en un coup d'œil,
 * avec compteur de produits et nombre d'urgences.
 */
export default function KitchenOverview({ products, onOpenLocation }) {
  const stats = EMPLACEMENTS.map((emplacement) => {
    const list = products.filter((p) => p.emplacement === emplacement);
    const urgents = list.filter((p) => {
      const j = joursRestants(p.date_expiration);
      return j !== null && j <= 3;
    }).length;
    return { emplacement, count: list.length, urgents };
  });

  return (
    <section aria-label="Ma cuisine">
      <h2 className="font-display font-bold text-base mb-2">Ma cuisine</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map(({ emplacement, count, urgents }) => {
          const IconCmp = LOCATION_ICONS[emplacement] ?? Archive;
          return (
            <button
              key={emplacement}
              type="button"
              onClick={() => onOpenLocation(emplacement)}
              className="pressable bg-card rounded-card border border-border shadow-card p-3 text-left"
            >
              <div className="flex items-start justify-between">
                <span className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center">
                  <IconCmp size={18} strokeWidth={1.9} />
                </span>
                <ChevronRight size={15} className="text-muted mt-1" />
              </div>
              <p className="font-semibold text-[13px] leading-tight mt-2.5">{emplacement}</p>
              <p className="text-xs text-muted mt-0.5">
                <span className="font-num">{count}</span> produit{count > 1 ? 's' : ''}
                {urgents > 0 && (
                  <span className="text-fresh-soon font-semibold"> · {urgents} urgent{urgents > 1 ? 's' : ''}</span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
