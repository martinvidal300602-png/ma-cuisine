// src/components/Inventory/FilterBar.jsx
import { CATEGORIES, EMPLACEMENTS } from '../Add/ManualForm';
import Icon from '../UI/Icon';

/**
 * Recherche (nom, marque) + emplacements en puces défilantes + filtre catégorie.
 */
export default function FilterBar({ search, onSearch, categorie, onCategorie, emplacement, onEmplacement, showEmplacement = true }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Rechercher un produit ou une marque…"
          aria-label="Rechercher un produit ou une marque"
          className="w-full pl-9 pr-3 py-2.5 rounded-card border border-border bg-card text-sm placeholder:text-muted"
        />
      </div>

      {showEmplacement && (
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4" role="group" aria-label="Filtrer par emplacement">
        <Chip selected={emplacement === ''} onClick={() => onEmplacement('')}>
          Tous
        </Chip>
        {EMPLACEMENTS.map((e2) => (
          <Chip key={e2} selected={emplacement === e2} onClick={() => onEmplacement(emplacement === e2 ? '' : e2)}>
            {e2}
          </Chip>
        ))}
      </div>
      )}

      <select
        value={categorie}
        onChange={(e) => onCategorie(e.target.value)}
        aria-label="Filtrer par catégorie"
        className="w-full px-3 py-2 rounded-card border border-border bg-card text-sm text-text"
      >
        <option value="">Toutes catégories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        selected
          ? 'bg-accent text-white border-accent'
          : 'bg-card text-muted border-border hover:border-accent hover:text-accent'
      }`}
    >
      {children}
    </button>
  );
}
