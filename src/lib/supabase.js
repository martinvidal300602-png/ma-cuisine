import { createClient } from '@supabase/supabase-js';
import { runtimeConfig } from '../config/runtime';

if (!runtimeConfig.hasSupabase) {
  throw new Error(
    'Configuration Supabase manquante : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local',
  );
}

export const supabase = createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
  },
});
