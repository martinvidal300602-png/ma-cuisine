// src/components/Shopping/ShoppingActiveBanner.jsx
import { ShoppingCart, ChevronRight } from 'lucide-react';

export default function ShoppingActiveBanner({ session, onOpen }) {
  if (!session) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="pressable w-full bg-fresh-soon-bg text-fresh-soon rounded-card px-3.5 py-3 flex items-center gap-2.5 text-left"
    >
      <ShoppingCart size={17} strokeWidth={2} className="shrink-0" />
      <span className="flex-1 text-sm font-semibold truncate">
        {session.started_by || 'Quelqu’un'} est en train de faire les courses
      </span>
      <ChevronRight size={15} className="shrink-0" />
    </button>
  );
}
