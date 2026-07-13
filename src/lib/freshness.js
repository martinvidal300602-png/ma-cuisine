// src/lib/freshness.js
// Présentation de la fraîcheur : transforme « jours restants » en
// pastille, libellé et couleurs. Aucune logique métier ici.
import { joursRestants } from '../hooks/useAlerts';

/**
 * Buckets ordonnés du plus urgent au plus tranquille.
 * `tone` correspond aux tokens --fresh-* (voir index.css / tailwind.config.js).
 */
export const FRESHNESS_BUCKETS = [
  { id: 'expired', titre: 'Périmés', tone: 'expired' },
  { id: 'soon', titre: 'À manger vite', tone: 'soon' },
  { id: 'week', titre: 'Cette semaine', tone: 'week' },
  { id: 'ok', titre: 'Tranquille', tone: 'ok' },
  { id: 'none', titre: 'Sans date', tone: 'none' },
];

/** Bucket d'un nombre de jours restants (null = pas de date). */
export function bucketFromJours(jours) {
  if (jours === null || jours === undefined) return 'none';
  if (jours < 0) return 'expired';
  if (jours <= 3) return 'soon';
  if (jours <= 7) return 'week';
  return 'ok';
}

/** Bucket d'un produit. */
export function bucketFromProduct(product) {
  return bucketFromJours(joursRestants(product?.date_expiration));
}

/**
 * Contenu de la pastille « J » : gros chiffre + petit libellé.
 * Exemples : (12 → « 12 j / reste ») (0 → « auj. / expire ») (−2 → « −2 j / périmé »)
 */
export function jChip(jours) {
  if (jours === null || jours === undefined) {
    return { num: '—', label: 'sans date', tone: 'none', aria: 'Sans date de péremption' };
  }
  if (jours < 0) {
    return {
      num: `−${Math.abs(jours)} j`,
      label: 'périmé',
      tone: 'expired',
      aria: `Périmé depuis ${Math.abs(jours)} jour${Math.abs(jours) > 1 ? 's' : ''}`,
    };
  }
  if (jours === 0) {
    return { num: 'auj.', label: 'expire', tone: 'soon', aria: "Expire aujourd'hui" };
  }
  const tone = jours <= 3 ? 'soon' : jours <= 7 ? 'week' : 'ok';
  return {
    num: `${jours} j`,
    label: 'reste',
    tone,
    aria: `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`,
  };
}

/** Classes utilitaires Tailwind pour une tonalité de fraîcheur. */
export function toneClasses(tone) {
  const map = {
    expired: 'bg-fresh-expired-bg text-fresh-expired',
    soon: 'bg-fresh-soon-bg text-fresh-soon',
    week: 'bg-fresh-week-bg text-fresh-week',
    ok: 'bg-fresh-ok-bg text-fresh-ok',
    none: 'bg-fresh-none-bg text-fresh-none',
  };
  return map[tone] ?? map.none;
}

/** Couleur pleine (liseré de carte, points de section). */
export function toneVar(tone) {
  const map = {
    expired: 'var(--fresh-expired)',
    soon: 'var(--fresh-soon)',
    week: 'var(--fresh-week)',
    ok: 'var(--fresh-ok)',
    none: 'var(--fresh-none)',
  };
  return map[tone] ?? map.none;
}
