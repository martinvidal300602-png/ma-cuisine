// src/components/Inventory/ProductList.jsx
import { useMemo, useState } from 'react';
import FilterBar from './FilterBar';
import ProductCard from './ProductCard';

/**
 * Liste filtrable des produits, triés par date d'expiration croissante (tri fait côté requête).
 */
export default function ProductList({
  products,
  loading,
  error,
  onUpdateQuantity,
  onDecrementProduct,
  onConsumeProduct,
  onDelete,
  onAddShoppingItem,
}) {
  const [search, setSearch] = useState('');
  const [categorie, setCategorie] = useState('');
  const [emplacement, setEmplacement] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categorie && p.categorie !== categorie) return false;
      if (emplacement && p.emplacement !== emplacement) return false;
      if (q) {
        const haystack = `${p.nom ?? ''} ${p.marque ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, categorie, emplacement]);

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        categorie={categorie}
        onCategorie={setCategorie}
        emplacement={emplacement}
        onEmplacement={setEmplacement}
      />

      {loading && <p className="text-muted text-sm text-center py-8">Chargement du stock…</p>}

      {error && (
        <p role="alert" className="text-danger text-sm text-center py-4">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2" aria-hidden="true">🧺</div>
          <p className="text-muted text-sm">
            {products.length === 0
              ? "Le stock est vide. Ajoutez un premier produit depuis l'onglet Ajouter."
              : 'Aucun produit ne correspond à ces filtres.'}
          </p>
        </div>
      )}

      {filtered.map((p) => (
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
  );
}
