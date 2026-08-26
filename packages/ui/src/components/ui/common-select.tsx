'use client';

import React, { useEffect, useState } from 'react';

import { AsyncSelect } from './async-select';

interface CommonSelectProps<T> {
  fetcher?: (query?: string) => void;
  getOptionValue: (item: T) => string;
  getDisplayValue: (item: T) => React.ReactNode;
  renderOption: (item: T) => React.ReactNode;
  label: string;
  placeholder?: string;
  notFound?: React.ReactNode;
  width?: string;
  height?: string | number;
  setChosenValue?: (value: string) => void;
  listData: T[];
  selectedValueProp?: string;
  disabled?: boolean;
}

// Basic Demo
function CommonSelect<T>({
  fetcher,
  getOptionValue,
  getDisplayValue,
  renderOption,
  label,
  placeholder = 'Select...',
  notFound,
  width = '375px',
  height = '40px',
  setChosenValue = () => {},
  listData,
  selectedValueProp = '',
  disabled = false,
}: CommonSelectProps<T>) {
  const [selectedValue, setSelectedValue] = useState(selectedValueProp);

  useEffect(() => {
    setChosenValue(selectedValue);
    // setChosenValue is a caller-supplied callback (default is a fresh no-op
    // each render); depending on it would fire this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue]);

  useEffect(() => {
    setSelectedValue(selectedValueProp);
  }, [selectedValueProp]);

  return (
    <div className="flex flex-col gap-2">
      <AsyncSelect<T>
        {...(fetcher && { fetcher })}
        renderOption={renderOption}
        getOptionValue={getOptionValue}
        getDisplayValue={getDisplayValue}
        notFound={notFound}
        label={label}
        placeholder={placeholder}
        value={selectedValue}
        onChange={setSelectedValue}
        width={width}
        height={height}
        listData={listData}
        disabled={disabled}
        clearable={true}
      />
    </div>
  );
}

export { CommonSelect };
