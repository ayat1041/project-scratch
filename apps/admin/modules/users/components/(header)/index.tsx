'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import type { RoleForUserForm } from '../../api/users-api';
import { USER_HEADER } from '../../utils/testids';

const CreateUserDialog = dynamic(() => import('../CreateUserDialog'));

interface UsersHeaderProps {
  allRoles: RoleForUserForm[];
}

export default function UsersHeader({ allRoles }: UsersHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage platform users and accounts</p>
      </div>
      <Button type="button" onClick={() => setOpen(true)} data-testid={USER_HEADER.ADD_BUTTON}>
        <Plus className="h-4 w-4" />
        Add user
      </Button>
      {open && <CreateUserDialog open={open} onOpenChange={setOpen} allRoles={allRoles} />}
    </div>
  );
}
