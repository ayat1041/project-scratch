import { Filter } from '@repo/ui/components/common/table';
import type { UserStatusSummaryItem } from '../../api/users-api';
import { USER_FILTER } from '../../utils/testids';

interface UsersFilterProps {
  statusSummary: UserStatusSummaryItem[];
}

export default function UsersFilter({ statusSummary }: UsersFilterProps) {
  return (
    <Filter
      fields={[
        {
          type: 'search',
          key: 'search',
          placeholder: 'Search by email or username...',
          debounceMs: 400,
          testId: USER_FILTER.SEARCH_INPUT,
        },
        {
          type: 'select',
          key: 'status',
          placeholder: 'Status',
          options: statusSummary,
          defaultValue: 'all',
          testId: USER_FILTER.STATUS_TRIGGER,
        },
      ]}
    />
  );
}
