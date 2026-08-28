'use client';

import { Trash2 } from 'lucide-react';
import { BulkActionBar } from '@repo/ui/components/common/table';
import type { PermissionRecord } from '../../api/permissions-api';
import { PERMISSION_BULK_ACTIONS } from '../../utils/testids';
import { usePermissionsTable } from './usePermissionsTable';
import PermissionsTable from './PermissionsTable';
import PermissionDialogs from './PermissionDialogs';

interface PermissionsTableSectionProps {
  data: PermissionRecord[];
}

export default function PermissionsTableSection({ data }: PermissionsTableSectionProps) {
  const tableState = usePermissionsTable(data);

  const bulkActions = [
    {
      label: 'Delete',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      variant: 'destructive' as const,
      testId: PERMISSION_BULK_ACTIONS.DELETE_BUTTON,
      loading: tableState.isBulkDeleting,
      disabled: tableState.isBulkDeleting,
      onClick: async () => {
        const success = await tableState.handleBulkDelete();
        if (success) tableState.setSelectedIds(new Set());
      },
    },
  ];

  return (
    <>
      <BulkActionBar selectedCount={tableState.selectedIds.size} actions={bulkActions} />
      <PermissionsTable data={data} tableState={tableState} />
      <PermissionDialogs tableState={tableState} />
    </>
  );
}
