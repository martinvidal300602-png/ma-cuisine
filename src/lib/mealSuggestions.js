import { joursRestants } from '../hooks/useAlerts.js';

const BASE_INGREDIENTS = ['sel', 'poivre', 'huile'];

export function suggestMeals(products, { mode = 'waste', maxMinutes = 20, people = 3, vegetarian = false } = {}) {
  const available = products.filter((product) => Number(product.quantite || 0) > 0);
  const find = (...patterns) => available.find((product) => patterns.some((pattern) => normalize(product.nom).includes(pattern)));
  const all = (...patterns) => available.filter((product) => patterns.some((pattern) => normalize(product.nom).includes(pattern)));
  const vegetable = () => available.filter((product) => product.categorie === 'Légumes & Fruits');
  const suggestions = [];

  const eggs = find('oeuf');
  const cheese = find('fromage', 'emmental', 'comte', 'mozzarella', 'chevre');
  const vegetables = vegetable();
  if (eggs && vegetables.length) {
    add(suggestions, 'Omelette aux légumes', [eggs, vegetables[0], cheese].filter(Boolean), 15, people, 'Poêle', vegetarian);
  }

  const saladBase = find('salade', 'tomate', 'concombre');
  const saladProtein = vegetarian
    ? find('oeuf', 'fromage', 'tofu', 'pois chiche')
    : find('jambon', 'thon', 'poulet', 'oeuf', 'fromage');
  if (saladBase && saladProtein) {
    const extras = all('tomate', 'concombre', 'mais', 'avocat').filter((item) => item.id !== saladBase.id).slice(0, 2);
    add(suggestions, 'Salade composée', [saladBase, saladProtein, ...extras], 10, people, 'Sans cuisson', vegetarian);
  }

  const pasta = find('pate', 'spaghetti', 'penne', 'tagliatelle');
  const pastaSauce = find('sauce tomate', 'pesto', 'coulis', 'tomate');
  if (pasta && pastaSauce) {
    add(suggestions, 'Pâtes du placard', [pasta, pastaSauce, cheese].filter(Boolean), 15, people, 'Casserole', vegetarian);
  }

  if (vegetables.length >= 2) {
    const protein = vegetarian ? find('tofu', 'oeuf', 'pois chiche') : find('poulet', 'jambon', 'saumon', 'oeuf');
    add(suggestions, 'Poêlée anti-gaspillage', [...vegetables.slice(0, 3), protein].filter(Boolean), 20, people, 'Poêle', vegetarian);
  }

  const bread = find('pain', 'baguette', 'tartine');
  const topping = vegetarian ? find('fromage', 'avocat', 'tomate') : find('fromage', 'jambon', 'thon', 'saumon');
  if (bread && topping) add(suggestions, 'Tartines chaudes', [bread, topping], 10, people, 'Four ou poêle', vegetarian);

  const rice = find('riz');
  const bowlProtein = vegetarian ? find('tofu', 'oeuf', 'pois chiche') : find('poulet', 'thon', 'saumon', 'oeuf');
  if (rice && vegetables.length && bowlProtein) {
    add(suggestions, 'Bol de riz garni', [rice, vegetables[0], bowlProtein], 20, people, 'Casserole', vegetarian);
  }

  const filtered = suggestions
    .filter((suggestion) => suggestion.minutes <= Number(maxMinutes))
    .filter((suggestion) => !vegetarian || suggestion.vegetarianCompatible);

  return filtered
    .sort((a, b) => mode === 'waste' ? b.urgencyScore - a.urgencyScore || a.minutes - b.minutes : a.minutes - b.minutes || b.urgencyScore - a.urgencyScore)
    .slice(0, 2)
    .map(({ vegetarianCompatible, urgencyScore, ...suggestion }) => suggestion);
}

export { BASE_INGREDIENTS };

function add(target, name, products, minutes, people, method, vegetarian) {
  const unique = Array.from(new Map(products.map((product) => [product.id || normalize(product.nom), product])).values());
  const urgencyScore = unique.reduce((score, product) => {
    const days = joursRestants(product.date_expiration);
    return score + (days === null ? 0 : Math.max(0, 8 - days));
  }, 0);
  target.push({
    name,
    products: unique.map((product) => product.nom),
    minutes,
    people,
    method,
    bases: BASE_INGREDIENTS,
    urgencyScore,
    vegetarianCompatible: vegetarian || !unique.some((product) => product.categorie === 'Viandes & Poissons'),
  });
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe');
}
