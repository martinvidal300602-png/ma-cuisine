import { useState } from 'react';
import Button from '../components/UI/Button';
import { CATEGORIES } from '../components/Add/ManualForm';
import ShoppingItem from '../components/Shopping/ShoppingItem';
import ShopMode from '../components/Shopping/ShopMode';
import ShoppingActiveBanner from '../components/Shopping/ShoppingActiveBanner';

const DEFAULT_FORM = {
  nom: '',
  marque: '',
  categorie: 'Autre',
  quantite: 1,
  unite: 'unité',
  priorite: 'normale',
};

export default function ShoppingList({
  shopping,
  session,
  userEmail,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState(null);
  const [shopModeOpen, setShopModeOpen] = useState(false);

  const set = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
  };

  const handleAdd = async () => {
    if (!form.nom.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }

    setError(null);
    try {
      await shopping.addItem({ ...form, ajoute_par: userEmail ?? null, source: 'manuel' });
      setForm(DEFAULT_FORM);
    } catch (err) {
      setError(err.message || "L'ajout a échoué.");
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

  const inputClass = 'w-full px-3 py-2.5 rounded-card border border-border bg-card text-sm';
  const checkedCount = shopping.items.filter((item) => item.coche).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Courses</h1>
        <p className="text-muted text-sm">
          {shopping.loading ? '…' : `${shopping.items.length} produit${shopping.items.length > 1 ? 's' : ''} dans la liste`}
        </p>
      </header>

      <ShoppingActiveBanner session={session.activeSession} onOpen={() => setShopModeOpen(true)} />

      <div className="bg-card rounded-card border border-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={form.nom}
            onChange={set('nom')}
            className={`${inputClass} col-span-2`}
            placeholder="Produit à acheter"
            aria-label="Produit à acheter"
          />
          <input
            type="text"
            value={form.marque}
            onChange={set('marque')}
            className={inputClass}
            placeholder="Marque"
            aria-label="Marque"
          />
          <select value={form.categorie} onChange={set('categorie')} className={inputClass} aria-label="Catégorie">
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
          <select value={form.priorite} onChange={set('priorite')} className={`${inputClass} col-span-2`} aria-label="Priorité">
            <option value="basse">Priorité basse</option>
            <option value="normale">Priorité normale</option>
            <option value="haute">Priorité haute</option>
          </select>
        </div>
        <Button onClick={handleAdd}>Ajouter à la liste</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={handleStart}>
          {session.activeSession ? 'Ouvrir le mode courses' : 'Démarrer les courses'}
        </Button>
        <Button variant="secondary" onClick={handleClearChecked} disabled={checkedCount === 0}>
          Supprimer cochés
        </Button>
      </div>

      {(error || shopping.error || session.error) && (
        <p role="alert" className="text-danger text-sm">
          {error || shopping.error || session.error}
        </p>
      )}

      <div className="space-y-3">
        {shopping.loading && <p className="text-muted text-sm text-center py-8">Chargement de la liste…</p>}
        {!shopping.loading && shopping.items.length === 0 && (
          <p className="text-muted text-sm text-center py-8">La liste de courses est vide.</p>
        )}
        {shopping.items.map((item) => (
          <ShoppingItem
            key={item.id}
            item={item}
            onToggle={(id, coche) => shopping.updateItem(id, { coche })}
            onDelete={shopping.deleteItem}
          />
        ))}
      </div>

      {shopModeOpen && (
        <ShopMode
          items={shopping.items}
          onToggle={(id, coche) => shopping.updateItem(id, { coche })}
          onClose={() => setShopModeOpen(false)}
          onFinish={handleFinish}
          onClearChecked={handleClearChecked}
        />
      )}
    </div>
  );
}
