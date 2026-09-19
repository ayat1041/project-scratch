'use client';

import type { RolePermissionSummary, RoleRecord } from '../../api/roles-api';
import { useRolesTable } from './useRolesTable';
import RolesTable from './RolesTable';
import RoleDialogs from './RoleDialogs';

interface RolesTableSectionProps {
  data: RoleRecord[];
  allPermissions: RolePermissionSummary[];
}

export default function RolesTableSection({ data, allPermissions }: RolesTableSectionProps) {
  const tableState = useRolesTable();

  return (
    <>
      <RolesTable data={data} tableState={tableState} />
      <RoleDialogs tableState={tableState} allPermissions={allPermissions} />
    </>
  );
}
