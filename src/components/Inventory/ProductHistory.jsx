import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ProductHistory({ product }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('historique_produits')
        .select('id, quantite_ajoutee, quantite_consommee, resultat, source_ajout, user_email, created_at')
        .eq('produit_id', product.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (!active) return;
      if (error) setAvailable(false);
      else setEntries(data || []);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [product.id]);

  return (
    <section>
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Historique produit</h3>
      {loading ? <div className="skeleton h-14" /> : !available ? (
        <p className="text-xs text-muted bg-card border border-border rounded-card p-3">Disponible après validation de la migration V3.</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted bg-card border border-border rounded-card p-3">Aucun mouvement enregistré pour ce produit.</p>
      ) : (
        <div className="bg-card rounded-card border border-border divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="px-3 py-2.5 flex gap-3">
              <Clock3 size={15} className="text-muted mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{entryLabel(entry, product.unite)}</span><span className="block text-xs text-muted mt-0.5">{formatDate(entry.created_at)}{entry.user_email ? ` · ${displayActor(entry.user_email)}` : ''}</span></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function entryLabel(entry, unit) {
  if (Number(entry.quantite_ajoutee || 0) > 0) return `+${entry.quantite_ajoutee} ${unit || 'unité'} · ajouté (${entry.source_ajout || 'manuel'})`;
  if (Number(entry.quantite_consommee || 0) > 0) return `−${entry.quantite_consommee} ${unit || 'unité'} · ${entry.resultat === 'gaspille' ? 'gaspillé' : 'consommé'}`;
  return 'Stock corrigé';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function displayActor(value) {
  return String(value || '').split('@')[0];
}
