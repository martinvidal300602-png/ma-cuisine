// src/pages/AddProduct.jsx
import { useState } from 'react';
import AddMenu from '../components/Add/AddMenu';
import FridgePhoto from '../components/Add/FridgePhoto';
import BarcodeScanner from '../components/Add/BarcodeScanner';
import ReceiptScanner from '../components/Add/ReceiptScanner';
import ManualForm from '../components/Add/ManualForm';

const TITRES = {
  photo: 'Photo du frigo',
  barcode: 'Code-barres',
  receipt: 'Scanner un ticket',
  manual: 'Saisie manuelle',
};

/**
 * Page Ajouter : menu de 3 modes (photo / code-barres / manuel).
 */
export default function AddProduct({ addProduct, addProducts, userEmail }) {
  const [mode, setMode] = useState(null);

  const handleAddOne = async (product) => {
    await addProduct({ ...product, ajoute_par: userEmail ?? null });
  };

  return (
    <div>
      <header className="mb-4 flex items-center gap-3">
        {mode && (
          <button
            type="button"
            onClick={() => setMode(null)}
            aria-label="Revenir au choix du mode d'ajout"
            className="text-accent text-sm font-medium"
          >
            ← Retour
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold">{mode ? TITRES[mode] : 'Ajouter'}</h1>
          {!mode && <p className="text-muted text-sm">Choisissez un mode d'ajout</p>}
        </div>
      </header>

      {!mode && <AddMenu onSelect={setMode} />}
      {mode === 'photo' && <FridgePhoto onSubmitMany={addProducts} userEmail={userEmail} />}
      {mode === 'barcode' && <BarcodeScanner onSubmit={handleAddOne} />}
      {mode === 'receipt' && <ReceiptScanner onSubmitMany={addProducts} userEmail={userEmail} />}
      {mode === 'manual' && (
        <div className="bg-card rounded-card border border-border p-4">
          <ManualForm onSubmit={handleAddOne} />
        </div>
      )}
    </div>
  );
}
