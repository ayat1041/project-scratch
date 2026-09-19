'use client';

import { useRouter } from 'next/navigation';
import { GenericForm } from '@repo/ui/components/form/GenericForm';
import { TextField } from '@repo/ui/components/form/fields/TextField';
import { TextareaField } from '@repo/ui/components/form/fields/TextareaField';
import { SubmitButton } from '@repo/ui/components/form/fields/SubmitButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { FormLabel } from '@repo/ui/components/ui/form';
import {
  AdminCreateRolePayloadValidationSchema,
  type AdminCreateRolePayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import type { RolePermissionSummary, RoleRecord } from '../api/roles-api';
import { handleCreateRole, handleUpdateRole } from '../handlers/roles.handlers';
import PermissionCheckboxGroups from './PermissionCheckboxGroups';

interface AddAndEditRoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allPermissions: RolePermissionSummary[];
  role?: RoleRecord | null;
}

export default function AddAndEditRole({ open, onOpenChange, allPermissions, role }: AddAndEditRoleProps) {
  const router = useRouter();
  const isEditing = Boolean(role);

  const onSubmit = async (values: AdminCreateRolePayloadValidationSchemaType) => {
    try {
      if (role) {
        await handleUpdateRole(role.id, values);
      } else {
        await handleCreateRole(values);
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      // handler already surfaced a toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit role' : 'Add role'}</DialogTitle>
        </DialogHeader>
        <GenericForm
          key={role?.id ?? 'new'}
          schema={AdminCreateRolePayloadValidationSchema}
          initialValues={{
            name: role?.name ?? '',
            description: role?.description ?? '',
            permissions: role?.permissions.map((permission) => permission.id) ?? [],
          }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <TextField<AdminCreateRolePayloadValidationSchemaType>
            name="name"
            label="Name"
            placeholder="content-editor"
            required
            disabled={role?.isSystemRole}
          />
          <TextareaField<AdminCreateRolePayloadValidationSchemaType>
            name="description"
            label="Description"
          />
          <div className="space-y-2">
            <FormLabel>Permissions</FormLabel>
            <PermissionCheckboxGroups allPermissions={allPermissions} />
          </div>
          <SubmitButton label={isEditing ? 'Save changes' : 'Create role'} loadingLabel="Saving..." />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
