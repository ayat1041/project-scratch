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
import type { PermissionsTableState } from './usePermissionsTable';

const AddAndEditPermission = dynamic(() => import('../AddAndEditPermission'));

interface PermissionDialogsProps {
  tableState: PermissionsTableState;
}

export default function PermissionDialogs({ tableState }: PermissionDialogsProps) {
  return (
    <>
      {tableState.editOpen && (
        <AddAndEditPermission
          open={tableState.editOpen}
          onOpenChange={tableState.setEditOpen}
          permission={tableState.editingPermission}
        />
      )}

      <AlertDialog
        open={tableState.deletingPermission !== null}
        onOpenChange={(open) => !open && tableState.setDeletingPermission(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this permission?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{tableState.deletingPermission?.name}&rdquo; from every role that
              currently has it. This cannot be undone.
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
