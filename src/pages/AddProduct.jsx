// src/pages/AddProduct.jsx
import { useRef, useState } from 'react';
import AddMenu from '../components/Add/AddMenu';
import FridgePhoto from '../components/Add/FridgePhoto';
import BarcodeScanner from '../components/Add/BarcodeScanner';
import ReceiptScanner from '../components/Add/ReceiptScanner';
import ManualForm from '../components/Add/ManualForm';
import Button from '../components/UI/Button';
import { creerChampsFusion, trouverDoublonsProbables } from '../lib/duplicates';

const TITRES = {
  photo: 'Photo du frigo',
  barcode: 'Code-barres',
  receipt: 'Scanner un ticket',
  manual: 'Saisie manuelle',
};

/**
 * Page Ajouter : menu de 3 modes (photo / code-barres / manuel).
 */
export default function AddProduct({
  addProduct,
  addProducts,
  products,
  updateProduct,
  shopping,
  shoppingSession,
  userEmail,
}) {
  const [mode, setMode] = useState(null);
  const [pendingDuplicates, setPendingDuplicates] = useState(null);
  const pendingResolveRef = useRef(null);
  const pendingRejectRef = useRef(null);

  const handleAddOne = async (product) => {
    const result = await handleAddMany([product]);
    return result?.[0] ?? null;
  };

  const handleAddMany = async (list) => {
    const payload = list.map((product) => ({ ...product, ajoute_par: product.ajoute_par ?? userEmail ?? null }));
    const duplicates = trouverDoublonsProbables(payload, products);

    if (duplicates.length === 0) {
      return addProducts(payload);
    }

    const duplicateProducts = new Set(duplicates.map((entry) => entry.product));
    const uniqueProducts = payload.filter((product) => !duplicateProducts.has(product));

    return new Promise((resolve, reject) => {
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;
      setPendingDuplicates({
        entries: duplicates.map((entry) => ({
          ...entry,
          decision: entry.canMerge ? 'merge' : 'new',
        })),
        uniqueProducts,
      });
    });
  };

  const updateDecision = (index, decision) => {
    setPendingDuplicates((state) => ({
      ...state,
      entries: state.entries.map((entry, i) => (i === index ? { ...entry, decision } : entry)),
    }));
  };

  const resolveDuplicates = async () => {
    if (!pendingDuplicates) return;

    try {
      const toInsert = [];
      toInsert.push(...(pendingDuplicates.uniqueProducts ?? []));

      for (const entry of pendingDuplicates.entries) {
        if (entry.decision === 'ignore') continue;
        if (entry.decision === 'new' || !entry.canMerge) {
          toInsert.push(entry.product);
          continue;
        }

        await updateProduct(entry.existing.id, creerChampsFusion(entry.existing, entry.product));
      }

      const inserted = toInsert.length > 0 ? await addProducts(toInsert) : [];
      pendingResolveRef.current?.(inserted ?? []);
      clearPendingDuplicates();
    } catch (err) {
      pendingRejectRef.current?.(err);
      clearPendingDuplicates();
    }
  };

  const cancelDuplicates = () => {
    pendingRejectRef.current?.(new Error("Ajout annulé pendant la résolution des doublons."));
    clearPendingDuplicates();
  };

  const clearPendingDuplicates = () => {
    setPendingDuplicates(null);
    pendingResolveRef.current = null;
    pendingRejectRef.current = null;
  };

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        {mode && (
          <button
            type="button"
            onClick={() => setMode(null)}
            aria-label="Revenir au choix du mode d'ajout"
            className="text-accent text-sm font-medium"
          >
            ← Retour
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold">{mode ? TITRES[mode] : 'Ajouter'}</h1>
          {!mode && <p className="text-muted text-sm">Choisissez un mode d'ajout</p>}
        </div>
      </header>

      {!mode && <AddMenu onSelect={setMode} />}
      {mode === 'photo' && <FridgePhoto onSubmitMany={handleAddMany} userEmail={userEmail} />}
      {mode === 'barcode' && <BarcodeScanner onSubmit={handleAddOne} />}
      {mode === 'receipt' && (
        <ReceiptScanner
          onSubmitMany={handleAddMany}
          shoppingItems={shopping?.items ?? []}
          deleteShoppingItems={shopping?.deleteItems}
          activeShoppingSession={shoppingSession?.activeSession}
          finishShoppingSession={shoppingSession?.finishSession}
          userEmail={userEmail}
        />
      )}
      {mode === 'manual' && (
        <div className="bg-card rounded-card border border-border p-4">
          <ManualForm onSubmit={handleAddOne} />
        </div>
      )}

      {pendingDuplicates && (
        <DuplicateResolver
          entries={pendingDuplicates.entries}
          onDecision={updateDecision}
          onConfirm={resolveDuplicates}
          onCancel={cancelDuplicates}
        />
      )}
    </div>
  );
}

function DuplicateResolver({ entries, onDecision, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="max-w-app mx-auto bg-bg rounded-card border border-border p-4 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold">Doublons possibles</h2>
          <p className="text-sm text-muted">Choisissez quoi faire pour chaque produit déjà présent au même emplacement.</p>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={`${entry.product.nom}-${index}`} className="bg-card rounded-card border border-border p-3 space-y-3">
              <div className="text-sm">
                <p className="font-semibold">{entry.product.nom}</p>
                <p className="text-muted">
                  Nouveau : {entry.product.quantite} {entry.product.unite} · {entry.product.emplacement}
                </p>
                <p className="text-muted">
                  Existant : {entry.existing.nom} · {entry.existing.quantite} {entry.existing.unite}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {entry.canMerge && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`duplicate-${index}`}
                      checked={entry.decision === 'merge'}
                      onChange={() => onDecision(index, 'merge')}
                      className="accent-[var(--color-accent)]"
                    />
                    Fusionner avec l’existant
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`duplicate-${index}`}
                    checked={entry.decision === 'new'}
                    onChange={() => onDecision(index, 'new')}
                    className="accent-[var(--color-accent)]"
                  />
                  Ajouter comme nouveau produit
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`duplicate-${index}`}
                    checked={entry.decision === 'ignore'}
                    onChange={() => onDecision(index, 'ignore')}
                    className="accent-[var(--color-accent)]"
                  />
                  Ignorer
                </label>
              </div>

              {!entry.canMerge && (
                <p className="text-xs text-warn">Unités incompatibles : fusion désactivée.</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>Valider</Button>
        </div>
      </div>
    </div>
  );
}
