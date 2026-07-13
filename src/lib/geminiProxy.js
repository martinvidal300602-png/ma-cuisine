import { runtimeConfig } from '../config/runtime';
import { supabase } from './supabase';

export async function postGemini(kind, request) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Votre session a expiré. Reconnectez-vous avant l’analyse.');

  try {
    return await fetch(runtimeConfig.geminiApiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ kind, request }),
    });
  } catch {
    throw new Error('Impossible de joindre le service Gemini. Vérifiez votre connexion.');
  }
}
