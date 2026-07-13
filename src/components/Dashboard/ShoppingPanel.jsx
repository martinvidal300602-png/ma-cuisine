// src/components/Dashboard/ShoppingPanel.jsx
import { useState } from 'react';
import { ShoppingCart, RotateCcw, Check, ChevronRight } from 'lucide-react';

/**
 * « Courses » sur le tableau de bord : état de la liste, session en cours,
 * et suggestions de rachat (produits épuisés dans le stock).
 */
export default function ShoppingPanel({ products, shopping, session, onOpenCourses, addShoppingItem }) {
  const [addedIds, setAddedIds] = useState(new Set());
  const [error, setError] = useState(null);

  const remaining = shopping.items.filter((item) => !item.coche);
  const shoppingNames = new Set(shopping.items.map((i) => (i.nom || '').trim().toLowerCase()));

  // Produits épuisés au stock et pas encore sur la liste → suggestions de rachat
  const suggestions = products
    .filter((p) => Number(p.quantite || 0) <= 0)
    .filter((p) => !shoppingNames.has((p.nom || '').trim().toLowerCase()))
    .slice(0, 3);

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
      setAddedIds((s) => new Set([...s, p.id]));
    } catch (err) {
      setError(err.message || 'Ajout impossible.');
    }
  };

  return (
    <section aria-label="Courses">
      <h2 className="font-display font-bold text-base mb-2">Courses</h2>

      <button
        type="button"
        onClick={onOpenCourses}
        className="pressable w-full bg-card rounded-card border border-border shadow-card p-3.5 flex items-center gap-3 text-left"
      >
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            session.activeSession ? 'bg-fresh-soon-bg text-fresh-soon' : 'bg-accent-light text-accent'
          }`}
        >
          <ShoppingCart size={19} strokeWidth={1.9} />
        </span>
        <span className="flex-1 min-w-0">
          {session.activeSession ? (
            <>
              <span className="block font-semibold text-sm">Courses en cours</span>
              <span className="block text-xs text-muted truncate">
                {session.activeSession.started_by || 'Quelqu’un'} est au magasin · {remaining.length} restant
                {remaining.length > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <span className="block font-semibold text-sm">
                {remaining.length === 0
                  ? 'Liste de courses vide'
                  : `${remaining.length} produit${remaining.length > 1 ? 's' : ''} à acheter`}
              </span>
              <span className="block text-xs text-muted truncate">
                {remaining.length === 0
                  ? 'Ajoutez ce qui manque pour préparer les prochaines courses.'
                  : remaining.slice(0, 3).map((i) => i.nom).join(' · ')}
              </span>
            </>
          )}
        </span>
        <ChevronRight size={16} className="text-muted shrink-0" />
      </button>

      {suggestions.length > 0 && (
        <div className="mt-2.5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
            Épuisés — à racheter ?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((p) => {
              const added = addedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={added}
                  onClick={() => handleSuggest(p)}
                  className={`pressable inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    added
                      ? 'bg-fresh-ok-bg text-fresh-ok border-transparent'
                      : 'bg-card text-text border-border'
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

      {error && (
        <p role="alert" className="text-danger text-xs mt-2">
          {error}
        </p>
      )}
    </section>
  );
}
