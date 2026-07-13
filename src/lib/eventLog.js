import { supabase } from './supabase';

const isDev = import.meta.env.DEV;
let contextPromise;
let eventsAvailable = true;
let historyAvailable = true;
let photoAvailable = true;
let ticketAvailable = true;

async function householdContext() {
  if (!contextPromise) {
    contextPromise = (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return null;

      const { data, error } = await supabase
        .from('foyer_membres')
        .select('foyer_id, email, display_name')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isMissingFoundation(error)) {
          eventsAvailable = false;
          historyAvailable = false;
          return null;
        }
        throw error;
      }

      return data?.foyer_id
        ? {
            foyerId: data.foyer_id,
            userId: user.id,
            email: data.email || user.email || null,
            displayName: data.display_name || user.user_metadata?.display_name || null,
          }
        : null;
    })().catch((error) => {
      contextPromise = undefined;
      if (isDev) console.warn('[v3-events] contexte familial indisponible', error);
      return null;
    });
  }
  return contextPromise;
}

export async function recordEvent({
  type,
  entityType,
  entityId = null,
  title,
  detail = null,
  payload = {},
  undoSeconds = 0,
}) {
  if (!eventsAvailable) return null;
  const context = await householdContext();
  if (!context) return null;

  const undoUntil = undoSeconds > 0
    ? new Date(Date.now() + undoSeconds * 1000).toISOString()
    : null;
  const { data, error } = await supabase
    .from('evenements')
    .insert([{
      foyer_id: context.foyerId,
      type,
      entity_type: entityType,
      entity_id: isUuid(entityId) ? entityId : null,
      title,
      detail,
      payload,
      actor_id: context.userId,
      actor_email: context.email,
      undo_until: undoUntil,
    }])
    .select('id')
    .single();

  if (error) {
    if (isMissingFoundation(error)) eventsAvailable = false;
    else if (isDev) console.warn('[v3-events] événement non journalisé', error);
    return null;
  }
  return data;
}

export async function recordProductHistory({
  product,
  added = 0,
  consumed = 0,
  result = 'stock',
  source = 'manuel',
  metadata = {},
}) {
  if (!historyAvailable || !product?.nom) return null;
  const context = await householdContext();
  if (!context) return null;

  const { data, error } = await supabase
    .from('historique_produits')
    .insert([{
      foyer_id: context.foyerId,
      produit_id: isUuid(product.id) ? product.id : null,
      nom: product.nom,
      quantite_ajoutee: Math.max(0, Number(added || 0)),
      quantite_consommee: Math.max(0, Number(consumed || 0)),
      date_ajout: added > 0 ? new Date().toISOString() : null,
      date_fin: result === 'consomme' || result === 'gaspille' ? new Date().toISOString() : null,
      resultat: result,
      source_ajout: source,
      user_id: context.userId,
      user_email: context.email,
      metadata,
    }])
    .select('id')
    .single();

  if (error) {
    if (isMissingFoundation(error)) historyAvailable = false;
    else if (isDev) console.warn('[v3-history] historique non journalisé', error);
    return null;
  }
  return data;
}

export async function recordPhotoAnalysis({ emplacement, items = [] }) {
  if (!photoAvailable) return null;
  const context = await householdContext();
  if (!context) return null;
  const now = new Date().toISOString();
  const { data: analysis, error } = await supabase
    .from('analyses_photo')
    .insert([{
      foyer_id: context.foyerId,
      emplacement,
      status: 'validee',
      user_id: context.userId,
      user_email: context.email,
      validated_at: now,
    }])
    .select('id')
    .single();

  if (error || !analysis) {
    if (isMissingFoundation(error)) photoAvailable = false;
    else if (isDev) console.warn('[v3-photo] analyse non journalisée', error);
    return null;
  }

  const rows = items.filter((item) => item?.nom).map((item) => ({
    analyse_id: analysis.id,
    produit_id: isUuid(item.produitId) ? item.produitId : null,
    nom_detecte: item.nom,
    normalized_name: normalizeName(item.nom),
    marque: item.marque || null,
    quantite_visible: Number.isFinite(Number(item.quantite)) ? Number(item.quantite) : null,
    unite: item.unite || null,
    confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low',
    confidence_score: confidenceScore(item.confidence),
    image_zone: item.imageZone || null,
    sources: Array.isArray(item.sources) ? item.sources : [],
    comparison_status: item.comparisonStatus,
    user_decision: item.userDecision,
  }));

  if (rows.length) {
    const { error: itemsError } = await supabase.from('analyses_photo_items').insert(rows);
    if (itemsError && !isMissingFoundation(itemsError) && isDev) {
      console.warn('[v3-photo] détails de l’analyse non journalisés', itemsError);
    }
  }
  return analysis;
}

export async function recordTicketAnalysis({ sessionId = null, items = [], selectedIndexes = [] }) {
  if (!ticketAvailable) return null;
  const context = await householdContext();
  if (!context) return null;
  const now = new Date().toISOString();
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert([{
      foyer_id: context.foyerId,
      courses_session_id: isUuid(sessionId) ? sessionId : null,
      status: 'valide',
      user_id: context.userId,
      user_email: context.email,
      validated_at: now,
    }])
    .select('id')
    .single();

  if (error || !ticket) {
    if (isMissingFoundation(error)) ticketAvailable = false;
    else if (isDev) console.warn('[v3-ticket] ticket non journalisé', error);
    return null;
  }

  const selected = new Set(selectedIndexes);
  const rows = items.filter((item) => item?.nom).map((item, index) => ({
    ticket_id: ticket.id,
    raw_label: item.raw_label || null,
    nom: item.nom,
    marque: item.marque || null,
    categorie: item.categorie || null,
    quantite: Number.isFinite(Number(item.quantite)) ? Number(item.quantite) : 1,
    unite: item.unite || null,
    confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low',
    decision: selected.has(index) ? 'ajouter' : 'ignorer',
  }));
  if (rows.length) {
    const { error: itemsError } = await supabase.from('ticket_items').insert(rows);
    if (itemsError && !isMissingFoundation(itemsError) && isDev) {
      console.warn('[v3-ticket] lignes du ticket non journalisées', itemsError);
    }
  }
  return ticket;
}

export function resetEventLogCacheForTests() {
  contextPromise = undefined;
  eventsAvailable = true;
  historyAvailable = true;
  photoAvailable = true;
  ticketAvailable = true;
}

function isMissingFoundation(error) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error?.code)
    || /foyer_membres|evenements|historique_produits/i.test(String(error?.message || ''));
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function normalizeName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function confidenceScore(value) {
  return { high: 0.9, medium: 0.62, low: 0.3 }[value] || 0.3;
}
