import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
// import { useDebounce } from '@/hooks/use-debounce';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface AsyncSelectProps<T> {
  /** Async function to fetch options */
  fetcher?: (query?: string) => void;
  /** Preload all data ahead of time */
  preload?: boolean;
  /** Function to filter options */
  filterFn?: (option: T, query: string) => boolean;
  /** Function to render each option */
  renderOption: (option: T) => React.ReactNode;
  /** Function to get the value from an option */
  getOptionValue: (option: T) => string;
  /** Function to get the display value for the selected option */
  getDisplayValue: (option: T) => React.ReactNode;
  /** Custom not found message */
  notFound?: React.ReactNode;
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode;
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Label for the select field */
  label: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Disable the entire select */
  disabled?: boolean;
  /** Custom width for the popover */
  width?: string | number;
  /** Custom height for the trigger button */
  height?: string | number;
  /** Custom class names */
  className?: string;
  /** Custom trigger button class names */
  triggerClassName?: string;
  /** Custom no results message */
  noResultsMessage?: string;
  /** Allow clearing the selection */
  clearable?: boolean;

  listData: T[];
}

export function AsyncSelect<T>({
  fetcher,
  preload,
  filterFn,
  renderOption,
  getOptionValue,
  getDisplayValue,
  notFound,
  loadingSkeleton,
  label,
  placeholder = 'Select...',
  value,
  onChange,
  disabled = false,
  width = '200px',
  height = '40px',
  className,
  triggerClassName,
  noResultsMessage,
  clearable = true,
  listData,
}: AsyncSelectProps<T>) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const [searchTerm] = useState('');
  const [originalOptions, setOriginalOptions] = useState<T[]>([]);

  useEffect(() => {
    setMounted(true);
    setSelectedValue(value);
    if (value === '') {
      setSelectedOption(null);
    }
  }, [value]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        if (fetcher) {
          await fetcher(searchTerm);
        }
        setOriginalOptions(listData);
        setOptions(listData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch options'
        );
      } finally {
        setLoading(false);
      }
    };

    if (!mounted) {
      fetchOptions();
    } else if (!preload) {
      fetchOptions();
    } else if (preload) {
      if (searchTerm) {
        setOptions(
          originalOptions.filter(option =>
            filterFn ? filterFn(option, searchTerm) : true
          )
        );
      } else {
        setOptions(originalOptions);
      }
    }
    // listData/originalOptions intentionally excluded: this effect sets
    // originalOptions from listData, so depending on either would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, searchTerm, mounted, preload, filterFn]);

  useEffect(() => {
    setSelectedOption(
      options?.find(option => getOptionValue(option) === selectedValue) || null
    );
    // getOptionValue is a caller-supplied prop, typically redefined every
    // render; depending on it would re-run this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selectedValue]);

  const handleSelect = useCallback(
    (currentValue: string) => {
      const newValue =
        clearable && currentValue === selectedValue ? '' : currentValue;
      setSelectedValue(newValue);
      setSelectedOption(
        options.find(option => getOptionValue(option) === newValue) || null
      );
      onChange(newValue);
      setOpen(false);
    },
    [selectedValue, onChange, clearable, options, getOptionValue]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger data-testid="open-select" asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'border-input focus:border-secondary h-9 justify-between px-2.5 py-2.5 !text-base shadow-xs placeholder:!text-base hover:bg-transparent hover:text-current',
            disabled && 'cursor-not-allowed opacity-50',
            triggerClassName
          )}
          style={{ width: width, height: height }}
          disabled={disabled}
        >
          <span
            className={cn(
              'truncate text-base placeholder:text-base',
              !selectedOption && 'text-muted-foreground'
            )}
          >
            {selectedOption ? getDisplayValue(selectedOption) : placeholder}
          </span>

          <ChevronsUpDown className="opacity-50" size={10} />
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: width }} className={cn('p-0', className)}>
        <Command>
          <div className="relative w-full">
            {/* <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              data-testid="search-list"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 rounded-b-none border-none pl-8 focus-visible:ring-0"
            />
            {loading && options?.length > 0 && (
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 transform items-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )} */}
          </div>
          <CommandList>
            {error && (
              <div className="text-destructive p-4 text-center">{error}</div>
            )}
            {loading &&
              options?.length === 0 &&
              (loadingSkeleton || <DefaultLoadingSkeleton />)}
            {!loading &&
              !error &&
              options?.length === 0 &&
              (notFound || (
                <CommandEmpty>
                  {noResultsMessage ?? `No ${label?.toLowerCase()} found.`}
                </CommandEmpty>
              ))}
            <CommandGroup>
              {options?.map(option => (
                <CommandItem
                  data-testid="select-option"
                  key={getOptionValue(option)}
                  value={getOptionValue(option)}
                  onSelect={handleSelect}
                >
                  {renderOption(option)}
                  <Check
                    className={cn(
                      'ml-auto h-3 w-3',
                      selectedValue === getOptionValue(option)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DefaultLoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map(i => (
        <CommandItem key={i} disabled>
          <div className="flex w-full items-center gap-2">
            <div className="bg-muted h-6 w-6 animate-pulse rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
            </div>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
