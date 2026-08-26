'use client';

import { CheckCircle2 } from 'lucide-react';

interface PasswordRequirementsChecklistProps {
  password: string;
}

export default function PasswordRequirementsChecklist({
  password,
}: PasswordRequirementsChecklistProps) {
  const requirements = [
    {
      label: 'At least 12 characters',
      isValid: password.length >= 12,
    },
    {
      label: 'At least one uppercase letter (A-Z)',
      isValid: /[A-Z]/.test(password),
    },
    {
      label: 'At least one lowercase letter (a-z)',
      isValid: /[a-z]/.test(password),
    },
    {
      label: 'At least one number (0-9)',
      isValid: /[0-9]/.test(password),
    },
    {
      label: 'At least one symbol (! " ? $ % ^ & * etc.)',
      isValid: /[!@#"?$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
    {
      label: 'No spaces allowed',
      isValid: !/\s/.test(password),
    },
  ];

  return (
    <div className="border-border bg-muted/30 mt-2 space-y-3 rounded-lg p-4">
      <p className="text-foreground mb-2 text-sm font-medium">
        Password requirements:
      </p>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {requirements.map(req => (
          <div
            key={req.label}
            className={`flex items-center gap-2 ${req.isValid ? 'text-success' : 'text-muted-foreground'}`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${req.isValid ? 'opacity-100' : 'opacity-40'}`}
            />
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
