'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserListItemResponseType } from '@repo/schemas-types/payload-schemas/admin/users/response.schema';
import { handleBulkUpdateUserStatus } from '../../handlers/users.handlers';

export function useUsersTable(data: UserListItemResponseType[]) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const allIds = data.map((user) => user.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkActivate = async (ids: string[]): Promise<boolean> => {
    setIsActivating(true);
    try {
      await handleBulkUpdateUserStatus(ids, false);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsActivating(false);
    }
  };

  const handleBulkDeactivate = async (ids: string[]): Promise<boolean> => {
    setIsDeactivating(true);
    try {
      await handleBulkUpdateUserStatus(ids, true);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsDeactivating(false);
    }
  };

  return {
    selectedIds,
    setSelectedIds,
    isAllSelected,
    handleSelectAll,
    handleSelectRow,
    isActivating,
    isDeactivating,
    handleBulkActivate,
    handleBulkDeactivate,
  };
}

export type UsersTableState = ReturnType<typeof useUsersTable>;
