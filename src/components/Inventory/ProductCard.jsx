// src/components/Inventory/ProductCard.jsx
import { useState } from 'react';
import Badge from '../UI/Badge';
import { joursRestants } from '../../hooks/useAlerts';

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

export default function ProductCard({ product, onUpdateQuantity, onDelete }) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(product.quantite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const badge = badgeExpiration(product.date_expiration);

  const commitQty = async () => {
    const value = Number(qtyValue);
    setEditingQty(false);
    if (!Number.isFinite(value) || value < 0 || value === product.quantite) {
      setQtyValue(product.quantite);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdateQuantity(product.id, value);
    } catch (err) {
      setError(err.message);
      setQtyValue(product.quantite);
    } finally {
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

        {error && (
          <p role="alert" className="text-danger text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
