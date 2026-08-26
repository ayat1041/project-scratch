import { Eye, EyeOff } from 'lucide-react';

interface PasswordVisibilityToggleProps {
  isVisible: boolean;
  onClick: () => void;
  className?: string;
}

export default function PasswordVisibilityToggle({
  isVisible,
  onClick,
  className = '',
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      className={`text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer transition-colors ${className}`}
      title={isVisible ? 'Hide password' : 'Show password'}
      aria-label={isVisible ? 'Hide password' : 'Show password'}
      onClick={onClick}
      data-testid="password-visibility-toggle"
    >
      {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );
}
