const COUNT_UNITS = new Set([
  'unite',
  'unites',
  'unite s',
  'piece',
  'pieces',
  'tranche',
  'tranches',
  'boite',
  'boites',
  'conserve',
  'conserves',
  'sachet',
  'sachets',
  'canette',
  'canettes',
  'avocat',
  'avocats',
  'banane',
  'bananes',
  'citron',
  'citrons',
  'salade',
  'salades',
  'tomate',
  'tomates',
  'oeuf',
  'oeufs',
  'cap',
  'caps',
  'capsule',
  'capsules',
  'rouleau',
  'rouleaux',
  'eponge',
  'eponges',
]);

const QUANTITY_UNITS = new Set(['g', 'kg', 'ml', 'cl', 'l', 'litre', 'litres']);

const FRACTION_UNITS = new Set([
  'bouteille',
  'bouteilles',
  'bocal',
  'bocaux',
  'pot',
  'pots',
  'paquet',
  'paquets',
  'brique',
  'briques',
]);

const FRACTION_NAME_WORDS = [
  'sauce',
  'sauce tomate',
  'coulis',
  'pesto',
  'creme',
  'puree',
  'confiture',
  'huile',
  'vin',
  'jus',
  'lait',
  'pates',
  'riz',
  'farine',
  'sirop',
  'miel',
];

const COUNT_PRODUCE_WORDS = [
  'avocat',
  'banane',
  'citron',
  'salade',
  'tomate',
  'oeuf',
  'pomme',
  'poire',
  'orange',
  'courgette',
  'aubergine',
  'concombre',
];

const COUNT_HOME_WORDS = [
  'lessive caps',
  'capsule',
  'eponge',
  'sopalin',
  'papier toilette',
  'mouchoir',
  'sac poubelle',
  'croquette',
  'litiere',
];

const SINGULAR_UNITS = {
  unites: 'unité',
  'unite s': 'unité',
  unite: 'unité',
  pieces: 'pièce',
  piece: 'pièce',
  tranches: 'tranche',
  tranche: 'tranche',
  sachets: 'sachet',
  sachet: 'sachet',
  boites: 'boîte',
  boite: 'boîte',
  conserves: 'conserve',
  conserve: 'conserve',
  canettes: 'canette',
  canette: 'canette',
  bouteilles: 'bouteille',
  bouteille: 'bouteille',
  bocaux: 'bocal',
  bocal: 'bocal',
  pots: 'pot',
  pot: 'pot',
  paquets: 'paquet',
  paquet: 'paquet',
  briques: 'brique',
  brique: 'brique',
  avocats: 'avocat',
  avocat: 'avocat',
  bananes: 'banane',
  banane: 'banane',
  citrons: 'citron',
  citron: 'citron',
  salades: 'salade',
  salade: 'salade',
  tomates: 'tomate',
  tomate: 'tomate',
  oeufs: 'œuf',
  oeuf: 'œuf',
  caps: 'cap',
  cap: 'cap',
  capsules: 'capsule',
  capsule: 'capsule',
  rouleaux: 'rouleau',
  rouleau: 'rouleau',
  eponges: 'éponge',
  eponge: 'éponge',
};

const PLURAL_UNITS = {
  unites: 'unités',
  'unite s': 'unités',
  unite: 'unités',
  pieces: 'pièces',
  piece: 'pièces',
  tranches: 'tranches',
  tranche: 'tranches',
  sachets: 'sachets',
  sachet: 'sachets',
  boites: 'boîtes',
  boite: 'boîtes',
  conserves: 'conserves',
  conserve: 'conserves',
  canettes: 'canettes',
  canette: 'canettes',
  bouteilles: 'bouteilles',
  bouteille: 'bouteilles',
  bocaux: 'bocaux',
  bocal: 'bocaux',
  pots: 'pots',
  pot: 'pots',
  paquets: 'paquets',
  paquet: 'paquets',
  briques: 'briques',
  brique: 'briques',
  avocats: 'avocats',
  avocat: 'avocats',
  bananes: 'bananes',
  banane: 'bananes',
  citrons: 'citrons',
  citron: 'citrons',
  salades: 'salades',
  salade: 'salades',
  tomates: 'tomates',
  tomate: 'tomates',
  oeufs: 'œufs',
  oeuf: 'œufs',
  caps: 'caps',
  cap: 'caps',
  capsules: 'capsules',
  capsule: 'capsules',
  rouleaux: 'rouleaux',
  rouleau: 'rouleaux',
  eponges: 'éponges',
  eponge: 'éponges',
};

