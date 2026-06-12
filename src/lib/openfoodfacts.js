// src/lib/openfoodfacts.js
// Recherche d'un produit par code-barres via l'API OpenFoodFacts.

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';

// Correspondance grossière tags OFF -> catégories de l'app
const CATEGORY_MAP = [
  { match: ['meats', 'fishes', 'seafood', 'poultry'], categorie: 'Viandes & Poissons' },
  { match: ['fruits', 'vegetables', 'legumes'], categorie: 'Légumes & Fruits' },
  { match: ['dairies', 'cheeses', 'yogurts', 'milks'], categorie: 'Produits laitiers' },
  { match: ['canned', 'groceries'], categorie: 'Conserves & Épicerie' },
  { match: ['frozen'], categorie: 'Surgelés' },
  { match: ['cereals', 'pastas', 'rices', 'breakfasts'], categorie: 'Céréales & Pâtes' },
  { match: ['sauces', 'condiments', 'spices'], categorie: 'Condiments & Sauces' },
  { match: ['beverages', 'waters', 'juices', 'sodas'], categorie: 'Boissons' },
  { match: ['breads', 'pastries', 'biscuits', 'bakery'], categorie: 'Boulangerie' },
  { match: ['cleaning', 'detergents', 'dishwashing', 'household'], categorie: 'Entretien & Ménage' },
  { match: ['hygiene', 'toothpaste', 'shampoo', 'soap', 'deodorants'], categorie: 'Hygiène & Salle de bain' },
  { match: ['paper-towels', 'toilet-paper', 'trash-bags', 'aluminium-foil'], categorie: 'Papeterie & Divers maison' },
  { match: ['pet-food', 'pets', 'cat-food', 'dog-food'], categorie: 'Animaux' },
];

function devinerCategorie(tags) {
  if (!Array.isArray(tags)) return 'Autre';
  const joined = tags.join(' ').toLowerCase();
  for (const entry of CATEGORY_MAP) {
    if (entry.match.some((m) => joined.includes(m))) return entry.categorie;
  }
  return 'Autre';
}

/**
 * Récupère un produit par code-barres.
 * @param {string} barcode
 * @returns {Promise<{ nom: string, marque: string|null, photo_url: string|null, categorie: string, code_barres: string } | null>}
 *          null si le produit est introuvable.
 */
export async function chercherParCodeBarres(barcode) {
  const code = String(barcode).trim();
  if (!code) {
    throw new Error('Saisissez un code-barres.');
  }

  let response;
  try {
    response = await fetch(`${OFF_URL}/${encodeURIComponent(code)}.json`);
  } catch (err) {
    throw new Error('Impossible de joindre OpenFoodFacts. Vérifiez votre connexion.');
  }

  if (!response.ok) {
    throw new Error(`Erreur OpenFoodFacts (${response.status}).`);
  }

  const data = await response.json();

  if (data.status !== 1 || !data.product) {
    return null; // produit inconnu
  }

  const p = data.product;
  return {
    nom: p.product_name || p.product_name_fr || '',
    marque: p.brands ? p.brands.split(',')[0].trim() : null,
    photo_url: p.image_url || null,
    categorie: devinerCategorie(p.categories_tags),
    code_barres: code,
  };
}
