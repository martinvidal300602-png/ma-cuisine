// src/hooks/useAlerts.js
import { useMemo } from 'react';

/** Renvoie la date du jour à minuit (heure locale). */
function aujourdhui() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Nombre de jours entre aujourd'hui et la date d'expiration (négatif = périmé). */
export function joursRestants(dateExpiration) {
  if (!dateExpiration) return null;
  const exp = new Date(dateExpiration + 'T00:00:00');
  const diff = exp.getTime() - aujourdhui().getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Classe les produits en trois groupes d'alertes :
 * - périmés (date < aujourd'hui)
 * - expirent dans 0 à 3 jours
 * - expirent cette semaine (4 à 7 jours)
 */
export function useAlerts(products) {
  return useMemo(() => {
    const perimes = [];
    const expirentBientot = [];
    const cetteSemaine = [];

    for (const p of products) {
      const jours = joursRestants(p.date_expiration);
      if (jours === null) continue;
      if (jours < 0) perimes.push(p);
      else if (jours <= 3) expirentBientot.push(p);
      else if (jours <= 7) cetteSemaine.push(p);
    }

    const alertCount = perimes.length + expirentBientot.length;

    return { perimes, expirentBientot, cetteSemaine, alertCount };
  }, [products]);
}
