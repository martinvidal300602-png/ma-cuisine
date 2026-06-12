import Button from '../UI/Button';

export default function EmptyProductSheet({
  product,
  busy,
  canAddToShopping,
  onAddToShopping,
  onDelete,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 flex items-end">
      <div className="w-full max-w-app mx-auto bg-bg rounded-card border border-border p-4 space-y-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold">Vous avez terminé {product.nom}</h2>
          <p className="text-sm text-muted">
            Choisissez quoi faire. Le produit ne sera pas supprimé automatiquement.
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={onAddToShopping} disabled={busy || !canAddToShopping}>
            Ajouter à la liste de courses
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={busy}>
            Supprimer du stock
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
