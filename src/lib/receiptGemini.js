// src/lib/receiptGemini.js
// Analyse d'un ticket de caisse via Google Gemini.

import { z } from 'zod';
import { estimerDLCString } from './dlc_estimees';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.85;
const OUTPUT_MIME_TYPE = 'image/jpeg';

export const RECEIPT_CATEGORIES = [
  'Viandes & Poissons',
  'Légumes & Fruits',
  'Produits laitiers',
  'Conserves & Épicerie',
  'Surgelés',
  'Céréales & Pâtes',
  'Condiments & Sauces',
  'Boissons',
  'Boulangerie',
  'Autre',
];

export const RECEIPT_LOCATIONS = [
  'Frigo',
  'Placard sous fenêtre',
  'Plan de travail',
  'Placard épices',
];

const PROMPT = `Tu es un système d’extraction de produits depuis un ticket de caisse français.
Réponds uniquement avec un JSON brut valide.
Aucun markdown.
Aucun texte avant ou après le JSON.
Pas de \`\`\`json.
Pas de commentaire.
Le JSON doit toujours respecter exactement la structure attendue :
{"items":[{"raw_label":"string","name":"string","brand":"string|null","category":"Viandes & Poissons|Légumes & Fruits|Produits laitiers|Conserves & Épicerie|Surgelés|Céréales & Pâtes|Condiments & Sauces|Boissons|Boulangerie|Autre","quantity":1,"unit":"string","suggested_location":"Frigo|Placard sous fenêtre|Plan de travail|Placard épices","confidence":"high|medium|low"}],"uncertain_items":[{"raw_label":"string","reason":"string"}]}
Lis uniquement les lignes correspondant à des produits achetés.
Ignore total, sous-total, TVA, carte bancaire, CB, rendu monnaie, fidélité, date, magasin, promotions non alimentaires, remises.
Si plusieurs images sont fournies, ce sont différentes parties du même ticket de caisse.
Reconstitue mentalement le ticket complet.
Ignore les doublons éventuels entre deux images qui se chevauchent.
Ignore TOTAL, TVA, CB, remises, promotions, sous-total.
Les tickets peuvent contenir des abréviations françaises.
Pour chaque produit, propose un emplacement probable parmi :
- Frigo
- Placard sous fenêtre
- Plan de travail
- Placard épices

Règles d’emplacement :
- produits frais, lait, yaourt, fromage, viande, poisson, légumes frais, fruits fragiles → Frigo
- pâtes, riz, conserves, biscuits, céréales, chips, farine, sucre → Placard sous fenêtre
- huile, vinaigre, fruits à température ambiante, pain en cours, café utilisé souvent → Plan de travail
- sel, poivre, herbes, épices, paprika, curry, basilic sec → Placard épices

Exemples d’abréviations :
- LT DEMI ECR 1L → lait demi-écrémé, Produits laitiers, quantity 1, unit bouteille, Frigo
- OEUFS X6 → œufs, Autre, quantity 6, unit pièces, Frigo
- PDT → pommes de terre, Légumes & Fruits, Placard sous fenêtre ou Plan de travail selon contexte
- TOM → tomates, Légumes & Fruits, Frigo
- YAOURT NAT → yaourt nature, Produits laitiers, Frigo
- PATES → pâtes, Céréales & Pâtes, Placard sous fenêtre
- PAPRIKA → paprika, Condiments & Sauces, Placard épices

Si tu n’es pas sûr, mets confidence low.
Si une ligne est incertaine, mets-la dans uncertain_items.
Retourne uniquement le JSON demandé, sans balise markdown.`;

class GeminiJsonParseError extends Error {
  constructor(message, rawText = '') {
    super(message);
    this.name = 'GeminiJsonParseError';
    this.rawText = rawText;
  }
}

const ReceiptItemSchema = z
  .object({
    raw_label: z.string().trim().min(1),
    name: z.string().trim().min(1),
    brand: z.string().trim().nullable(),
    category: z.enum(RECEIPT_CATEGORIES),
    quantity: z.coerce.number().positive().default(1),
    unit: z.string().trim().min(1),
    suggested_location: z.enum(RECEIPT_LOCATIONS),
    confidence: z.enum(['high', 'medium', 'low']),
  })
  .strict();

const ReceiptUncertainItemSchema = z
  .object({
    raw_label: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  })
  .strict();

const ReceiptResponseSchema = z
  .object({
    items: z.array(ReceiptItemSchema).default([]),
    uncertain_items: z.array(ReceiptUncertainItemSchema).default([]),
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
          raw_label: { type: 'string' },
          name: { type: 'string' },
          brand: { type: 'string', nullable: true },
          category: { type: 'string', enum: RECEIPT_CATEGORIES },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          suggested_location: { type: 'string', enum: RECEIPT_LOCATIONS },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: [
          'raw_label',
          'name',
          'brand',
          'category',
          'quantity',
          'unit',
          'suggested_location',
          'confidence',
        ],
      },
    },
    uncertain_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          raw_label: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['raw_label', 'reason'],
      },
    },
  },
  required: ['items', 'uncertain_items'],
};

