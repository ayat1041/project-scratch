'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent } from '@repo/ui/components/ui/card';
import { Label } from '@repo/ui/components/ui/label';
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
import type { UserDetailResponseType } from '@repo/schemas-types/payload-schemas/admin/users/response.schema';
import type { RoleForUserForm } from '../../api/users-api';
import { handleUpdateUserRoles, handleUpdateUserStatus } from '../../handlers/users.handlers';
import RoleMultiSelect from './RoleMultiSelect';

interface EditUserFormProps {
  user: UserDetailResponseType;
  allRoles: RoleForUserForm[];
}

export default function EditUserForm({ user, allRoles }: EditUserFormProps) {
  const router = useRouter();
  const [roleIds, setRoleIds] = useState<number[]>(user.roles.map((role) => role.id));
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [confirmingStatusChange, setConfirmingStatusChange] = useState(false);

  const rolesChanged =
    roleIds.length !== user.roles.length || !user.roles.every((role) => roleIds.includes(role.id));

  const onSaveRoles = async () => {
    setIsSavingRoles(true);
    try {
      await handleUpdateUserRoles(user.id, roleIds);
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsSavingRoles(false);
    }
  };

  const onConfirmStatusChange = async () => {
    setIsTogglingStatus(true);
    try {
      await handleUpdateUserStatus(user.id, !user.isDeleted);
      setConfirmingStatusChange(false);
      router.refresh();
    } catch {
      // handler already surfaced a toast
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{user.email}</p>
              <p className="text-sm text-muted-foreground">@{user.userName}</p>
            </div>
            <div className="flex items-center gap-2">
              {user.isDeleted ? (
                <Badge variant="destructive">Deactivated</Badge>
              ) : user.isVerified ? (
                <Badge>Active</Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
              <Button
                type="button"
                variant={user.isDeleted ? 'default' : 'destructive'}
                size="sm"
                onClick={() => setConfirmingStatusChange(true)}
              >
                {user.isDeleted ? 'Activate' : 'Deactivate'}
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Origin</dt>
              <dd>{user.userOrigin}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registered</dt>
              <dd>{new Date(user.registeredAt).toLocaleString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <Label>Roles</Label>
          <RoleMultiSelect allRoles={allRoles} initialRoleIds={roleIds} onChange={setRoleIds} />
          <Button type="button" onClick={onSaveRoles} disabled={!rolesChanged || isSavingRoles}>
            {isSavingRoles ? 'Saving...' : 'Save roles'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmingStatusChange} onOpenChange={setConfirmingStatusChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isDeleted ? 'Activate this user?' : 'Deactivate this user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isDeleted
                ? 'They will be able to sign in again.'
                : 'They will immediately lose the ability to sign in.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isTogglingStatus} onClick={() => onConfirmStatusChange()}>
              {isTogglingStatus ? 'Saving...' : user.isDeleted ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
