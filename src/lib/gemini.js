// src/lib/gemini.js
// Analyse d'une photo large de frigo/placard via Google Gemini.

import { z } from 'zod';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
const GEMINI_MODEL = GEMINI_URL.match(/models\/([^:]+)/)?.[1] || 'unknown';
const isDev = import.meta.env.DEV;

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;
const OUTPUT_MIME_TYPE = 'image/jpeg';
const IMAGE_LABELS = [
  'full',
  'crop_top_left',
  'crop_top_right',
  'crop_middle_left',
  'crop_middle_right',
  'crop_bottom_left',
  'crop_bottom_right',
];

export const FOOD_CATEGORIES = [
  'fruit',
  'legume',
  'produit_laitier',
  'viande',
  'poisson',
  'feculent',
  'sauce',
  'boisson',
  'conserve',
  'snack',
  'autre',
];

const APP_CATEGORY_BY_AI_CATEGORY = {
  fruit: 'Légumes & Fruits',
  legume: 'Légumes & Fruits',
  produit_laitier: 'Produits laitiers',
  viande: 'Viandes & Poissons',
  poisson: 'Viandes & Poissons',
  feculent: 'Céréales & Pâtes',
  sauce: 'Condiments & Sauces',
  boisson: 'Boissons',
  conserve: 'Conserves & Épicerie',
  snack: 'Conserves & Épicerie',
  autre: 'Autre',
};

const APP_CATEGORIES = new Set(Object.values(APP_CATEGORY_BY_AI_CATEGORY));
const BISCUIT_CATEGORY = APP_CATEGORIES.has('Biscuits & Snacks sucrés')
  ? 'Biscuits & Snacks sucrés'
  : 'Boulangerie';

const PROMPT = `Tu es un système d'inventaire alimentaire par image.
Analyse les 7 images comme une seule scène.
L'image full donne le contexte général.
Les crops servent à mieux voir les détails.
Ne crée pas de doublons entre full et crops.
Si un même produit apparaît dans plusieurs images, fusionne-le.
Pour chaque produit, ajoute sources avec les noms des images où il est visible, par exemple ["full", "crop_middle_right"].
Identifie uniquement les aliments et produits alimentaires visibles.
Ne devine pas le contenu des sacs opaques.
Si un objet est partiellement caché, confidence = low ou medium.
Si tu n'es pas sûr, mets l'objet dans uncertain_items.
Ne confonds pas marque et aliment.
Regroupe les doublons évidents.
Ne liste pas les emballages vides.
Ne liste pas les objets non alimentaires.
Réponds uniquement selon le schéma JSON imposé.`;

const GeminiItemSchema = z
  .object({
    name: z.string().trim().min(1),
    category: z.enum(FOOD_CATEGORIES),
    quantity_estimate: z.string().trim().min(1),
    confidence: z.enum(['high', 'medium', 'low']),
    evidence: z.string().trim().min(1),
    visible_part: z.enum(['complete', 'partial', 'hidden']),
    sources: z.array(z.enum(IMAGE_LABELS)).default([]),
  })
  .strict();

const GeminiUncertainItemSchema = z
  .object({
    description: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

const GeminiResponseSchema = z
  .object({
    items: z.array(GeminiItemSchema).default([]),
    uncertain_items: z.array(GeminiUncertainItemSchema).default([]),
  })
  .strict();

const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: FOOD_CATEGORIES },
          quantity_estimate: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          evidence: { type: 'string' },
          visible_part: { type: 'string', enum: ['complete', 'partial', 'hidden'] },
          sources: {
            type: 'array',
            items: { type: 'string', enum: IMAGE_LABELS },
          },
        },
        required: [
          'name',
          'category',
          'quantity_estimate',
          'confidence',
          'evidence',
          'visible_part',
          'sources',
        ],
      },
    },
    uncertain_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['description', 'reason'],
      },
    },
  },
  required: ['items', 'uncertain_items'],
};

const CONFIDENCE_SCORE = {
  low: 1,
  medium: 2,
  high: 3,
};

const SCORE_CONFIDENCE = {
  1: 'low',
  2: 'medium',
  3: 'high',
};

const UNIT_TRANSLATIONS = {
  bag: 'paquet',
  bags: 'paquets',
  pack: 'paquet',
  packs: 'paquets',
  can: 'conserve',
  cans: 'conserves',
  jar: 'bocal',
  jars: 'bocaux',
  bottle: 'bouteille',
  bottles: 'bouteilles',
  pot: 'bocal',
  pots: 'bocaux',
};

