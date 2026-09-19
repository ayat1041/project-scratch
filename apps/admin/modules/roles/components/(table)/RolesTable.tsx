import { Lock, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/components/ui/table';
import { TableHeaderRow, type TableHeaderItem } from '@repo/ui/components/common/table';
import type { RoleRecord } from '../../api/roles-api';
import { ROLE_TABLE } from '../../utils/testids';
import type { RolesTableState } from './useRolesTable';

interface RolesTableProps {
  data: RoleRecord[];
  tableState: RolesTableState;
}

const headerItems: TableHeaderItem[] = [
  { label: 'Name' },
  { label: 'Description' },
  { label: 'Permissions' },
  { label: 'Actions', className: 'w-24 text-right' },
];

export default function RolesTable({ data, tableState }: RolesTableProps) {
  return (
    <Table>
      <TableHeaderRow items={headerItems} />
      <TableBody>
        {data.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {role.name}
                {role.isSystemRole && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    System
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{role.description || '—'}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => tableState.openEdit(role)}
                data-testid={`${ROLE_TABLE.EDIT_BUTTON_PREFIX}-${role.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={role.isSystemRole}
                title={role.isSystemRole ? 'System roles cannot be deleted' : undefined}
                onClick={() => tableState.setDeletingRole(role)}
                data-testid={`${ROLE_TABLE.DELETE_BUTTON_PREFIX}-${role.id}`}
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
