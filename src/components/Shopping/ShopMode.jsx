import { useMemo, useState } from 'react';
import Button from '../UI/Button';
import ShoppingItem from './ShoppingItem';

export default function ShopMode({ items, onToggle, onClose, onFinish, onClearChecked }) {
  const [showChecked, setShowChecked] = useState(false);
  const [error, setError] = useState(null);

  const visibleItems = useMemo(
    () => items.filter((item) => showChecked || !item.coche),
    [items, showChecked]
  );

  const handleFinish = async () => {
    setError(null);
    try {
      await onFinish();
      const shouldClear = window.confirm('Supprimer les produits cochés de la liste ?');
      if (shouldClear) {
        await onClearChecked();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Impossible de terminer les courses.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg px-4 pt-5 pb-6 overflow-y-auto">
      <div className="max-w-app mx-auto space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Je fais les courses</h1>
            <p className="text-sm text-muted">{items.filter((item) => !item.coche).length} produit(s) restant(s)</p>
          </div>
          <button type="button" onClick={onClose} className="text-accent text-sm font-medium">
            Quitter
          </button>
        </header>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showChecked}
            onChange={(e) => setShowChecked(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          Afficher les produits cochés
        </label>

        <div className="space-y-3">
          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Tous les produits visibles sont cochés.</p>
          ) : (
            visibleItems.map((item) => (
              <ShoppingItem key={item.id} item={item} onToggle={onToggle} onDelete={() => {}} large />
            ))
          )}
        </div>

        <Button size="lg" onClick={handleFinish}>
          Terminer les courses
        </Button>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