const UNIT_PLURALS = {
  bocal: 'bocaux',
  conserve: 'conserves',
  paquet: 'paquets',
  bouteille: 'bouteilles',
};

const EVIDENCE_TRANSLATIONS = [
  [/visible on the shelf/gi, "visible sur l'étagère"],
  [/on the shelf/gi, "sur l'étagère"],
  [/visible/gi, 'visible'],
  [/shelf/gi, 'étagère'],
  [/partial(?:ly)? hidden/gi, 'partiellement caché'],
  [/complete(?:ly)? visible/gi, 'entièrement visible'],
];

/**
 * Analyse une photo large de frigo/placard et retourne des listes prêtes pour validation UI.
 * @param {File} file
 * @param {string} emplacement
 * @returns {Promise<{items_high_confidence: Array, items_to_verify: Array, uncertain_items: Array}>}
 */
export async function analyserPhotoFrigo(file, emplacement = 'Frigo') {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Clé Gemini manquante : définissez VITE_GEMINI_API_KEY dans votre fichier .env'
    );
  }

  const images = await preparerImagesPourAnalyse(file);
  const rawResult = await appelerGemini(images);
  const parsed = validerReponseGemini(rawResult);
  logGeminiDebug('items reçus', parsed.items.length);

  return fusionnerResultats(parsed, emplacement);
}

async function appelerGemini(images) {
  const body = creerPayloadGemini(images, {
    temperature: 0.1,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
    responseSchema: GEMINI_RESPONSE_SCHEMA,
  });

  logGeminiDebug('modèle utilisé', GEMINI_MODEL);
  logGeminiDebug('nombre d’images envoyées', images.length);

  const response = await envoyerRequeteGemini(body);

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Erreur Gemini (${response.status}) : ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error("Gemini n'a renvoyé aucun résultat exploitable.");
  }

  return text;
}

function creerPayloadGemini(images, generationConfig) {
  return {
    contents: [
      {
        parts: [
          { text: PROMPT },
          ...images.flatMap((image) => [
            { text: `Image ${image.label}` },
            {
              inline_data: {
                mime_type: image.mimeType,
                data: image.base64,
              },
            },
          ]),
        ],
      },
    ],
    generationConfig,
  };
}

async function envoyerRequeteGemini(body) {
  try {
    return await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Impossible de joindre le service Gemini. Vérifiez votre connexion.');
  }
}

function validerReponseGemini(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error("La réponse de Gemini n'est pas un JSON valide. Réessayez avec une photo plus nette.");
  }

  const result = GeminiResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("La réponse de Gemini ne respecte pas le schéma attendu.");
  }

  return result.data;
}

function fusionnerResultats(result, emplacement) {
  const merged = [];

  result.items.forEach((item) => {
    const normalizedItem = normaliserProduitGemini(item);
    if (!normalizedItem.normalizedName) return;

    const existing = merged.find((candidate) =>
      sontDoublonsProbables(candidate.normalizedName, normalizedItem.normalizedName)
    );

    if (!existing) {
      merged.push({ ...normalizedItem, occurrences: 1 });
      return;
    }

    const currentScore = CONFIDENCE_SCORE[normalizedItem.confidence];
    const existingScore = CONFIDENCE_SCORE[existing.confidence];

    existing.occurrences += 1;
    existing.name = choisirNomLePlusPrecis(existing.name, normalizedItem.name);
    existing.normalizedName = normaliserNom(existing.name);
    existing.category = choisirCategorie(existing, normalizedItem);
    existing.confidence = currentScore > existingScore ? normalizedItem.confidence : existing.confidence;
    existing.visible_part =
      existing.visible_part === 'complete' || normalizedItem.visible_part !== 'complete'
        ? existing.visible_part
        : normalizedItem.visible_part;
    existing.evidence = fusionnerTexte(existing.evidence, normalizedItem.evidence);
    existing.quantity = fusionnerQuantites(existing.quantity, normalizedItem.quantity);
    existing.sources = fusionnerSources(existing.sources, normalizedItem.sources);
  });

  const items = merged.map((item) => {
    const boostedScore = item.occurrences > 1 ? Math.min(CONFIDENCE_SCORE[item.confidence] + 1, 3) : CONFIDENCE_SCORE[item.confidence];
    const confidence = SCORE_CONFIDENCE[boostedScore];

    return convertirVersProduitUI({
      ...item,
      confidence,
      emplacement,
    });
  });

  return {
    items_high_confidence: items.filter((item) => item.confidence === 'high'),
    items_to_verify: items.filter((item) => item.confidence === 'medium'),
    uncertain_items: [
      ...items.filter((item) => item.confidence === 'low'),
      ...result.uncertain_items.map((item) => ({
        description: item.description,
        reason: traduireEvidence(item.reason),
        kind: 'uncertain',
      })),
    ],
  };
}

