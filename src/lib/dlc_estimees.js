// src/lib/dlc_estimees.js
// Dictionnaire de durées de conservation estimées après achat (en jours)
// Sources : Ministère de l'Agriculture, INC, Que Choisir, HACCP, Yuka
// Catégories alignées avec la base SQL ma-cuisine
//
// IMPORTANT : Ces durées sont des estimations moyennes après achat.
// Elles servent à pré-remplir la date d'expiration — toujours vérifier
// la date réelle inscrite sur l'emballage.

// ─── Viandes & Poissons ──────────────────────────────────────────────────────
const VIANDES_POISSONS = {
  // Viandes crues
  "steak":              7,
  "boeuf":              7,
  "bœuf":               7,
  "veau":               7,
  "agneau":             7,
  "porc":               7,
  "cote":               7,
  "côte":               7,
  "roti":               7,
  "rôti":               7,
  "escalope":           7,
  "viande hachee":      7,
  "viande hachée":      7,
  "hachis":             7,
  "steak hache":        7,
  "steak haché":        7,
  "abat":               3,
  "abats":              3,
  "foie":               2,
  "poulet":             5,
  "volaille":           5,
  "dinde":              5,
  "canard":             5,
  "lapin":              3,

  // Viandes cuites / transformées
  "jambon cuit":        7,
  "jambon blanc":       7,
  "jambon":             5,
  "lardons":            14,
  "bacon":              14,
  "saucisse":           7,
  "merguez":            7,
  "chipolata":          7,
  "boudin":             7,
  "andouillette":       3,
  "saucisson":          10,
  "salami":             10,
  "chorizo":            14,
  "pate":               5,
  "pâté":               5,
  "rillettes":          5,
  "terrine":            5,
  "charcuterie":        5,
  "knacki":             3,
  "frankfurter":        3,

  // Poissons & fruits de mer
  "poisson":            2,
  "saumon":             5,
  "cabillaud":          2,
  "merlu":              2,
  "sole":               2,
  "bar":                2,
  "dorade":             2,
  "thon frais":         2,
  "sardine fraiche":    1,
  "sardine fraîche":    1,
  "truite":             2,
  "filet de poisson":   2,
  "crevette":           5,
  "crevettes":          5,
  "moule":              2,
  "moules":             2,
  "huitre":             5,
  "huître":             5,
  "noix de saint-jacques": 2,
  "noix de saint jacques": 2,
  "homard":             2,
  "langoustine":        2,
  "fruits de mer":      2,
  "surimi":             5,

  // Poissons transformés
  "saumon fume":        14,
  "saumon fumé":        14,
  "maquereau fume":     14,
  "maquereau fumé":     14,
  "hareng fume":        14,
  "hareng fumé":        14,
  "thon en conserve":   1095,
  "sardine en conserve": 1095,
};

