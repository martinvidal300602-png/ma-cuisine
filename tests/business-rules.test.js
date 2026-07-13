import test from 'node:test';
import assert from 'node:assert/strict';
import {
  creerChampsFusion,
  estDoublonProbable,
  unitesCompatibles,
} from '../src/lib/duplicates.js';
import { matchShoppingItems, normaliserNomCourses } from '../src/lib/matchShoppingItems.js';
import {
  formatQuantite,
  getConsumeMode,
  quantiteConsommation,
} from '../src/lib/productConsumption.js';

test('un doublon exige le même emplacement et une marque compatible', () => {
  const incoming = { nom: 'Yaourts nature bio', marque: 'Maison', emplacement: 'Frigo' };
  const existing = { nom: 'Yaourt nature', marque: 'Maison', emplacement: 'Frigo' };

  assert.equal(estDoublonProbable(incoming, existing), true);
  assert.equal(estDoublonProbable(incoming, { ...existing, emplacement: 'Plan de travail' }), false);
  assert.equal(estDoublonProbable(incoming, { ...existing, marque: 'Autre' }), false);
});

test('la fusion additionne la quantité et conserve la DLC la plus proche', () => {
  const merged = creerChampsFusion(
    { quantite: 2, unite: 'bocaux', date_expiration: '2026-07-20', marque: null },
    { quantite: 3, unite: 'bocal', date_expiration: '2026-07-18', marque: 'Maison' },
  );

  assert.equal(unitesCompatibles('bocaux', 'bocal'), true);
  assert.equal(merged.quantite, 5);
  assert.equal(merged.date_expiration, '2026-07-18');
  assert.equal(merged.marque, 'Maison');
});

test('le rapprochement ticket reconnaît les abréviations et garde les non-achetés', () => {
  const shopping = [
    { id: 'lait', nom: 'Lait demi écrémé', coche: true },
    { id: 'bananes', nom: 'Bananes', coche: false },
  ];
  const result = matchShoppingItems([{ nom: 'LT DEMI ECR' }], shopping);

  assert.equal(normaliserNomCourses('Lait demi écrémé'), 'lait demi ecreme');
  assert.equal(result.matchedItems.length, 1);
  assert.equal(result.matchedItems[0].shoppingItem.id, 'lait');
  assert.deepEqual(result.remainingShoppingItems.map((item) => item.id), ['bananes']);
});

test('les modes de consommation respectent unités, fractions et arrondis', () => {
  assert.equal(getConsumeMode({ nom: 'Œufs', unite: 'unités' }), 'count');
  assert.equal(getConsumeMode({ nom: 'Farine', unite: 'g' }), 'remaining_quantity');
  assert.equal(getConsumeMode({ nom: 'Sauce tomate', unite: 'bocal' }), 'remaining_fraction');
  assert.equal(quantiteConsommation(2.7, 'count'), 2);
  assert.equal(quantiteConsommation(0.334, 'remaining_fraction'), 0.33);
  assert.equal(formatQuantite(2, 'bouteilles', 'count'), '2 bouteilles');
});
