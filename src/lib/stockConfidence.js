const STATES = {
  confirmed: { id: 'confirmed', label: 'Confirmé', tone: 'ok' },
  probable: { id: 'probable', label: 'Probable', tone: 'week' },
  uncertain: { id: 'uncertain', label: 'Incertain', tone: 'soon' },
  verify: { id: 'verify', label: 'À vérifier', tone: 'expired' },
  exhausted: { id: 'exhausted', label: 'Épuisé', tone: 'none' },
};

export const STOCK_STATES = Object.values(STATES);

export function calculateStockConfidence(product, now = new Date()) {
  if (Number(product?.quantite || 0) <= 0 || product?.stock_status === 'exhausted') {
    return result('exhausted', 1, 'Quantité à zéro', product, now);
  }

  if (product?.stock_status && STATES[product.stock_status]) {
    const explicit = STATES[product.stock_status];
    return result(explicit.id, normalizeScore(product.confidence_score, 0.8), 'État confirmé par une action récente', product, now);
  }

  const rawConfidence = normalizeDetectionConfidence(product);
  const absenceCount = Number(product?.absence_count || 0);
  if (absenceCount >= 2 || rawConfidence < 0.35 || product?.confidence === 'low') {
    return result('verify', Math.min(rawConfidence, 0.34), absenceCount >= 2 ? 'Absent de plusieurs photos' : 'Détection peu fiable', product, now);
  }

  const manualAge = ageInDays(product?.last_manual_update_at, now);
  const ticketAge = ageInDays(product?.last_ticket_at, now);
  const seenAge = ageInDays(product?.last_seen_at, now);
  const updatedAge = ageInDays(product?.updated_at || product?.created_at, now);
  const evidenceAge = minDefined(manualAge, ticketAge, seenAge, updatedAge);

  if (manualAge !== null && manualAge <= 14) {
    return result('confirmed', Math.max(rawConfidence, 0.92), 'Modifié manuellement récemment', product, now);
  }
  if (ticketAge !== null && ticketAge <= 10) {
    return result('confirmed', Math.max(rawConfidence, 0.9), 'Ajout confirmé par un ticket récent', product, now);
  }
  if (seenAge !== null && seenAge <= 3 && rawConfidence >= 0.65) {
    return result('confirmed', Math.max(rawConfidence, 0.88), 'Vu récemment sur une photo', product, now);
  }
  if (evidenceAge === null || evidenceAge > 30) {
    return result('uncertain', Math.min(rawConfidence, 0.45), 'Stock ancien sans confirmation récente', product, now);
  }
  if (evidenceAge > 10 || product?.date_expiration_estimee) {
    return result('probable', Math.min(Math.max(rawConfidence, 0.55), 0.79), 'Présence plausible, à reconfirmer', product, now);
  }
  return result('confirmed', Math.max(rawConfidence, 0.82), 'Stock mis à jour récemment', product, now);
}

export function stockStateCounts(products) {
  return products.reduce((counts, product) => {
    const state = calculateStockConfidence(product).id;
    counts[state] = (counts[state] || 0) + 1;
    return counts;
  }, {});
}

function result(id, score, reason, product, now) {
  const state = STATES[id];
  const lastEvidence = latestDate(
    product?.last_seen_at,
    product?.last_manual_update_at,
    product?.last_ticket_at,
    product?.last_consumed_at,
    product?.updated_at,
    product?.created_at,
  );
  return {
    ...state,
    score: Math.round(normalizeScore(score, 0.5) * 100) / 100,
    reason,
    lastEvidence,
    lastSeenLabel: lastEvidence ? relativeDate(lastEvidence, now) : 'Jamais confirmé',
  };
}

function normalizeDetectionConfidence(product) {
  if (Number.isFinite(Number(product?.confidence_score))) {
    return normalizeScore(product.confidence_score, 0.6);
  }
  const byLabel = { high: 0.9, medium: 0.62, low: 0.3 };
  return byLabel[product?.confidence] || 0.7;
}

function normalizeScore(value, fallback) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(1, Math.max(0, score));
}

function ageInDays(value, now) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}

function minDefined(...values) {
  const defined = values.filter((value) => value !== null);
  return defined.length ? Math.min(...defined) : null;
}

function latestDate(...values) {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString();
}

function relativeDate(value, now) {
  const days = ageInDays(value, now);
  if (days === null) return 'Jamais confirmé';
  if (days === 0) return "Vu aujourd’hui";
  if (days === 1) return 'Vu hier';
  return `Vu il y a ${days} jours`;
}
