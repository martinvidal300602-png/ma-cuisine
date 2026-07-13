import { useMemo, useState } from 'react';
import { AlertTriangle, PackageX, ShoppingCart, Utensils } from 'lucide-react';
import Sheet from '../UI/Sheet';
import Button from '../UI/Button';
import UseProductModal from '../Inventory/UseProductModal';
import { joursRestants } from '../../hooks/useAlerts';
import { getConsumeMode, quantiteConsommation } from '../../lib/productConsumption';

const SNOOZE_KEY = 'ma-cuisine:v3-priority-snooze';

export default function TodayFocus({ perimes, expirentBientot, products, shopping, session, actions, onOpenCourses, onSeeAll }) {
  const [selected, setSelected] = useState(null);
  const [useProduct, setUseProduct] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [snoozed, setSnoozed] = useState(readSnoozed);

  const priorities = useMemo(() => {
    const shoppingNames = new Set(shopping.items.map((item) => normalize(item.nom)));
    const exhausted = products.filter((product) => Number(product.quantite || 0) <= 0 && !shoppingNames.has(normalize(product.nom)));
    const list = [];
    if (session.activeSession) {
      const remaining = shopping.items.filter((item) => !item.coche).length;
      list.push({ id: `session-${session.activeSession.id}`, type: 'courses', title: remaining ? `${remaining} article${remaining > 1 ? 's' : ''} reste${remaining > 1 ? 'nt' : ''} à trouver` : 'La session de courses peut être finalisée', detail: session.activeSession.started_by || 'Session familiale', actionLabel: remaining ? 'Reprendre' : 'Finaliser', icon: ShoppingCart });
    }
    perimes.filter((product) => !snoozed[product.id] || snoozed[product.id] < Date.now()).forEach((product) => list.push({ id: product.id, type: 'expired', product, title: expiredTitle(product), detail: product.emplacement, actionLabel: 'Vérifier', icon: AlertTriangle }));
    expirentBientot.forEach((product) => list.push({ id: product.id, type: 'consume', product, title: `${product.nom} doit être consommé rapidement`, detail: product.emplacement, actionLabel: 'Utiliser', icon: Utensils }));
    exhausted.forEach((product) => list.push({ id: product.id, type: 'rebuy', product, title: `${product.nom} est épuisé`, detail: 'Absent de la liste de courses', actionLabel: 'Ajouter', icon: PackageX }));
    return list.slice(0, 3);
  }, [expirentBientot, perimes, products, session.activeSession, shopping.items, snoozed]);

  const act = async (priority) => {
    setError(null);
    if (priority.type === 'courses') return onOpenCourses();
    if (priority.type === 'expired') return setSelected(priority.product);
    if (priority.type === 'consume') return setUseProduct(priority.product);
    setBusyId(priority.id);
    try {
      await actions.addShoppingItem({ nom: priority.product.nom, marque: priority.product.marque, categorie: priority.product.categorie, quantite: 1, unite: priority.product.unite || 'unité', priorite: 'normale', source: 'stock' });
    } catch (actionError) {
      setError(actionError.message || 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmUse = async (remainingQuantity) => {
    const product = useProduct;
    setUseProduct(null);
    if (!product) return;
    const quantity = quantiteConsommation(remainingQuantity, getConsumeMode(product));
    if (quantity <= 0) await actions.updateProductQuantity(product.id, 0, { mode: getConsumeMode(product) });
    else await actions.consumeProduct(product, { remainingQuantity: quantity });
  };

  const keepExpired = () => {
    const next = { ...snoozed, [selected.id]: Date.now() + 24 * 60 * 60 * 1000 };
    setSnoozed(next);
    try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(next)); } catch { /* sans gravité */ }
    setSelected(null);
  };

  return (
    <section aria-label="À faire aujourd’hui">
      <div className="flex items-center justify-between mb-2"><h2 className="font-display font-bold text-base">À faire aujourd’hui</h2>{priorities.length === 3 && <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-accent">Tout voir</button>}</div>
      {priorities.length === 0 ? (
        <div className="bg-card rounded-card border border-border p-4"><p className="text-sm font-semibold">Rien ne demande d’action immédiate</p><p className="text-xs text-muted mt-0.5">Le stock et les courses sont sous contrôle.</p></div>
      ) : (
        <div className="space-y-2.5">{priorities.map((priority) => { const Icon = priority.icon; return (
          <article key={`${priority.type}-${priority.id}`} className="bg-card rounded-card border border-border p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-accent-light text-accent flex items-center justify-center shrink-0"><Icon size={18} /></span>
            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{priority.title}</h3><p className="text-xs text-muted mt-0.5">{priority.detail}</p></div>
            <button type="button" disabled={busyId === priority.id} onClick={() => act(priority)} className="pressable min-h-10 px-3 rounded-xl bg-accent text-white text-xs font-semibold shrink-0">{busyId === priority.id ? '…' : priority.actionLabel}</button>
          </article>
        ); })}</div>
      )}
      {error && <p role="alert" className="text-danger text-sm mt-2">{error}</p>}

      {selected && <Sheet title={`Vérifier ${selected.nom}`} onClose={() => setSelected(null)}><div className="space-y-3"><p className="text-sm text-muted">Ce produit est dépassé. L’app attend votre décision et ne le supprime jamais automatiquement.</p><Button variant="danger" size="lg" onClick={async () => { await actions.deleteProduct(selected.id); setSelected(null); }}>Retirer du stock</Button><Button variant="secondary" size="lg" onClick={keepExpired}>Toujours consommable</Button></div></Sheet>}
      {useProduct && <UseProductModal product={useProduct} mode={getConsumeMode(useProduct)} onClose={() => setUseProduct(null)} onConfirm={confirmUse} />}
    </section>
  );
}

function expiredTitle(product) {
  const days = Math.abs(joursRestants(product.date_expiration));
  return `${product.nom} — périmé${days ? ` depuis ${days} jour${days > 1 ? 's' : ''}` : ''}`;
}

function normalize(value) { return String(value || '').trim().toLowerCase(); }
function readSnoozed() { try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}'); } catch { return {}; } }
