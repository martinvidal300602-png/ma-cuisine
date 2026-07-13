// src/components/Inventory/ProductList.jsx
import { useMemo, useState } from 'react';
import FilterBar from './FilterBar';
import ProductCard from './ProductCard';
import { FRESHNESS_BUCKETS, bucketFromProduct, toneVar } from '../../lib/freshness';
import { calculateStockConfidence } from '../../lib/stockConfidence';

/**
 * Liste des produits groupée par urgence : Périmés → À manger vite →
 * Cette semaine → Tranquille → Sans date. Le temps structure la page.
 */
export default function ProductList({
  products,
  loading,
  error,
  showEmplacementFilter = true,
  initialSearch = '',
  onUpdateQuantity,
  onDecrementProduct,
  onConsumeProduct,
  onDelete,
  onAddShoppingItem,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [categorie, setCategorie] = useState('');
  const [emplacement, setEmplacement] = useState('');
  const [stockState, setStockState] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categorie && p.categorie !== categorie) return false;
      if (emplacement && p.emplacement !== emplacement) return false;
      if (stockState && calculateStockConfidence(p).id !== stockState) return false;
      if (q) {
        const haystack = `${p.nom ?? ''} ${p.marque ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categorie, emplacement, stockState]);

  const sections = useMemo(() => {
    const byBucket = new Map(FRESHNESS_BUCKETS.map((b) => [b.id, []]));
    for (const p of filtered) {
      byBucket.get(bucketFromProduct(p))?.push(p);
    }
    return FRESHNESS_BUCKETS.map((b) => ({ ...b, produits: byBucket.get(b.id) ?? [] })).filter(
      (b) => b.produits.length > 0
    );
  }, [filtered]);

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        categorie={categorie}
        onCategorie={setCategorie}
        emplacement={emplacement}
        onEmplacement={setEmplacement}
        stockState={stockState}
        onStockState={setStockState}
        showEmplacement={showEmplacementFilter}
      />

      {loading && (
        <div className="space-y-3 pt-1" aria-label="Chargement du stock">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-sm text-center py-4">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-14">
          <div className="text-4xl mb-3" aria-hidden="true">🧺</div>
          <p className="font-display font-bold text-base">
            {products.length === 0 ? 'Le stock est vide' : 'Aucun résultat'}
          </p>
          <p className="text-muted text-sm mt-1">
            {products.length === 0
              ? "Ajoutez un premier produit depuis l'onglet Ajouter."
              : 'Aucun produit ne correspond à ces filtres.'}
          </p>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.id} aria-label={section.titre}>
          <h2 className="flex items-center gap-2 pt-3 pb-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: toneVar(section.tone) }}
              aria-hidden="true"
            />
            <span className="font-display font-bold text-[13px] uppercase tracking-wide text-text">
              {section.titre}
            </span>
            <span className="font-num text-xs text-muted">{section.produits.length}</span>
            <span className="flex-1 border-t border-border" aria-hidden="true" />
          </h2>
          <div className="space-y-2.5">
            {section.produits.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onUpdateQuantity={onUpdateQuantity}
                onDecrementProduct={onDecrementProduct}
                onConsumeProduct={onConsumeProduct}
                onDelete={onDelete}
                onAddShoppingItem={onAddShoppingItem}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
