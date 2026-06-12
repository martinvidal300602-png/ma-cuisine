// src/lib/duplicates.js

const WEAK_WORDS = new Set(['original', 'nature', 'bio']);

export function trouverDoublonsProbables(toAdd, existingProducts) {
  return toAdd
    .map((product) => {
      const match = existingProducts.find((existing) => estDoublonProbable(product, existing));
      return match ? { product, existing: match, canMerge: unitesCompatibles(product.unite, match.unite) } : null;
    })
    .filter(Boolean);
}

export function estDoublonProbable(product, existing) {
  if (!product?.nom || !existing?.nom) return false;
  if (product.emplacement !== existing.emplacement) return false;
  if (!marquesCompatibles(product.marque, existing.marque)) return false;

  const incomingTokens = tokensProduit(product.nom);
  const existingTokens = tokensProduit(existing.nom);
  if (incomingTokens.length === 0 || existingTokens.length === 0) return false;

  const shorter = incomingTokens.length <= existingTokens.length ? incomingTokens : existingTokens;
  const longer = incomingTokens.length > existingTokens.length ? incomingTokens : existingTokens;
  const common = shorter.filter((token) => longer.includes(token));

  if (common.length === shorter.length) return true;

  const union = new Set([...incomingTokens, ...existingTokens]);
  return common.length / union.size >= 0.75;
}

export function creerChampsFusion(existing, incoming) {
  const quantite = Number(existing.quantite || 0) + Number(incoming.quantite || 0);

  return {
    quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : existing.quantite,
    unite: existing.unite || incoming.unite || 'unité(s)',
    date_expiration: datePlusProche(existing.date_expiration, incoming.date_expiration),
    marque: existing.marque || incoming.marque || null,
  };
}

export function unitesCompatibles(first, second) {
  return uniteCanonique(first) === uniteCanonique(second);
}

function marquesCompatibles(first, second) {
  const a = normaliserTexte(first);
  const b = normaliserTexte(second);
  return !a || !b || a === b;
}

function tokensProduit(name) {
  return normaliserTexte(name)
    .split(' ')
    .map(singulierSimple)
    .filter((token) => token && !WEAK_WORDS.has(token));
}

function normaliserTexte(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function singulierSimple(token) {
  if (token.endsWith('aux')) return `${token.slice(0, -3)}al`;
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function uniteCanonique(unit) {
  const value = normaliserTexte(unit);
  const map = {
    bocaux: 'bocal',
    bocal: 'bocal',
    pots: 'pot',
    pot: 'pot',
    paquets: 'paquet',
    paquet: 'paquet',
    bouteilles: 'bouteille',
    bouteille: 'bouteille',
    boites: 'boite',
    boite: 'boite',
    pieces: 'piece',
    piece: 'piece',
    unites: 'unite',
    unite: 'unite',
    'unite s': 'unite',
  };
  return map[value] || value;
}

function datePlusProche(first, second) {
  if (!first) return second || null;
  if (!second) return first;
  return new Date(first) <= new Date(second) ? first : second;
}
