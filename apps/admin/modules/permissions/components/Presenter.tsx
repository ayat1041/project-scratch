import { Pagination, Empty } from '@repo/ui/components/common/table';
import { getPermissionsList } from '../services/permissions-service';
import PermissionsHeader from './(header)';
import PermissionsFilter from './(filter)';
import PermissionsTableSection from './(table)';

interface PermissionsPresenterProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PermissionsPresenter({ searchParams }: PermissionsPresenterProps) {
  const { data, pagination } = await getPermissionsList(searchParams);
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-6">
      <PermissionsHeader />
      <PermissionsFilter />

      <PermissionsTableSection data={data} />

      <Empty
        length={data.length}
        searchParams={searchParams}
        emptyMessage="No permissions yet. Add one to get started."
        filteredMessage="No permissions match your search."
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
