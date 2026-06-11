import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY manquante");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
  generationConfig: {
    temperature: 0.1,
    topP: 0.8,
    topK: 20,
    maxOutputTokens: 1024
  }
});

function fileToGenerativePart(base64Data, mimeType) {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    }
  };
}

function extractJsonArray(text) {
  if (!text) {
    throw new Error("Réponse Gemini vide");
  }

  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    console.error("Réponse Gemini brute :", text);
    throw new Error("Aucun tableau JSON valide trouvé dans la réponse Gemini");
  }

  const jsonText = cleaned.slice(start, end + 1);

  return JSON.parse(jsonText);
}

function normalizeProducts(products) {
  if (!Array.isArray(products)) {
    throw new Error("La réponse Gemini n'est pas un tableau");
  }

  return products
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      name: String(item.name || item.nom || "produit non identifié").trim(),
      quantity: String(item.quantity || item.quantite || "1").trim(),
      category: String(item.category || item.categorie || "autre").trim(),
      confidence: Math.max(0, Math.min(1, Number(item.confidence ?? 0.5)))
    }))
    .filter((item) => item.name.length > 0);
}

export async function analyzeFridgeImage(file) {
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const imagePart = fileToGenerativePart(base64Data, file.type);

  const prompt = `
Analyse cette photo de frigo.

Retourne UNIQUEMENT un tableau JSON valide.
Aucun texte avant.
Aucun texte après.
Aucun bloc markdown.
Pas de \`\`\`json.

Format exact :
[
  {
    "name": "nom simple en français",
    "quantity": "quantité estimée",
    "category": "fruit | légume | produit laitier | viande | poisson | boisson | plat préparé | autre",
    "confidence": 0.0
  }
]

Règles :
- Si tu n'es pas sûr, utilise "produit non identifié".
- N'invente pas de marque.
- N'ajoute que les aliments visibles.
- Ignore les sacs, boîtes, étagères et emballages vides.
- Le champ confidence est un nombre entre 0 et 1.
`;

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();

  try {
    const rawProducts = extractJsonArray(text);
    return normalizeProducts(rawProducts);
  } catch (error) {
    console.error("Erreur analyse Gemini :", error);
    console.error("Réponse Gemini brute :", text);
    throw new Error("La photo a été analysée, mais la réponse IA est mal formatée. Réessaie ou utilise l'ajout manuel.");
  }
}
