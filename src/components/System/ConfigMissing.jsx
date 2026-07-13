import { useState } from 'react';
import { Check, Clipboard, Settings2 } from 'lucide-react';

const ENV_TEMPLATE = `VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`;

export default function ConfigMissing({ missingVariables }) {
  const [copied, setCopied] = useState(false);

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(ENV_TEMPLATE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-app bg-card rounded-card border border-border shadow-card p-5 space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center">
          <Settings2 size={24} strokeWidth={1.9} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Configuration locale</p>
          <h1 className="font-display font-extrabold text-2xl mt-1">L’application n’est pas encore configurée</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Créez un fichier <code className="font-num text-text">.env.local</code> à la racine du projet,
            ajoutez les variables ci-dessous, puis redémarrez <code className="font-num text-text">npm run dev</code>.
          </p>
        </div>

        <div className="rounded-card border border-border bg-bg p-3">
          <p className="text-xs font-semibold text-muted mb-2">Variables obligatoires manquantes</p>
          <ul className="space-y-1">
            {missingVariables.map((variable) => (
              <li key={variable} className="font-num text-xs text-danger">
                {variable}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <pre className="font-num text-[11px] leading-relaxed whitespace-pre-wrap bg-text text-bg rounded-card p-3 pr-14 overflow-x-auto">
            {ENV_TEMPLATE}
          </pre>
          <button
            type="button"
            onClick={copyTemplate}
            className="pressable absolute top-2 right-2 w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center"
            aria-label="Copier le modèle de configuration"
          >
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
          </button>
        </div>

        <ol className="text-sm text-muted space-y-1.5 list-decimal list-inside">
          <li>Copiez les valeurs depuis le fichier environnement de votre version actuelle.</li>
          <li>Enregistrez sous le nom exact <code className="font-num text-text">.env.local</code>.</li>
          <li>Arrêtez puis relancez le serveur Vite.</li>
        </ol>
      </section>
    </main>
  );
}
