// src/components/Alerts/AlertsList.jsx
import Icon from '../UI/Icon';
import { joursRestants } from '../../hooks/useAlerts';
import { jChip, toneClasses, toneVar } from '../../lib/freshness';

function LigneProduit({ product }) {
  const chip = jChip(joursRestants(product.date_expiration));

  return (
    <li
      className="bg-card rounded-card border border-border shadow-card p-3 pl-4 flex items-center justify-between gap-3"
      style={{ boxShadow: `inset 3px 0 0 ${toneVar(chip.tone)}` }}
    >
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{product.nom}</p>
        <p className="text-xs text-muted truncate mt-0.5 flex items-center gap-1">
          <Icon name="pin" size={11} />
          {product.emplacement ?? '—'}
          {product.marque ? ` · ${product.marque}` : ''}
        </p>
      </div>
      <div className={`j-chip ${toneClasses(chip.tone)}`} role="img" aria-label={chip.aria}>
        <span className="j-num">{chip.num}</span>
        <span className="j-lab">{chip.label}</span>
      </div>
    </li>
  );
}

function Section({ titre, tone, produits }) {
  if (produits.length === 0) return null;
  return (
    <section aria-label={titre}>
      <h2 className="flex items-center gap-2 pb-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: toneVar(tone) }}
          aria-hidden="true"
        />
        <span className="font-display font-bold text-[13px] uppercase tracking-wide">{titre}</span>
        <span className="font-num text-xs text-muted">{produits.length}</span>
        <span className="flex-1 border-t border-border" aria-hidden="true" />
      </h2>
      <ul className="space-y-2.5">
        {produits.map((p) => (
          <LigneProduit key={p.id} product={p} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Trois sections : périmés / à manger vite / cette semaine,
 * avec un message encourageant si tout va bien.
 */
export default function AlertsList({ perimes, expirentBientot, cetteSemaine }) {
  const vide = perimes.length === 0 && expirentBientot.length === 0 && cetteSemaine.length === 0;

  if (vide) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
        <p className="font-display font-bold text-lg">Tout est sous contrôle</p>
        <p className="text-muted text-sm mt-1">Aucun produit ne périme dans les 7 prochains jours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section titre="Périmés" tone="expired" produits={perimes} />
      <Section titre="À manger vite" tone="soon" produits={expirentBientot} />
      <Section titre="Cette semaine" tone="week" produits={cetteSemaine} />
    </div>
  );
}