export function normalizeUnit(unit) {
  const cleaned = String(unit || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/\b\d+([.,]\d+)?\b/g, ' ')
    .replace(/\b(environ|approx|approximativement)\b/g, ' ')
    .replace(/\benv\.?/g, ' ')
    .replace(/[.,]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (cleaned === 'l') return 'l';
  return cleaned;
}

export function getConsumeMode(product) {
  const unit = normalizeUnit(product?.unite);
  const name = normalizeText(product?.nom);
  const category = normalizeText(product?.categorie);

  if (QUANTITY_UNITS.has(unit)) return 'remaining_quantity';
  if (COUNT_HOME_WORDS.some((word) => name.includes(word))) return 'count';
  if (FRACTION_NAME_WORDS.some((word) => name.includes(word))) return 'remaining_fraction';
  if (isIndividualProduce(name) && (isPieceLikeUnit(unit) || isProduceCategory(category))) return 'count';
  if (FRACTION_UNITS.has(unit)) return 'remaining_fraction';
  if (COUNT_UNITS.has(unit)) return 'count';
  if (isProduceCategory(category) && isIndividualProduce(name)) return 'count';

  return 'remaining_fraction';
}

export function formatQuantite(value, unit, mode = null) {
  const number = Number(value);
  const cleanUnit = normalizeUnit(unit);
  if (!Number.isFinite(number)) return `0 ${displayUnitFor(0, unit)}`.trim();

  const effectiveMode = mode || modeFromUnit(cleanUnit);
  if (effectiveMode === 'count') {
    const count = Math.max(0, Math.floor(number));
    return `${count} ${displayUnitFor(count, unit)}`.trim();
  }

  const rounded = roundQuantity(number);
  const displayUnit = displayUnitFor(rounded, unit);
  const canUseFraction = effectiveMode === 'remaining_fraction' && FRACTION_UNITS.has(cleanUnit) && rounded <= 1;
  const formatted = canUseFraction ? formatFraction(rounded) : formatNumber(rounded);
  return `${formatted} ${displayUnit}`.trim();
}

export function quantiteConsommation(value, mode = 'remaining_fraction') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const positive = Math.max(0, number);
  return mode === 'count' ? Math.floor(positive) : roundQuantity(positive);
}

export function normaliserUniteConsommation(unit) {
  return normalizeUnit(unit);
}

export function estProduitEntier(product) {
  return getConsumeMode(product) === 'count';
}

export function estProduitDivisible(product) {
  return getConsumeMode(product) === 'remaining_quantity';
}

function modeFromUnit(unit) {
  if (QUANTITY_UNITS.has(unit)) return 'remaining_quantity';
  if (COUNT_UNITS.has(unit)) return 'count';
  if (FRACTION_UNITS.has(unit)) return 'remaining_fraction';
  return 'remaining_fraction';
}

function isPieceLikeUnit(unit) {
  return unit === '' || unit === 'unite' || unit === 'unites' || unit === 'unite s' || unit === 'piece' || unit === 'pieces' || COUNT_UNITS.has(unit);
}

function isIndividualProduce(name) {
  return COUNT_PRODUCE_WORDS.some((word) => name.includes(word));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .toLowerCase();
}

function isProduceCategory(category) {
  return category.includes('legumes') && category.includes('fruits');
}

function formatFraction(value) {
  const fractions = [
    { value: 0.25, label: '¼' },
    { value: 0.5, label: '½' },
    { value: 0.75, label: '¾' },
  ];
  const match = fractions.find((entry) => Math.abs(value - entry.value) < 0.01);
  return match ? match.label : formatNumber(value);
}

function displayUnitFor(value, unit) {
  const cleanUnit = normalizeUnit(unit);
  const number = Number(value);
  const isOne = number > 0 && number <= 1;
  if (isOne && SINGULAR_UNITS[cleanUnit]) return SINGULAR_UNITS[cleanUnit];
  if (!isOne && PLURAL_UNITS[cleanUnit]) return PLURAL_UNITS[cleanUnit];
  return cleanUnit || String(unit || '').trim();
}

function roundQuantity(value) {
  return Math.round(value * 100) / 100;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(value).replace(/\.?0+$/, '');
}
