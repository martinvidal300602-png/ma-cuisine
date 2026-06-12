// src/lib/dateExpiration.js
import { CATEGORIES_SANS_DLC, estimerDLCString } from './dlc_estimees';

export function categorieSansDLC(categorie) {
  return CATEGORIES_SANS_DLC.includes(categorie);
}

export function appliquerDateExpirationEstimee(product, source = 'manuel') {
  if (categorieSansDLC(product.categorie)) {
    return {
      ...product,
      date_expiration: null,
      date_expiration_estimee: false,
    };
  }

  if (product.date_expiration) {
    return {
      ...product,
      date_expiration_estimee: product.date_expiration_estimee ?? false,
    };
  }

  const estimate = estimerDLCString(product.nom, product.categorie, source);
  if (!estimate) {
    return {
      ...product,
      date_expiration_estimee: false,
    };
  }

  return {
    ...product,
    date_expiration: estimate,
    date_expiration_estimee: true,
  };
}
