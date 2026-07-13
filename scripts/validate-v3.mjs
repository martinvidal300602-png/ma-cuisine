import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const manualForm = read('src/components/Add/ManualForm.jsx');
const locationBlock = manualForm.match(/export const EMPLACEMENTS = \[([\s\S]*?)\];/)?.[1] || '';
const locations = Array.from(locationBlock.matchAll(/'([^']+)'/g), (match) => match[1]);
assert.deepEqual(locations, [
  'Frigo',
  'Placard sous fenêtre',
  'Plan de travail',
  'Placard épices',
]);

const gemini = read('src/lib/gemini.js');
const receiptGemini = read('src/lib/receiptGemini.js');
for (const source of [gemini, receiptGemini]) {
  assert.match(source, /import \{ z \} from 'zod'/);
  assert.match(source, /safeParse/);
  assert.match(source, /postGemini/);
}
const geminiApi = read('api/gemini.js');
assert.match(geminiApi, /gemini-2\.5-flash-lite/);
assert.match(geminiApi, /:generateContent/);
assert.match(geminiApi, /GEMINI_API_KEY/);
assert.match(geminiApi, /auth\.getUser\(accessToken\)/);
assert.match(geminiApi, /MAX_BODY_BYTES/);
assert.match(geminiApi, /consumeRateLimit/);
assert.doesNotMatch(read('src/config/runtime.js'), /VITE_GEMINI_API_KEY/);
assert.doesNotMatch(read('.env.example'), /VITE_GEMINI_API_KEY/);
for (const requiredImage of [
  "'full'",
  "'crop_top_left'",
  "'crop_top_right'",
  "'crop_middle_left'",
  "'crop_middle_right'",
  "'crop_bottom_left'",
  "'crop_bottom_right'",
]) {
  assert.ok(gemini.includes(requiredImage), `Pipeline photo incomplet : ${requiredImage}`);
}

const barcodeScanner = read('src/components/Add/BarcodeScanner.jsx');
assert.match(barcodeScanner, /await import\('@zxing\/browser'\)/);
assert.doesNotMatch(barcodeScanner, /from '@zxing\/browser'/);

const app = read('src/App.jsx');
for (const lazyScreen of ['pages/Cuisine', 'pages/Courses', 'pages/Activity', 'pages/Settings', 'components/Scan/AddFlow']) {
  assert.ok(app.includes(`import('./${lazyScreen}')`), `Import dynamique manquant : ${lazyScreen}`);
}

const manifest = JSON.parse(read('public/manifest.json'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.orientation, 'portrait-primary');
assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));

function pngSize(path) {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${path} n'est pas un PNG`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

assert.deepEqual(pngSize('public/apple-touch-icon.png'), [180, 180]);
assert.deepEqual(pngSize('public/icon-192.png'), [192, 192]);
assert.deepEqual(pngSize('public/icon-512.png'), [512, 512]);

const viteConfig = read('vite.config.js');
assert.match(viteConfig, /VitePWA/);
assert.match(viteConfig, /navigateFallbackDenylist/);
assert.equal(JSON.parse(read('package.json')).devDependencies['vite-plugin-pwa'], '^0.20.5');
assert.match(read('.gitignore'), /^\.env$/m);
assert.match(read('.gitignore'), /^\.env\.local$/m);

const migration = read('supabase/migrations/20260713_v3_intelligence_foundations.sql');
for (const table of [
  'foyers',
  'foyer_membres',
  'historique_produits',
  'evenements',
  'analyses_photo',
  'analyses_photo_items',
  'tickets',
  'ticket_items',
  'utilisateurs_preferences',
]) {
  assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Table V3 manquante : ${table}`);
}
assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
assert.match(migration, /current_foyer_id\(\)/);

const stockConfidence = read('src/lib/stockConfidence.js');
for (const state of ['Confirmé', 'Probable', 'Incertain', 'À vérifier', 'Épuisé']) {
  assert.ok(stockConfidence.includes(state), `État de stock manquant : ${state}`);
}

const today = read('src/pages/Today.jsx');
for (const block of ['TodayFocus', 'DashboardRecommendations', 'QuickActions']) {
  assert.ok(today.includes(`<${block}`), `Bloc d’accueil manquant : ${block}`);
}
const quickActions = read('src/components/Dashboard/QuickActions.jsx');
for (const action of ['Scanner un produit', 'Photographier un emplacement', 'Scanner un ticket', 'Ajouter manuellement']) {
  assert.ok(quickActions.includes(action), `Action rapide manquante : ${action}`);
}

const notify = read('api/notify.js');
assert.match(notify, /process\.env\.CRON_SECRET/);
assert.doesNotMatch(notify, /VITE_SUPABASE_URL/);

console.log('Validation V3 : stock intelligent, proxy Gemini, foyer/RLS, accueil, crops, ZXing, lazy loading et PWA conformes.');
