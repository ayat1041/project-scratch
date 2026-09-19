import { Pagination, Empty } from '@repo/ui/components/common/table';
import { getAllPermissionsForRoleForm, getRolesList } from '../services/roles-service';
import RolesHeader from './(header)';
import RolesFilter from './(filter)';
import RolesTableSection from './(table)';

interface RolesPresenterProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RolesPresenter({ searchParams }: RolesPresenterProps) {
  const [{ data, pagination }, allPermissions] = await Promise.all([
    getRolesList(searchParams),
    getAllPermissionsForRoleForm(),
  ]);
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-6">
      <RolesHeader allPermissions={allPermissions} />
      <RolesFilter />

      <RolesTableSection data={data} allPermissions={allPermissions} />

      <Empty
        length={data.length}
        searchParams={searchParams}
        emptyMessage="No roles yet. Add one to get started."
        filteredMessage="No roles match your search."
      />

      <Pagination
        length={pagination.total > 0}
        pagination={{
          limit: pagination.limit,
          offset: pagination.offset,
          totalItems: pagination.total,
          totalPages,
        }}
      />
    </div>
  );
}
