// src/lib/dateExpiration.js
import { estimerDLCString } from './dlc_estimees';

export function appliquerDateExpirationEstimee(product) {
  if (product.date_expiration) {
    return {
      ...product,
      date_expiration_estimee: product.date_expiration_estimee ?? false,
    };
  }

  const estimate = estimerDLCString(product.nom, product.categorie);
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
