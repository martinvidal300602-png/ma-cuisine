// src/pages/Alerts.jsx
import AlertsList from '../components/Alerts/AlertsList';

/**
 * Page Alertes : produits périmés, expirant sous 3 jours, ou cette semaine.
 */
export default function Alerts({ perimes, expirentBientot, cetteSemaine, loading }) {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold">Alertes</h1>
        <p className="text-muted text-sm">Produits à consommer en priorité</p>
      </header>

      {loading ? (
        <p className="text-muted text-sm text-center py-8">Chargement…</p>
      ) : (
        <AlertsList perimes={perimes} expirentBientot={expirentBientot} cetteSemaine={cetteSemaine} />
      )}
    </div>
  );
}
