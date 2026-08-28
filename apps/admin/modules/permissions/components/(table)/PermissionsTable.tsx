import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/components/ui/table';
import { TableHeaderRow, type TableHeaderItem } from '@repo/ui/components/common/table';
import type { PermissionRecord } from '../../api/permissions-api';
import { PERMISSION_TABLE } from '../../utils/testids';
import type { PermissionsTableState } from './usePermissionsTable';

interface PermissionsTableProps {
  data: PermissionRecord[];
  tableState: PermissionsTableState;
}

export default function PermissionsTable({ data, tableState }: PermissionsTableProps) {
  const headerItems: TableHeaderItem[] = [
    {
      className: 'w-10',
      showCheckbox: true,
      checked: tableState.isAllSelected,
      onCheckedChange: tableState.handleSelectAll,
      disabled: data.length === 0,
      ariaLabel: 'Select all permissions',
      testId: PERMISSION_TABLE.SELECT_ALL_CHECKBOX,
    },
    { label: 'Name' },
    { label: 'Description' },
    { label: 'Used by' },
    { label: 'Actions', className: 'w-24 text-right' },
  ];

  return (
    <Table>
      <TableHeaderRow items={headerItems} />
      <TableBody>
        {data.map((permission) => (
          <TableRow key={permission.id}>
            <TableCell>
              <Checkbox
                checked={tableState.selectedIds.has(permission.id)}
                onCheckedChange={(checked) => tableState.handleSelectRow(permission.id, Boolean(checked))}
                data-testid={`${PERMISSION_TABLE.ROW_CHECKBOX_PREFIX}-${permission.id}`}
                aria-label={`Select ${permission.name}`}
              />
            </TableCell>
            <TableCell className="font-mono text-sm">{permission.name}</TableCell>
            <TableCell className="text-muted-foreground">{permission.description || '—'}</TableCell>
            <TableCell>
              <Badge variant={permission.roleCount > 0 ? 'secondary' : 'outline'}>
                {permission.roleCount} role{permission.roleCount === 1 ? '' : 's'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => tableState.openEdit(permission)}
                data-testid={`${PERMISSION_TABLE.EDIT_BUTTON_PREFIX}-${permission.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => tableState.setDeletingPermission(permission)}
                data-testid={`${PERMISSION_TABLE.DELETE_BUTTON_PREFIX}-${permission.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
