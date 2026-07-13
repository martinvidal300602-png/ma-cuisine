export default function ScreenLoader({ label = 'Chargement…' }) {
  return (
    <div className="space-y-3" aria-label={label} aria-busy="true">
      <div className="skeleton h-12" />
      <div className="skeleton h-28" />
      <div className="skeleton h-20" />
    </div>
  );
}
