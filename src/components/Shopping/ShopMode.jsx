// src/components/Shopping/ShopMode.jsx
import { useMemo, useState } from 'react';
import { X, ReceiptText, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../UI/Button';
import ShoppingItem from './ShoppingItem';
import ProgressRing from '../UI/ProgressRing';
import { CATEGORIES } from '../Add/ManualForm';

/**
 * Mode magasin plein écran : gros items, progression visible,
 * « À prendre » groupé par rayon, « Dans le chariot » replié,
 * et une fin de courses guidée (ticket, nettoyage de liste).
 */
export default function ShopMode({ items, onToggle, onClose, onFinish, onClearChecked, onScanReceipt }) {
  const [showChecked, setShowChecked] = useState(false);
  const [error, setError] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [endPanel, setEndPanel] = useState(false);

  const remaining = useMemo(() => items.filter((item) => !item.coche), [items]);
  const checked = useMemo(() => items.filter((item) => item.coche), [items]);

  // Rayons = catégories, dans l'ordre du magasin (ordre des CATEGORIES)
  const rayons = useMemo(() => {
    const order = new Map(CATEGORIES.map((c, i) => [c, i]));
    const groups = new Map();
    for (const item of remaining) {
      const key = item.categorie || 'Autre';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99)
    );
  }, [remaining]);

  const handleFinish = async () => {
    setError(null);
    setFinishing(true);
    try {
      await onFinish();
      setEndPanel(true);
    } catch (err) {
      setError(err.message || 'Impossible de terminer les courses.');
    } finally {
      setFinishing(false);
    }
  };

  const handleClearAndClose = async () => {
    setError(null);
    try {
      await onClearChecked();
      onClose();
    } catch (err) {
      setError(err.message || 'Impossible de nettoyer la liste.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-y-auto">
      <div className="max-w-app mx-auto px-4 pb-36">
        <header className="flex items-center justify-between gap-3 pb-3 pt-safe sticky top-0 bg-bg z-10">
          <div className="flex items-center gap-3">
            <ProgressRing value={checked.length} total={items.length || 1} />
            <div>
              <h1 className="font-display font-extrabold text-xl leading-tight">Au magasin</h1>
              <p className="text-xs text-muted">
                {remaining.length === 0
                  ? 'Tout est dans le chariot !'
                  : `${remaining.length} produit${remaining.length > 1 ? 's' : ''} à prendre`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Quitter le mode magasin"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted pressable shrink-0"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        {endPanel ? (
          <div className="view-rise bg-card rounded-card border border-border shadow-card p-4 space-y-3 mt-2">
            <h2 className="font-display font-bold text-lg">Courses terminées 🎉</h2>
            <p className="text-sm text-muted">
              {checked.length} produit{checked.length > 1 ? 's' : ''} coché
              {checked.length > 1 ? 's' : ''}. Vous pouvez scanner le ticket pour les ajouter au
              stock, ou simplement nettoyer la liste.
            </p>
            {onScanReceipt && (
              <Button
                size="lg"
                onClick={() => {
                  onClose();
                  onScanReceipt();
                }}
              >
                <ReceiptText size={17} strokeWidth={2} />
                Scanner le ticket de caisse
              </Button>
            )}
            <Button variant="secondary" size="lg" onClick={handleClearAndClose} disabled={checked.length === 0}>
              Retirer les {checked.length} coché{checked.length > 1 ? 's' : ''} de la liste
            </Button>
            <Button variant="ghost" size="lg" onClick={onClose}>
              Garder la liste telle quelle
            </Button>
          </div>
        ) : (
          <>
            {items.length === 0 && (
              <p className="text-sm text-muted text-center py-12">La liste de courses est vide.</p>
            )}

            <div className="space-y-4 mt-1">
              {rayons.map(([categorie, list]) => (
                <section key={categorie} aria-label={categorie}>
                  <h2 className="flex items-center gap-2 pb-2">
                    <span className="font-display font-bold text-[13px] uppercase tracking-wide">
                      {categorie}
                    </span>
                    <span className="font-num text-xs text-muted">{list.length}</span>
                    <span className="flex-1 border-t border-border" aria-hidden="true" />
                  </h2>
                  <div className="space-y-2.5">
                    {list.map((item) => (
                      <ShoppingItem key={item.id} item={item} onToggle={onToggle} onDelete={() => {}} large />
                    ))}
                  </div>
                </section>
              ))}

              {remaining.length === 0 && items.length > 0 && (
                <p className="text-sm text-muted text-center py-6">
                  Tout est coché. Touchez « Terminer les courses » en bas.
                </p>
              )}

              {checked.length > 0 && (
                <section aria-label="Dans le chariot">
                  <button
                    type="button"
                    onClick={() => setShowChecked((v) => !v)}
                    className="pressable w-full flex items-center gap-2 pb-2 text-left"
                  >
                    <span className="font-display font-bold text-[13px] uppercase tracking-wide text-muted">
                      Dans le chariot
                    </span>
                    <span className="font-num text-xs text-muted">{checked.length}</span>
                    <span className="flex-1 border-t border-border" aria-hidden="true" />
                    {showChecked ? (
                      <ChevronUp size={15} className="text-muted" />
                    ) : (
                      <ChevronDown size={15} className="text-muted" />
                    )}
                  </button>
                  {showChecked && (
                    <div className="space-y-2.5">
                      {checked.map((item) => (
                        <ShoppingItem key={item.id} item={item} onToggle={onToggle} onDelete={() => {}} large />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm mt-3">
            {error}
          </p>
        )}
      </div>

      {!endPanel && items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-bg/95 border-t border-border pb-safe">
          <div className="max-w-app mx-auto px-4 py-3">
            <Button size="lg" onClick={handleFinish} disabled={finishing}>
              {finishing ? 'On termine…' : 'Terminer les courses'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
