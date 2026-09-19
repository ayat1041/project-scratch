'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleRecord } from '../../api/roles-api';
import { handleDeleteRole } from '../../handlers/roles.handlers';

export function useRolesTable() {
  const router = useRouter();

  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openEdit = (role: RoleRecord) => {
    setEditingRole(role);
    setEditOpen(true);
  };

  const handleDeleteOne = async (): Promise<boolean> => {
    if (!deletingRole) return false;
    setIsDeleting(true);
    try {
      await handleDeleteRole(deletingRole.id);
      setDeletingRole(null);
      router.refresh();
      return true;
    } catch {
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    editingRole,
    editOpen,
    setEditOpen,
    openEdit,
    deletingRole,
    setDeletingRole,
    isDeleting,
    handleDeleteOne,
  };
}

export type RolesTableState = ReturnType<typeof useRolesTable>;
