'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

interface CreateSeoPageDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (path: string) => Promise<boolean>;
}

export default function CreateSeoPageDialog({
  open,
  isSubmitting,
  onClose,
  onCreate,
}: CreateSeoPageDialogProps) {
  const [path, setPath] = useState('');

  const handleSubmit = async () => {
    const success = await onCreate(path.startsWith('/') ? path : `/${path}`);
    if (success) setPath('');
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a page override</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="seo-page-path">Path</Label>
          <Input
            id="seo-page-path"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="/pricing"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !path.trim()} type="button">
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
