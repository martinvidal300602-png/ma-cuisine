const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const runtimeConfig = Object.freeze({
  supabaseUrl,
  supabaseAnonKey,
  geminiApiPath: '/api/gemini',
  geminiMode: 'server',
  hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
  hasGemini: true,
});

export const missingRequiredVariables = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean);
