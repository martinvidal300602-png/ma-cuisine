import { supabase } from './supabase';
import { recordPhotoAnalysis } from './eventLog';

const isDev = import.meta.env.DEV;
let evidenceAvailable = true;

export async function persistPhotoValidation({
  emplacement,
  added = [],
  toVerify = [],
  stillPresent = [],
  possiblyRemoved = [],
  uncertain = [],
}) {
  void recordPhotoAnalysis({
    emplacement,
    items: [
      ...added.map((item) => analysisItem(item, 'nouveau', 'ajouter')),
      ...toVerify.map((item) => analysisItem(item, 'a_verifier', item.selected ? 'ajouter' : 'ignorer')),
      ...stillPresent.map(({ detected, existing }) => analysisItem(detected, 'toujours_present', 'conserver', existing.id)),
      ...possiblyRemoved.map((item) => analysisItem(item, 'probablement_retire', item.selected ? 'epuiser' : 'conserver', item.id)),
      ...uncertain.map((item) => analysisItem({ ...item, confidence: 'low' }, 'a_verifier', 'ignorer')),
    ],
  });

  if (!evidenceAvailable) return;
  const now = new Date().toISOString();
  const changes = [
    ...stillPresent.map(({ detected, existing }) => ({
      id: existing.id,
      fields: {
        last_seen_at: now,
        absence_count: 0,
        confidence_score: confidenceScore(detected.confidence),
        stock_status: detected.confidence === 'high' ? 'confirmed' : 'probable',
      },
    })),
    ...possiblyRemoved.map((product) => ({
      id: product.id,
      fields: product.selected
        ? { stock_status: 'exhausted', last_consumed_at: now }
        : {
            absence_count: Number(product.absence_count || 0) + 1,
            stock_status: Number(product.absence_count || 0) + 1 >= 2 ? 'verify' : 'probable',
          },
    })),
  ];

  for (const change of changes) {
    const { error } = await supabase.from('produits').update(change.fields).eq('id', change.id);
    if (error) {
      if (['42703', 'PGRST204'].includes(error.code) || /last_seen_at|absence_count|stock_status/i.test(error.message || '')) {
        evidenceAvailable = false;
        return;
      }
      if (isDev) console.warn('[v3-photo] preuve stock non enregistrée', error);
    }
  }
}

function analysisItem(item, comparisonStatus, userDecision, produitId = null) {
  return {
    nom: item.nom || item.description || 'Élément non identifié',
    marque: item.marque || null,
    quantite: item.quantite ?? item.quantity_estimate ?? null,
    unite: item.unite || null,
    confidence: item.confidence || 'low',
    sources: item.sources || [],
    comparisonStatus,
    userDecision,
    produitId,
  };
}

function confidenceScore(value) {
  return { high: 0.9, medium: 0.62, low: 0.3 }[value] || 0.3;
}
