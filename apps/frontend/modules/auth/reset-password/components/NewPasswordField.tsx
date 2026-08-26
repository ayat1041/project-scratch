'use client';

import PasswordRequirementsChecklist from '@modules/auth/components/PasswordRequirementsChecklist';
import PasswordInput from '@modules/auth/sign-up/components/PasswordInput';
import { getPasswordRequirementStatus } from '@repo/utilities/validation/password-requirements';
import PasswordGeneratorPanel from '@repo/ui/components/ui/password-generator-panel';

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
  onPasswordGenerated,
}: NewPasswordFieldProps) {
  const status = getPasswordRequirementStatus(password);

  return (
    <div className="mb-2.5 space-y-2 md:mb-[15px]">
      <label
        htmlFor="password"
        className="block text-sm font-medium text-black"
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
        className="border-gray placeholder:text-gray text-text bg-secondary/50 h-12 pr-10 pl-10 text-sm font-medium outline-none placeholder:text-sm md:w-[382px]"
        dataTestId="reset-password-input"
      />
      {/* {error && <p className="text-danger mt-1 text-sm">{error}</p>} */}
      <PasswordGeneratorPanel
        onPasswordGenerated={onPasswordGenerated}
        inputPassword={password}
        maxLength={32}
        showTestIds
      />
      <PasswordRequirementsChecklist status={status} />
    </div>
  );
}
