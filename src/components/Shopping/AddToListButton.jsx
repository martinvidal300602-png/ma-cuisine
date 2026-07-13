// src/components/Shopping/AddToListButton.jsx
import { useState } from 'react';
import Icon from '../UI/Icon';

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
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy}
        aria-label={done ? 'Ajouté à la liste de courses' : 'Ajouter à la liste de courses'}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          done ? 'text-fresh-ok bg-fresh-ok-bg' : 'text-accent hover:bg-accent-light'
        }`}
      >
        <Icon name={done ? 'check' : 'cart'} size={14} strokeWidth={2} />
        {done ? 'Ajouté' : 'Courses'}
      </button>
      {error && <p className="text-danger text-xs basis-full">{error}</p>}
    </>
  );
}
