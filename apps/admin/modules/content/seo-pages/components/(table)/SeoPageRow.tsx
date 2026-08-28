import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { TableCell, TableRow } from '@repo/ui/components/ui/table';
import type { SeoPageListItemResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
  none: 'outline',
};

interface SeoPageRowProps {
  page: SeoPageListItemResponseType;
  onDelete: (id: string) => void;
}

export const SeoPageRow = ({ page, onDelete }: SeoPageRowProps) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{page.path}</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[page.latestStatus]}>{page.latestStatus}</Badge>
      </TableCell>
      <TableCell>{new Date(page.updatedAt).toLocaleString()}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/content/seo-pages/${page.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(page.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

SeoPageRow.displayName = 'SeoPageRow';
