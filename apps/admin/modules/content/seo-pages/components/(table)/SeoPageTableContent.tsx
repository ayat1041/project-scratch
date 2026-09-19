import { TableBody } from '@repo/ui/components/ui/table';
import type { SeoPageListItemResponseType } from '@repo/schemas-types/payload-schemas/content/seo-pages/response.schema';
import { SeoPageRow } from './SeoPageRow';

interface SeoPageTableContentProps {
  pages: SeoPageListItemResponseType[];
  onDelete: (id: string) => void;
}

export const SeoPageTableContent = ({ pages, onDelete }: SeoPageTableContentProps) => {
  return (
    <TableBody>
      {pages.map((page) => (
        <SeoPageRow key={page.id} page={page} onDelete={onDelete} />
      ))}
    </TableBody>
  );
};

SeoPageTableContent.displayName = 'SeoPageTableContent';
