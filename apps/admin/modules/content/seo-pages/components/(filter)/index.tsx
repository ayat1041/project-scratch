import { Filter } from '@repo/ui/components/common/table';

export const SeoPagesFilter = () => {
  return (
    <Filter
      fields={[
        {
          type: 'search',
          key: 'search',
          placeholder: 'Search by path...',
          debounceMs: 400,
        },
      ]}
    />
  );
};

SeoPagesFilter.displayName = 'SeoPagesFilter';
