'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import type { PasswordRequirementStatus } from '@repo/utilities/validation/password-requirements';

type Props = {
  status: PasswordRequirementStatus;
};

function Item({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-sm',
        met ? 'text-success' : 'text-muted-foreground'
      )}
    >
      <CheckCircle2
        className={cn('h-4 w-4', met ? 'opacity-100' : 'opacity-40')}
      />
      <span>{children}</span>
    </li>
  );
}

export default function PasswordRequirementsChecklist({ status }: Props) {
  // Safety check: provide default values if status is undefined
  const safeStatus = status || {
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false,
    noSpaces: false,
  };

  return (
    <div className="border-border bg-secondary/30 rounded-lg border p-4">
      <p className="text-foreground mb-2 text-sm font-semibold">
        Password requirements
      </p>
      <ul className="space-y-1">
        <Item met={safeStatus.minLength}>At least 12 characters</Item>
        <Item met={safeStatus.uppercase}>
          At least one uppercase letter (A–Z)
        </Item>
        <Item met={safeStatus.lowercase}>
          At least one lowercase letter (a–z)
        </Item>
        <Item met={safeStatus.number}>At least one number (0–9)</Item>
        <Item met={safeStatus.symbol}>
          At least one symbol (!, ?, $, %, ^, &amp;, *, etc.)
        </Item>
        <Item met={safeStatus.noSpaces}>No spaces allowed</Item>
      </ul>
    </div>
  );
}
