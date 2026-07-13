import { calculateStockConfidence } from './stockConfidence.js';
import { normaliserNomCourses } from './matchShoppingItems.js';

const DAY = 86_400_000;

export function buildShoppingSuggestions(products, history = [], shoppingItems = [], now = new Date()) {
  const existingNames = new Set(shoppingItems.map((item) => normaliserNomCourses(item.nom)).filter(Boolean));
  const suggestions = new Map();

  const add = (key, suggestion) => {
    const normalized = normaliserNomCourses(key);
    if (!normalized || existingNames.has(normalized)) return;
    const current = suggestions.get(normalized);
    if (!current || suggestion.rank < current.rank) suggestions.set(normalized, suggestion);
  };

  for (const product of products) {
    const state = calculateStockConfidence(product, now);
    if (state.id === 'exhausted') {
      add(product.nom, suggestionFromProduct(product, 'Stock épuisé', 'La quantité actuelle est à zéro.', 'stock', 1));
    } else if (Number(product.quantite || 0) > 0 && Number(product.quantite || 0) <= 1) {
      add(product.nom, suggestionFromProduct(product, 'Stock bientôt terminé', `Il reste ${formatQuantity(product.quantite, product.unite)}.`, 'stock_bas', 3));
    }
  }

  for (const pattern of purchasePatterns(history, now)) {
    if (!pattern.due) continue;
    const product = findProduct(products, pattern.name);
    add(pattern.name, {
      id: `habit-${pattern.key}`,
      product,
      nom: product?.nom || pattern.name,
      marque: product?.marque || null,
      categorie: product?.categorie || 'Autre',
      unite: product?.unite || 'unité',
      reason: `Acheté environ tous les ${pattern.averageDays} jours`,
      detail: `Dernier achat il y a ${pattern.daysSinceLast} jour${pattern.daysSinceLast > 1 ? 's' : ''}.`,
      source: 'stock',
      rank: 2,
    });
  }

  return Array.from(suggestions.values())
    .sort((a, b) => a.rank - b.rank || a.nom.localeCompare(b.nom, 'fr'))
    .slice(0, 6);
}

export function purchasePatterns(history, now = new Date()) {
  const groups = new Map();
  for (const row of history) {
    const key = normaliserNomCourses(row.nom);
    const date = new Date(row.date_ajout || row.created_at);
    if (!key || Number.isNaN(date.getTime()) || Number(row.quantite_ajoutee || 0) <= 0) continue;
    if (!groups.has(key)) groups.set(key, { key, name: row.nom, dates: [] });
    groups.get(key).dates.push(date);
  }

  return Array.from(groups.values()).flatMap((group) => {
    const dates = group.dates.sort((a, b) => b - a);
    if (dates.length < 2) return [];
    const intervals = dates.slice(0, -1).map((date, index) => Math.max(1, Math.round((date - dates[index + 1]) / DAY)));
    const averageDays = Math.max(1, Math.round(intervals.reduce((total, days) => total + days, 0) / intervals.length));
    const daysSinceLast = Math.max(0, Math.floor((now - dates[0]) / DAY));
    return [{
      key: group.key,
      name: group.name,
      averageDays,
      daysSinceLast,
      due: daysSinceLast >= Math.max(1, Math.round(averageDays * 0.8)),
    }];
  });
}

function suggestionFromProduct(product, reason, detail, source, rank) {
  return {
    id: `stock-${product.id}`,
    product,
    nom: product.nom,
    marque: product.marque,
    categorie: product.categorie || 'Autre',
    unite: product.unite || 'unité',
    reason,
    detail,
    source,
    rank,
  };
}

function findProduct(products, name) {
  const key = normaliserNomCourses(name);
  return products.find((product) => normaliserNomCourses(product.nom) === key);
}

function formatQuantity(quantity, unit) {
  return `${Number(quantity || 0).toLocaleString('fr-FR')} ${unit || 'unité'}`.trim();
}
