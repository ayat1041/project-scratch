'use client';

import PasswordGeneratorPanel from '@repo/ui/components/ui/password-generator-panel';
import PasswordInput from './PasswordInput';
import PasswordRequirementsChecklist from '@modules/auth/components/PasswordRequirementsChecklist';

interface NewPasswordFieldProps {
  password: string;
  onPasswordChange: (val: string) => void;
  showPassword: boolean;
  onToggle: () => void;
  error: string | null;
  onPasswordGenerated: (pw: string) => void;
}

export default function NewPasswordField({
  password,
  onPasswordChange,
  showPassword,
  onToggle,
  error,
  onPasswordGenerated,
}: NewPasswordFieldProps) {
  return (
    <div className="mb-2.5 space-y-2 md:mb-[15px]">
      <label
        htmlFor="password"
        className="text-foreground block text-sm font-medium"
      >
        New Password
      </label>
      <PasswordInput
        value={password}
        onChange={onPasswordChange}
        isVisible={showPassword}
        onToggle={onToggle}
        id="password"
        placeholder="Enter new password"
        autoComplete="new-password"
        className="h-12 pr-10 pl-10 text-base font-medium outline-none md:w-[382px] md:text-base"
        dataTestId="reset-password-input"
      />
      <PasswordGeneratorPanel
        onPasswordGenerated={onPasswordGenerated}
        inputPassword={password}
        colorScheme="primary"
      />
      <PasswordRequirementsChecklist password={password} />
    </div>
  );
}
