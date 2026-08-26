'use client';
import React from 'react';
import { Button } from '@repo/ui/components/ui/button';

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  disabled?: boolean;
  loading?: boolean;
  testId?: string;
}

export interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  className?: string;
}

/**
 * Generic BulkActionBar component for table bulk operations
 *
 * @example
 * ```tsx
 * <BulkActionBar
 *   selectedCount={5}
 *   actions={[
 *     {
 *       label: 'Submit for review',
 *       icon: <Send className="mr-2 h-4 w-4" />,
 *       onClick: handleSubmit,
 *       loading: isSubmitting
 *     },
 *     {
 *       label: 'Delete',
 *       icon: <Trash2 className="mr-2 h-4 w-4" />,
 *       onClick: handleDelete,
 *       variant: 'destructive',
 *       loading: isDeleting
 *     }
 *   ]}
 * />
 * ```
 */
export default function BulkActionBar({
  selectedCount,
  actions,
  className = '',
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`bg-muted flex items-center gap-4 rounded-lg p-3 ${className}`}
    >
      <span className="text-sm font-medium">
        {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
      </span>
      {actions.map((action, index) => (
        <Button
          key={index}
          size="sm"
          variant={action.variant || 'default'}
          disabled={action.disabled || action.loading}
          onClick={action.onClick}
          data-testid={action.testId}
        >
          {action.icon}
          {action.loading ? 'Loading...' : action.label}
        </Button>
      ))}
    </div>
  );
}