// ─── Légumes & Fruits ────────────────────────────────────────────────────────
const LEGUMES_FRUITS = {
  // Légumes frais (réfrigérateur)
  "salade":             4,
  "laitue":             4,
  "mache":              3,
  "mâche":              3,
  "roquette":           4,
  "epinard":            4,
  "épinard":            4,
  "cresson":            3,
  "endive":             5,
  "poireau":            7,
  "brocoli":            4,
  "chou-fleur":         7,
  "chou":               7,
  "choux de bruxelles": 5,
  "asperge":            3,
  "asperges":           3,
  "haricot vert":       4,
  "haricots verts":     4,
  "petits pois":        3,
  "courgette":          7,
  "concombre":          7,
  "poivron":            7,
  "tomate":             7,
  "tomates":            7,
  "champignon":         4,
  "champignons":        4,
  "celeri":             7,
  "céleri":             7,
  "fenouil":            5,
  "artichaut":          5,
  "bette":              4,
  "betterave":          14,
  "carotte":            14,
  "carottes":           14,
  "navet":              14,
  "radis":              7,
  "persil":             5,
  "ciboulette":         5,
  "basilic frais":      5,
  "menthe fraiche":     5,
  "menthe fraîche":     5,
  "coriandre fraiche":  5,
  "coriandre fraîche":  5,

  // Légumes à température ambiante
  "pomme de terre":     30,
  "pommes de terre":    30,
  "oignon":             30,
  "oignons":            30,
  "ail":                30,
  "echalote":           21,
  "échalote":           21,

  // Fruits frais (réfrigérateur)
  "fraise":             4,
  "fraises":            4,
  "framboise":          3,
  "framboises":         3,
  "myrtille":           5,
  "myrtilles":          5,
  "cerise":             5,
  "cerises":            5,
  "raisin":             7,
  "peche":              5,
  "pêche":              5,
  "abricot":            5,
  "nectarine":          5,
  "prune":              5,
  "melon":              5,
  "pasteque":           7,
  "pastèque":           7,
  "kiwi":               14,
  "kiwis":              14,

  // Fruits à température ambiante
  "pomme":              30,
  "pommes":             30,
  "poire":              14,
  "poires":             14,
  "orange":             14,
  "oranges":            14,
  "citron":             21,
  "citrons":            21,
  "mandarine":          14,
  "banane":             7,
  "bananes":            7,
  "ananas":             7,
  "mangue":             5,
  "avocat":             4,
  "avocats":            4,
  "noix":               90,
  "noisette":           90,
  "amande":             90,
};

// ─── Produits laitiers ───────────────────────────────────────────────────────
const PRODUITS_LAITIERS = {
  "lait entier":        7,
  "lait nature":        7,
  "lait demi-ecreme":   7,
  "lait demi-écrémé":   7,
  "lait ecreme":        7,
  "lait écrémé":        7,
  "lait uht":           90,
  "lait sans lactose":  7,
  "yaourt":             30,
  "yaourts":            30,
  "yogourt":            30,
  "fromage blanc":      14,
  "faisselle":          7,
  "petit-suisse":       14,
  "creme fraiche":      7,
  "crème fraîche":      7,
  "creme fraiche ouverte": 7,
  "crème fraiche ouverte": 7,
  "beurre":             30,
  "beurre doux":        30,
  "beurre demi-sel":    30,
  "emmental":           21,
  "gruyere":            21,
  "gruyère":            21,
  "comté":              21,
  "comte":              21,
  "beaufort":           21,
  "cheddar":            21,
  "gouda":              21,
  "raclette":           14,
  "camembert":          14,
  "brie":               14,
  "coulommiers":        14,
  "munster":            10,
  "livarot":            10,
  "maroilles":          10,
  "roquefort":          21,
  "bleu":               21,
  "chevre":             10,
  "chèvre":             10,
  "mozzarella":         5,
  "burrata":            3,
  "ricotta":            5,
  "mascarpone":         7,
  "parmesan":           30,
  "fromage rape":       14,
  "fromage râpé":       14,
  "fromage a tartiner": 14,
  "fromage à tartiner": 14,
  "dessert lacte":      14,
  "dessert lacté":      14,
  "mousse au chocolat": 3,
  "creme dessert":      14,
  "crème dessert":      14,
  "flan":               5,
  "riz au lait":        5,
  "chantilly":          2,
  "lait fermente":      21,
  "lait fermenté":      21,
  "kefir":              14,
  "kéfir":              14,
};

