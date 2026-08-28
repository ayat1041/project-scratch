'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PermissionRecord } from '../../api/permissions-api';
import { handleBulkDeletePermissions, handleDeletePermission } from '../../handlers/permissions.handlers';

export function usePermissionsTable(data: PermissionRecord[]) {
  const router = useRouter();

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Dialog states
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<PermissionRecord | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allIds = data.map((permission) => permission.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const openEdit = (permission: PermissionRecord) => {
    setEditingPermission(permission);
    setEditOpen(true);
  };

  // Handlers
  const handleDeleteOne = async (): Promise<boolean> => {
    if (!deletingPermission) return false;
    setIsDeleting(true);
    try {
      await handleDeletePermission(deletingPermission.id);
      setDeletingPermission(null);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (): Promise<boolean> => {
    setIsBulkDeleting(true);
    try {
      await handleBulkDeletePermissions([...selectedIds]);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    // State
    selectedIds,
    setSelectedIds,
    isAllSelected,
    handleSelectAll,
    handleSelectRow,

    // Dialog states
    editingPermission,
    editOpen,
    setEditOpen,
    openEdit,
    deletingPermission,
    setDeletingPermission,

    // Handlers
    isDeleting,
    isBulkDeleting,
    handleDeleteOne,
    handleBulkDelete,
  };
}

export type PermissionsTableState = ReturnType<typeof usePermissionsTable>;
