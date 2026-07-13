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
  assert.match(source, /gemini-2\.5-flash-lite:generateContent/);
  assert.match(source, /import \{ z \} from 'zod'/);
  assert.match(source, /safeParse/);
}
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

assert.match(read('src/main.jsx'), /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
assert.match(read('.gitignore'), /^\.env$/m);
assert.match(read('.gitignore'), /^\.env\.local$/m);

console.log('Validation V3 : emplacements, Gemini/Zod, crops, ZXing, lazy loading et PWA conformes.');
