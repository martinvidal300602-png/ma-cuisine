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

export function normalizeUnit(unit) {
  return String(unit || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getConsumeMode(product) {
  const unit = normalizeUnit(product?.unite);
  const name = normalizeText(product?.nom);

  if (QUANTITY_UNITS.has(unit)) return 'remaining_quantity';
  if (FRACTION_NAME_WORDS.some((word) => name.includes(word))) return 'remaining_fraction';
  if (FRACTION_UNITS.has(unit)) return 'remaining_fraction';
  if (COUNT_UNITS.has(unit)) return 'count';

  return 'remaining_fraction';
}

export function formatQuantite(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number)) return `0 ${unit || ''}`.trim();

  const rounded = Math.round(number * 100) / 100;
  const fractions = [
    { value: 0.25, label: '¼' },
    { value: 0.5, label: '½' },
    { value: 0.75, label: '¾' },
    { value: 0.33, label: '⅓' },
    { value: 0.67, label: '⅔' },
  ];
  const match = fractions.find((entry) => Math.abs(rounded - entry.value) < 0.01);
  const formatted = match ? match.label : formatNumber(rounded);
  return `${formatted} ${unit || ''}`.trim();
}

export function quantiteConsommation(value, mode = 'remaining_fraction') {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const positive = Math.max(0, number);
  return mode === 'count' ? Math.floor(positive) : Math.round(positive * 100) / 100;
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

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(value).replace(/\.0+$/, '');
}
