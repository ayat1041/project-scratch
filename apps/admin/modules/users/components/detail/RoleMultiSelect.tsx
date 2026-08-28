'use client';

import { useState } from 'react';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Label } from '@repo/ui/components/ui/label';
import type { RoleForUserForm } from '../../api/users-api';

interface RoleMultiSelectProps {
  allRoles: RoleForUserForm[];
  initialRoleIds: number[];
  onChange: (roleIds: number[]) => void;
}

export default function RoleMultiSelect({ allRoles, initialRoleIds, onChange }: RoleMultiSelectProps) {
  const [selected, setSelected] = useState<number[]>(initialRoleIds);

  const toggle = (id: number, checked: boolean) => {
    const next = checked ? [...selected, id] : selected.filter((roleId) => roleId !== id);
    setSelected(next);
    onChange(next);
  };

  if (allRoles.length === 0) {
    return <p className="text-sm text-muted-foreground">No roles exist yet.</p>;
  }

  return (
    <div className="space-y-1.5 rounded-md border p-4">
      {allRoles.map((role) => (
        <div key={role.id} className="flex items-center gap-2">
          <Checkbox
            id={`role-${role.id}`}
            checked={selected.includes(role.id)}
            onCheckedChange={(checked) => toggle(role.id, Boolean(checked))}
          />
          <Label htmlFor={`role-${role.id}`} className="cursor-pointer font-normal">
            {role.name}
          </Label>
        </div>
      ))}
    </div>
  );
}
