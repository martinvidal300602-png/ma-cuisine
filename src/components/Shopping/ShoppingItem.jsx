export default function ShoppingItem({ item, onToggle, onDelete, large = false }) {
  return (
    <article
      className={`bg-card rounded-card border border-border p-3 flex items-start gap-3 ${
        item.coche ? 'opacity-60' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={item.coche}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className={`${large ? 'w-7 h-7' : 'w-5 h-5'} mt-0.5 accent-[var(--color-accent)] shrink-0`}
        aria-label={`Cocher ${item.nom}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`${large ? 'text-lg' : 'text-sm'} font-semibold truncate ${item.coche ? 'line-through' : ''}`}>
              {item.nom}
            </h3>
            {item.marque && <p className="text-xs text-muted truncate">{item.marque}</p>}
          </div>
          <span className="text-xs text-muted font-num shrink-0">
            {item.quantite} {item.unite}
          </span>
        </div>
        <p className="text-xs text-muted mt-1">
          {item.categorie} · priorité {item.priorite}
        </p>
      </div>

      {!large && (
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="text-muted hover:text-danger text-sm px-2 py-1"
          aria-label={`Supprimer ${item.nom}`}
        >
          🗑️
        </button>
      )}
    </article>
  );
}
