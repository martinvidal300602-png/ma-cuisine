import { useMemo } from 'react';
import {
  ArchiveX,
  Check,
  CircleMinus,
  Clock3,
  Camera,
  ReceiptText,
  PackagePlus,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  Utensils,
} from 'lucide-react';
import MobileHeader from '../components/UI/MobileHeader';
import ProfileButton from '../components/UI/ProfileButton';
import EmptyState from '../components/UI/EmptyState';

const TYPE_META = {
  product_added: { icon: PackagePlus, tone: 'bg-fresh-ok-bg text-fresh-ok' },
  products_added: { icon: PackagePlus, tone: 'bg-fresh-ok-bg text-fresh-ok' },
  product_updated: { icon: RefreshCw, tone: 'bg-fresh-none-bg text-muted' },
  product_restocked: { icon: PackagePlus, tone: 'bg-fresh-ok-bg text-fresh-ok' },
  product_consumed: { icon: Utensils, tone: 'bg-fresh-week-bg text-fresh-week' },
  product_moved: { icon: RefreshCw, tone: 'bg-fresh-none-bg text-muted' },
  product_deleted: { icon: ArchiveX, tone: 'bg-fresh-expired-bg text-fresh-expired' },
  shopping_added: { icon: ShoppingCart, tone: 'bg-accent-light text-accent' },
  shopping_checked: { icon: Check, tone: 'bg-fresh-ok-bg text-fresh-ok' },
  shopping_unchecked: { icon: RefreshCw, tone: 'bg-fresh-none-bg text-muted' },
  shopping_removed: { icon: CircleMinus, tone: 'bg-fresh-none-bg text-muted' },
  shopping_started: { icon: ShoppingBasket, tone: 'bg-accent-light text-accent' },
  shopping_reopened: { icon: ShoppingBasket, tone: 'bg-accent-light text-accent' },
  shopping_finished: { icon: Check, tone: 'bg-fresh-ok-bg text-fresh-ok' },
  shopping_cancelled: { icon: CircleMinus, tone: 'bg-fresh-expired-bg text-fresh-expired' },
  photo_analyzed: { icon: Camera, tone: 'bg-accent-light text-accent' },
  ticket_validated: { icon: ReceiptText, tone: 'bg-fresh-ok-bg text-fresh-ok' },
};

function dayKey(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export default function Activity({ events, onClear, userEmail, onOpenSettings }) {
  const groups = useMemo(() => {
    const result = new Map();
    events.forEach((item) => {
      const key = dayKey(item.timestamp);
      if (!result.has(key)) result.set(key, []);
      result.get(key).push(item);
    });
    return Array.from(result.entries());
  }, [events]);

  return (
    <div className="space-y-5">
      <MobileHeader
        title="Activité"
        subtitle="Les changements récents de la cuisine"
        right={<ProfileButton onClick={onOpenSettings} email={userEmail} />}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<Clock3 size={24} strokeWidth={1.9} />}
          title="Aucune activité récente"
          text="Les ajouts, consommations et changements de courses apparaîtront ici."
        />
      ) : (
        <>
          {groups.map(([label, items]) => (
            <section key={label} aria-label={label}>
              <h2 className="text-[13px] font-semibold text-muted uppercase tracking-wide mb-2 first-letter:uppercase">
                {label}
              </h2>
              <div className="bg-card rounded-card border border-border overflow-hidden">
                {items.map((item, index) => {
                  const meta = TYPE_META[item.type] || { icon: Clock3, tone: 'bg-fresh-none-bg text-muted' };
                  const Icon = meta.icon;
                  return (
                    <article key={item.id} className={`flex gap-3 p-3.5 ${index > 0 ? 'border-t border-border' : ''}`}>
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.tone}`}>
                        <Icon size={17} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                          <time className="text-[11px] text-muted font-num shrink-0" dateTime={item.timestamp}>
                            {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.timestamp))}
                          </time>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {item.actor ? `${displayActor(item.actor)} · ` : ''}{item.detail}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <button type="button" onClick={onClear} className="pressable w-full min-h-11 text-sm font-medium text-muted">
            Effacer l’historique local
          </button>
        </>
      )}
    </div>
  );
}

function displayActor(value) {
  const text = String(value || '').trim();
  if (!text.includes('@')) return text;
  return text.split('@')[0];
}
