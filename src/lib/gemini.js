// src/lib/gemini.js
// Analyse d'une photo de frigo/placard via Google Gemini Flash.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT = `Analyse cette photo de réfrigérateur ou de placard.
Identifie tous les produits alimentaires visibles.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour :
{
  "produits": [
    {
      "nom": "string",
      "marque": "string ou null",
      "quantite": number,
      "unite": "string",
      "categorie": "string parmi les catégories autorisées",
      "emplacement": "Réfrigérateur"
    }
  ]
}
Catégories autorisées : Viandes & Poissons, Légumes & Fruits, Produits laitiers,
Conserves & Épicerie, Surgelés, Céréales & Pâtes, Condiments & Sauces,
Boissons, Boulangerie, Autre.`;

/**
 * Analyse une image en base64 et retourne la liste des produits détectés.
 * @param {string} base64Data - données image SANS le préfixe data:...;base64,
 * @param {string} mimeType - ex. "image/jpeg"
 * @returns {Promise<Array>} liste de produits { nom, marque, quantite, unite, categorie, emplacement }
 */
export async function analyserPhotoFrigo(base64Data, mimeType) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Clé Gemini manquante : définissez VITE_GEMINI_API_KEY dans votre fichier .env'
    );
  }

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
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
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini n'a renvoyé aucun résultat exploitable.");
  }

  // Nettoyage défensif : retirer d'éventuelles clôtures markdown
  const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    throw new Error("La réponse de Gemini n'est pas un JSON valide. Réessayez avec une photo plus nette.");
  }

  if (!parsed || !Array.isArray(parsed.produits)) {
    throw new Error('Aucun produit détecté sur la photo.');
  }

  return parsed.produits.map((p) => ({
    nom: typeof p.nom === 'string' ? p.nom : 'Produit',
    marque: typeof p.marque === 'string' ? p.marque : null,
    quantite: Number.isFinite(Number(p.quantite)) && Number(p.quantite) > 0 ? Number(p.quantite) : 1,
    unite: typeof p.unite === 'string' && p.unite ? p.unite : 'unité(s)',
    categorie: p.categorie || 'Autre',
    emplacement: p.emplacement || 'Réfrigérateur',
  }));
}

/**
 * Convertit un File en base64 (sans le préfixe data URL).
 * @param {File} file
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export function fichierVersBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = String(result).split(',')[1];
      if (!base64) {
        reject(new Error('Lecture du fichier image impossible.'));
        return;
      }
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Lecture du fichier image impossible.'));
    reader.readAsDataURL(file);
  });
}
