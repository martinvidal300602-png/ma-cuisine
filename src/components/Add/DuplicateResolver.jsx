// src/components/Add/DuplicateResolver.jsx
import Button from '../UI/Button';

/**
 * Résolution des doublons probables avant insertion :
 * fusionner avec l'existant, ajouter comme nouveau, ou ignorer.
 */
export default function DuplicateResolver({ entries, onDecision, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/45 px-4 py-6 overflow-y-auto">
      <div className="sheet-panel max-w-app mx-auto bg-bg rounded-card border border-border p-4 space-y-4 shadow-sheet">
        <div>
          <h2 className="font-display font-extrabold text-lg">Doublons possibles</h2>
          <p className="text-sm text-muted">
            Choisissez quoi faire pour chaque produit déjà présent au même emplacement.
          </p>
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={`${entry.product.nom}-${index}`}
              className="bg-card rounded-card border border-border p-3 space-y-3"
            >
              <div className="text-sm">
                <p className="font-semibold">{entry.product.nom}</p>
                <p className="text-muted">
                  Nouveau : {entry.product.quantite} {entry.product.unite} · {entry.product.emplacement}
                </p>
                <p className="text-muted">
                  Existant : {entry.existing.nom} · {entry.existing.quantite} {entry.existing.unite}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {entry.canMerge && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`duplicate-${index}`}
                      checked={entry.decision === 'merge'}
                      onChange={() => onDecision(index, 'merge')}
                      className="accent-[var(--color-accent)]"
                    />
                    Fusionner avec l'existant
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`duplicate-${index}`}
                    checked={entry.decision === 'new'}
                    onChange={() => onDecision(index, 'new')}
                    className="accent-[var(--color-accent)]"
                  />
                  Ajouter comme nouveau produit
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`duplicate-${index}`}
                    checked={entry.decision === 'ignore'}
                    onChange={() => onDecision(index, 'ignore')}
                    className="accent-[var(--color-accent)]"
                  />
                  Ignorer
                </label>
              </div>

              {!entry.canMerge && (
                <p className="text-xs text-warn">Unités incompatibles : fusion désactivée.</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>Valider</Button>
        </div>
      </div>
    </div>
  );
}
