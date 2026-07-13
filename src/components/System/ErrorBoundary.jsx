import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur non gérée dans Ma Cuisine', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-bg px-4 py-10 flex items-center justify-center">
        <section className="w-full max-w-app bg-card rounded-card border border-border shadow-card p-5 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-fresh-expired-bg text-danger flex items-center justify-center">
            <AlertTriangle size={24} strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">Erreur d’affichage</p>
            <h1 className="font-display font-extrabold text-2xl mt-1">L’application a rencontré un problème</h1>
            <p className="text-sm text-muted mt-2">
              Rechargez la page. Si l’erreur revient, ouvrez la console du navigateur et conservez le message affiché.
            </p>
          </div>
          {import.meta.env.DEV && (
            <pre className="font-num text-[11px] leading-relaxed whitespace-pre-wrap bg-bg border border-border rounded-card p-3 overflow-x-auto text-danger">
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="pressable w-full min-h-11 rounded-card bg-accent text-white font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={17} strokeWidth={2.1} />
            Recharger
          </button>
        </section>
      </main>
    );
  }
}
