// src/components/Auth/LoginForm.jsx
import { useState } from 'react';
import Button from '../UI/Button';

/**
 * Écran de connexion plein écran (email + mot de passe via Supabase Auth).
 */
export default function LoginForm({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Renseignez votre email et votre mot de passe.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSignIn(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg bg-tiles">
      <div className="w-full max-w-app">
        <div className="text-center mb-8">
          <p className="text-4xl mb-4" aria-hidden="true">🥕</p>
          <h1 className="font-display font-extrabold text-4xl tracking-tight">Ma Cuisine</h1>
          <p className="text-muted text-sm mt-2">Le garde-manger partagé de la famille</p>
        </div>

        <div className="bg-card rounded-card border border-border p-5 shadow-card">
          <label className="block mb-4">
            <span className="block text-sm font-semibold mb-1.5">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm"
              placeholder="vous@exemple.fr"
            />
          </label>

          <label className="block mb-5">
            <span className="block text-sm font-semibold mb-1.5">Mot de passe</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p role="alert" className="text-danger text-sm mb-4">
              {error}
            </p>
          )}

          <Button size="lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </div>
      </div>
    </div>
  );
}
