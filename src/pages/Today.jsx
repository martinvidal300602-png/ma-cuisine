// src/pages/Today.jsx
import { useState } from 'react';
import { BellRing, ChefHat, ChevronRight } from 'lucide-react';
import TodayFocus from '../components/Dashboard/TodayFocus';
import ShoppingPanel from '../components/Dashboard/ShoppingPanel';
import QuickActions from '../components/Dashboard/QuickActions';
import AlertsList from '../components/Alerts/AlertsList';
import MobileHeader from '../components/UI/MobileHeader';
import ProfileButton from '../components/UI/ProfileButton';
import { joursRestants } from '../hooks/useAlerts';

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
  userEmail,
  onOpenSettings,
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

  const produitsCetteSemaine = [...expirentBientot, ...cetteSemaine];
  const semainePreview = produitsCetteSemaine.slice(0, 3);
  const suggestion =
    expirentBientot[0] ||
    cetteSemaine[0] ||
    products.find((product) => {
      const days = joursRestants(product.date_expiration);
      return days === null || days >= 0;
    });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="text-muted text-sm first-letter:uppercase">{aujourdhui}</p>
          <h1 className="font-display font-bold text-[34px] tracking-[-0.035em] leading-tight">Aujourd’hui</h1>
        </div>
        <ProfileButton onClick={onOpenSettings} email={userEmail} />
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

          <ShoppingPanel
            products={products}
            shopping={shopping}
            session={shoppingSession}
            onOpenCourses={onOpenCourses}
            addShoppingItem={actions.addShoppingItem}
          />

          <section aria-label="Cette semaine">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-base">Cette semaine</h2>
              {produitsCetteSemaine.length > 3 && (
                <button type="button" onClick={() => setAlertsOpen(true)} className="pressable text-xs font-semibold text-accent inline-flex items-center">
                  Tout voir <ChevronRight size={14} />
                </button>
              )}
            </div>
            <div className="bg-card rounded-card border border-border overflow-hidden">
              {semainePreview.length === 0 ? (
                <div className="p-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-fresh-ok-bg text-fresh-ok flex items-center justify-center shrink-0">
                    <BellRing size={17} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Semaine tranquille</p>
                    <p className="text-xs text-muted">Aucune date ne demande d’attention.</p>
                  </div>
                </div>
              ) : (
                semainePreview.map((product, index) => {
                  const days = joursRestants(product.date_expiration);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => onOpenCuisine(product.emplacement)}
                      className={`pressable w-full min-h-14 px-4 py-3 flex items-center gap-3 text-left ${index ? 'border-t border-border' : ''}`}
                    >
                      <span className="font-num text-xs font-semibold text-fresh-week w-10 shrink-0">
                        {days === 0 ? 'Ce jour' : `J−${days}`}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{product.nom}</span>
                        <span className="block text-xs text-muted truncate">{product.emplacement}</span>
                      </span>
                      <ChevronRight size={15} className="text-muted" />
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {suggestion && (
            <section aria-label="Recommandation">
              <h2 className="font-display font-bold text-base mb-2">Suggestion</h2>
              <button
                type="button"
                onClick={() => onOpenCuisine(suggestion.emplacement)}
                className="pressable w-full bg-card rounded-card border border-border p-4 flex items-start gap-3 text-left"
              >
                <span className="w-10 h-10 rounded-full bg-accent-light text-accent flex items-center justify-center shrink-0">
                  <ChefHat size={19} strokeWidth={1.9} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">Commencez par {suggestion.nom}</span>
                  <span className="block text-xs text-muted mt-0.5">
                    {suggestion.emplacement} · idéal pour décider du prochain repas sans gaspiller.
                  </span>
                </span>
                <ChevronRight size={16} className="text-muted mt-1" />
              </button>
            </section>
          )}

          <QuickActions onSelect={onOpenScan} />
        </>
      )}
    </div>
  );
}
