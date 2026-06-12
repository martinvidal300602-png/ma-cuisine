// src/components/UI/BottomNav.jsx
/**
 * Barre de navigation fixe en bas (64px + safe area iOS).
 * Onglets principaux : Stock / Ajouter / Courses / Alertes / Réglages.
 * Un badge rouge sur "Alertes" indique le nombre de produits périmés ou expirant sous 3 jours.
 */
const TABS = [
  { id: 'stock', label: 'Stock', icon: '🧺' },
  { id: 'ajouter', label: 'Ajouter', icon: '➕' },
  { id: 'courses', label: 'Courses', icon: '🛒' },
  { id: 'alertes', label: 'Alertes', icon: '🔔' },
  { id: 'reglages', label: 'Réglages', icon: '⚙️' },
];

export default function BottomNav({ active, onChange, alertCount = 0 }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-safe"
    >
      <div className="max-w-app mx-auto h-16 grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-muted'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.id === 'alertes' && alertCount > 0 && (
                <span
                  aria-label={`${alertCount} alertes`}
                  className="absolute top-1.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-num font-semibold flex items-center justify-center"
                >
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
