import { Filter } from '@repo/ui/components/common/table';
import { ROLE_FILTER } from '../../utils/testids';

export default function RolesFilter() {
  return (
    <Filter
      fields={[
        {
          type: 'search',
          key: 'search',
          placeholder: 'Search roles...',
          debounceMs: 400,
          testId: ROLE_FILTER.SEARCH_INPUT,
        },
      ]}
    />
  );
}
