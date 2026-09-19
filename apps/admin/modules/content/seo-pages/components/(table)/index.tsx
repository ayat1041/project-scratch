'use client';

import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Card } from '@repo/ui/components/ui/card';
import { Table } from '@repo/ui/components/ui/table';
import type { SeoPageListItemResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';
import { useSeoPagesTable } from './useSeoPagesTable';
import { SeoPageTableHeader } from './SeoPageTableHeader';
import { SeoPageTableContent } from './SeoPageTableContent';

const CreateSeoPageDialog = dynamic(() => import('../CreateSeoPageDialog'));
const DeleteSeoPageDialog = dynamic(() => import('../DeleteSeoPageDialog'));

interface SeoPagesTableProps {
  pages: SeoPageListItemResponseType[];
}

export const SeoPagesTable = ({ pages }: SeoPagesTableProps) => {
  const tableState = useSeoPagesTable();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={tableState.openCreate}>
          <Plus className="h-4 w-4" />
          Add page
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <SeoPageTableHeader />
          <SeoPageTableContent pages={pages} onDelete={tableState.openDelete} />
        </Table>
      </Card>

      <CreateSeoPageDialog
        open={tableState.isCreateOpen}
        isSubmitting={tableState.isSubmitting}
        onClose={tableState.closeCreate}
        onCreate={tableState.createPage}
      />
      <DeleteSeoPageDialog
        open={tableState.deletingPageId !== null}
        isSubmitting={tableState.isSubmitting}
        onClose={tableState.closeDelete}
        onConfirm={tableState.deletePage}
      />
    </div>
  );
};

SeoPagesTable.displayName = 'SeoPagesTable';
