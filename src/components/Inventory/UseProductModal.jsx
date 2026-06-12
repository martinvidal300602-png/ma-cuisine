import { useState } from 'react';
import Button from '../UI/Button';

export default function UseProductModal({ product, mode, onClose, onConfirm }) {
  const isWhole = mode === 'whole';
  const [usedAmount, setUsedAmount] = useState(1);
  const [remaining, setRemaining] = useState(product.quantite ?? 0);

  const confirm = () => {
    if (isWhole) {
      onConfirm(Math.max(0, Number(product.quantite || 0) - Number(usedAmount || 0)));
      return;
    }
    onConfirm(Number(remaining));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 flex items-end">
      <div className="w-full max-w-app mx-auto bg-bg rounded-card border border-border p-4 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold">{product.nom}</h2>
          <p className="text-sm text-muted">
            Stock actuel : {product.quantite} {product.unite}
          </p>
        </div>

        {isWhole ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Combien avez-vous utilisé ?</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUsedAmount((value) => Math.max(1, Number(value) - 1))}
                className="w-11 h-11 rounded-card border border-border bg-card text-xl"
                aria-label="Diminuer la quantité utilisée"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={usedAmount}
                onChange={(e) => setUsedAmount(e.target.value)}
                className="font-num w-24 px-3 py-2 rounded-card border border-border bg-card text-center"
                aria-label="Quantité utilisée"
              />
              <button
                type="button"
                onClick={() => setUsedAmount((value) => Number(value || 0) + 1)}
                className="w-11 h-11 rounded-card border border-border bg-card text-xl"
                aria-label="Augmenter la quantité utilisée"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Combien reste-t-il ?</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
                className="font-num flex-1 px-3 py-2 rounded-card border border-border bg-card"
                aria-label="Quantité restante"
              />
              <span className="text-sm text-muted">{product.unite}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={confirm}>Valider</Button>
        </div>
      </div>
    </div>
  );
}
