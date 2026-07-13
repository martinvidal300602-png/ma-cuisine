// src/pages/Today.jsx
import { useState } from 'react';
import { BellRing } from 'lucide-react';
import TodayFocus from '../components/Dashboard/TodayFocus';
import KitchenOverview from '../components/Dashboard/KitchenOverview';
import ShoppingPanel from '../components/Dashboard/ShoppingPanel';
import QuickActions from '../components/Dashboard/QuickActions';
import AlertsList from '../components/Alerts/AlertsList';
import MobileHeader from '../components/UI/MobileHeader';

/**
 * Aujourd'hui — le tableau de bord décisionnel.
 * On ouvre l'app et on sait : quoi manger, quoi racheter, quoi scanner, où chercher.
 */
export default function Today({
  products,
  loading,
  error,
  perimes,
  expirentBientot,
  cetteSemaine,
  shopping,
  shoppingSession,
  actions,
  onOpenScan,
  onOpenCuisine,
  onOpenCourses,
}) {
  const [alertsOpen, setAlertsOpen] = useState(false);

  const aujourdhui = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  if (alertsOpen) {
    return (
      <div className="view-rise">
        <MobileHeader
          title="À surveiller"
          subtitle="Tous les produits qui demandent une action"
          onBack={() => setAlertsOpen(false)}
        />
        <AlertsList perimes={perimes} expirentBientot={expirentBientot} cetteSemaine={cetteSemaine} />
      </div>
    );
  }

  const semainePreview = cetteSemaine.slice(0, 4);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted text-sm first-letter:uppercase">{aujourdhui}</p>
        <h1 className="font-display font-extrabold text-[28px] leading-tight">Ma Cuisine</h1>
      </header>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Chargement">
          <div className="skeleton h-32" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : (
        <>
          <TodayFocus
            perimes={perimes}
            expirentBientot={expirentBientot}
            actions={actions}
            onSeeAll={() => setAlertsOpen(true)}
          />

          {semainePreview.length > 0 && (
            <section aria-label="Cette semaine">
              <button
                type="button"
                onClick={() => setAlertsOpen(true)}
                className="pressable w-full bg-card rounded-card border border-border shadow-card p-3 flex items-center gap-3 text-left"
              >
                <span className="w-9 h-9 rounded-xl bg-fresh-week-bg text-fresh-week flex items-center justify-center shrink-0">
                  <BellRing size={17} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {cetteSemaine.length} produit{cetteSemaine.length > 1 ? 's' : ''} à manger cette semaine
                  </span>
                  <span className="block text-xs text-muted truncate">
                    {semainePreview.map((p) => p.nom).join(' · ')}
                  </span>
                </span>
              </button>
            </section>
          )}

          <ShoppingPanel
            products={products}
            shopping={shopping}
            session={shoppingSession}
            onOpenCourses={onOpenCourses}
            addShoppingItem={actions.addShoppingItem}
          />

          <KitchenOverview products={products} onOpenLocation={onOpenCuisine} />

          <QuickActions onSelect={onOpenScan} />
        </>
      )}
    </div>
  );
}
