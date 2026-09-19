'use client';

import { Ban, Check } from 'lucide-react';
import { BulkActionBar } from '@repo/ui/components/common/table';
import type { UserListItemResponseType } from '@repo/schemas-types/payload-schemas/admin/users/response.schema';
import { USER_BULK_ACTIONS } from '../../utils/testids';
import { useUsersTable } from './useUsersTable';
import UsersTable from './UsersTable';

interface UsersTableSectionProps {
  data: UserListItemResponseType[];
}

export default function UsersTableSection({ data }: UsersTableSectionProps) {
  const tableState = useUsersTable(data);
  const selectedIds = [...tableState.selectedIds];

  const bulkActions = [
    {
      label: 'Activate',
      icon: <Check className="mr-2 h-4 w-4" />,
      testId: USER_BULK_ACTIONS.ACTIVATE_BUTTON,
      loading: tableState.isActivating,
      disabled: tableState.isActivating || tableState.isDeactivating,
      onClick: async () => {
        const success = await tableState.handleBulkActivate(selectedIds);
        if (success) tableState.setSelectedIds(new Set());
      },
    },
    {
      label: 'Deactivate',
      icon: <Ban className="mr-2 h-4 w-4" />,
      variant: 'destructive' as const,
      testId: USER_BULK_ACTIONS.DEACTIVATE_BUTTON,
      loading: tableState.isDeactivating,
      disabled: tableState.isActivating || tableState.isDeactivating,
      onClick: async () => {
        const success = await tableState.handleBulkDeactivate(selectedIds);
        if (success) tableState.setSelectedIds(new Set());
      },
    },
  ];

  return (
    <>
      <BulkActionBar selectedCount={tableState.selectedIds.size} actions={bulkActions} />
      <UsersTable data={data} tableState={tableState} />
    </>
  );
}
