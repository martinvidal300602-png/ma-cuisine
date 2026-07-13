// src/pages/Cuisine.jsx
import { useEffect, useMemo, useState } from 'react';
import { Refrigerator, Archive, LayoutPanelTop, FlaskConical, ChevronRight, Search, Rows3, ScanLine } from 'lucide-react';
import MobileHeader from '../components/UI/MobileHeader';
import EmptyState from '../components/UI/EmptyState';
import ProductList from '../components/Inventory/ProductList';
import { EMPLACEMENTS } from '../components/Add/ManualForm';
import { joursRestants } from '../hooks/useAlerts';
import { toneVar } from '../lib/freshness';
import ProfileButton from '../components/UI/ProfileButton';

const LOCATION_ICONS = {
  Frigo: Refrigerator,
  'Placard sous fenêtre': Archive,
  'Plan de travail': LayoutPanelTop,
  'Placard épices': FlaskConical,
};

/**
 * Cuisine — le stock rangé comme la vraie cuisine.
 * Vue d'ensemble par emplacement → détail d'un emplacement → vue « Tout » (recherche + filtres).
 */
export default function Cuisine({
  products,
  loading,
  error,
  actions,
  initialEmplacement = null,
  onConsumeTarget,
  onOpenScan,
  userEmail,
  onOpenSettings,
}) {
  // 'overview' | 'tous' | un des 4 emplacements
  const [view, setView] = useState(initialEmplacement ?? 'overview');
  const [pendingSearch, setPendingSearch] = useState('');

  // Si le tableau de bord demande un emplacement précis, on l'ouvre une fois.
  useEffect(() => {
    if (initialEmplacement) {
      setView(initialEmplacement);
      onConsumeTarget?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmplacement]);

  const stats = useMemo(
    () =>
      EMPLACEMENTS.map((emplacement) => {
        const list = products.filter((p) => p.emplacement === emplacement);
        const urgents = list.filter((p) => {
          const j = joursRestants(p.date_expiration);
          return j !== null && j <= 3;
        });
        return { emplacement, count: list.length, urgents: urgents.length };
      }),
    [products]
  );

  const listProps = {
    loading,
    error,
    onUpdateQuantity: actions.updateProductQuantity,
    onDecrementProduct: actions.decrementProduct,
    onConsumeProduct: actions.consumeProduct,
    onDelete: actions.deleteProduct,
    onAddShoppingItem: actions.addShoppingItem,
  };

  if (view === 'tous') {
    return (
      <div className="view-rise">
        <MobileHeader
          title="Tous les produits"
          subtitle={`${products.length} produit${products.length > 1 ? 's' : ''} dans la cuisine`}
          onBack={() => {
            setPendingSearch('');
            setView('overview');
          }}
        />
        <ProductList key={pendingSearch} products={products} initialSearch={pendingSearch} {...listProps} />
      </div>
    );
  }

  if (view !== 'overview') {
    const emplacement = view;
    const filtered = products.filter((p) => p.emplacement === emplacement);
    return (
      <div className="view-rise">
        <MobileHeader
          title={emplacement}
          subtitle={`${filtered.length} produit${filtered.length > 1 ? 's' : ''}`}
          onBack={() => setView('overview')}
        />
        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon={<ScanLine size={24} strokeWidth={1.9} />}
            title={`Rien dans « ${emplacement} »`}
            text="Scannez ou ajoutez un produit pour remplir cet emplacement."
            action={
              <button
                type="button"
                onClick={onOpenScan}
                className="pressable px-4 py-2.5 rounded-card bg-accent text-white text-sm font-semibold"
              >
                Ajouter un produit
              </button>
            }
          />
        ) : (
          <ProductList products={filtered} showEmplacementFilter={false} {...listProps} />
        )}
      </div>
    );
  }

  return (
    <div>
      <MobileHeader
        title="Cuisine"
        subtitle="Tout le stock, rangé comme chez vous"
        right={<ProfileButton onClick={onOpenSettings} email={userEmail} />}
      />

      {/* Recherche globale : ouvre la vue Tout */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <Search size={16} strokeWidth={2} />
        </span>
        <input
          type="search"
          value={pendingSearch}
          onChange={(e) => setPendingSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setView('tous')}
          placeholder="Chercher dans toute la cuisine…"
          aria-label="Chercher dans toute la cuisine"
          className="w-full pl-9 pr-3 py-2.5 rounded-card border border-border bg-card text-sm placeholder:text-muted"
        />
        {pendingSearch.trim() && (
          <button
            type="button"
            onClick={() => setView('tous')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent text-xs font-semibold px-2 py-1 rounded-lg bg-accent-light pressable"
          >
            Chercher
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-danger text-sm mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Chargement">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {stats.map(({ emplacement, count, urgents }) => {
            const IconCmp = LOCATION_ICONS[emplacement] ?? Archive;
            return (
              <button
                key={emplacement}
                type="button"
                onClick={() => setView(emplacement)}
                className="pressable w-full bg-card rounded-card border border-border shadow-card p-4 flex items-center gap-3.5 text-left"
                style={urgents > 0 ? { boxShadow: `inset 3px 0 0 ${toneVar('soon')}` } : undefined}
              >
                <span className="w-11 h-11 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <IconCmp size={21} strokeWidth={1.9} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[15px]">{emplacement}</span>
                  <span className="block text-xs text-muted mt-0.5">
                    <span className="font-num">{count}</span> produit{count > 1 ? 's' : ''}
                    {urgents > 0 && (
                      <span className="text-fresh-soon font-semibold">
                        {' '}· {urgents} à manger vite
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight size={17} className="text-muted shrink-0" />
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setView('tous')}
            className="pressable w-full bg-bg rounded-card border border-dashed border-border p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-muted"
          >
            <Rows3 size={16} strokeWidth={2} />
            Tous les produits · filtres et recherche
          </button>
        </div>
      )}
    </div>
  );
}
