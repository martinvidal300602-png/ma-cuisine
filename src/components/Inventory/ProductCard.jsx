// src/components/Inventory/ProductCard.jsx
import { useState } from 'react';
import { joursRestants } from '../../hooks/useAlerts';
import AddToListButton from '../Shopping/AddToListButton';
import UseProductModal from './UseProductModal';
import EmptyProductSheet from './EmptyProductSheet';
import Icon from '../UI/Icon';
import { formatQuantite, getConsumeMode, quantiteConsommation } from '../../lib/productConsumption';
import { jChip, toneClasses, toneVar } from '../../lib/freshness';

// Vignette emoji par catégorie quand le produit n'a pas de photo
const EMOJIS = {
  'Viandes & Poissons': '🥩',
  'Légumes & Fruits': '🥦',
  'Produits laitiers': '🧀',
  'Conserves & Épicerie': '🥫',
  'Surgelés': '🧊',
  'Céréales & Pâtes': '🍝',
  'Condiments & Sauces': '🫙',
  'Boissons': '🧃',
  'Boulangerie': '🥖',
  'Entretien & Ménage': '🧼',
  'Hygiène & Salle de bain': '🧴',
  'Papeterie & Divers maison': '🧻',
  'Animaux': '🐾',
  'Autre': '🍽️',
};

export default function ProductCard({
  product,
  onUpdateQuantity,
  onDecrementProduct,
  onConsumeProduct,
  onDelete,
  onAddShoppingItem,
}) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(product.quantite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [emptySheetOpen, setEmptySheetOpen] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  const jours = joursRestants(product.date_expiration);
  const chip = jChip(jours);
  const consumeMode = getConsumeMode(product);
  const isCount = consumeMode === 'count';
  const emoji = EMOJIS[product.categorie] ?? EMOJIS['Autre'];

  const commitQty = async () => {
    const rawValue = Number(qtyValue);
    setEditingQty(false);
    if (!Number.isFinite(rawValue)) {
      setQtyValue(product.quantite);
      return;
    }
    const value = quantiteConsommation(rawValue, consumeMode);
    if (value === product.quantite) {
      setQtyValue(product.quantite);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdateQuantity(product.id, value, { mode: consumeMode });
    } catch (err) {
      setError(err.message);
      setQtyValue(product.quantite);
    } finally {
      setBusy(false);
    }
  };

  const handleDecrement = async () => {
    const current = Number(product.quantite || 0);
    if (current - 1 <= 0) {
      setEmptySheetOpen(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onDecrementProduct(product.id, 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleIncrement = async () => {
    const current = Number(product.quantite || 0);
    setBusy(true);
    setError(null);
    try {
      await onUpdateQuantity(product.id, current + 1, { mode: consumeMode });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUseConfirm = async (newQuantity) => {
    if (!Number.isFinite(Number(newQuantity))) {
      setError('La quantité doit être un nombre valide.');
      return;
    }
    const quantity = quantiteConsommation(newQuantity, consumeMode);
    setUseModalOpen(false);
    if (quantity <= 0) {
      setEmptySheetOpen(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onConsumeProduct(product, { remainingQuantity: quantity });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddToShoppingFromEmpty = async () => {
    if (!onAddShoppingItem) return;
    setBusy(true);
    setError(null);
    try {
      await onAddShoppingItem({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: 1,
        unite: product.unite || 'unité',
        priorite: 'normale',
        source: 'stock',
      });
      await onUpdateQuantity(product.id, 0, { mode: consumeMode });
      setEmptySheetOpen(false);
    } catch (err) {
      setError(err.message || "Impossible d'ajouter ce produit à la liste.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteFromEmpty = async () => {
    const ok = window.confirm(`Supprimer « ${product.nom} » du stock ?`);
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await onDelete(product.id);
      setEmptySheetOpen(false);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm(`Supprimer « ${product.nom} » ?`);
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(product.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <article
      className="bg-card rounded-card border border-border shadow-card p-3 pl-4 relative overflow-hidden"
      style={{ boxShadow: `inset 3px 0 0 ${toneVar(chip.tone)}` }}
    >
      <div className="flex items-start gap-3">
        {/* Vignette photo ou emoji */}
        <div className="w-11 h-11 rounded-[10px] bg-bg border border-border flex items-center justify-center overflow-hidden shrink-0">
          {product.photo_url && !imgBroken ? (
            <img
              src={product.photo_url}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <span className="text-xl" aria-hidden="true">
              {emoji}
            </span>
          )}
        </div>

        {/* Nom, marque, emplacement */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">{product.nom}</h3>
          {product.marque && <p className="text-xs text-muted truncate mt-0.5">{product.marque}</p>}
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <Icon name="pin" size={12} />
            {product.emplacement ?? '—'}
          </p>
        </div>

        {/* Pastille jours restants */}
        <div className={`j-chip ${toneClasses(chip.tone)}`} role="img" aria-label={chip.aria}>
          <span className="j-num">{chip.num}</span>
          <span className="j-lab">{chip.label}</span>
        </div>
      </div>

      {/* Quantité + actions */}
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-1.5">
          {isCount && (
            <button
              type="button"
              onClick={handleDecrement}
              disabled={busy}
              aria-label="Retirer 1"
              className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-text hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
            >
              <Icon name="minus" size={15} strokeWidth={2.2} />
            </button>
          )}

          {editingQty ? (
            <input
              type="number"
              min="0"
              step="0.1"
              autoFocus
              value={qtyValue}
              onChange={(e) => setQtyValue(e.target.value)}
              onBlur={commitQty}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="font-num w-20 px-2 py-1.5 text-sm rounded-lg border border-accent bg-bg"
              aria-label="Modifier la quantité"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setQtyValue(product.quantite);
                setEditingQty(true);
              }}
              disabled={busy}
              aria-label={`Quantité : ${formatQuantite(product.quantite, product.unite, consumeMode)}. Toucher pour modifier`}
              className="font-num text-sm px-2.5 py-1.5 rounded-lg bg-bg border border-border font-medium hover:border-accent transition-colors"
            >
              {formatQuantite(product.quantite, product.unite, consumeMode)}
            </button>
          )}

          {isCount && (
            <button
              type="button"
              onClick={handleIncrement}
              disabled={busy}
              aria-label="Ajouter 1"
              className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-text hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
            >
              <Icon name="plus" size={15} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setUseModalOpen(true)}
            disabled={busy}
            className="text-accent text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-accent-light disabled:opacity-50 transition-colors"
          >
            Utiliser
          </button>
          {onAddShoppingItem && <AddToListButton product={product} onAdd={onAddShoppingItem} />}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label={`Supprimer ${product.nom}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-fresh-expired hover:bg-fresh-expired-bg transition-colors"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger text-xs mt-2">
          {error}
        </p>
      )}

      {useModalOpen && (
        <UseProductModal
          product={product}
          mode={consumeMode}
          onClose={() => setUseModalOpen(false)}
          onConfirm={handleUseConfirm}
        />
      )}

      {emptySheetOpen && (
        <EmptyProductSheet
          product={product}
          busy={busy}
          canAddToShopping={Boolean(onAddShoppingItem)}
          onAddToShopping={handleAddToShoppingFromEmpty}
          onDelete={handleDeleteFromEmpty}
          onCancel={() => setEmptySheetOpen(false)}
        />
      )}
    </article>
  );
}
