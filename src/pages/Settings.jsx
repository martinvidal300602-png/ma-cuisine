import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Cloud, Cpu, BellRing, Crown, Users } from 'lucide-react';
import Button from '../components/UI/Button';
import PwaInstallHint from '../components/UI/PwaInstallHint';
import { runtimeConfig } from '../config/runtime';
import MobileHeader from '../components/UI/MobileHeader';
import { supabase } from '../lib/supabase';

const NTFY_STORAGE_KEY = 'ma-cuisine:ntfy-topic';

/**
 * Réglages locaux et état des intégrations.
 * Le topic ntfy stocké ici sert uniquement de mémo : le cron utilise NTFY_TOPIC côté Vercel.
 */
export default function Settings({ userEmail, onSignOut, onClose }) {
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
      window.setTimeout(() => setSavedMsg(false), 2000);
    } catch {
      setError("Impossible d'enregistrer le mémo sur cet appareil.");
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
      <MobileHeader title="Réglages" subtitle="Compte, installation et services" onBack={onClose} />

      <PwaInstallHint />

      <section className="bg-card rounded-card border border-border p-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">État des services</h2>
        <div className="space-y-2.5">
          <ServiceStatus
            icon={Cloud}
            label="Supabase"
            detail="Stock, comptes et synchronisation"
            ready={runtimeConfig.hasSupabase}
          />
          <ServiceStatus
            icon={Cpu}
            label="Gemini 2.5 Flash Lite"
            detail="Proxy serveur sécurisé pour photos et tickets"
            ready={runtimeConfig.hasGemini}
          />
        </div>
      </section>

      <FamilyPanel userEmail={userEmail} />

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

      <section className="bg-card rounded-card border border-border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
            <BellRing size={17} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Notifications ntfy.sh</h2>
            <p className="text-xs text-muted mt-0.5">
              Le cron utilise la variable serveur <code className="font-num">NTFY_TOPIC</code> configurée sur Vercel.
            </p>
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium mb-1">Mémo local du topic</span>
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="ma-cuisine-famille"
            className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm font-num"
          />
        </label>
        <p className="text-xs text-muted">
          Ce champ aide à recopier le bon topic dans l’app ntfy. Il ne modifie pas le cron ni les variables Vercel.
        </p>
        <Button variant="secondary" onClick={saveTopic}>
          Enregistrer le mémo
        </Button>
        {savedMsg && (
          <p role="status" className="text-accent text-sm">
            ✓ Mémo enregistré sur cet appareil.
          </p>
        )}

        <div className="text-sm text-muted space-y-1 pt-2 border-t border-border">
          <p className="font-medium text-text">Installer ntfy sur iPhone :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Installez l’application « ntfy » depuis l’App Store.</li>
            <li>Ouvrez ntfy et touchez « + ».</li>
            <li>Saisissez exactement le topic configuré sur Vercel.</li>
            <li>Autorisez les notifications quand iOS le demande.</li>
          </ol>
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

function FamilyPanel({ userEmail }) {
  const [members, setMembers] = useState([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('foyer_membres')
        .select('user_id, email, display_name, role, created_at')
        .order('created_at', { ascending: true });
      if (!active) return;
      if (error) setAvailable(false);
      else setMembers(data || []);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <section className="bg-card rounded-card border border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center"><Users size={17} /></span>
        <div><h2 className="text-sm font-semibold">Foyer familial</h2><p className="text-xs text-muted">Stock et activité partagés</p></div>
      </div>
      {!available ? (
        <p className="text-xs text-muted">La gestion familiale sera activée après validation de la migration V3 séparée.</p>
      ) : members.length === 0 ? (
        <p className="text-xs text-muted">{userEmail || 'Compte actuel'} · membre</p>
      ) : (
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.user_id} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
              <span className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-xs font-bold">{initials(member.display_name || member.email)}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium truncate">{member.display_name || member.email || 'Membre'}</span><span className="block text-xs text-muted">{member.role === 'administrateur' ? 'Administrateur du foyer' : 'Membre'}</span></span>
              {member.role === 'administrateur' && <Crown size={15} className="text-warn" aria-label="Administrateur" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function initials(value) {
  return String(value || '?').split(/[@\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';
}

function ServiceStatus({ icon: Icon, label, detail, ready, missingText = 'Configuration manquante' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center text-muted shrink-0">
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted truncate">{ready ? detail : missingText}</span>
      </span>
      {ready ? (
        <CheckCircle2 size={18} className="text-accent shrink-0" aria-label="Configuré" />
      ) : (
        <CircleAlert size={18} className="text-warn shrink-0" aria-label="Configuration incomplète" />
      )}
    </div>
  );
}
