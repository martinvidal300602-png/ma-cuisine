// src/components/Alerts/AlertsList.jsx
import Badge from '../UI/Badge';
import { joursRestants } from '../../hooks/useAlerts';

function LigneProduit({ product }) {
  const jours = joursRestants(product.date_expiration);
  let badge;
  if (jours < 0) badge = <Badge variant="danger">Périmé depuis {Math.abs(jours)} j</Badge>;
  else if (jours === 0) badge = <Badge variant="warn">Aujourd'hui</Badge>;
  else if (jours <= 3) badge = <Badge variant="warn">{jours} j</Badge>;
  else badge = <Badge variant="ok">{jours} j</Badge>;

  return (
    <li className="bg-card rounded-card border border-border p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{product.nom}</p>
        <p className="text-xs text-muted truncate">
          {product.emplacement ?? '—'}
          {product.marque ? ` · ${product.marque}` : ''}
        </p>
      </div>
      {badge}
    </li>
  );
}

function Section({ titre, produits }) {
  if (produits.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
        {titre} <span className="font-num">({produits.length})</span>
      </h2>
      <ul className="space-y-2">
        {produits.map((p) => (
          <LigneProduit key={p.id} product={p} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Trois sections : périmés / expire dans 3 jours / cette semaine,
 * avec un message encourageant si tout va bien.
 */
export default function AlertsList({ perimes, expirentBientot, cetteSemaine }) {
  const vide = perimes.length === 0 && expirentBientot.length === 0 && cetteSemaine.length === 0;

  if (vide) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3" aria-hidden="true">🎉</div>
        <p className="font-semibold">Tout est sous contrôle !</p>
        <p className="text-muted text-sm mt-1">Aucun produit ne périme dans les 7 prochains jours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section titre="Périmés" produits={perimes} />
      <Section titre="Expire dans 3 jours" produits={expirentBientot} />
      <Section titre="Cette semaine" produits={cetteSemaine} />
    </div>
  );
}
