// src/components/Dashboard/DecisionCard.jsx
import { useState } from 'react';
import { CookingPot, ShoppingCart, CheckCheck, Check } from 'lucide-react';
import UseProductModal from '../Inventory/UseProductModal';
import EmptyProductSheet from '../Inventory/EmptyProductSheet';
import { joursRestants } from '../../hooks/useAlerts';
import { getConsumeMode, formatQuantite, quantiteConsommation } from '../../lib/productConsumption';
import { jChip, toneClasses, toneVar } from '../../lib/freshness';

/**
 * Carte de décision : un produit urgent, trois issues.
 * « Utiliser » (je le mange), « Racheter » (sur la liste), « Fini » (vide → choix).
 */
export default function DecisionCard({ product, actions }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [useOpen, setUseOpen] = useState(false);
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [rebought, setRebought] = useState(false);

  const chip = jChip(joursRestants(product.date_expiration));
  const mode = getConsumeMode(product);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Action impossible.');
    } finally {
      setBusy(false);
    }
  };

  const handleUseConfirm = async (newQuantity) => {
    const quantity = quantiteConsommation(newQuantity, mode);
    setUseOpen(false);
    if (quantity <= 0) {
      setEmptyOpen(true);
      return;
    }
    await run(() => actions.consumeProduct(product, { remainingQuantity: quantity }));
  };

  const handleRebuy = () =>
    run(async () => {
      await actions.addShoppingItem({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: 1,
        unite: product.unite || 'unité',
        priorite: 'haute',
        source: 'stock',
      });
      setRebought(true);
    });

  const handleEmptyAddToShopping = () =>
    run(async () => {
      await actions.addShoppingItem({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: 1,
        unite: product.unite || 'unité',
        priorite: 'normale',
        source: 'stock',
      });
      await actions.updateProductQuantity(product.id, 0, { mode });
      setEmptyOpen(false);
    });

  const handleEmptyDelete = async () => {
    const ok = window.confirm(`Supprimer « ${product.nom} » du stock ?`);
    if (!ok) return;
    await run(async () => {
      await actions.deleteProduct(product.id);
      setEmptyOpen(false);
    });
  };

  return (
    <article
      className="w-full bg-card rounded-card border border-border p-3.5 flex flex-col"
      style={{ boxShadow: `inset 0 3px 0 ${toneVar(chip.tone)}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">{product.nom}</h3>
          <p className="text-xs text-muted mt-0.5 truncate">
            {formatQuantite(product.quantite, product.unite, mode)} · {product.emplacement}
          </p>
        </div>
        <div className={`j-chip ${toneClasses(chip.tone)}`} role="img" aria-label={chip.aria}>
          <span className="j-num">{chip.num}</span>
          <span className="j-lab">{chip.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => setUseOpen(true)}
          className="pressable flex flex-col items-center gap-1 py-2 rounded-xl bg-accent text-white text-[11px] font-semibold disabled:opacity-50"
        >
          <CookingPot size={16} strokeWidth={2} />
          Utiliser
        </button>
        <button
          type="button"
          disabled={busy || rebought}
          onClick={handleRebuy}
          className={`pressable flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-semibold border disabled:opacity-60 ${
            rebought
              ? 'bg-fresh-ok-bg text-fresh-ok border-transparent'
              : 'bg-card text-accent border-border'
          }`}
        >
          {rebought ? <Check size={16} strokeWidth={2.4} /> : <ShoppingCart size={16} strokeWidth={2} />}
          {rebought ? 'Sur la liste' : 'Racheter'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setEmptyOpen(true)}
          className="pressable flex flex-col items-center gap-1 py-2 rounded-xl bg-card text-muted border border-border text-[11px] font-semibold disabled:opacity-50"
        >
          <CheckCheck size={16} strokeWidth={2} />
          Fini
        </button>
      </div>

      {error && (
        <p role="alert" className="text-danger text-xs mt-2">
          {error}
        </p>
      )}

      {useOpen && (
        <UseProductModal
          product={product}
          mode={mode}
          onClose={() => setUseOpen(false)}
          onConfirm={handleUseConfirm}
        />
      )}
      {emptyOpen && (
        <EmptyProductSheet
          product={product}
          busy={busy}
          canAddToShopping
          onAddToShopping={handleEmptyAddToShopping}
          onDelete={handleEmptyDelete}
          onCancel={() => setEmptyOpen(false)}
        />
      )}
    </article>
  );
}
