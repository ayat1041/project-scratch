'use client';

import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import React from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  className = '',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const values = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const newValues = [...values];
    newValues[index] = val;
    onChange(newValues.join(''));
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index]) {
        const newValues = [...values];
        newValues[index] = '';
        onChange(newValues.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;
    const newValues = Array.from({ length }, (_, i) => pastedData[i] || '');
    onChange(newValues.join(''));
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={`mx-auto flex w-fit gap-[3px] md:gap-1.5 ${className}`}>
      {values.map((val, index) => (
        <input
          key={val}
          ref={el => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          placeholder="0"
          className="border-input text-foreground focus:border-primary h-[47px] w-[47px] rounded-full border-[.49px] text-center text-4xl font-medium transition-colors focus:outline-none md:h-16 md:w-16 md:border-[.67px]"
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default PinInput;
