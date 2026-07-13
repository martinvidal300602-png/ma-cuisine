import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, MoreHorizontal, Package, ShoppingCart, Trash2, Utensils } from 'lucide-react';
import { joursRestants } from '../../hooks/useAlerts';
import UseProductModal from './UseProductModal';
import EmptyProductSheet from './EmptyProductSheet';
import Sheet from '../UI/Sheet';
import Button from '../UI/Button';
import { formatQuantite, getConsumeMode, quantiteConsommation } from '../../lib/productConsumption';
import { jChip, toneClasses, toneVar } from '../../lib/freshness';

export default function ProductCard({
  product,
  onUpdateQuantity,
  onDecrementProduct,
  onConsumeProduct,
  onDelete,
  onAddShoppingItem,
}) {
  const [qtyValue, setQtyValue] = useState(product.quantite);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [emptySheetOpen, setEmptySheetOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [addedToShopping, setAddedToShopping] = useState(false);

  const chip = jChip(joursRestants(product.date_expiration));
  const consumeMode = getConsumeMode(product);
  const isCount = consumeMode === 'count';

  useEffect(() => setQtyValue(product.quantite), [product.quantite]);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err.message || 'Action impossible.');
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const updateQuantity = async (rawValue) => {
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      setError('La quantité doit être un nombre valide.');
      return;
    }
    const value = quantiteConsommation(numericValue, consumeMode);
    if (value <= 0) {
      setActionsOpen(false);
      setEmptySheetOpen(true);
      return;
    }
    try {
      await run(() => onUpdateQuantity(product.id, value, { mode: consumeMode }));
    } catch {
      setQtyValue(product.quantite);
    }
  };

  const decrementOne = async () => {
    if (Number(product.quantite || 0) <= 1) {
      setActionsOpen(false);
      setEmptySheetOpen(true);
      return;
    }
    try {
      await run(() => onDecrementProduct(product.id, 1));
    } catch {
      // Le message d'erreur reste visible dans la sheet.
    }
  };

  const handleUseConfirm = async (newQuantity) => {
    if (!Number.isFinite(Number(newQuantity))) {
      setUseModalOpen(false);
      setError('La quantité doit être un nombre valide.');
      return;
    }
    const quantity = quantiteConsommation(newQuantity, consumeMode);
    setUseModalOpen(false);
    if (quantity <= 0) {
      setEmptySheetOpen(true);
      return;
    }
    try {
      await run(() => onConsumeProduct(product, { remainingQuantity: quantity }));
    } catch {
      // Le message d'erreur reste visible sur la carte.
    }
  };

  const handleAddShopping = async () => {
    if (!onAddShoppingItem) return;
    try {
      await run(() => onAddShoppingItem({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: 1,
        unite: product.unite || 'unité',
        priorite: 'normale',
        source: 'stock',
      }));
      setAddedToShopping(true);
    } catch {
      // Le message d'erreur reste visible dans la sheet.
    }
  };

  const handleAddToShoppingFromEmpty = async () => {
    try {
      await run(async () => {
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
      });
      setEmptySheetOpen(false);
    } catch {
      // Le message d'erreur reste visible sur la carte.
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer « ${product.nom} » du stock ?`)) return;
    try {
      await run(() => onDelete(product.id));
      setActionsOpen(false);
      setEmptySheetOpen(false);
    } catch {
      // Le message d'erreur reste visible.
    }
  };

  const expirationLabel = product.date_expiration
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(`${product.date_expiration}T12:00:00`),
      )
    : 'Aucune date';

  return (
    <article
      className="bg-card rounded-card border border-border overflow-hidden"
      style={{ boxShadow: `inset 3px 0 0 ${toneVar(chip.tone)}` }}
    >
      <div className="p-3.5 pl-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-bg border border-border flex items-center justify-center overflow-hidden shrink-0 text-muted">
          {product.photo_url && !imgBroken ? (
            <img src={product.photo_url} alt="" className="w-full h-full object-cover" onError={() => setImgBroken(true)} />
          ) : (
            <Package size={20} strokeWidth={1.7} aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">{product.nom}</h3>
          <p className="text-xs text-muted truncate mt-0.5">
            {product.marque ? `${product.marque} · ` : ''}{formatQuantite(product.quantite, product.unite, consumeMode)}
          </p>
          <p className="text-xs text-muted mt-1 flex items-center gap-1 truncate">
            <MapPin size={12} strokeWidth={2} /> {product.emplacement || 'Emplacement inconnu'}
          </p>
        </div>

        <div className={`j-chip ${toneClasses(chip.tone)}`} role="img" aria-label={chip.aria}>
          <span className="j-num">{chip.num}</span>
          <span className="j-lab">{chip.label}</span>
        </div>
      </div>

      <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted pl-1 truncate">DLC · {expirationLabel}</span>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={() => setUseModalOpen(true)}
            className="pressable min-h-9 px-3 rounded-xl bg-accent-light text-accent text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Utensils size={14} strokeWidth={2} /> Utiliser
          </button>
          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            aria-label={`Plus d’actions pour ${product.nom}`}
            className="pressable w-9 h-9 rounded-xl bg-bg text-muted flex items-center justify-center"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-danger text-xs px-4 pb-3">{error}</p>}

      {actionsOpen && (
        <Sheet title={product.nom} onClose={() => setActionsOpen(false)}>
          <div className="space-y-4">
            <div className="bg-card rounded-card border border-border divide-y divide-border">
              <DetailRow icon={MapPin} label="Emplacement" value={product.emplacement || '—'} />
              <DetailRow icon={CalendarDays} label="Date d’expiration" value={expirationLabel} />
              <DetailRow icon={Package} label="Catégorie" value={product.categorie || 'Autre'} />
            </div>

            <section>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Quantité</h3>
              <div className="bg-card rounded-card border border-border p-3 flex items-center gap-2">
                {isCount && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={decrementOne}
                    className="pressable w-11 h-11 rounded-full bg-bg border border-border text-xl"
                    aria-label="Retirer une unité"
                  >
                    −
                  </button>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={qtyValue}
                  onChange={(event) => setQtyValue(event.target.value)}
                  className="font-num min-w-0 flex-1 h-11 px-3 rounded-xl border border-border bg-bg text-center text-sm"
                  aria-label="Quantité"
                />
                {isCount && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => updateQuantity(Number(product.quantite || 0) + 1)}
                    className="pressable w-11 h-11 rounded-full bg-bg border border-border text-xl"
                    aria-label="Ajouter une unité"
                  >
                    +
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateQuantity(qtyValue)}
                  className="pressable h-11 px-3 rounded-xl bg-accent text-white text-xs font-semibold"
                >
                  Valider
                </button>
              </div>
            </section>

            {error && <p role="alert" className="text-danger text-sm">{error}</p>}

            <div className="space-y-2">
              {onAddShoppingItem && (
                <Button variant="secondary" size="lg" onClick={handleAddShopping} disabled={busy || addedToShopping}>
                  <ShoppingCart size={17} /> {addedToShopping ? 'Ajouté aux courses' : 'Ajouter aux courses'}
                </Button>
              )}
              <Button variant="danger" size="lg" onClick={handleDelete} disabled={busy}>
                <Trash2 size={17} /> Supprimer du stock
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {useModalOpen && (
        <UseProductModal product={product} mode={consumeMode} onClose={() => setUseModalOpen(false)} onConfirm={handleUseConfirm} />
      )}

      {emptySheetOpen && (
        <EmptyProductSheet
          product={product}
          busy={busy}
          canAddToShopping={Boolean(onAddShoppingItem)}
          onAddToShopping={handleAddToShoppingFromEmpty}
          onDelete={handleDelete}
          onCancel={() => setEmptySheetOpen(false)}
        />
      )}
    </article>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="min-h-12 px-3 flex items-center gap-3">
      <Icon size={16} className="text-muted shrink-0" />
      <span className="text-sm text-muted flex-1">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
