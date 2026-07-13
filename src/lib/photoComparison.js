import { estDoublonProbable } from './duplicates.js';

export function comparePhotoToStock(detectedItems, stockProducts, emplacement, uncertainItems = []) {
  const stock = stockProducts.filter(
    (product) => product.emplacement === emplacement && Number(product.quantite || 0) > 0,
  );
  const matchedStockIds = new Set();
  const newItems = [];
  const stillPresent = [];
  const toVerify = [];

  for (const item of detectedItems) {
    const candidate = stock.find(
      (product) => !matchedStockIds.has(product.id) && estDoublonProbable(item, product),
    );
    if (candidate) {
      matchedStockIds.add(candidate.id);
      stillPresent.push({ detected: item, existing: candidate });
      continue;
    }
    if (item.confidence === 'high' && item.visible_part === 'complete') newItems.push(item);
    else toVerify.push(item);
  }

  return {
    newItems,
    stillPresent,
    possiblyRemoved: stock.filter((product) => !matchedStockIds.has(product.id)),
    toVerify,
    uncertainItems,
  };
}

const PHOTO_HISTORY_KEY = 'ma-cuisine:v3-photo-history';

export function rememberPhotoAnalysis(emplacement, date = new Date()) {
  try {
    const current = JSON.parse(localStorage.getItem(PHOTO_HISTORY_KEY) || '{}');
    current[emplacement] = date.toISOString();
    localStorage.setItem(PHOTO_HISTORY_KEY, JSON.stringify(current));
  } catch {
    // L'analyse reste fonctionnelle si le stockage local est indisponible.
  }
}

export function getPhotoHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(PHOTO_HISTORY_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export function daysSincePhoto(emplacement, now = new Date()) {
  const value = getPhotoHistory()[emplacement];
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}
