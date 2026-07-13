// src/components/UI/TabBar.jsx
import { Sun, Refrigerator, ShoppingCart, Clock3, ScanLine } from 'lucide-react';

/**
 * Barre d'onglets iOS : 4 destinations + bouton Scanner central surélevé.
 * Le scan n'est plus un onglet parmi d'autres : c'est LE geste central.
 */
const LEFT_TABS = [
  { id: 'aujourdhui', label: "Aujourd'hui", icon: Sun },
  { id: 'cuisine', label: 'Cuisine', icon: Refrigerator },
];
const RIGHT_TABS = [
  { id: 'courses', label: 'Courses', icon: ShoppingCart },
  { id: 'activite', label: 'Activité', icon: Clock3 },
];

function Tab({ tab, active, onChange, badge = 0 }) {
  const isActive = active === tab.id;
  const IconCmp = tab.icon;
  return (
    <button
      type="button"
      onClick={() => onChange(tab.id)}
      aria-label={tab.label}
      aria-current={isActive ? 'page' : undefined}
      className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] pressable ${
        isActive ? 'text-accent font-semibold' : 'text-muted font-medium'
      }`}
    >
      <span className="relative">
        <IconCmp size={21} strokeWidth={isActive ? 2.2 : 1.8} />
        {badge > 0 && (
          <span
            aria-label={`${badge} alertes`}
            className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-fresh-expired text-white text-[10px] font-num font-semibold flex items-center justify-center"
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      <span>{tab.label}</span>
    </button>
  );
}

export default function TabBar({ active, onChange, onScan, alertCount = 0 }) {
  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 inset-x-0 z-40">
      <div className="tabbar-blur border-t border-border pb-safe">
        <div className="max-w-app mx-auto h-[64px] grid grid-cols-5 items-stretch px-1">
          {LEFT_TABS.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              active={active}
              onChange={onChange}
              badge={tab.id === 'aujourdhui' ? alertCount : 0}
            />
          ))}

          {/* Bouton central Scanner */}
          <div className="relative flex justify-center">
            <button
              type="button"
              onClick={onScan}
              aria-label="Scanner ou ajouter un produit"
              className="fab-scan pressable absolute -top-5 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center border-4 border-bg"
            >
              <ScanLine size={24} strokeWidth={2.2} />
            </button>
            <span className="self-end pb-1.5 text-[10px] font-semibold text-accent">Scanner</span>
          </div>

          {RIGHT_TABS.map((tab) => (
            <Tab key={tab.id} tab={tab} active={active} onChange={onChange} />
          ))}
        </div>
      </div>
    </nav>
  );
}
