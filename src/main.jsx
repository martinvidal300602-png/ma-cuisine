import React from 'react';
import ReactDOM from 'react-dom/client';
import ConfigMissing from './components/System/ConfigMissing';
import ErrorBoundary from './components/System/ErrorBoundary';
import { missingRequiredVariables, runtimeConfig } from './config/runtime';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (!runtimeConfig.hasSupabase) {
  root.render(
    <React.StrictMode>
      <ConfigMissing missingVariables={missingRequiredVariables} />
    </React.StrictMode>,
  );
} else {
  import('./App')
    .then(({ default: App }) => {
      root.render(
        <React.StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </React.StrictMode>,
      );
    })
    .catch((error) => {
      console.error("Impossible de charger l'application", error);
      root.render(
        <ErrorBoundary>
          <CrashAtStartup error={error} />
        </ErrorBoundary>,
      );
    });
}

function CrashAtStartup({ error }) {
  throw error;
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn("Le service worker n'a pas pu être enregistré.", error);
    });
  });
}