// ─── Conserves & Épicerie ────────────────────────────────────────────────────
const CONSERVES_EPICERIE = {
  // Conserves (DDM longue)
  "conserve":           1095,
  "boite de":           1095,
  "boîte de":           1095,
  "thon":               1095,
  "sardine":            1095,
  "maquereau":          1095,
  "saumon en conserve": 1095,
  "tomate en conserve": 1095,
  "tomates pelees":     1095,
  "tomates pelées":     1095,
  "tomate concassee":   1095,
  "tomate concassée":   1095,
  "concentre de tomate":1095,
  "concentré de tomate":1095,
  "haricots rouges":    1095,
  "pois chiches":       1095,
  "lentilles en conserve": 1095,
  "corn":               1095,
  "mais":               1095,
  "maïs":               1095,
  "champignons en conserve": 1095,
  "artichauts en conserve": 1095,
  "petits pois en conserve": 1095,
  "soupe en conserve":  1095,
  "bouillon":           730,
  "bouillon cube":      730,

  // Bocaux / condiments
  "cornichons":         730,
  "olives":             730,
  "capres":             730,
  "câpres":             730,
  "confiture":          365,
  "miel":               730,
  "nutella":            365,
  "pate a tartiner":    365,
  "pâte à tartiner":    365,
  "beurre de cacahuete":365,
  "tahini":             365,

  // Matières grasses
  "huile d'olive":      365,
  "huile de tournesol": 365,
  "huile":              365,
  "vinaigre":           730,
  "margarine":          30,

  // Condiments ouverts
  "ketchup":            180,
  "moutarde":           365,
  "mayonnaise":         60,
  "sauce soja":         365,
  "sauce worcestershire": 365,
  "tabasco":            365,
  "sauce piquante":     365,
  "sauce barbecue":     180,
  "sauce caesar":       60,
};

// ─── Surgelés ────────────────────────────────────────────────────────────────
const SURGELES = {
  "surgele":            90,
  "surgelé":            90,
  "surgeles":           90,
  "surgelés":           90,
  "glace":              90,
  "sorbet":             90,
  "legumes surgeles":   90,
  "légumes surgelés":   90,
  "poisson surgele":    90,
  "poisson surgelé":    90,
  "viande surgelee":    90,
  "viande surgelée":    90,
  "pizza surgelee":     90,
  "pizza surgelée":     90,
  "plat cuisine surgele": 90,
  "plat cuisiné surgelé": 90,
  "frites surgelees":   90,
  "frites surgelées":   90,
};

// ─── Céréales & Pâtes ────────────────────────────────────────────────────────
const CEREALES_PATES = {
  "pates":              730,
  "pâtes":              730,
  "spaghetti":          730,
  "tagliatelle":        730,
  "fusilli":            730,
  "penne":              730,
  "farfalle":           730,
  "macaroni":           730,
  "linguine":           730,
  "riz":                730,
  "riz basmati":        730,
  "riz complet":        730,
  "riz jasmin":         730,
  "quinoa":             730,
  "boulgour":           730,
  "couscous":           730,
  "semoule":            730,
  "polenta":            730,
  "farine":             365,
  "farine de ble":      365,
  "farine de blé":      365,
  "farine complete":    180,
  "farine complète":    180,
  "flocons d'avoine":   365,
  "muesli":             365,
  "cereales":           365,
  "céréales":           365,
  "corn flakes":        365,
  "granola":            180,
  "pain de mie":        7,
  "pain grille":        90,
  "pain grillé":        90,
  "biscottes":          180,
  "crackers":           180,
  "galettes de riz":    180,
  "chapelure":          180,
};

// ─── Condiments & Sauces ─────────────────────────────────────────────────────
const CONDIMENTS_SAUCES = {
  // Épices sèches (longue durée)
  "sel":                1825,
  "poivre":             730,
  "paprika":            730,
  "cumin":              730,
  "curcuma":            730,
  "cannelle":           730,
  "curry":              730,
  "gingembre en poudre":730,
  "coriandre en poudre":730,
  "piment":             730,
  "herbes de provence": 730,
  "thym":               730,
  "basilic sec":        730,
  "origan":             730,
  "romarin":            730,
  "laurier":            730,
  "noix de muscade":    730,
  "cardamome":          730,
  "anis":               730,
  "epice":              730,
  "épice":              730,
  "epices":             730,
  "épices":             730,
  "levure":             180,
  "levure chimique":    365,
  "bicarbonate":        730,

  // Sucre & douceurs
  "sucre":              1825,
  "sucre glace":        730,
  "sucre roux":         1825,
  "cassonade":          1825,
  "sirop d'erable":     365,
  "sirop d'érable":     365,
  "sirop":              180,

  // Sauces (ouvertes, réfrigérateur)
  "sauce tomate":       5,
  "pesto":              5,
  "sauce bolognaise":   3,
};

