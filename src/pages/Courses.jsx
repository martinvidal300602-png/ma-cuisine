// src/pages/Courses.jsx
import { useMemo, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, RotateCcw, Check, ShoppingCart, Trash2 } from 'lucide-react';
import Button from '../components/UI/Button';
import MobileHeader from '../components/UI/MobileHeader';
import EmptyState from '../components/UI/EmptyState';
import ShoppingItem from '../components/Shopping/ShoppingItem';
import ShopMode from '../components/Shopping/ShopMode';
import ShoppingActiveBanner from '../components/Shopping/ShoppingActiveBanner';
import { CATEGORIES } from '../components/Add/ManualForm';
import ProfileButton from '../components/UI/ProfileButton';

const DEFAULT_FORM = {
  nom: '',
  marque: '',
  categorie: 'Autre',
  quantite: 1,
  unite: 'unité',
  priorite: 'normale',
};

/**
 * Courses — deux temps clairement séparés :
 * 1. Préparation : ajout rapide, suggestions de rachat, liste par rayon.
 * 2. Au magasin : mode plein écran (ShopMode) avec progression.
 */
export default function Courses({
  products,
  shopping,
  session,
  userEmail,
  addShoppingItem,
  onScanReceipt,
  onOpenSettings,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [shopModeOpen, setShopModeOpen] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState(new Set());
  const [showChecked, setShowChecked] = useState(false);

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const remaining = useMemo(() => shopping.items.filter((i) => !i.coche), [shopping.items]);
  const checked = useMemo(() => shopping.items.filter((i) => i.coche), [shopping.items]);

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

  const shoppingNames = useMemo(
    () => new Set(shopping.items.map((i) => (i.nom || '').trim().toLowerCase())),
    [shopping.items]
  );
  const suggestions = useMemo(
    () =>
      products
        .filter((p) => Number(p.quantite || 0) <= 0)
        .filter((p) => !shoppingNames.has((p.nom || '').trim().toLowerCase()))
        .slice(0, 4),
    [products, shoppingNames]
  );

  const handleAdd = async () => {
    if (!form.nom.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }
    setError(null);
    try {
      await shopping.addItem({ ...form, ajoute_par: userEmail ?? null, source: 'manuel' });
      setForm(DEFAULT_FORM);
      setDetailsOpen(false);
    } catch (err) {
      setError(err.message || "L'ajout a échoué.");
    }
  };

  const handleSuggest = async (p) => {
    setError(null);
    try {
      await addShoppingItem({
        nom: p.nom,
        marque: p.marque,
        categorie: p.categorie,
        quantite: 1,
        unite: p.unite || 'unité',
        priorite: 'normale',
        source: 'stock',
      });
      setAddedSuggestions((s) => new Set([...s, p.id]));
    } catch (err) {
      setError(err.message || 'Ajout impossible.');
    }
  };

  const handleStart = async () => {
    setError(null);
    try {
      await session.startSession(userEmail);
      setShopModeOpen(true);
    } catch (err) {
      setError(err.message || 'Impossible de démarrer les courses.');
    }
  };

  const handleFinish = async () => {
    setError(null);
    try {
      await session.finishSession();
    } catch (err) {
      setError(err.message || 'Impossible de terminer les courses.');
      throw err;
    }
  };

  const handleClearChecked = async () => {
    setError(null);
    try {
      await shopping.clearChecked();
    } catch (err) {
      setError(err.message || 'Impossible de supprimer les produits cochés.');
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm';

  return (
    <div className="space-y-4">
      <MobileHeader
        title="Courses"
        subtitle={
          shopping.loading
            ? '…'
            : remaining.length === 0
              ? 'Rien à acheter pour le moment'
              : `${remaining.length} produit${remaining.length > 1 ? 's' : ''} à acheter`
        }
        right={<ProfileButton onClick={onOpenSettings} email={userEmail} />}
      />

      <ShoppingActiveBanner session={session.activeSession} onOpen={() => setShopModeOpen(true)} />

      {shopping.items.length > 0 && (
        <section className="bg-card rounded-card border border-border p-3.5" aria-label="Progression de la liste">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold">Préparation</span>
            <span className="font-num text-muted">{checked.length}/{shopping.items.length}</span>
          </div>
          <div className="h-2 rounded-full bg-bg overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax={shopping.items.length} aria-valuenow={checked.length}>
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${shopping.items.length ? (checked.length / shopping.items.length) * 100 : 0}%` }}
            />
          </div>
        </section>
      )}

      {/* Ajout rapide : une ligne, détails optionnels */}
      <div className="bg-card rounded-card border border-border shadow-card p-3 space-y-2.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={form.nom}
            onChange={set('nom')}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className={`${inputClass} flex-1`}
            placeholder="Ajouter… (ex. beurre doux)"
            aria-label="Produit à acheter"
          />
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Ajouter à la liste"
            className="pressable w-11 h-11 rounded-card bg-accent text-white flex items-center justify-center shrink-0"
          >
            <Plus size={20} strokeWidth={2.2} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="pressable inline-flex items-center gap-1 text-xs font-semibold text-muted"
        >
          {detailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Détails (marque, rayon, quantité, priorité)
        </button>

        {detailsOpen && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              type="text"
              value={form.marque}
              onChange={set('marque')}
              className={inputClass}
              placeholder="Marque"
              aria-label="Marque"
            />
            <select value={form.categorie} onChange={set('categorie')} className={inputClass} aria-label="Rayon">
              {CATEGORIES.map((categorie) => (
                <option key={categorie} value={categorie}>
                  {categorie}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={form.quantite}
              onChange={set('quantite')}
              className={inputClass}
              aria-label="Quantité"
            />
            <input
              type="text"
              value={form.unite}
              onChange={set('unite')}
              className={inputClass}
              placeholder="Unité"
              aria-label="Unité"
            />
            <select
              value={form.priorite}
              onChange={set('priorite')}
              className={`${inputClass} col-span-2`}
              aria-label="Priorité"
            >
              <option value="basse">Priorité basse</option>
              <option value="normale">Priorité normale</option>
              <option value="haute">Priorité haute</option>
            </select>
          </div>
        )}
      </div>

      {/* Suggestions de rachat (produits épuisés au stock) */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
            Épuisés — à racheter ?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((p) => {
              const added = addedSuggestions.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={added}
                  onClick={() => handleSuggest(p)}
                  className={`pressable inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    added ? 'bg-fresh-ok-bg text-fresh-ok border-transparent' : 'bg-card text-text border-border'
                  }`}
                >
                  {added ? <Check size={13} strokeWidth={2.4} /> : <RotateCcw size={13} strokeWidth={2.2} />}
                  {p.nom}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(error || shopping.error || session.error) && (
        <p role="alert" className="text-danger text-sm">
          {error || shopping.error || session.error}
        </p>
      )}

      {/* Liste à acheter, par rayon */}
      {shopping.loading ? (
        <div className="space-y-3" aria-label="Chargement">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
      ) : shopping.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={24} strokeWidth={1.9} />}
          title="La liste est vide"
          text="Ajoutez un produit ci-dessus, ou touchez « Racheter » sur un produit du stock."
        />
      ) : (
        <div className="space-y-4">
          {rayons.map(([categorie, list]) => (
            <section key={categorie} aria-label={categorie}>
              <h2 className="flex items-center gap-2 pb-2">
                <span className="font-display font-bold text-[13px] uppercase tracking-wide">{categorie}</span>
                <span className="font-num text-xs text-muted">{list.length}</span>
                <span className="flex-1 border-t border-border" aria-hidden="true" />
              </h2>
              <div className="space-y-2.5">
                {list.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={(id, coche) => shopping.updateItem(id, { coche })}
                    onDelete={shopping.deleteItem}
                  />
                ))}
              </div>
            </section>
          ))}

          {checked.length > 0 && (
            <section aria-label="Déjà cochés">
              <div className="flex items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowChecked((value) => !value)}
                  className="pressable flex items-center gap-2 flex-1 text-left min-h-9"
                  aria-expanded={showChecked}
                >
                  <span className="font-display font-bold text-[13px] uppercase tracking-wide text-muted">
                    Déjà cochés
                  </span>
                  <span className="font-num text-xs text-muted">{checked.length}</span>
                  <span className="flex-1 border-t border-border" aria-hidden="true" />
                  {showChecked ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
                </button>
                <button
                  type="button"
                  onClick={handleClearChecked}
                  className="pressable inline-flex items-center gap-1 text-xs font-semibold text-fresh-expired"
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                  Vider
                </button>
              </div>
              {showChecked && (
                <div className="space-y-2.5">
                  {checked.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={(id, coche) => shopping.updateItem(id, { coche })}
                      onDelete={shopping.deleteItem}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {shopping.items.length > 0 && <div className="h-16" aria-hidden="true" />}

      {/* CTA magasin, au-dessus de la tab bar */}
      {shopping.items.length > 0 && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] inset-x-0 z-30 pointer-events-none">
          <div className="max-w-app mx-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button size="lg" className="pointer-events-auto shadow-sheet" onClick={handleStart}>
              <ShoppingCart size={17} strokeWidth={2.1} />
              {session.activeSession ? 'Reprendre les courses' : 'Commencer les courses'}
            </Button>
          </div>
        </div>
      )}

      {shopModeOpen && (
        <ShopMode
          items={shopping.items}
          onToggle={(id, coche) => shopping.updateItem(id, { coche })}
          onClose={() => setShopModeOpen(false)}
          onFinish={handleFinish}
          onClearChecked={handleClearChecked}
          onScanReceipt={onScanReceipt}
        />
      )}
    </div>
  );
}
