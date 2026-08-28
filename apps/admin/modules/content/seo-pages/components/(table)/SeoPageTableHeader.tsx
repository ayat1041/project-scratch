import { TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';

export const SeoPageTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Path</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Updated</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

SeoPageTableHeader.displayName = 'SeoPageTableHeader';
