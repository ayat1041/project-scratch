'use client';

import { useFormContext } from 'react-hook-form';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Label } from '@repo/ui/components/ui/label';
import type { AdminCreateRolePayloadValidationSchemaType } from '@repo/schemas-types/payload-schemas/admin/roles/payload.schema';
import type { RolePermissionSummary } from '../api/roles-api';

interface PermissionCheckboxGroupsProps {
  allPermissions: RolePermissionSummary[];
}

const groupByDomain = (permissions: RolePermissionSummary[]) => {
  const groups = new Map<string, RolePermissionSummary[]>();
  for (const permission of permissions) {
    const domain = permission.name.includes(':') ? permission.name.split(':')[0]! : 'other';
    const group = groups.get(domain) ?? [];
    group.push(permission);
    groups.set(domain, group);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
};

export default function PermissionCheckboxGroups({ allPermissions }: PermissionCheckboxGroupsProps) {
  const { watch, setValue } = useFormContext<AdminCreateRolePayloadValidationSchemaType>();
  const selected = watch('permissions') ?? [];
  const groups = groupByDomain(allPermissions);

  const toggle = (id: number, checked: boolean) => {
    const next = checked ? [...selected, id] : selected.filter((permissionId) => permissionId !== id);
    setValue('permissions', next, { shouldDirty: true, shouldValidate: true });
  };

  if (allPermissions.length === 0) {
    return <p className="text-sm text-muted-foreground">No permissions exist yet.</p>;
  }

  return (
    <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border p-4">
      {groups.map(([domain, permissions]) => (
        <div key={domain} className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{domain}</p>
          <div className="space-y-1.5">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center gap-2">
                <Checkbox
                  id={`permission-${permission.id}`}
                  checked={selected.includes(permission.id)}
                  onCheckedChange={(checked) => toggle(permission.id, Boolean(checked))}
                />
                <Label htmlFor={`permission-${permission.id}`} className="cursor-pointer font-mono text-sm font-normal">
                  {permission.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
