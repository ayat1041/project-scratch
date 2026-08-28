'use client';

import { useRouter } from 'next/navigation';
import { GenericForm } from '@repo/ui/components/form/GenericForm';
import { TextField } from '@repo/ui/components/form/fields/TextField';
import { SelectField } from '@repo/ui/components/form/fields/SelectField';
import { SubmitButton } from '@repo/ui/components/form/fields/SubmitButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { CreateUserFormSchema, type CreateUserFormValues } from '../validations/create-user.schema';
import type { RoleForUserForm } from '../api/users-api';
import { handleCreateUser } from '../handlers/users.handlers';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allRoles: RoleForUserForm[];
}

export default function CreateUserDialog({ open, onOpenChange, allRoles }: CreateUserDialogProps) {
  const router = useRouter();

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      await handleCreateUser({
        email: values.email,
        name: values.name,
        password: values.password,
        roleIds: [Number(values.roleId)],
      });
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
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <GenericForm
          schema={CreateUserFormSchema}
          initialValues={{ email: '', name: '', password: '' }}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <TextField<CreateUserFormValues> name="name" label="Name" required />
          <TextField<CreateUserFormValues> name="email" label="Email" type="email" required />
          <TextField<CreateUserFormValues> name="password" label="Password" type="password" required />
          <SelectField<CreateUserFormValues>
            name="roleId"
            label="Role"
            placeholder="Select a role"
            options={allRoles.map((role) => ({ value: String(role.id), text: role.name }))}
            required
          />
          <SubmitButton label="Create user" loadingLabel="Creating..." />
        </GenericForm>
      </DialogContent>
    </Dialog>
  );
}
