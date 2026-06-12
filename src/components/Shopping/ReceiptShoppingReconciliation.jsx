import { useEffect, useMemo, useState } from 'react';
import Button from '../UI/Button';
import { matchShoppingItems } from '../../lib/matchShoppingItems';

export default function ReceiptShoppingReconciliation({
  receiptItems,
  shoppingItems,
  activeSession,
  adding,
  onConfirm,
}) {
  const reconciliation = useMemo(
    () => matchShoppingItems(receiptItems, shoppingItems),
    [receiptItems, shoppingItems]
  );
  const [selectedReceiptIndexes, setSelectedReceiptIndexes] = useState(new Set());
  const [shoppingIdsToDelete, setShoppingIdsToDelete] = useState(new Set());
  const [finishSession, setFinishSession] = useState(false);

  useEffect(() => {
    const selected = new Set();
    const toDelete = new Set();

    reconciliation.matchedItems.forEach((match) => {
      if (match.confidence === 'high' || match.confidence === 'medium') {
        selected.add(match.receiptIndex);
        toDelete.add(match.shoppingItem.id);
      }
    });

    reconciliation.unmatchedReceiptItems.forEach(({ receiptIndex }) => {
      selected.add(receiptIndex);
    });

    setSelectedReceiptIndexes(selected);
    setShoppingIdsToDelete(toDelete);
  }, [reconciliation]);

  const toggleReceipt = (index) => {
    setSelectedReceiptIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleShoppingDelete = (id) => {
    setShoppingIdsToDelete((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    onConfirm({
      selectedReceiptIndexes: Array.from(selectedReceiptIndexes),
      shoppingIdsToDelete: Array.from(shoppingIdsToDelete),
      finishSession,
    });
  };

  const selectedCount = selectedReceiptIndexes.size;
  const missingShoppingItems = [
    ...reconciliation.checkedButNotOnReceipt,
    ...reconciliation.remainingShoppingItems,
  ];

  return (
    <div className="bg-card rounded-card border border-border p-4 space-y-4">
      <div>
        <h3 className="text-base font-bold">Rapprochement ticket / liste</h3>
        <p className="text-sm text-muted">
          Le ticket sert de preuve d’achat. Vérifiez les correspondances avant d’ajouter au stock ou de retirer des produits de la liste.
        </p>
      </div>

      <Section title={`Trouvés dans la liste (${reconciliation.matchedItems.length})`}>
        {reconciliation.matchedItems.length === 0 ? (
          <Empty text="Aucune correspondance trouvée. Vous pouvez quand même ajouter les produits du ticket au stock." />
        ) : (
          reconciliation.matchedItems.map((match) => (
            <div key={`${match.receiptIndex}-${match.shoppingItem.id}`} className="border border-border rounded-card p-3 space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedReceiptIndexes.has(match.receiptIndex)}
                  onChange={() => toggleReceipt(match.receiptIndex)}
                  className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="font-semibold">{match.receiptItem.nom}</span>
                  <span className="block text-muted">Liste : {match.shoppingItem.nom}</span>
                  <span className="block text-xs text-muted">
                    {match.confidence} · {match.reason}
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={shoppingIdsToDelete.has(match.shoppingItem.id)}
                  onChange={() => toggleShoppingDelete(match.shoppingItem.id)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                Retirer ce produit de la liste après ajout au stock
              </label>
            </div>
          ))
        )}
      </Section>

      <Section title={`Achetés mais pas dans la liste (${reconciliation.unmatchedReceiptItems.length})`}>
        {reconciliation.unmatchedReceiptItems.length === 0 ? (
          <Empty text="Tous les produits du ticket ont une correspondance dans la liste." />
        ) : (
          reconciliation.unmatchedReceiptItems.map(({ receiptItem, receiptIndex }) => (
            <label key={`${receiptItem.raw_label}-${receiptIndex}`} className="flex items-start gap-2 border border-border rounded-card p-3 text-sm">
              <input
                type="checkbox"
                checked={selectedReceiptIndexes.has(receiptIndex)}
                onChange={() => toggleReceipt(receiptIndex)}
                className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
              />
              <span>
                <span className="font-semibold">{receiptItem.nom}</span>
                {receiptItem.raw_label && <span className="block text-xs text-muted">{receiptItem.raw_label}</span>}
              </span>
            </label>
          ))
        )}
      </Section>

      <Section title={`Dans la liste mais pas sur le ticket (${missingShoppingItems.length})`}>
        {missingShoppingItems.length === 0 ? (
          <Empty text="Aucun produit restant dans la liste." />
        ) : (
          missingShoppingItems.map((item) => (
            <div key={item.id} className="border border-border rounded-card p-3 space-y-2">
              <p className="text-sm font-semibold">{item.nom}</p>
              <p className="text-xs text-muted">
                {item.coche ? 'Coché pendant les courses' : 'Non coché'} · conservé par défaut
              </p>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={shoppingIdsToDelete.has(item.id)}
                  onChange={() => toggleShoppingDelete(item.id)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                Supprimer quand même de la liste
              </label>
            </div>
          ))
        )}
      </Section>

      {activeSession && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={finishSession}
            onChange={(e) => setFinishSession(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          Terminer la session courses après validation
        </label>
      )}

      <Button size="lg" onClick={confirm} disabled={adding || selectedCount === 0}>
        {adding
          ? 'Validation en cours…'
          : `Ajouter ${selectedCount} produit${selectedCount > 1 ? 's' : ''} au stock`}
      </Button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-muted">{title}</h4>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-muted border border-border rounded-card p-3">{text}</p>;
}
