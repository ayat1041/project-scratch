'use client';

import { FC } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export const DateInput: FC<DateInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'MM/YYYY',
  disabled = false,
  className,
  error = false,
}) => {
  // Convert YYYY-MM format to MM/YYYY display format
  const formatDisplayValue = (monthValue: string): string => {
    if (!monthValue) return '';
    const [year, month] = monthValue.split('-');
    return `${month}/${year}`;
  };

  // Convert MM/YYYY display format back to YYYY-MM format
  const parseInputValue = (displayValue: string): string => {
    if (!displayValue) return '';
    const match = displayValue.match(/^(\d{2})\/(\d{4})$/);
    if (match) {
      const [, month, year] = match;
      return `${year}-${month}`;
    }
    return displayValue; // fallback to original value
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type={value ? 'text' : 'text'}
        value={value ? formatDisplayValue(value) : ''}
        onChange={e => {
          const inputValue = e.target.value;
          // If it looks like MM/YYYY format, convert to YYYY-MM
          if (inputValue.match(/^\d{2}\/\d{4}$/)) {
            onChange(parseInputValue(inputValue));
          } else {
            onChange(inputValue);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          if (!value && !disabled) {
            // Create a hidden month input to trigger the picker
            const currentInput = document.getElementById(id);
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'month';
            hiddenInput.style.position = 'fixed';
            hiddenInput.style.opacity = '0';
            hiddenInput.style.pointerEvents = 'auto';
            hiddenInput.style.zIndex = '9999';

            // Position the hidden input at the same location as the current input
            if (currentInput) {
              const rect = currentInput.getBoundingClientRect();
              hiddenInput.style.left = rect.left + 'px';
              hiddenInput.style.top = rect.top + 'px';
              hiddenInput.style.width = rect.width + 'px';
              hiddenInput.style.height = rect.height + 'px';
            }

            document.body.appendChild(hiddenInput);

            hiddenInput.onchange = () => {
              if (hiddenInput.value) {
                onChange(hiddenInput.value);
              }
              document.body.removeChild(hiddenInput);
            };

            hiddenInput.onblur = () => {
              setTimeout(() => {
                if (document.body.contains(hiddenInput)) {
                  document.body.removeChild(hiddenInput);
                }
              }, 200);
            };

            setTimeout(() => {
              hiddenInput.showPicker?.();
            }, 0);
          }
        }}
        onBlur={() => {
          onBlur?.();
        }}
        onClick={() => {
          // Only trigger if it has value and not disabled
          if (value && !disabled) {
            // Create a hidden month input to trigger the picker
            const currentInput = document.getElementById(id);
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'month';
            hiddenInput.value = value;
            hiddenInput.style.position = 'fixed';
            hiddenInput.style.opacity = '0';
            hiddenInput.style.pointerEvents = 'auto';
            hiddenInput.style.zIndex = '9999';

            // Position the hidden input at the same location as the current input
            if (currentInput) {
              const rect = currentInput.getBoundingClientRect();
              hiddenInput.style.left = rect.left + 'px';
              hiddenInput.style.top = rect.top + 'px';
              hiddenInput.style.width = rect.width + 'px';
              hiddenInput.style.height = rect.height + 'px';
            }

            document.body.appendChild(hiddenInput);

            hiddenInput.onchange = () => {
              if (hiddenInput.value) {
                onChange(hiddenInput.value);
              }
              document.body.removeChild(hiddenInput);
            };

            hiddenInput.onblur = () => {
              setTimeout(() => {
                if (document.body.contains(hiddenInput)) {
                  document.body.removeChild(hiddenInput);
                }
              }, 200);
            };

            setTimeout(() => {
              hiddenInput.showPicker?.();
            }, 0);
          }
        }}
        className={cn(
          'border-gray h-[50px] pr-10',
          '[&::-webkit-calendar-picker-indicator]:!pointer-events-none [&::-webkit-calendar-picker-indicator]:!opacity-0',
          '[&::-webkit-dropdown-arrow]:!hidden [&::-webkit-inner-spin-button]:!hidden [&::-webkit-outer-spin-button]:!hidden',
          error && 'border-danger',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      />
      <Calendar
        size={24}
        className={cn(
          'text-gray absolute top-1/2 right-3 -translate-y-1/2',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        )}
        onClick={() => {
          if (disabled) return;

          // Create a hidden month input to trigger the picker
          const currentInput = document.getElementById(id);
          const hiddenInput = document.createElement('input');
          hiddenInput.type = 'month';
          if (value) hiddenInput.value = value;
          hiddenInput.style.position = 'fixed';
          hiddenInput.style.opacity = '0';
          hiddenInput.style.pointerEvents = 'auto';
          hiddenInput.style.zIndex = '9999';

          // Position the hidden input at the same location as the current input
          if (currentInput) {
            const rect = currentInput.getBoundingClientRect();
            hiddenInput.style.left = rect.left + 'px';
            hiddenInput.style.top = rect.top + 'px';
            hiddenInput.style.width = rect.width + 'px';
            hiddenInput.style.height = rect.height + 'px';
          }

          document.body.appendChild(hiddenInput);

          hiddenInput.onchange = () => {
            if (hiddenInput.value) {
              onChange(hiddenInput.value);
            }
            document.body.removeChild(hiddenInput);
          };

          hiddenInput.onblur = () => {
            setTimeout(() => {
              if (document.body.contains(hiddenInput)) {
                document.body.removeChild(hiddenInput);
              }
            }, 200);
          };

          setTimeout(() => {
            hiddenInput.showPicker?.();
          }, 0);
        }}
      />
    </div>
  );
};
