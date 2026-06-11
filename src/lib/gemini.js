// src/lib/gemini.js
// Analyse d'une photo large de frigo/placard via Google Gemini.

import { z } from 'zod';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;
const OUTPUT_MIME_TYPE = 'image/jpeg';

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

const PROMPT = `Tu es un système d'inventaire alimentaire par image.
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
        },
        required: ['name', 'category', 'quantity_estimate', 'confidence', 'evidence', 'visible_part'],
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
};

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

  return fusionnerResultats(parsed, emplacement);
}

async function appelerGemini(images) {
  const body = creerPayloadGemini(images, {
    temperature: 0.1,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
    responseSchema: GEMINI_RESPONSE_SCHEMA,
  });

  let response = await envoyerRequeteGemini(body);

  if (!response.ok && response.status === 400) {
    const retryBody = creerPayloadGemini(images, {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseFormat: {
        text: {
          mimeType: 'application/json',
          schema: GEMINI_RESPONSE_SCHEMA,
        },
      },
    });
    response = await envoyerRequeteGemini(retryBody);
  }

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
            { text: `Image fournie: ${image.label}` },
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
  const byName = new Map();

  result.items.forEach((item) => {
    const key = normaliserNom(item.name);
    if (!key) return;

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, { ...item, occurrences: 1 });
      return;
    }

    const currentScore = CONFIDENCE_SCORE[item.confidence];
    const existingScore = CONFIDENCE_SCORE[existing.confidence];

    existing.occurrences += 1;
    existing.confidence = currentScore > existingScore ? item.confidence : existing.confidence;
    existing.visible_part =
      existing.visible_part === 'complete' || item.visible_part !== 'complete'
        ? existing.visible_part
        : item.visible_part;
    existing.evidence = fusionnerTexte(existing.evidence, item.evidence);
    existing.quantity_estimate = fusionnerTexte(existing.quantity_estimate, item.quantity_estimate);
  });

  const items = Array.from(byName.values()).map((item) => {
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
        reason: item.reason,
        kind: 'uncertain',
      })),
    ],
  };
}

function convertirVersProduitUI(item) {
  const { quantite, unite } = normaliserQuantite(item.quantity_estimate);

  return {
    nom: item.name,
    marque: null,
    quantite,
    unite,
    categorie: APP_CATEGORY_BY_AI_CATEGORY[item.category] || 'Autre',
    emplacement: item.emplacement,
    date_expiration: '',
    confidence: item.confidence,
    evidence: item.evidence,
    visible_part: item.visible_part,
    occurrences: item.occurrences,
    ai_category: item.category,
    kind: 'item',
  };
}

function normaliserQuantite(quantityEstimate) {
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
  const translated = UNIT_TRANSLATIONS[unitKey];

  if (translated) {
    return {
      quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
      unite: translated,
    };
  }

  const translatedText = raw.replace(/\b(bags?|packs?|cans?|jars?|bottles?)\b/gi, (match) => {
    const replacement = UNIT_TRANSLATIONS[match.toLowerCase()];
    return replacement || match;
  });

  return {
    quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
    unite: numberMatch ? translatedText.replace(numberMatch[0], '').trim() || 'unité(s)' : translatedText,
  };
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
      label: 'image_complete',
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
        label: `crop_l${row + 1}_c${col + 1}`,
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