function convertirVersProduitUI(item) {
  return {
    nom: item.name,
    marque: null,
    quantite: item.quantity.quantite,
    unite: item.quantity.unite,
    categorie: categorieAppPourProduit(item),
    emplacement: item.emplacement,
    date_expiration: '',
    confidence: item.confidence,
    evidence: item.evidence,
    visible_part: item.visible_part,
    sources: item.sources,
    occurrences: item.occurrences,
    ai_category: item.category,
    kind: 'item',
  };
}

function categorieAppPourProduit(item) {
  const normalized = normaliserNom(item.name);
  if (/\b(oreo|biscuit|biscuits|cookie|cookies)\b/.test(normalized)) return BISCUIT_CATEGORY;
  if (normalized.includes('sauce tomate')) return 'Condiments & Sauces';
  if (/\bolives?\b/.test(normalized)) return 'Conserves & Épicerie';
  return APP_CATEGORY_BY_AI_CATEGORY[item.category] || 'Autre';
}

function normaliserProduitGemini(item) {
  const name = String(item.name || '').trim();
  const correctedCategory = corrigerCategorie(item.category, name);

  return {
    ...item,
    name,
    normalizedName: normaliserNom(name),
    category: correctedCategory,
    quantity: normaliserQuantite(item.quantity_estimate, name),
    evidence: traduireEvidence(item.evidence),
    sources: Array.isArray(item.sources) ? item.sources.filter((source) => IMAGE_LABELS.includes(source)) : [],
  };
}

