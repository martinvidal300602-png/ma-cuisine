const WEAK_WORDS = new Set([
  'original',
  'nature',
  'bio',
  'paquet',
  'sachet',
  'bouteille',
  'bocal',
  'boite',
  'boites',
  'x4',
  'x6',
  'x12',
  'moulu',
]);

const TOKEN_ALIASES = {
  lt: 'lait',
  lait: 'lait',
  demi: 'demi',
  ecr: 'ecreme',
  ecreme: 'ecreme',
  ecremee: 'ecreme',
  ecremees: 'ecreme',
  yaourts: 'yaourt',
  yaourt: 'yaourt',
  nat: 'nature',
  pates: 'pate',
  pate: 'pate',
  penne: 'penne',
  tomates: 'tomate',
  tomate: 'tomate',
  tom: 'tomate',
  grappe: 'grappe',
  paprika: 'paprika',
  doux: 'doux',
  oreo: 'oreo',
  cafe: 'cafe',
  cafes: 'cafe',
  huile: 'huile',
  olive: 'olive',
  olives: 'olive',
  thon: 'thon',
  naturel: 'nature',
  bananes: 'banane',
  banane: 'banane',
  cookies: 'cookie',
  biscuits: 'biscuit',
};

export function normaliserNomCourses(value) {
  return tokensNom(value).join(' ');
}

export function matchShoppingItems(receiptItems = [], shoppingItems = []) {
  const usedShoppingIds = new Set();
  const matchedItems = [];
  const unmatchedReceiptItems = [];

  receiptItems.forEach((receiptItem, receiptIndex) => {
    const receiptTokens = tokensNom(receiptItem.nom || receiptItem.name || receiptItem.raw_label);
    let best = null;

    shoppingItems.forEach((shoppingItem) => {
      if (usedShoppingIds.has(shoppingItem.id)) return;
      const shoppingTokens = tokensNom(shoppingItem.nom || shoppingItem.name);
      const score = scorerTokens(receiptTokens, shoppingTokens);
      if (!best || score.value > best.score.value) {
        best = { shoppingItem, score };
      }
    });

    if (!best || best.score.value < 0.34) {
      unmatchedReceiptItems.push({ receiptItem, receiptIndex });
      return;
    }

    usedShoppingIds.add(best.shoppingItem.id);
    matchedItems.push({
      receiptItem,
      receiptIndex,
      shoppingItem: best.shoppingItem,
      confidence: best.score.confidence,
      reason: best.score.reason,
    });
  });

  const unmatchedShoppingItems = shoppingItems.filter((item) => !usedShoppingIds.has(item.id));

  return {
    matchedItems,
    unmatchedReceiptItems,
    checkedButNotOnReceipt: unmatchedShoppingItems.filter((item) => item.coche),
    remainingShoppingItems: unmatchedShoppingItems.filter((item) => !item.coche),
  };
}

function scorerTokens(receiptTokens, shoppingTokens) {
  if (receiptTokens.length === 0 || shoppingTokens.length === 0) {
    return { value: 0, confidence: 'low', reason: 'nom insuffisant' };
  }

  const receiptKey = receiptTokens.join(' ');
  const shoppingKey = shoppingTokens.join(' ');
  if (receiptKey === shoppingKey) {
    return { value: 1, confidence: 'high', reason: 'nom normalisé identique' };
  }

  const receiptSet = new Set(receiptTokens);
  const shoppingSet = new Set(shoppingTokens);
  const common = shoppingTokens.filter((token) => receiptSet.has(token));
  const reverseCommon = receiptTokens.filter((token) => shoppingSet.has(token));
  const shorterCount = Math.min(receiptSet.size, shoppingSet.size);
  const unionCount = new Set([...receiptTokens, ...shoppingTokens]).size;
  const overlap = Math.max(common.length, reverseCommon.length);
  const ratio = overlap / unionCount;

  if (overlap === shorterCount && shorterCount > 0) {
    const confidence = shorterCount >= 2 || ratio >= 0.5 ? 'high' : 'medium';
    return {
      value: confidence === 'high' ? 0.92 : 0.72,
      confidence,
      reason: 'un nom contient fortement l’autre',
    };
  }

  if (ratio >= 0.55 || (overlap >= 2 && ratio >= 0.4)) {
    return { value: 0.64, confidence: 'medium', reason: 'similarité partielle forte' };
  }

  if (ratio >= 0.34) {
    return { value: 0.38, confidence: 'low', reason: 'ressemblance faible à vérifier' };
  }

  return { value: 0, confidence: 'low', reason: 'pas de correspondance fiable' };
}

function tokensNom(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(normaliserToken)
    .map(singulierSimple)
    .filter((token) => token && !WEAK_WORDS.has(token));
}

function normaliserToken(token) {
  if (/^x\d+$/.test(token)) return '';
  return TOKEN_ALIASES[token] || token;
}

function singulierSimple(token) {
  if (token.endsWith('aux') && token.length > 4) return `${token.slice(0, -3)}al`;
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}
