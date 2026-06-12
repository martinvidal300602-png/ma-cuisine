// src/pages/Home.jsx
import ProductList from '../components/Inventory/ProductList';

/**
 * Page Stock : liste temps réel de tous les produits.
 */
export default function Home({ products, loading, error, updateProduct, deleteProduct, addShoppingItem }) {
  const handleUpdateQuantity = (id, quantite) => updateProduct(id, { quantite });

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold">Stock</h1>
        <p className="text-muted text-sm">
          {loading ? '…' : `${products.length} produit${products.length > 1 ? 's' : ''} dans la cuisine`}
        </p>
      </header>
      <ProductList
        products={products}
        loading={loading}
        error={error}
        onUpdateQuantity={handleUpdateQuantity}
        onDelete={deleteProduct}
        onAddShoppingItem={addShoppingItem}
      />
    </div>
  );
}