function normaliserQuantite(quantityEstimate, name = '') {
  const raw = String(quantityEstimate || '').trim();
  if (!raw) {
    return { quantite: 1, unite: 'unité(s)' };
  }

  const normalized = raw.toLowerCase().replace(',', '.');
  const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  const quantite = numberMatch ? Number(numberMatch[1]) : 1;
  const withoutNumber = normalized
    .replace(/(\d+(?:\.\d+)?)/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const unitKey = (withoutNumber.split(/\s+/)[0] || normalized.split(/\s+/)[0] || '').replace(
    /[^a-z]/g,
    ''
  );
  const nameKey = normaliserNom(name);
  const forcedUnit =
    nameKey.includes('sauce tomate') && (unitKey === 'pot' || unitKey === 'pots')
      ? UNIT_TRANSLATIONS[unitKey]
      : null;
  const translated = forcedUnit || UNIT_TRANSLATIONS[unitKey];

  if (translated) {
    const unite = quantite > 1 ? mettreUniteAuPluriel(translated) : translated;
    return {
      quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
      unite,
    };
  }

  const translatedText = raw.replace(/\b(bags?|packs?|cans?|jars?|bottles?)\b/gi, (match) => {
    const replacement = UNIT_TRANSLATIONS[match.toLowerCase()];
    return replacement || match;
  });

  return {
    quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
    unite: numberMatch ? nettoyerUnite(translatedText) : nettoyerUnite(translatedText),
  };
}

function nettoyerUnite(unit) {
  return String(unit || '')
    .replace(/\d+(?:[,.]\d+)?/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'unité(s)';
}

function fusionnerQuantites(first, second) {
  if (!first) return second;
  if (!second) return first;
  if (uniteCanonique(first.unite) !== uniteCanonique(second.unite)) return first;

  const quantite = first.quantite + second.quantite;
  return {
    quantite,
    unite: quantite > 1 ? mettreUniteAuPluriel(first.unite) : first.unite,
  };
}

function fusionnerSources(first = [], second = []) {
  return Array.from(new Set([...first, ...second].filter((source) => IMAGE_LABELS.includes(source))));
}

function mettreUniteAuPluriel(unite) {
  return UNIT_PLURALS[unite] || unite;
}

function uniteCanonique(unite) {
  const value = String(unite || '').trim();
  const singular = Object.entries(UNIT_PLURALS).find(([, plural]) => plural === value);
  return singular ? singular[0] : value;
}

function choisirNomLePlusPrecis(first, second) {
  const firstTokens = tokensNom(first);
  const secondTokens = tokensNom(second);
  if (secondTokens.length > firstTokens.length) return second;
  if (secondTokens.length === firstTokens.length && second.length > first.length) return second;
  return first;
}

function choisirCategorie(first, second) {
  const preciseByName = corrigerCategorie(second.category, second.name);
  if (preciseByName !== second.category) return preciseByName;

  const firstCategory = corrigerCategorie(first.category, first.name);
  if (firstCategory !== first.category) return firstCategory;
  if (first.category === 'autre') return second.category;
  if (second.category === 'autre') return first.category;
  if (first.category === 'snack' && second.category !== 'snack') return second.category;
  return first.category;
}

function corrigerCategorie(category, name) {
  const normalized = normaliserNom(name);
  if (/\b(oreo|biscuit|biscuits|cookie|cookies)\b/.test(normalized)) return 'snack';
  if (normalized.includes('sauce tomate')) return 'sauce';
  if (/\bolives?\b/.test(normalized)) return 'conserve';
  return category;
}

function sontDoublonsProbables(first, second) {
  if (!first || !second) return false;
  if (first === second) return true;

  const firstTokens = tokensNom(first);
  const secondTokens = tokensNom(second);
  const shorter = firstTokens.length <= secondTokens.length ? firstTokens : secondTokens;
  const longer = firstTokens.length > secondTokens.length ? firstTokens : secondTokens;
  const common = shorter.filter((token) => longer.includes(token));

  if (shorter.length >= 2 && common.length === shorter.length) return true;

  const union = new Set([...firstTokens, ...secondTokens]);
  return common.length / union.size >= 0.75;
}

function tokensNom(name) {
  return normaliserNom(name).split(' ').filter(Boolean);
}

function traduireEvidence(evidence) {
  return EVIDENCE_TRANSLATIONS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(evidence || '').trim()
  );
}

function normaliserNom(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(le|la|les|un|une|des|du|de|d)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function fusionnerTexte(first, second) {
  if (!second || first === second) return first;
  if (!first) return second;
  return `${first}; ${second}`;
}

function logGeminiDebug(label, value) {
  if (isDev) {
    console.log(`[gemini-photo] ${label}`, value);
  }
}

async function preparerImagesPourAnalyse(file) {
  const source = await chargerImageOrientee(file);
  const fullCanvas = dessinerDansCanvas(source, {
    sx: 0,
    sy: 0,
    sw: source.width,
    sh: source.height,
    maxWidth: MAX_IMAGE_WIDTH,
  });

  libererSource(source);

  const images = [
    {
      label: IMAGE_LABELS[0],
      ...(await canvasVersBase64(fullCanvas)),
    },
  ];

  const cropWidth = fullCanvas.width / 2;
  const cropHeight = fullCanvas.height / 3;

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const cropCanvas = dessinerDansCanvas(fullCanvas, {
        sx: col * cropWidth,
        sy: row * cropHeight,
        sw: cropWidth,
        sh: cropHeight,
        maxWidth: MAX_IMAGE_WIDTH,
      });

      images.push({
        label: IMAGE_LABELS[1 + row * 2 + col],
        ...(await canvasVersBase64(cropCanvas)),
      });
    }
  }

  return images;
}

async function chargerImageOrientee(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (err) {
      return createImageBitmap(file);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Lecture du fichier image impossible.'));
    };
    img.src = url;
  });
}

function dessinerDansCanvas(source, { sx, sy, sw, sh, maxWidth }) {
  const scale = Math.min(1, maxWidth / sw);
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Impossible de préparer l'image pour l'analyse.");
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  return canvas;
}

function canvasVersBase64(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression de l'image impossible."));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = String(reader.result).split(',')[1];
          if (!base64) {
            reject(new Error('Lecture du fichier image impossible.'));
            return;
          }
          resolve({ base64, mimeType: OUTPUT_MIME_TYPE });
        };
        reader.onerror = () => reject(new Error('Lecture du fichier image impossible.'));
        reader.readAsDataURL(blob);
      },
      OUTPUT_MIME_TYPE,
      JPEG_QUALITY
    );
  });
}

function libererSource(source) {
  if (typeof source.close === 'function') {
    source.close();
  }
}

/**
 * Convertit un File en base64 (sans le préfixe data URL).
 * Conservé pour compatibilité avec d'éventuels appels existants.
 * @param {File} file
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export function fichierVersBase64(file) {
  return preparerImagesPourAnalyse(file).then(([image]) => image);
}
