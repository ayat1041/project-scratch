'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import type { RolePermissionSummary } from '../../api/roles-api';
import { ROLE_HEADER } from '../../utils/testids';

const AddAndEditRole = dynamic(() => import('../AddAndEditRole'));

interface RolesHeaderProps {
  allPermissions: RolePermissionSummary[];
}

export default function RolesHeader({ allPermissions }: RolesHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground">Manage roles and the permissions each one grants</p>
      </div>
      <Button type="button" onClick={() => setOpen(true)} data-testid={ROLE_HEADER.ADD_BUTTON}>
        <Plus className="h-4 w-4" />
        Add role
      </Button>
      {open && <AddAndEditRole open={open} onOpenChange={setOpen} allPermissions={allPermissions} />}
    </div>
  );
}
