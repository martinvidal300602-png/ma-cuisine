// src/components/Scan/AddFlow.jsx
import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import FridgePhoto from '../Add/FridgePhoto';
import BarcodeScanner from '../Add/BarcodeScanner';
import ReceiptScanner from '../Add/ReceiptScanner';
import ManualForm from '../Add/ManualForm';
import DuplicateResolver from '../Add/DuplicateResolver';
import { creerChampsFusion, trouverDoublonsProbables } from '../../lib/duplicates';

const TITRES = {
  photo: 'Photo du frigo',
  barcode: 'Code-barres',
  receipt: 'Scanner un ticket',
  manual: 'Saisie manuelle',
};

const SOUS_TITRES = {
  photo: 'Photographiez, vérifiez, validez : rien ne part au stock sans vous.',
  barcode: 'Visez le code-barres, la fiche se remplit toute seule.',
  receipt: 'Le ticket met à jour le stock et la liste de courses.',
  manual: 'La fiche complète, à votre rythme.',
};

/**
 * Vue plein écran d'un mode d'ajout. La logique de détection des doublons
 * (fusion / nouveau / ignorer) vit ici et protège tous les modes.
 */
export default function AddFlow({
  mode,
  onClose,
  addProducts,
  products,
  updateProduct,
  shopping,
  shoppingSession,
  userEmail,
}) {
  const [pendingDuplicates, setPendingDuplicates] = useState(null);
  const pendingResolveRef = useRef(null);
  const pendingRejectRef = useRef(null);

  const handleAddOne = async (product) => {
    const result = await handleAddMany([product]);
    return result?.[0] ?? null;
  };

  const handleAddMany = async (list) => {
    const payload = list.map((product) => ({
      ...product,
      ajoute_par: product.ajoute_par ?? userEmail ?? null,
    }));
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
    pendingRejectRef.current?.(new Error('Ajout annulé pendant la résolution des doublons.'));
    clearPendingDuplicates();
  };

  const clearPendingDuplicates = () => {
    setPendingDuplicates(null);
    pendingResolveRef.current = null;
    pendingRejectRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto view-rise">
      <div className="max-w-app mx-auto px-4 pb-10">
        <header className="flex items-start justify-between gap-3 pb-3 pt-safe sticky top-0 bg-bg z-10">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-xl leading-tight">{TITRES[mode]}</h1>
            <p className="text-xs text-muted mt-0.5">{SOUS_TITRES[mode]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted pressable shrink-0"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <div className="pt-1">
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
            <div className="bg-card rounded-card border border-border shadow-card p-4">
              <ManualForm onSubmit={handleAddOne} />
            </div>
          )}
        </div>
      </div>

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