/**
 * Analyse une ou plusieurs photos du même ticket de caisse.
 * @param {File|File[]} input
 * @returns {Promise<{items: Array, uncertain_items: Array}>}
 */
export async function analyserTicketCaisse(input) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Clé Gemini manquante : définissez VITE_GEMINI_API_KEY dans votre fichier .env'
    );
  }

  const files = Array.isArray(input) ? input : [input];
  const cleanFiles = files.filter(Boolean);
  if (cleanFiles.length === 0) {
    throw new Error('Ajoutez au moins une photo du ticket.');
  }

  const images = await Promise.all(cleanFiles.map(preparerImageTicket));
  const parsed = await analyserImagesTicketAvecFallback(images);
  const items = dedupliquerItemsTicket(parsed.items);

  return {
    items: items.map(normaliserItemTicket),
    uncertain_items: parsed.uncertain_items,
  };
}

async function analyserImagesTicketAvecFallback(images) {
  try {
    const text = await appelerGeminiTicket(images);
    return validerReponseTicket(text);
  } catch (err) {
    if (!(err instanceof GeminiJsonParseError) || images.length <= 1) {
      throw err;
    }

    const partialResults = [];
    for (const image of images) {
      try {
        const text = await appelerGeminiTicket([image]);
        partialResults.push(validerReponseTicket(text));
      } catch (imageErr) {
        if (import.meta.env.DEV) {
          console.warn('[receipt-gemini] échec fallback image ticket', imageErr);
        }
      }
    }

    if (partialResults.length === 0) {
      throw new Error('Impossible de lire le ticket complet. Essayez avec des photos plus nettes ou moins inclinées.');
    }

    return {
      items: dedupliquerItemsTicket(partialResults.flatMap((result) => result.items)),
      uncertain_items: partialResults.flatMap((result) => result.uncertain_items),
    };
  }
}

