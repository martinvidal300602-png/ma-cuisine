// src/components/Auth/LoginForm.jsx
import { useState } from 'react';
import Button from '../UI/Button';
import { CookingPot } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg pt-safe pb-safe">
      <div className="w-full max-w-app">
        <div className="text-center mb-8">
          <span className="w-16 h-16 rounded-[20px] mx-auto mb-5 bg-accent text-white flex items-center justify-center shadow-card">
            <CookingPot size={30} strokeWidth={1.8} />
          </span>
          <h1 className="font-display font-bold text-[36px] tracking-[-0.04em]">Ma Cuisine</h1>
          <p className="text-muted text-sm mt-2">La cuisine partagée de la famille</p>
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
              className="w-full px-3.5 h-12 rounded-card border border-border bg-bg text-base"
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
              className="w-full px-3.5 h-12 rounded-card border border-border bg-bg text-base"
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
