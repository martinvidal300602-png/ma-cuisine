// src/pages/Settings.jsx
import { useState } from 'react';
import Button from '../components/UI/Button';

const NTFY_STORAGE_KEY = 'ma-cuisine:ntfy-topic';

/**
 * Page Réglages : compte, topic ntfy.sh personnel (localStorage),
 * instructions d'installation ntfy sur iPhone, déconnexion.
 */
export default function Settings({ userEmail, onSignOut }) {
  const [topic, setTopic] = useState(() => {
    try {
      return localStorage.getItem(NTFY_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const saveTopic = () => {
    try {
      localStorage.setItem(NTFY_STORAGE_KEY, topic.trim());
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      setError("Impossible d'enregistrer le topic sur cet appareil.");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await onSignOut();
    } catch (err) {
      setError(err.message || 'Déconnexion impossible.');
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Réglages</h1>
      </header>

      {/* Compte */}
      <section className="bg-card rounded-card border border-border p-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">Compte</h2>
        <p className="text-sm">
          Connectée en tant que <span className="font-medium">{userEmail ?? '—'}</span>
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-card border border-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Notifications ntfy.sh</h2>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Votre topic personnel</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ma-cuisine-famille"
            className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm font-num"
          />
        </label>
        <Button variant="secondary" onClick={saveTopic}>
          Enregistrer le topic
        </Button>
        {savedMsg && (
          <p role="status" className="text-accent text-sm">
            ✓ Topic enregistré sur cet appareil.
          </p>
        )}

        <div className="text-sm text-muted space-y-1 pt-2 border-t border-border">
          <p className="font-medium text-text">Installer ntfy sur iPhone :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Installez l'application « ntfy » depuis l'App Store.</li>
            <li>Ouvrez ntfy et touchez « + » pour vous abonner à un topic.</li>
            <li>Saisissez exactement le topic ci-dessus (ex. ma-cuisine-famille).</li>
            <li>Autorisez les notifications quand iOS le demande.</li>
          </ol>
          <p>Vous recevrez chaque matin à 8h la liste des produits qui expirent.</p>
        </div>
      </section>

      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
