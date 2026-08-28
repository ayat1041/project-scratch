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
import {
  AdminCreatePermissionPayloadValidationSchema,
  type AdminCreatePermissionPayloadValidationSchemaType,
} from '@repo/schemas-types/payload-schemas/admin/permissions/payload.schema';
import type { PermissionRecord } from '../api/permissions-api';
import { handleCreatePermission, handleUpdatePermission } from '../handlers/permissions.handlers';

interface AddAndEditPermissionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: PermissionRecord | null;
}

export default function AddAndEditPermission({ open, onOpenChange, permission }: AddAndEditPermissionProps) {
  const router = useRouter();
  const isEditing = Boolean(permission);

  const onSubmit = async (values: AdminCreatePermissionPayloadValidationSchemaType) => {
    try {
      if (permission) {
        await handleUpdatePermission(permission.id, values);
      } else {
        await handleCreatePermission(values);
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      // handler already surfaced a toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit permission' : 'Add permission'}</DialogTitle>
        </DialogHeader>
        <GenericForm
          key={permission?.id ?? 'new'}
          schema={AdminCreatePermissionPayloadValidationSchema}
          initialValues={{ name: permission?.name ?? '', description: permission?.description ?? '' }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <TextField<AdminCreatePermissionPayloadValidationSchemaType>
            name="name"
            label="Name"
            placeholder="content:read_seo_page"
            required
          />
          <TextareaField<AdminCreatePermissionPayloadValidationSchemaType>
            name="description"
            label="Description"
          />
          <SubmitButton label={isEditing ? 'Save changes' : 'Create permission'} loadingLabel="Saving..." />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
