// src/pages/Today.jsx
import { useState } from 'react';
import TodayFocus from '../components/Dashboard/TodayFocus';
import QuickActions from '../components/Dashboard/QuickActions';
import DashboardRecommendations from '../components/Dashboard/DashboardRecommendations';
import AlertsList from '../components/Alerts/AlertsList';
import MobileHeader from '../components/UI/MobileHeader';
import ProfileButton from '../components/UI/ProfileButton';

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
            products={products}
            shopping={shopping}
            session={shoppingSession}
            actions={actions}
            onOpenCourses={onOpenCourses}
            onSeeAll={() => setAlertsOpen(true)}
          />

          <DashboardRecommendations
            products={products}
            shopping={shopping}
            thisWeek={produitsCetteSemaine}
            onOpenCuisine={onOpenCuisine}
            onOpenCourses={onOpenCourses}
            onOpenPhoto={() => onOpenScan('photo')}
          />

          <QuickActions onSelect={onOpenScan} />
        </>
      )}
    </div>
  );
}
