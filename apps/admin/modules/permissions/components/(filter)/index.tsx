import { Filter } from '@repo/ui/components/common/table';
import { PERMISSION_FILTER } from '../../utils/testids';

export default function PermissionsFilter() {
  return (
    <Filter
      fields={[
        {
          type: 'search',
          key: 'search',
          placeholder: 'Search permissions...',
          debounceMs: 400,
          testId: PERMISSION_FILTER.SEARCH_INPUT,
        },
      ]}
    />
  );
}
