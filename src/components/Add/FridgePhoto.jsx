// src/components/Add/FridgePhoto.jsx
import { useState } from 'react';
import Button from '../UI/Button';
import { analyserPhotoFrigo } from '../../lib/gemini';
import { appliquerDateExpirationEstimee } from '../../lib/dateExpiration';
import { CATEGORIES, DEFAULT_EMPLACEMENT, EMPLACEMENTS, normaliserEmplacement } from './ManualForm';

const isDev = import.meta.env.DEV;

/**
 * Mode A - photo large du frigo/placard analysée par Gemini.
 * Les produits fiables ou à vérifier passent toujours par une validation humaine.
 */
export default function FridgePhoto({ onSubmitMany, userEmail }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [detected, setDetected] = useState([]);
  const [uncertain, setUncertain] = useState([]);
  const [selectedEmplacement, setSelectedEmplacement] = useState(DEFAULT_EMPLACEMENT);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDetected([]);
    setUncertain([]);
    setError(null);
    setDone(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setDone(false);
    try {
      const emplacement = normaliserEmplacement(selectedEmplacement);
      const result = await analyserPhotoFrigo(file, emplacement);
      const produits = [
        ...result.items_high_confidence.map((p) => ({
          ...p,
          selected: p.confidence === 'high' && p.visible_part === 'complete',
        })),
        ...result.items_to_verify.map((p) => ({ ...p, selected: false })),
      ];

      setUncertain(result.uncertain_items);

      if (produits.length === 0) {
        setDetected([]);
        setError(
          result.uncertain_items.length > 0
            ? 'Aucun produit assez fiable pour être ajouté. Vérifiez les éléments incertains ci-dessous.'
            : "Aucun produit n'a été détecté sur cette photo."
        );
        return;
      }

      setDetected(
        produits.map((p) =>
          appliquerDateExpirationEstimee(
            {
              ...p,
              categorie: CATEGORIES.includes(p.categorie) ? p.categorie : 'Autre',
              emplacement,
              date_expiration: '',
            },
            emplacement === 'Frigo' ? 'photo_frigo' : 'photo_placard'
          )
        )
      );
      logPhotoDebug('items détectés', produits);
    } catch (err) {
      setError(err.message || "L'analyse a échoué.");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index, key, value) => {
    setDetected((list) =>
      list.map((item, i) =>
        i === index
          ? {
              ...item,
              [key]: value,
              ...(key === 'date_expiration' ? { date_expiration_estimee: false } : {}),
            }
          : item
      )
    );
  };

  const selectedCount = detected.filter((d) => d.selected).length;
  const highConfidence = detected
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.confidence === 'high');
  const itemsToVerify = detected
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.confidence === 'medium');

  const handleAddAll = async () => {
    const checkedItems = detected.filter((d) => d.selected && d.nom.trim() && d.confidence !== 'low');
    const toAdd = checkedItems.map((item) => buildPhotoProductPayload(item, userEmail));

    logPhotoDebug('items cochés', checkedItems);
    logPhotoDebug('payload envoyé à Supabase', toAdd);

    if (toAdd.length === 0) {
      setError('Sélectionnez au moins un produit avec un nom.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const inserted = await onSubmitMany(toAdd);
      logPhotoDebug('réponse Supabase', inserted);
      setDetected([]);
      setUncertain([]);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setDone(true);
    } catch (err) {
      logPhotoDebug('erreur Supabase', err);
      setError(err.message || "L'ajout a échoué.");
    } finally {
      setAdding(false);
    }
  };

  const inputClass = 'w-full px-2 py-1.5 rounded border border-border bg-bg text-sm';

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-card border border-border p-4 space-y-3">
        <label className="block">
          <span className="sr-only">Prendre une photo du frigo ou du placard</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="block w-full text-sm text-muted file:mr-3 file:px-4 file:py-2.5 file:rounded-card file:border-0 file:bg-accent file:text-white file:text-sm file:font-medium"
            aria-label="Prendre une photo"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Emplacement de la photo</span>
          <select
            value={selectedEmplacement}
            onChange={(e) => setSelectedEmplacement(normaliserEmplacement(e.target.value))}
            className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm"
          >
            {EMPLACEMENTS.map((emplacement) => (
              <option key={emplacement} value={emplacement}>
                {emplacement}
              </option>
            ))}
          </select>
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Photo sélectionnée du frigo ou du placard"
            className="w-full max-h-64 object-contain rounded-card border border-border bg-bg"
          />
        )}

        {file && (
          <Button size="lg" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? 'Analyse en cours…' : 'Analyser la photo'}
          </Button>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {done && !error && (
          <p role="status" className="text-accent text-sm">
            Produits ajoutés au stock.
          </p>
        )}
      </div>

      {(detected.length > 0 || uncertain.length > 0) && (
        <div className="space-y-3">
          {highConfidence.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">
                À valider avant ajout ({highConfidence.length})
              </h3>
              {highConfidence.map(({ item, index }) =>
                renderDetectedItem(item, index, updateItem, inputClass)
              )}
            </section>
          )}

          {itemsToVerify.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">
                À vérifier manuellement ({itemsToVerify.length})
              </h3>
              {itemsToVerify.map(({ item, index }) =>
                renderDetectedItem(item, index, updateItem, inputClass)
              )}
            </section>
          )}

          {uncertain.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">
                Incertains, non ajoutés ({uncertain.length})
              </h3>
              {uncertain.map((item, i) => (
                <div
                  key={`${item.description || item.nom}-${i}`}
                  className="bg-card rounded-card border border-border p-3 space-y-1"
                >
                  <p className="text-sm font-medium">{item.nom || item.description}</p>
                  <p className="text-xs text-muted">
                    {item.reason || item.evidence || 'Confiance trop faible.'}
                  </p>
                </div>
              ))}
            </section>
          )}

          {detected.length > 0 && (
            <Button size="lg" onClick={handleAddAll} disabled={adding || selectedCount === 0}>
              {adding
                ? 'Ajout en cours…'
                : `Ajouter ${selectedCount} produit${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function buildPhotoProductPayload(item, userEmail) {
  const quantite = Number(item.quantite);

  return {
    nom: item.nom.trim(),
    marque: item.marque ? String(item.marque).trim() || null : null,
    categorie: CATEGORIES.includes(item.categorie) ? item.categorie : 'Autre',
    emplacement: normaliserEmplacement(item.emplacement),
    quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
    unite: String(item.unite || '').trim() || 'unité(s)',
    date_expiration: item.date_expiration || null,
    notes: null,
    photo_url: null,
    code_barres: null,
    ajoute_par: userEmail ?? null,
  };
}

function logPhotoDebug(label, value) {
  if (isDev) {
    console.log(`[photo-stock] ${label}`, value);
  }
}

function renderDetectedItem(item, index, updateItem, inputClass) {
  return (
    <div
      key={`${item.nom}-${index}`}
      className={`bg-card rounded-card border p-3 space-y-2 ${
        item.selected ? 'border-accent' : 'border-border opacity-70'
      }`}
    >
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={(e) => updateItem(index, 'selected', e.target.checked)}
          className="w-4 h-4 accent-[var(--color-accent)]"
          aria-label={`Inclure ${item.nom || 'ce produit'}`}
        />
        <input
          type="text"
          value={item.nom}
          onChange={(e) => updateItem(index, 'nom', e.target.value)}
          className={`${inputClass} font-medium`}
          placeholder="Nom du produit"
          aria-label="Nom du produit"
        />
      </label>

      <p className="text-xs text-muted">
        Confiance {item.confidence} - {labelVisiblePart(item.visible_part)}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={item.marque ?? ''}
          onChange={(e) => updateItem(index, 'marque', e.target.value)}
          className={inputClass}
          placeholder="Marque"
          aria-label="Marque"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={item.quantite}
            onChange={(e) => updateItem(index, 'quantite', e.target.value)}
            className={`${inputClass} font-num w-16`}
            aria-label="Quantité"
          />
          <input
            type="text"
            value={item.unite}
            onChange={(e) => updateItem(index, 'unite', e.target.value)}
            className={inputClass}
            placeholder="Unité"
            aria-label="Unité"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={item.categorie}
          onChange={(e) => updateItem(index, 'categorie', e.target.value)}
          className={inputClass}
          aria-label="Catégorie"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={item.emplacement}
          onChange={(e) => updateItem(index, 'emplacement', e.target.value)}
          className={inputClass}
          aria-label="Emplacement"
        >
          {EMPLACEMENTS.map((e2) => (
            <option key={e2} value={e2}>
              {e2}
            </option>
          ))}
        </select>
      </div>

      <input
        type="date"
        value={item.date_expiration}
        onChange={(e) => updateItem(index, 'date_expiration', e.target.value)}
        className={inputClass}
        aria-label="Date d'expiration"
      />
      {item.date_expiration_estimee && (
        <p className="text-xs text-muted">date estimée, à vérifier</p>
      )}
    </div>
  );
}

function labelVisiblePart(visiblePart) {
  if (visiblePart === 'complete') return 'visible entièrement';
  if (visiblePart === 'partial') return 'partiellement visible';
  return 'peu visible';
}
