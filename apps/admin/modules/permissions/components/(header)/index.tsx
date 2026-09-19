'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { PERMISSION_HEADER } from '../../utils/testids';

const AddAndEditPermission = dynamic(() => import('../AddAndEditPermission'));

export default function PermissionsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground">
          Fine-grained permission strings assigned to roles
        </p>
      </div>
      <Button type="button" onClick={() => setOpen(true)} data-testid={PERMISSION_HEADER.ADD_BUTTON}>
        <Plus className="h-4 w-4" />
        Add permission
      </Button>
      {open && <AddAndEditPermission open={open} onOpenChange={setOpen} />}
    </div>
  );
}
