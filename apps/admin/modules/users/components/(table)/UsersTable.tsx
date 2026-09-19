import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/components/ui/table';
import { TableHeaderRow, type TableHeaderItem } from '@repo/ui/components/common/table';
import type { UserListItemResponseType } from '@repo/schemas-types/payload-schemas/admin/users/response.schema';
import { USER_TABLE } from '../../utils/testids';
import type { UsersTableState } from './useUsersTable';

interface UsersTableProps {
  data: UserListItemResponseType[];
  tableState: UsersTableState;
}

const statusBadge = (user: UserListItemResponseType) => {
  if (user.isDeleted) return <Badge variant="destructive">Deactivated</Badge>;
  if (!user.isVerified) return <Badge variant="outline">Unverified</Badge>;
  return <Badge>Active</Badge>;
};

export default function UsersTable({ data, tableState }: UsersTableProps) {
  const headerItems: TableHeaderItem[] = [
    {
      className: 'w-10',
      showCheckbox: true,
      checked: tableState.isAllSelected,
      onCheckedChange: tableState.handleSelectAll,
      disabled: data.length === 0,
      ariaLabel: 'Select all users',
      testId: USER_TABLE.SELECT_ALL_CHECKBOX,
    },
    { label: 'Email' },
    { label: 'Username' },
    { label: 'Roles' },
    { label: 'Status' },
    { label: 'Registered' },
    { label: 'Actions', className: 'w-16 text-right' },
  ];

  return (
    <Table>
      <TableHeaderRow items={headerItems} />
      <TableBody>
        {data.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Checkbox
                checked={tableState.selectedIds.has(user.id)}
                onCheckedChange={(checked) => tableState.handleSelectRow(user.id, Boolean(checked))}
                data-testid={`${USER_TABLE.ROW_CHECKBOX_PREFIX}-${user.id}`}
                aria-label={`Select ${user.email}`}
              />
            </TableCell>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell className="text-muted-foreground">{user.userName}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </TableCell>
            <TableCell>{statusBadge(user)}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(user.registeredAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/dashboard/users/${user.id}`} data-testid={`${USER_TABLE.EDIT_LINK_PREFIX}-${user.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
