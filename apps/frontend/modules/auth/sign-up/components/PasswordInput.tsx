'use client';
import React from 'react';
import { Lock } from 'lucide-react';
import PasswordVisibilityToggle from '@repo/ui/components/common/PasswordVisibilityToggle';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui/components/ui/input';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  onToggle: () => void;
  id?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  dataTestId?: string;
  error?: boolean;
}

const PasswordInput = ({
  value,
  onChange,
  isVisible,
  onToggle,
  id = 'password',
  placeholder = '••••••••',
  autoComplete,
  className,
  dataTestId,
  error = false,
}: PasswordInputProps) => {
  return (
    <div className="relative md:w-[382px]">
      <div className="relative">
        <span className="absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 transform">
          <Lock className="text-muted-foreground h-5 w-5" />
        </span>
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          data-testid={dataTestId}
          className={cn(
            'h-12 w-full rounded border pr-10 pl-10 text-base font-medium outline-none md:w-[382px] md:text-base',
            className,
            error && 'border-destructive'
          )}
        />
        <PasswordVisibilityToggle isVisible={isVisible} onClick={onToggle} />
      </div>
    </div>
  );
};

export default PasswordInput;
