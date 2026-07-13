import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStockConfidence } from '../src/lib/stockConfidence.js';
import { comparePhotoToStock } from '../src/lib/photoComparison.js';
import { suggestMeals } from '../src/lib/mealSuggestions.js';
import { buildShoppingSuggestions, purchasePatterns } from '../src/lib/shoppingSuggestions.js';
import { estimerDLC } from '../src/lib/dlc_estimees.js';
import {
  flushShoppingQueue,
  queueShoppingAdd,
  queueShoppingDelete,
  queueShoppingUpdate,
  readShoppingQueue,
} from '../src/lib/offlineShopping.js';

test('le moteur de confiance distingue stock confirmé, ancien, absent et épuisé', () => {
  const now = new Date('2026-07-13T12:00:00Z');
  assert.equal(calculateStockConfidence({ quantite: 0 }, now).label, 'Épuisé');
  assert.equal(calculateStockConfidence({ quantite: 2, last_manual_update_at: '2026-07-12T10:00:00Z' }, now).label, 'Confirmé');
  assert.equal(calculateStockConfidence({ quantite: 2, updated_at: '2026-05-01T10:00:00Z' }, now).label, 'Incertain');
  assert.equal(calculateStockConfidence({ quantite: 2, absence_count: 2 }, now).label, 'À vérifier');
});

test('la comparaison photo sépare nouveaux, présents, retirés probables et ambigus', () => {
  const stock = [
    { id: 'lait', nom: 'Lait demi-écrémé', marque: 'Maison', emplacement: 'Frigo', quantite: 1 },
    { id: 'salade', nom: 'Salade verte', marque: null, emplacement: 'Frigo', quantite: 1 },
  ];
  const detected = [
    { nom: 'Lait demi écrémé', marque: 'Maison', emplacement: 'Frigo', confidence: 'high', visible_part: 'complete' },
    { nom: 'Jambon', marque: null, emplacement: 'Frigo', confidence: 'high', visible_part: 'complete' },
    { nom: 'Bocal', marque: null, emplacement: 'Frigo', confidence: 'medium', visible_part: 'partial' },
  ];
  const result = comparePhotoToStock(detected, stock, 'Frigo', [{ description: 'Sachet opaque' }]);

  assert.deepEqual(result.stillPresent.map(({ existing }) => existing.id), ['lait']);
  assert.deepEqual(result.newItems.map((item) => item.nom), ['Jambon']);
  assert.deepEqual(result.possiblyRemoved.map((item) => item.id), ['salade']);
  assert.deepEqual(result.toVerify.map((item) => item.nom), ['Bocal']);
  assert.equal(result.uncertainItems.length, 1);
});

test('l’assistant repas utilise uniquement le stock présent et respecte le temps', () => {
  const products = [
    { id: 'eggs', nom: 'Œufs', categorie: 'Produits laitiers', quantite: 6, date_expiration: '2026-07-14' },
    { id: 'broccoli', nom: 'Brocoli', categorie: 'Légumes & Fruits', quantite: 1, date_expiration: '2026-07-14' },
    { id: 'cheese', nom: 'Fromage râpé', categorie: 'Produits laitiers', quantite: 1 },
    { id: 'missing', nom: 'Jambon', categorie: 'Viandes & Poissons', quantite: 0 },
  ];
  const meals = suggestMeals(products, { mode: 'waste', maxMinutes: 15, people: 2, vegetarian: true });

  assert.equal(meals[0].name, 'Omelette aux légumes');
  assert.equal(meals[0].people, 2);
  assert.ok(meals[0].products.every((name) => name !== 'Jambon'));
  assert.ok(meals.every((meal) => meal.minutes <= 15));
});

test('les habitudes d’achat produisent une suggestion expliquée quand le rythme est dépassé', () => {
  const now = new Date('2026-07-13T12:00:00Z');
  const history = [
    { nom: 'Lait', quantite_ajoutee: 1, date_ajout: '2026-07-06T12:00:00Z' },
    { nom: 'Lait', quantite_ajoutee: 1, date_ajout: '2026-06-30T12:00:00Z' },
    { nom: 'Lait', quantite_ajoutee: 1, date_ajout: '2026-06-24T12:00:00Z' },
  ];
  assert.equal(purchasePatterns(history, now)[0].averageDays, 6);
  const suggestions = buildShoppingSuggestions([], history, [], now);
  assert.match(suggestions[0].reason, /tous les 6 jours/);
  assert.match(suggestions[0].detail, /7 jours/);
});

test('la DLC estimée d’un yaourt est une date future plausible', () => {
  const before = new Date();
  const estimated = estimerDLC('Yaourt nature', 'Produits laitiers', 'ticket');
  const days = Math.round((estimated - before) / 86_400_000);
  assert.ok(days >= 5 && days <= 45);
});

test('la file hors-ligne fusionne les changements locaux puis se synchronise', async () => {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
  };
  const localId = queueShoppingAdd({ nom: 'Pommes', coche: false });
  queueShoppingUpdate(localId, { quantite: 2 });
  assert.equal(readShoppingQueue().length, 1);
  assert.equal(readShoppingQueue()[0].payload.quantite, 2);

  const calls = [];
  const fakeSupabase = {
    from: () => ({
      insert: async (payload) => { calls.push(['insert', payload]); return { error: null }; },
      update: () => ({ eq: async () => ({ error: null }) }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  };
  await flushShoppingQueue(fakeSupabase);
  assert.equal(calls.length, 1);
  assert.equal(readShoppingQueue().length, 0);

  const secondId = queueShoppingAdd({ nom: 'Pain' });
  queueShoppingDelete(secondId);
  assert.equal(readShoppingQueue().length, 0);
  delete globalThis.localStorage;
});
