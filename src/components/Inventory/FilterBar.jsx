// src/components/Inventory/FilterBar.jsx
import { CATEGORIES, EMPLACEMENTS } from '../Add/ManualForm';

/**
 * Barre de recherche (nom, marque) + filtres catégorie et emplacement.
 */
export default function FilterBar({ search, onSearch, categorie, onCategorie, emplacement, onEmplacement }) {
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Rechercher un produit ou une marque…"
        aria-label="Rechercher un produit ou une marque"
        className="w-full px-3 py-2.5 rounded-card border border-border bg-card text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={categorie}
          onChange={(e) => onCategorie(e.target.value)}
          aria-label="Filtrer par catégorie"
          className="px-3 py-2 rounded-card border border-border bg-card text-sm text-text"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={emplacement}
          onChange={(e) => onEmplacement(e.target.value)}
          aria-label="Filtrer par emplacement"
          className="px-3 py-2 rounded-card border border-border bg-card text-sm text-text"
        >
          <option value="">Tous emplacements</option>
          {EMPLACEMENTS.map((e2) => (
            <option key={e2} value={e2}>
              {e2}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
