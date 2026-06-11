// src/components/Add/FridgePhoto.jsx
import { useState } from 'react';
import Button from '../UI/Button';
import { analyserPhotoFrigo, fichierVersBase64 } from '../../lib/gemini';
import { CATEGORIES, EMPLACEMENTS } from './ManualForm';

/**
 * Mode A — photo du frigo analysée par Gemini Flash.
 * Les produits détectés sont affichés avec une checkbox et des champs modifiables,
 * puis insérés en masse dans Supabase.
 */
export default function FridgePhoto({ onSubmitMany, userEmail }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [detected, setDetected] = useState([]); // [{ ...produit, selected: bool }]
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDetected([]);
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
      const { base64, mimeType } = await fichierVersBase64(file);
      const produits = await analyserPhotoFrigo(base64, mimeType);
      if (produits.length === 0) {
        setError("Aucun produit n'a été détecté sur cette photo.");
        setDetected([]);
      } else {
        setDetected(
          produits.map((p) => ({
            ...p,
            categorie: CATEGORIES.includes(p.categorie) ? p.categorie : 'Autre',
            emplacement: EMPLACEMENTS.includes(p.emplacement) ? p.emplacement : 'Réfrigérateur',
            date_expiration: '',
            selected: true,
          }))
        );
      }
    } catch (err) {
      setError(err.message || "L'analyse a échoué.");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index, key, value) => {
    setDetected((list) => list.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const selectedCount = detected.filter((d) => d.selected).length;

  const handleAddAll = async () => {
    const toAdd = detected
      .filter((d) => d.selected && d.nom.trim())
      .map((d) => ({
        nom: d.nom.trim(),
        marque: d.marque ? String(d.marque).trim() || null : null,
        categorie: d.categorie,
        emplacement: d.emplacement,
        quantite: Number.isFinite(Number(d.quantite)) && Number(d.quantite) > 0 ? Number(d.quantite) : 1,
        unite: d.unite || 'unité(s)',
        date_expiration: d.date_expiration || null,
        ajoute_par: userEmail ?? null,
      }));

    if (toAdd.length === 0) {
      setError('Sélectionnez au moins un produit avec un nom.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      await onSubmitMany(toAdd);
      setDetected([]);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setDone(true);
    } catch (err) {
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

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Photo sélectionnée du frigo ou du placard"
            className="w-full max-h-64 object-contain rounded-card border border-border bg-bg"
          />
        )}

        {file && (
          <Button size="lg" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? 'Analyse en cours…' : '✨ Analyser la photo'}
          </Button>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {done && !error && (
          <p role="status" className="text-accent text-sm">
            ✓ Produits ajoutés au stock.
          </p>
        )}
      </div>

      {detected.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">
            {detected.length} produit{detected.length > 1 ? 's' : ''} détecté{detected.length > 1 ? 's' : ''} — vérifiez avant d'ajouter
          </h3>

          {detected.map((item, i) => (
            <div
              key={i}
              className={`bg-card rounded-card border p-3 space-y-2 ${
                item.selected ? 'border-accent' : 'border-border opacity-60'
              }`}
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => updateItem(i, 'selected', e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                  aria-label={`Inclure ${item.nom || 'ce produit'}`}
                />
                <input
                  type="text"
                  value={item.nom}
                  onChange={(e) => updateItem(i, 'nom', e.target.value)}
                  className={`${inputClass} font-medium`}
                  placeholder="Nom du produit"
                  aria-label="Nom du produit"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.marque ?? ''}
                  onChange={(e) => updateItem(i, 'marque', e.target.value)}
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
                    onChange={(e) => updateItem(i, 'quantite', e.target.value)}
                    className={`${inputClass} font-num w-16`}
                    aria-label="Quantité"
                  />
                  <input
                    type="text"
                    value={item.unite}
                    onChange={(e) => updateItem(i, 'unite', e.target.value)}
                    className={inputClass}
                    placeholder="Unité"
                    aria-label="Unité"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={item.categorie}
                  onChange={(e) => updateItem(i, 'categorie', e.target.value)}
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
                  onChange={(e) => updateItem(i, 'emplacement', e.target.value)}
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
                onChange={(e) => updateItem(i, 'date_expiration', e.target.value)}
                className={inputClass}
                aria-label="Date d'expiration"
              />
            </div>
          ))}

          <Button size="lg" onClick={handleAddAll} disabled={adding || selectedCount === 0}>
            {adding
              ? 'Ajout en cours…'
              : `Ajouter ${selectedCount} produit${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}
