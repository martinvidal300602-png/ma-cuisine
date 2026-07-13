// src/components/Shopping/ShoppingItem.jsx
import Icon from '../UI/Icon';

export default function ShoppingItem({ item, onToggle, onDelete, large = false }) {
  return (
    <article
      className={`bg-card rounded-card border border-border shadow-card p-3 flex items-center gap-3 transition-opacity ${
        item.coche ? 'opacity-55' : ''
      }`}
    >
      <label className="relative shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={item.coche}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="peer sr-only"
          aria-label={`Cocher ${item.nom}`}
        />
        <span
          className={`flex items-center justify-center rounded-lg border-2 border-border bg-bg text-transparent transition-colors peer-checked:bg-accent peer-checked:border-accent peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent ${
            large ? 'w-8 h-8' : 'w-6 h-6'
          }`}
        >
          <Icon name="check" size={large ? 18 : 14} strokeWidth={2.6} />
        </span>
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className={`${large ? 'text-lg' : 'text-sm'} font-semibold truncate ${
                item.coche ? 'line-through decoration-muted' : ''
              }`}
            >
              {item.nom}
            </h3>
            {item.marque && <p className="text-xs text-muted truncate">{item.marque}</p>}
          </div>
          <span className="text-xs text-muted font-num shrink-0 pt-0.5">
            {item.quantite} {item.unite}
          </span>
        </div>
        <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
          {item.categorie}
          {item.priorite === 'haute' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-fresh-soon-bg text-fresh-soon text-[10px] font-semibold">
              priorité haute
            </span>
          )}
        </p>
      </div>

      {!large && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-fresh-expired hover:bg-fresh-expired-bg transition-colors shrink-0"
          aria-label={`Supprimer ${item.nom}`}
        >
          <Icon name="trash" size={16} />
        </button>
      )}
    </article>
  );
}
