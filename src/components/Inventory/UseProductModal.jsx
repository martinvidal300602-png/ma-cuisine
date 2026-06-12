import { useMemo, useState } from 'react';
import Button from '../UI/Button';
import { formatQuantite, quantiteConsommation } from '../../lib/productConsumption';

const QUICK_COUNT = [1, 2, 3, 4];
const QUICK_FRACTIONS = [
  { label: 'Plein', value: 1 },
  { label: '3/4', value: 0.75 },
  { label: '1/2', value: 0.5 },
  { label: '1/4', value: 0.25 },
  { label: 'Vide', value: 0 },
];

export default function UseProductModal({ product, mode, onClose, onConfirm }) {
  const current = Number(product.quantite || 0);
  const [usedAmount, setUsedAmount] = useState(1);
  const [remaining, setRemaining] = useState(current);
  const [remainingTotal, setRemainingTotal] = useState(current);
  const [fraction, setFraction] = useState(0.5);
  const [error, setError] = useState(null);
  const fractionAsTotal = mode === 'remaining_fraction' && current > 1;

  const nextQuantity = useMemo(() => {
    if (mode === 'count') {
      return quantiteConsommation(current - Number(usedAmount || 0), 'count');
    }
    if (mode === 'remaining_quantity' || fractionAsTotal) {
      return quantiteConsommation(remaining, mode);
    }
    return quantiteConsommation(current * Number(fraction || 0), mode);
  }, [current, fraction, fractionAsTotal, mode, remaining, usedAmount]);
  const exceedsCurrent = (mode === 'remaining_quantity' || fractionAsTotal) && nextQuantity > current;

  const confirm = (forcedQuantity) => {
    const value = forcedQuantity ?? nextQuantity;
    if ((mode === 'remaining_quantity' || fractionAsTotal) && value > current) {
      setError('Il ne peut pas rester plus que la quantité actuelle.');
      return;
    }
    setError(null);
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 flex items-end">
      <div className="w-full max-w-app mx-auto bg-bg rounded-card border border-border p-4 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold">{product.nom}</h2>
          <p className="text-sm text-muted">Quantité actuelle : {formatQuantite(current, product.unite, mode)}</p>
          <p className="text-sm text-muted">Après validation : {formatQuantite(nextQuantity, product.unite, mode)}</p>
        </div>

        {mode === 'count' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Combien avez-vous utilisé ?</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_COUNT.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUsedAmount(value)}
                  className={`px-3 py-2 rounded-card border text-sm ${
                    Number(usedAmount) === value ? 'border-accent bg-accent-light text-accent' : 'border-border bg-card'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
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
        )}

        {mode === 'remaining_quantity' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Combien reste-t-il ?</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={remaining}
                onChange={(e) => {
                  setRemaining(e.target.value);
                  setError(null);
                }}
                className="font-num flex-1 px-3 py-2 rounded-card border border-border bg-card"
                aria-label="Quantité restante"
              />
              <span className="text-sm text-muted">{product.unite}</span>
            </div>
          </div>
        )}

        {mode === 'remaining_fraction' && fractionAsTotal && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Combien reste-t-il au total ?</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={remainingTotal}
                onChange={(e) => {
                  setRemainingTotal(e.target.value);
                  setRemaining(e.target.value);
                  setError(null);
                }}
                className="font-num flex-1 px-3 py-2 rounded-card border border-border bg-card"
                aria-label="Quantité restante totale"
              />
              <span className="text-sm text-muted">{formatQuantite(2, product.unite, mode).replace(/^2\s*/, '')}</span>
            </div>
          </div>
        )}

        {mode === 'remaining_fraction' && !fractionAsTotal && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Quelle part de la quantité actuelle reste-t-il ?</p>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_FRACTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setFraction(option.value)}
                  className={`px-2 py-2 rounded-card border text-sm ${
                    Number(fraction) === option.value ? 'border-accent bg-accent-light text-accent' : 'border-border bg-card'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={Math.round(Number(fraction) * 100)}
                onChange={(e) => setFraction(Number(e.target.value) / 100)}
                className="w-full accent-[var(--color-accent)]"
                aria-label="Part restante"
              />
              <p className="text-xs text-muted text-center">{Math.round(Number(fraction) * 100)} % restant</p>
            </div>
          </div>
        )}

        {(error || exceedsCurrent) && (
          <p role="alert" className="text-danger text-sm">
            {error || 'Il ne peut pas rester plus que la quantité actuelle.'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => confirm(0)}>
            Tout utiliser
          </Button>
        </div>
        <Button onClick={() => confirm()} disabled={exceedsCurrent}>
          Confirmer
        </Button>
      </div>
    </div>
  );
}
