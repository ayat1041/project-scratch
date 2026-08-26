'use client';

import { Input } from '@repo/ui/components/ui/input';
import PasswordVisibilityToggle from '@repo/ui/components/common/PasswordVisibilityToggle';
import { CheckCircle2, Lock } from 'lucide-react';

interface ConfirmPasswordFieldProps {
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  showPassword: boolean;
  onToggle: () => void;
  error: string | null;
  disabled?: boolean;
  passwordsMatch: boolean;
}

export default function ConfirmPasswordField({
  confirmPassword,
  onConfirmPasswordChange,
  showPassword,
  onToggle,
  error,
  disabled = false,
  passwordsMatch,
}: ConfirmPasswordFieldProps) {
  return (
    <div className="mb-2.5 space-y-2">
      <label
        htmlFor="confirmPassword"
        className="block text-sm font-medium text-black"
      >
        Confirm Password
      </label>
      <div className="relative flex items-center md:w-[382px]">
        <span className="text-gray absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 transform">
          <Lock className="text-muted-foreground h-5 w-5" />
        </span>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          className="border-gray placeholder:text-gray text-text h-12 bg-white pr-10 pl-10 text-base font-medium outline-none md:w-[382px] md:text-base"
          value={confirmPassword}
          onChange={e => onConfirmPasswordChange(e.target.value)}
          data-testid="reset-confirm-password-input"
          required
          disabled={disabled}
        />
        <PasswordVisibilityToggle isVisible={showPassword} onClick={onToggle} />
      </div>
      {disabled && (
        <p className="text-muted-foreground text-sm md:w-[382px]">
          Complete the password requirements above to enable confirmation.
        </p>
      )}
      {passwordsMatch && (
        <p className="text-success flex items-center gap-1 text-sm">
          <CheckCircle2 className="h-4 w-4" /> Passwords match
        </p>
      )}
      {error && <p className="text-danger mt-1 text-sm">{error}</p>}
    </div>
  );
}
