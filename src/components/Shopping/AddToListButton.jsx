import { useState } from 'react';

export default function AddToListButton({ product, onAdd }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleAdd = async () => {
    setBusy(true);
    setDone(false);
    setError(null);
    try {
      await onAdd({
        nom: product.nom,
        marque: product.marque,
        categorie: product.categorie,
        quantite: 1,
        unite: product.unite || 'unité',
        source: 'stock',
      });
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
    } catch (err) {
      setError(err.message || "Impossible d'ajouter ce produit à la liste.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        className="text-accent text-xs px-2 py-1 rounded bg-accent-light font-medium disabled:opacity-50"
      >
        {done ? 'Ajouté' : 'Ajouter à la liste'}
      </button>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
