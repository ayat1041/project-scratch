'use client';

import dynamic from 'next/dynamic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import type { RolePermissionSummary } from '../../api/roles-api';
import type { RolesTableState } from './useRolesTable';

const AddAndEditRole = dynamic(() => import('../AddAndEditRole'));

interface RoleDialogsProps {
  tableState: RolesTableState;
  allPermissions: RolePermissionSummary[];
}

export default function RoleDialogs({ tableState, allPermissions }: RoleDialogsProps) {
  return (
    <>
      {tableState.editOpen && (
        <AddAndEditRole
          open={tableState.editOpen}
          onOpenChange={tableState.setEditOpen}
          allPermissions={allPermissions}
          role={tableState.editingRole}
        />
      )}

      <AlertDialog
        open={tableState.deletingRole !== null}
        onOpenChange={(open) => !open && tableState.setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              Any user currently assigned &ldquo;{tableState.deletingRole?.name}&rdquo; will lose the
              permissions it grants. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tableState.isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={tableState.isDeleting} onClick={() => tableState.handleDeleteOne()}>
              {tableState.isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
