// src/components/Inventory/ProductCard.jsx
import { useState } from 'react';
import Badge from '../UI/Badge';
import { joursRestants } from '../../hooks/useAlerts';
import AddToListButton from '../Shopping/AddToListButton';
import UseProductModal from './UseProductModal';
import EmptyProductSheet from './EmptyProductSheet';
import { estProduitDivisible, estProduitEntier, quantiteConsommation } from '../../lib/productConsumption';

// Placeholder emoji par catégorie quand le produit n'a pas de photo
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
  'Autre': '🍽️',
};

function badgeExpiration(dateExpiration) {
  const jours = joursRestants(dateExpiration);
  if (jours === null) return { variant: 'neutral', label: 'Sans date' };
  if (jours < 0) return { variant: 'danger', label: `Périmé (${Math.abs(jours)} j)` };
  if (jours === 0) return { variant: 'warn', label: "Expire aujourd'hui" };
  if (jours <= 3) return { variant: 'warn', label: `${jours} j restants` };
  return { variant: 'ok', label: `${jours} j restants` };
}

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

  const badge = badgeExpiration(product.date_expiration);
  const isWhole = estProduitEntier(product);
  const isDivisible = estProduitDivisible(product);
  const useMode = isDivisible ? 'divisible' : 'whole';

  const commitQty = async () => {
    const rawValue = Number(qtyValue);
    setEditingQty(false);
    if (!Number.isFinite(rawValue)) {
      setQtyValue(product.quantite);
      return;
    }
    const value = quantiteConsommation(rawValue, isWhole);
    if (value === product.quantite) {
      setQtyValue(product.quantite);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdateQuantity(product.id, value, { whole: isWhole });
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

  const handleUseConfirm = async (newQuantity) => {
    if (!Number.isFinite(Number(newQuantity))) {
      setError('La quantité doit être un nombre valide.');
      return;
    }
    const quantity = quantiteConsommation(newQuantity, isWhole);
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
      await onUpdateQuantity(product.id, 0, { whole: isWhole });
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
    <article className="bg-card rounded-card border border-border shadow-sm p-3 flex gap-3 items-start">
      {/* Photo ou emoji */}
      <div className="w-14 h-14 rounded-card bg-bg border border-border flex items-center justify-center overflow-hidden shrink-0">
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.nom}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-2xl" aria-hidden="true">
            {EMOJIS[product.categorie] ?? EMOJIS['Autre']}
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{product.nom}</h3>
            {product.marque && <p className="text-xs text-muted truncate">{product.marque}</p>}
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <p className="text-xs text-muted mt-1">📍 {product.emplacement ?? '—'}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantité modifiable inline */}
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
              className="font-num w-20 px-2 py-1 text-sm rounded border border-accent bg-bg"
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
              aria-label={`Quantité : ${product.quantite} ${product.unite}. Toucher pour modifier`}
              className="font-num text-sm px-2 py-1 rounded bg-accent-light text-accent font-medium"
            >
              {product.quantite} {product.unite}
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label={`Supprimer ${product.nom}`}
            className="text-muted hover:text-danger text-sm px-2 py-1 transition-colors"
          >
            🗑️
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {isWhole && (
            <button
              type="button"
              onClick={handleDecrement}
              disabled={busy}
              className="text-accent text-xs px-2 py-1 rounded bg-accent-light font-medium disabled:opacity-50"
            >
              −1
            </button>
          )}
          <button
            type="button"
            onClick={() => setUseModalOpen(true)}
            disabled={busy}
            className="text-accent text-xs px-2 py-1 rounded bg-accent-light font-medium disabled:opacity-50"
          >
            Utiliser
          </button>
        </div>

        {onAddShoppingItem && (
          <div className="mt-2">
            <AddToListButton product={product} onAdd={onAddShoppingItem} />
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger text-xs mt-1">
            {error}
          </p>
        )}
      </div>

      {useModalOpen && (
        <UseProductModal
          product={product}
          mode={useMode}
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
