import { UserRound } from 'lucide-react';

export default function ProfileButton({ onClick, email }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir le profil et les réglages"
      className="pressable w-10 h-10 rounded-full bg-card border border-border text-accent flex items-center justify-center"
      title={email || 'Profil'}
    >
      <UserRound size={19} strokeWidth={2} />
    </button>
  );
}
