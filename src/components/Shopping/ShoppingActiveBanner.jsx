export default function ShoppingActiveBanner({ session, onOpen }) {
  if (!session) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full bg-accent-light text-accent rounded-card border border-accent/30 px-3 py-2 text-left text-sm font-medium"
    >
      {session.started_by || 'Quelqu’un'} est en train de faire les courses
    </button>
  );
}
