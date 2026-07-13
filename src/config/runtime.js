const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

export const runtimeConfig = Object.freeze({
  supabaseUrl,
  supabaseAnonKey,
  geminiApiKey,
  hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
  hasGemini: Boolean(geminiApiKey),
});

export const missingRequiredVariables = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean);
