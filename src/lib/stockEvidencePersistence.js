import { supabase } from './supabase';

const isDev = import.meta.env.DEV;
let available = true;

export async function recordStockEvidence(productId, kind, extra = {}) {
  if (!available || !productId) return;
  const now = new Date().toISOString();
  const fields = evidenceFields(kind, now, extra);
  const { error } = await supabase.from('produits').update(fields).eq('id', productId);
  if (!error) return;
  if (['42703', 'PGRST204'].includes(error.code) || /last_(seen|manual|ticket|consumed)_at|confidence_score|stock_status/i.test(error.message || '')) {
    available = false;
  } else if (isDev) {
    console.warn('[v3-stock] preuve non enregistrée', error);
  }
}

function evidenceFields(kind, now, extra) {
  if (kind === 'receipt') return { last_ticket_at: now, confidence_score: 0.96, stock_status: 'confirmed', absence_count: 0, ...extra };
  if (kind === 'photo') return { last_seen_at: now, confidence_score: 0.85, stock_status: 'probable', absence_count: 0, ...extra };
  if (kind === 'consumed') return { last_consumed_at: now, stock_status: extra.quantite <= 0 ? 'exhausted' : 'confirmed', ...extra };
  return { last_manual_update_at: now, confidence_score: 1, stock_status: 'confirmed', absence_count: 0, ...extra };
}
