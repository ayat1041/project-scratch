import { Pagination, Empty } from '@repo/ui/components/common/table';
import { getSeoPagesList } from '../services';
import { SeoPagesFilter } from './(filter)';
import { SeoPagesTable } from './(table)';

interface SeoPagesPresenterProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SeoPagesPresenter({ searchParams }: SeoPagesPresenterProps) {
  const { data, pagination } = await getSeoPagesList(searchParams);
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="space-y-6">
      <SeoPagesFilter />

      <SeoPagesTable pages={data} />

      <Empty
        length={data.length}
        searchParams={searchParams}
        emptyMessage="No page overrides yet. Add one to get started."
        filteredMessage="No pages match your search."
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
