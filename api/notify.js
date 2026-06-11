// api/notify.js
// Fonction serverless Vercel exécutée chaque jour à 8h (heure de Paris)
// via Vercel Cron (voir vercel.json — 06:00 UTC ≈ 8h Paris en été, 7h en hiver).
//
// 1. Interroge Supabase : produits expirant dans 0 à 3 jours (périmés inclus)
// 2. S'il y a des résultats → POST https://ntfy.sh/{NTFY_TOPIC}
// 3. Retourne 200 OK

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ntfyTopic = process.env.NTFY_TOPIC;

  if (!supabaseUrl || !serviceKey || !ntfyTopic) {
    return res.status(500).json({
      ok: false,
      error:
        'Configuration manquante : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et NTFY_TOPIC sont requis.',
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Bornes : aujourd'hui → aujourd'hui + 3 jours (on inclut aussi les périmés)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inThreeDays = new Date(today);
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const toISODate = (d) => d.toISOString().slice(0, 10);

  let produits;
  try {
    const { data, error } = await supabase
      .from('produits')
      .select('nom, marque, emplacement, quantite, unite, date_expiration')
      .not('date_expiration', 'is', null)
      .lte('date_expiration', toISODate(inThreeDays))
      .order('date_expiration', { ascending: true });

    if (error) throw new Error(error.message);
    produits = data ?? [];
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Requête Supabase échouée : ' + err.message });
  }

  if (produits.length === 0) {
    return res.status(200).json({ ok: true, sent: false, message: 'Aucune alerte aujourd’hui.' });
  }

  // Construction du corps de la notification
  const lignes = produits.map((p) => {
    const exp = new Date(p.date_expiration + 'T00:00:00');
    const jours = Math.round((exp.getTime() - today.getTime()) / 86400000);
    let etat;
    if (jours < 0) etat = `périmé depuis ${Math.abs(jours)} j`;
    else if (jours === 0) etat = "expire aujourd'hui";
    else etat = `expire dans ${jours} j`;
    const lieu = p.emplacement ? ` (${p.emplacement})` : '';
    return `• ${p.nom}${lieu} — ${etat}`;
  });

  const body = lignes.join('\n');

  try {
    const ntfyResponse = await fetch(`https://ntfy.sh/${encodeURIComponent(ntfyTopic)}`, {
      method: 'POST',
      headers: {
        Title: '🛒 Ma Cuisine — Alertes',
        Priority: 'default',
        Tags: 'shopping_cart',
      },
      body,
    });

    if (!ntfyResponse.ok) {
      throw new Error(`ntfy.sh a répondu ${ntfyResponse.status}`);
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Envoi ntfy échoué : ' + err.message });
  }

  return res.status(200).json({ ok: true, sent: true, count: produits.length });
}