// ─── Boissons ────────────────────────────────────────────────────────────────
const BOISSONS = {
  "jus d'orange":       7,
  "jus de pomme":       7,
  "jus d'ananas":       7,
  "jus de raisin":      7,
  "jus multifruits":    7,
  "jus de fruits frais":3,
  "jus":                7,
  "nectar":             7,
  "smoothie":           3,
  "eau":                365,
  "eau plate":          365,
  "eau gazeuse":        365,
  "coca":               365,
  "pepsi":              365,
  "soda":               365,
  "limonade":           365,
  "biere":              180,
  "bière":              180,
  "vin":                3,
  "cafe":               180,
  "café":               180,
  "the":                730,
  "thé":                730,
  "infusion":           730,
  "chocolat en poudre": 365,
  "cacao":              365,
  "lait vegetal":       5,
  "lait végétal":       5,
  "boisson vegetale":   5,
  "boisson végétale":   5,
  "lait d'amande":      5,
  "lait de soja":       5,
  "lait d'avoine":      5,
};

// ─── Boulangerie ─────────────────────────────────────────────────────────────
const BOULANGERIE = {
  "pain":               3,
  "baguette":           2,
  "pain complet":       4,
  "pain de seigle":     5,
  "pain aux cereales":  4,
  "pain aux céréales":  4,
  "pain de campagne":   4,
  "brioche":            5,
  "croissant":          2,
  "pain au chocolat":   2,
  "viennoiserie":       2,
  "gateau":             5,
  "gâteau":             5,
  "tarte":              3,
  "cake":               5,
  "muffin":             4,
  "cookie":             7,
  "cookies":            7,
  "oreo":               180,
  "biscuit":            180,
  "biscuits":           180,
  "sable":              180,
  "sablé":              180,
  "macaron":            5,
  "eclair":             2,
  "éclair":             2,
  "paris-brest":        2,
  "mille-feuille":      2,
  "crepe":              3,
  "crêpe":              3,
  "gaufre":             3,
};

// ─── Plats cuisinés & autres ─────────────────────────────────────────────────
const AUTRES = {
  "plat cuisine":       3,
  "plat cuisiné":       3,
  "quiche":             3,
  "pizza fraiche":      3,
  "pizza fraîche":      3,
  "lasagne fraiche":    3,
  "lasagne fraîche":    3,
  "gratin":             3,
  "soupe fraiche":      3,
  "soupe fraîche":      3,
  "salade composee":    2,
  "salade composée":    2,
  "taboulet":           3,
  "taboulé":            3,
  "hummus":             7,
  "houmous":            7,
  "tzatziki":           5,
  "guacamole":          3,
  "oeuf":               28,
  "œuf":                28,
  "oeufs":              28,
  "œufs":               28,
  "chocolat":           180,
  "tablette de chocolat":180,
  "chips":              90,
  "pop-corn":           90,
  "cacahuetes":         90,
  "cacahuètes":         90,
  "noix de cajou":      90,
};

// ─── Dictionnaire fusionné ───────────────────────────────────────────────────
export const DLC_ESTIMEES = {
  ...VIANDES_POISSONS,
  ...LEGUMES_FRUITS,
  ...PRODUITS_LAITIERS,
  ...CONSERVES_EPICERIE,
  ...SURGELES,
  ...CEREALES_PATES,
  ...CONDIMENTS_SAUCES,
  ...BOISSONS,
  ...BOULANGERIE,
  ...AUTRES,
};

// ─── Correspondance catégorie SQL → durée par défaut ───────────────────────
// Utilisé en fallback si aucun mot-clé ne correspond
export const DLC_PAR_CATEGORIE = {
  "Viandes & Poissons":   3,
  "Légumes & Fruits":     7,
  "Produits laitiers":    14,
  "Conserves & Épicerie": 730,
  "Surgelés":             90,
  "Céréales & Pâtes":     365,
  "Condiments & Sauces":  365,
  "Boissons":             180,
  "Boulangerie":          3,
  "Autre":                14,
};

