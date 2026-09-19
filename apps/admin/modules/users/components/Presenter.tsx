import { Pagination, Empty } from '@repo/ui/components/common/table';
import { getAllRolesForUserForm, getUsersList } from '../services/users-service';
import UsersHeader from './(header)';
import UsersFilter from './(filter)';
import UsersTableSection from './(table)';

interface UsersPresenterProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersPresenter({ searchParams }: UsersPresenterProps) {
  const [{ data, pagination, counts }, allRoles] = await Promise.all([
    getUsersList(searchParams),
    getAllRolesForUserForm(),
  ]);

  return (
    <div className="space-y-6">
      <UsersHeader allRoles={allRoles} />
      <UsersFilter statusSummary={counts.statusSummary} />

      <UsersTableSection data={data} />

      <Empty
        length={data.length}
        searchParams={searchParams}
        emptyMessage="No users yet. Add one to get started."
        filteredMessage="No users match your search or filters."
      />

      <Pagination
        length={pagination.totalItems > 0}
        pagination={pagination}
      />
    </div>
  );
}
