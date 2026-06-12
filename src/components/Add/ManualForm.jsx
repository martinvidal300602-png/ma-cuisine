// src/components/Add/ManualForm.jsx
import { useEffect, useState } from 'react';
import Button from '../UI/Button';
import { appliquerDateExpirationEstimee } from '../../lib/dateExpiration';

export const CATEGORIES = [
  'Viandes & Poissons',
  'Légumes & Fruits',
  'Produits laitiers',
  'Conserves & Épicerie',
  'Surgelés',
  'Céréales & Pâtes',
  'Condiments & Sauces',
  'Boissons',
  'Boulangerie',
  'Autre',
];

export const EMPLACEMENTS = [
  'Frigo',
  'Placard sous fenêtre',
  'Plan de travail',
  'Placard épices',
];

export const DEFAULT_EMPLACEMENT = 'Frigo';

export function normaliserEmplacement(emplacement) {
  const value = String(emplacement || '').trim();
  if (EMPLACEMENTS.includes(value)) return value;

  const legacy = {
    Réfrigérateur: 'Frigo',
    Refrigerateur: 'Frigo',
    Congélateur: 'Frigo',
    Congelateur: 'Frigo',
    Placard: 'Placard sous fenêtre',
    Épicerie: 'Placard sous fenêtre',
    Epicerie: 'Placard sous fenêtre',
    Cellier: 'Placard sous fenêtre',
    Cuisine: 'Plan de travail',
  };

  return legacy[value] || DEFAULT_EMPLACEMENT;
}

const DEFAUT = {
  nom: '',
  marque: '',
  categorie: 'Autre',
  emplacement: DEFAULT_EMPLACEMENT,
  quantite: 1,
  unite: 'unité(s)',
  date_expiration: '',
  notes: '',
  photo_url: null,
  code_barres: null,
};

/**
 * Formulaire de saisie manuelle. Peut être pré-rempli (scan code-barres) via `initial`.
 */
export default function ManualForm({ initial = {}, onSubmit, submitLabel = 'Ajouter le produit' }) {
  const initialForm = appliquerDateExpirationEstimee({
    ...DEFAUT,
    ...initial,
    emplacement: normaliserEmplacement(initial.emplacement || DEFAUT.emplacement),
  });
  const [form, setForm] = useState(initialForm);
  const [dateEstimated, setDateEstimated] = useState(Boolean(initialForm.date_expiration_estimee));
  const [dateEditedManually, setDateEditedManually] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    if (key === 'date_expiration') {
      setDateEstimated(false);
      setDateEditedManually(true);
    }
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  useEffect(() => {
    if (!form.nom.trim()) return;
    if (dateEditedManually) return;
    if (form.date_expiration && !dateEstimated) return;

    const withEstimate = appliquerDateExpirationEstimee({
      ...form,
      date_expiration: '',
      date_expiration_estimee: false,
    });

    if (!withEstimate.date_expiration) return;
    if (withEstimate.date_expiration === form.date_expiration) return;

    setForm((f) => ({
      ...f,
      date_expiration: withEstimate.date_expiration,
      date_expiration_estimee: true,
    }));
    setDateEstimated(true);
  }, [form.nom, form.categorie, dateEstimated, form.date_expiration, dateEditedManually]);

  const handleSubmit = async () => {
    if (!form.nom.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }
    const quantite = Number(form.quantite);
    if (!Number.isFinite(quantite) || quantite <= 0) {
      setError('La quantité doit être un nombre positif.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        nom: form.nom.trim(),
        marque: form.marque.trim() || null,
        categorie: form.categorie,
        emplacement: normaliserEmplacement(form.emplacement),
        quantite,
        unite: form.unite.trim() || 'unité(s)',
        date_expiration: form.date_expiration || null,
        notes: form.notes.trim() || null,
        photo_url: form.photo_url || null,
        code_barres: form.code_barres || null,
      });
      setForm({ ...DEFAUT });
      setDateEstimated(false);
      setDateEditedManually(false);
      setSaved(true);
    } catch (err) {
      setError(err.message || "L'ajout a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-card border border-border bg-card text-sm';

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block text-sm font-medium mb-1">
          Nom <span className="text-danger">*</span>
        </span>
        <input type="text" value={form.nom} onChange={set('nom')} className={inputClass} placeholder="Ex. Yaourt nature" />
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Marque</span>
        <input type="text" value={form.marque} onChange={set('marque')} className={inputClass} placeholder="Ex. Danone" />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Catégorie</span>
          <select value={form.categorie} onChange={set('categorie')} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Emplacement</span>
          <select value={form.emplacement} onChange={set('emplacement')} className={inputClass}>
            {EMPLACEMENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Quantité</span>
          <input
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={form.quantite}
            onChange={set('quantite')}
            className={`${inputClass} font-num`}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Unité</span>
          <input type="text" value={form.unite} onChange={set('unite')} className={inputClass} placeholder="unité(s), g, L…" />
        </label>
      </div>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Date d'expiration</span>
        <input type="date" value={form.date_expiration} onChange={set('date_expiration')} className={inputClass} />
        {dateEstimated && (
          <span className="block text-xs text-muted mt-1">date estimée, à vérifier</span>
        )}
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">Notes</span>
        <textarea value={form.notes} onChange={set('notes')} rows="2" className={inputClass} placeholder="Entamé, à finir vite…" />
      </label>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-accent text-sm">
          ✓ Produit ajouté au stock.
        </p>
      )}

      <Button size="lg" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Ajout en cours…' : submitLabel}
      </Button>
    </div>
  );
}