// ─── Normalisation ──────────────────────────────────────────────────────────
function normaliser(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function joursContextuels(nomNormalise, categorie, source) {
  const isNeuf =
    source === "ticket" ||
    source === "code_barres" ||
    source === "photo_placard";

  if (isNeuf) {
    if (
      nomNormalise.includes("sauce tomate") ||
      nomNormalise.includes("sauce en bocal") ||
      nomNormalise.includes("conserve") ||
      nomNormalise.includes("bocal") ||
      categorie === "Conserves & Épicerie"
    ) {
      return 365;
    }

    if (
      nomNormalise.includes("pates") ||
      nomNormalise.includes("pâtes") ||
      nomNormalise.includes("riz") ||
      nomNormalise.includes("cereales") ||
      nomNormalise.includes("céréales") ||
      categorie === "Céréales & Pâtes"
    ) {
      return 730;
    }

    if (
      nomNormalise.includes("oreo") ||
      nomNormalise.includes("biscuit") ||
      nomNormalise.includes("biscuits") ||
      nomNormalise.includes("cookie") ||
      nomNormalise.includes("cookies")
    ) {
      return 180;
    }

    if (
      nomNormalise.includes("paprika") ||
      nomNormalise.includes("epice") ||
      nomNormalise.includes("épice") ||
      nomNormalise.includes("epices") ||
      nomNormalise.includes("épices")
    ) {
      return 730;
    }

    if (
      nomNormalise === "eau" ||
      nomNormalise.includes("eau ") ||
      nomNormalise.includes("soda")
    ) {
      return 365;
    }
  }

  if (source === "photo_frigo" && nomNormalise.includes("sauce tomate")) {
    return 5;
  }

  return null;
}

// ─── Fonction principale ────────────────────────────────────────────────────
/**
 * Estime une date d'expiration à partir du nom du produit et/ou de sa catégorie.
 *
 * @param {string} nomProduit - Nom du produit (ex: "Yaourt nature Danone")
 * @param {string} [categorie] - Catégorie SQL (ex: "Produits laitiers")
 * @param {"photo_frigo"|"photo_placard"|"ticket"|"code_barres"|"manuel"} [source]
 * @returns {Date|null} Date estimée, ou null si aucune correspondance
 */
export function estimerDLC(nomProduit, categorie = null, source = "manuel") {
  const nomNormalise = normaliser(nomProduit);
  const joursPrioritaires = joursContextuels(nomNormalise, categorie, source);

  if (joursPrioritaires !== null) {
    const date = new Date();
    date.setDate(date.getDate() + joursPrioritaires);
    return date;
  }

  // 1. Cherche le mot-clé le plus long qui correspond dans le nom
  let meilleurMatch = null;
  let longueurMax = 0;

  for (const [cle, jours] of Object.entries(DLC_ESTIMEES)) {
    const cleNormalisee = normaliser(cle);
    if (
      nomNormalise.includes(cleNormalisee) &&
      cleNormalisee.length > longueurMax
    ) {
      meilleurMatch = jours;
      longueurMax = cleNormalisee.length;
    }
  }

  if (meilleurMatch !== null) {
    const date = new Date();
    date.setDate(date.getDate() + meilleurMatch);
    return date;
  }

  // 2. Fallback sur la catégorie SQL
  if (categorie && DLC_PAR_CATEGORIE[categorie]) {
    const date = new Date();
    date.setDate(date.getDate() + DLC_PAR_CATEGORIE[categorie]);
    return date;
  }

  // 3. Aucune correspondance
  return null;
}

/**
 * Formate une date en string ISO pour Supabase (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
export function formatDateISO(date) {
  return date.toISOString().split("T")[0];
}

/**
 * Retourne la date d'expiration estimée au format YYYY-MM-DD,
 * ou null si aucune correspondance trouvée.
 *
 * @param {string} nomProduit
 * @param {string} [categorie]
 * @param {"photo_frigo"|"photo_placard"|"ticket"|"code_barres"|"manuel"} [source]
 * @returns {string|null}
 */
export function estimerDLCString(nomProduit, categorie = null, source = "manuel") {
  const date = estimerDLC(nomProduit, categorie, source);
  return date ? formatDateISO(date) : null;
}
