const WHOLE_UNITS = new Set([
  'unite',
  'unites',
  'unite s',
  'piece',
  'pieces',
  'tranche',
  'tranches',
  'sachet',
  'sachets',
  'boite',
  'boites',
  'bouteille',
  'bouteilles',
  'paquet',
  'paquets',
  'bocal',
  'bocaux',
  'pot',
  'pots',
  'conserve',
  'conserves',
]);

const DIVISIBLE_UNITS = new Set(['g', 'kg', 'ml', 'cl', 'l']);

export function normaliserUniteConsommation(unit) {
  return String(unit || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function estProduitEntier(product) {
  return WHOLE_UNITS.has(normaliserUniteConsommation(product?.unite));
}

export function estProduitDivisible(product) {
  return DIVISIBLE_UNITS.has(normaliserUniteConsommation(product?.unite));
}

export function quantiteConsommation(value, whole = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const positive = Math.max(0, number);
  return whole ? Math.floor(positive) : positive;
}
