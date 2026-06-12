// src/components/Add/ReceiptScanner.jsx
import { useState } from 'react';
import Button from '../UI/Button';
import { analyserTicketCaisse } from '../../lib/receiptGemini';
import { appliquerDateExpirationEstimee } from '../../lib/dateExpiration';
import { CATEGORIES, EMPLACEMENTS, normaliserEmplacement } from './ManualForm';
import ReceiptShoppingReconciliation from '../Shopping/ReceiptShoppingReconciliation';

export default function ReceiptScanner({
  onSubmitMany,
  shoppingItems = [],
  deleteShoppingItems,
  activeShoppingSession,
  finishShoppingSession,
  userEmail,
}) {
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [items, setItems] = useState([]);
  const [uncertain, setUncertain] = useState([]);

  const handleFile = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setItems([]);
    setUncertain([]);
    setError(null);
    setDone(false);
    setFiles((current) => [...current, ...selected]);
    setPreviewUrls((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setPreviewUrls((current) => {
      const url = current[index];
      if (url) URL.revokeObjectURL(url);
      return current.filter((_, i) => i !== index);
    });
    setItems([]);
    setUncertain([]);
    setError(null);
    setDone(false);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setError(null);
    setDone(false);
    try {
      const result = await analyserTicketCaisse(files.length === 1 ? files[0] : files);
      setItems(
        result.items.map((item) =>
          appliquerDateExpirationEstimee(
            {
              ...item,
              categorie: CATEGORIES.includes(item.categorie) ? item.categorie : 'Autre',
              emplacement: normaliserEmplacement(item.emplacement),
              selected: item.confidence === 'high',
            },
            'ticket'
          )
        )
      );
      setUncertain(result.uncertain_items);

      if (result.items.length === 0) {
        setError(
          result.uncertain_items.length > 0
            ? 'Aucun produit assez fiable pour être ajouté. Vérifiez les lignes incertaines ci-dessous.'
            : "Aucun produit n'a été détecté sur ce ticket."
        );
      }
    } catch (err) {
      const message = err.message?.includes("JSON")
        ? 'Impossible de lire le ticket complet. Essayez avec des photos plus nettes ou moins inclinées.'
        : err.message || "L'analyse du ticket a échoué.";
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (index, key, value) => {
    setItems((list) =>
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

  const selectedCount = items.filter((item) => item.selected).length;

  const buildPayload = (indexes) => {
    const selectedIndexes = new Set(indexes);
    return items
      .filter((item, index) => selectedIndexes.has(index) && item.nom.trim())
      .map((item) => {
        const quantite = Number(item.quantite);

        return {
          nom: item.nom.trim(),
          marque: item.marque ? String(item.marque).trim() || null : null,
          categorie: CATEGORIES.includes(item.categorie) ? item.categorie : 'Autre',
          emplacement: normaliserEmplacement(item.emplacement),
          quantite: Number.isFinite(quantite) && quantite > 0 ? quantite : 1,
          unite: String(item.unite || '').trim() || 'unité(s)',
          date_expiration: item.date_expiration || null,
          notes: item.raw_label ? `Ticket : ${item.raw_label}` : null,
          photo_url: null,
          code_barres: null,
          ajoute_par: userEmail ?? null,
        };
      });
  };

  const resetAfterSuccess = () => {
    setItems([]);
    setUncertain([]);
    setFiles([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setDone(true);
  };

  const handleAddSelected = async () => {
    const indexes = items.map((item, index) => (item.selected ? index : null)).filter((index) => index !== null);
    const payload = buildPayload(indexes);

    if (payload.length === 0) {
      setError('Sélectionnez au moins un produit avec un nom.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      await onSubmitMany(payload);
      resetAfterSuccess();
    } catch (err) {
      setError(err.message || "L'ajout a échoué.");
    } finally {
      setAdding(false);
    }
  };

  const handleReconciliationConfirm = async ({
    selectedReceiptIndexes,
    shoppingIdsToDelete,
    finishSession,
  }) => {
    const payload = buildPayload(selectedReceiptIndexes);

    if (payload.length === 0) {
      setError('Sélectionnez au moins un produit avec un nom.');
      return;
    }

    setAdding(true);
    setError(null);
    try {
      await onSubmitMany(payload);

      if (shoppingIdsToDelete.length > 0) {
        if (!deleteShoppingItems) throw new Error('Suppression de la liste courses indisponible.');
        await deleteShoppingItems(shoppingIdsToDelete);
      }

      if (finishSession && activeShoppingSession) {
        if (!finishShoppingSession) throw new Error('Fin de session courses indisponible.');
        await finishShoppingSession();
      }

      resetAfterSuccess();
    } catch (err) {
      setError(err.message || "La validation du ticket a échoué.");
    } finally {
      setAdding(false);
    }
  };

  const inputClass = 'w-full px-2 py-1.5 rounded border border-border bg-bg text-sm';

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-card border border-border p-4 space-y-3">
        {files.length > 0 && (
          <p className="text-sm text-muted">
            {files.length} photo{files.length > 1 ? 's' : ''} sélectionnée{files.length > 1 ? 's' : ''}. Ajoutez une autre photo si le ticket continue.
          </p>
        )}
        <label className="block">
          <span className="block text-sm font-medium mb-2">
            {files.length > 0 ? 'Ajouter une autre photo' : 'Prendre ou importer le ticket'}
          </span>
          <span className="sr-only">
            {files.length > 0 ? 'Ajouter une autre photo du ticket' : 'Prendre ou importer une ou plusieurs photos du ticket'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFile}
            className="block w-full text-sm text-muted file:mr-3 file:px-4 file:py-2.5 file:rounded-card file:border-0 file:bg-accent file:text-white file:text-sm file:font-medium"
            aria-label="Prendre ou importer une photo du ticket"
          />
        </label>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Ticket sélectionné ${index + 1}`}
                  className="aspect-square w-full object-cover rounded-card border border-border bg-bg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-bg/90 border border-border rounded px-1.5 py-0.5 text-xs text-danger"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <Button size="lg" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? 'Lecture en cours…' : 'Analyser le ticket complet'}
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

      {(items.length > 0 || uncertain.length > 0) && (
        <div className="space-y-3">
          {items.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">
                Produits détectés ({items.length})
              </h3>
              {items.map((item, index) => (
                <ReceiptItemForm
                  key={`${item.raw_label}-${index}`}
                  item={item}
                  index={index}
                  inputClass={inputClass}
                  updateItem={updateItem}
                />
              ))}
            </section>
          )}

          {uncertain.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">
                Lignes incertaines, non ajoutées ({uncertain.length})
              </h3>
              {uncertain.map((item, index) => (
                <div
                  key={`${item.raw_label}-${index}`}
                  className="bg-card rounded-card border border-border p-3 space-y-1"
                >
                  <p className="text-sm font-medium">{item.raw_label}</p>
                  <p className="text-xs text-muted">{item.reason}</p>
                </div>
              ))}
            </section>
          )}

          {items.length > 0 && shoppingItems.length > 0 && (
            <ReceiptShoppingReconciliation
              receiptItems={items}
              shoppingItems={shoppingItems}
              activeSession={activeShoppingSession}
              adding={adding}
              onConfirm={handleReconciliationConfirm}
            />
          )}

          {items.length > 0 && shoppingItems.length === 0 && (
            <Button size="lg" onClick={handleAddSelected} disabled={adding || selectedCount === 0}>
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

function ReceiptItemForm({ item, index, inputClass, updateItem }) {
  return (
    <div
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

      <p className="text-xs text-muted">Confiance {item.confidence}</p>

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
          {CATEGORIES.map((categorie) => (
            <option key={categorie} value={categorie}>
              {categorie}
            </option>
          ))}
        </select>
        <select
          value={item.emplacement}
          onChange={(e) => updateItem(index, 'emplacement', e.target.value)}
          className={inputClass}
          aria-label="Emplacement"
        >
          {EMPLACEMENTS.map((emplacement) => (
            <option key={emplacement} value={emplacement}>
              {emplacement}
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
