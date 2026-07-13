// src/components/UI/EmptyState.jsx
/**
 * État vide : icône, message, action. Une invitation, pas un mur.
 */
export default function EmptyState({ icon, title, text, action }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent-light text-accent flex items-center justify-center">
        {icon}
      </div>
      <p className="font-display font-bold text-base">{title}</p>
      {text && <p className="text-muted text-sm mt-1 max-w-[280px] mx-auto">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