async function appelerGeminiTicket(images) {
  const imageParts = images.flatMap((image, index) => [
    { text: `Image ${index + 1}/${images.length} du même ticket de caisse.` },
    {
      inline_data: {
        mime_type: image.mimeType,
        data: image.base64,
      },
    },
  ]);

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          ...imageParts,
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  let response;
  try {
    response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error('Impossible de joindre le service Gemini. Vérifiez votre connexion.');
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

function validerReponseTicket(text) {
  const parsed = parseGeminiJsonResponse(text);

  const result = ReceiptResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("La réponse de Gemini ne respecte pas le schéma ticket attendu.");
  }

  return result.data;
}

function parseGeminiJsonResponse(text) {
  const raw = String(text || '');
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const direct = tryParseJson(cleaned);
  if (direct.ok) return direct.value;

  const objectBlock = extractJsonBlock(cleaned, '{', '}');
  if (objectBlock) {
    const parsed = tryParseJson(objectBlock);
    if (parsed.ok) return parsed.value;
  }

  const arrayBlock = extractJsonBlock(cleaned, '[', ']');
  if (arrayBlock) {
    const parsed = tryParseJson(arrayBlock);
    if (parsed.ok) return parsed.value;
  }

  if (import.meta.env.DEV) {
    console.warn('[receipt-gemini] JSON invalide, extrait brut:', raw.slice(0, 500));
  }

  throw new GeminiJsonParseError(
    "La réponse de Gemini n'est pas un JSON valide.",
    raw
  );
}

function tryParseJson(value) {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (err) {
    return { ok: false };
  }
}

function extractJsonBlock(text, openChar, closeChar) {
  const start = text.indexOf(openChar);
  const end = text.lastIndexOf(closeChar);
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function dedupliquerItemsTicket(items) {
  const result = [];

  items.forEach((item) => {
    const existingIndex = result.findIndex((candidate) => itemsTicketProches(candidate, item));
    if (existingIndex === -1) {
      result.push(item);
      return;
    }

    result[existingIndex] = fusionnerItemsTicket(result[existingIndex], item);
  });

  return result;
}

function itemsTicketProches(first, second) {
  const firstKey = cleDoublonTicket(first);
  const secondKey = cleDoublonTicket(second);
  if (!firstKey || !secondKey) return false;
  if (firstKey === secondKey) return true;
  if (firstKey.includes(secondKey) || secondKey.includes(firstKey)) return true;

  const firstTokens = firstKey.split(' ');
  const secondTokens = secondKey.split(' ');
  const shorter = firstTokens.length <= secondTokens.length ? firstTokens : secondTokens;
  const longer = firstTokens.length > secondTokens.length ? firstTokens : secondTokens;
  const common = shorter.filter((token) => longer.includes(token));
  return shorter.length > 0 && common.length / shorter.length >= 0.8;
}

function cleDoublonTicket(item) {
  return normaliserTexte(`${item.raw_label || ''} ${item.name} ${item.brand || ''}`)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b\d+(?:\.\d{2})?\b/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function fusionnerItemsTicket(first, second) {
  const firstQuantity = Number(first.quantity);
  const secondQuantity = Number(second.quantity);
  const sameQuantity = Number.isFinite(firstQuantity) && Number.isFinite(secondQuantity) && firstQuantity === secondQuantity;

  return {
    ...first,
    raw_label: choisirLabelTicket(first.raw_label, second.raw_label),
    name: choisirNomTicket(first.name, second.name),
    brand: first.brand || second.brand || null,
    category: first.category !== 'Autre' ? first.category : second.category,
    quantity: sameQuantity ? firstQuantity : Math.max(firstQuantity || 1, secondQuantity || 1),
    unit: first.unit || second.unit,
    suggested_location: first.suggested_location || second.suggested_location,
    confidence: meilleureConfiance(first.confidence, second.confidence),
  };
}

function choisirLabelTicket(first, second) {
  return String(first || '').length >= String(second || '').length ? first : second;
}

function choisirNomTicket(first, second) {
  return String(first || '').length >= String(second || '').length ? first : second;
}

function meilleureConfiance(first, second) {
  const rank = { low: 0, medium: 1, high: 2 };
  return rank[second] > rank[first] ? second : first;
}

function normaliserItemTicket(item) {
  const categorie = corrigerCategorieTicket(item.category, item.name);
  const dateExpiration = estimerDLCString(item.name, categorie, 'ticket');
  const sensitive = estProduitSensibleOuAmbigu(item);
  const quantite = extraireQuantiteTicket(item) ?? normaliserQuantiteGemini(item.quantity);
  const unite = pluraliserUnite(nettoyerUnite(item.unit), quantite);

  return {
    raw_label: item.raw_label,
    nom: item.name,
    marque: item.brand || '',
    categorie,
    quantite,
    unite,
    emplacement: item.suggested_location,
    confidence: item.confidence,
    selected: item.confidence === 'high' && !sensitive,
    date_expiration: dateExpiration || '',
    date_expiration_estimee: Boolean(dateExpiration),
  };
}

function normaliserQuantiteGemini(quantity) {
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function extraireQuantiteTicket(item) {
  const raw = String(item.raw_label || '').trim();
  if (!raw) return null;

  const tokens = raw.match(/\S+/g) || [];
  if (tokens.length < 3) return null;

  const priceIndex = tokens.findLastIndex((token) => estPrixTicket(token));
  if (priceIndex <= 0) return null;

  const quantityToken = tokens[priceIndex - 1];
  if (!/^\d+$/.test(quantityToken)) return null;

  const quantity = Number(quantityToken);
  if (!Number.isInteger(quantity) || quantity <= 1 || quantity > 99) return null;

  return quantity;
}

function estPrixTicket(token) {
  const normalized = String(token || '').replace(',', '.');
  return /^\d+\.\d{2}$/.test(normalized);
}

function corrigerCategorieTicket(category, name) {
  const normalized = normaliserTexte(name);
  if (normalized.includes('sauce tomate')) return 'Condiments & Sauces';
  if (/\b(oreo|biscuit|biscuits|cookie|cookies)\b/.test(normalized)) return 'Boulangerie';
  return category;
}

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
  piece: 'pièce',
  pieces: 'pièces',
};

const UNIT_PLURALS = {
  bocal: 'bocaux',
  paquet: 'paquets',
  bouteille: 'bouteilles',
  boîte: 'boîtes',
  boite: 'boîtes',
  pot: 'pots',
  pièce: 'pièces',
  piece: 'pièces',
};

function nettoyerUnite(unit) {
  const cleaned = String(unit || '')
    .replace(/\d+(?:[,.]\d+)?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalized = cleaned.toLowerCase();

  return UNIT_TRANSLATIONS[normalized] || cleaned || 'unité(s)';
}

function pluraliserUnite(unit, quantity) {
  if (!(quantity > 1)) return unit;
  return UNIT_PLURALS[unit] || unit;
}

function estProduitSensibleOuAmbigu(item) {
  const text = normaliserTexte(`${item.raw_label} ${item.name} ${item.category}`);
  return /\b(alcool|vin|biere|bieres|liqueur|liqueurs|spiritueux)\b/.test(text);
}

function normaliserTexte(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function preparerImageTicket(file) {
  const source = await chargerImageOrientee(file);
  const canvas = dessinerDansCanvas(source, {
    sx: 0,
    sy: 0,
    sw: source.width,
    sh: source.height,
    maxWidth: MAX_IMAGE_WIDTH,
  });

  libererSource(source);
  return canvasVersBase64(canvas);
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
