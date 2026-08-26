export const generateHateoasLinksForCollection = ({
  baseUrl,
  offset,
  limit,
  totalCount,
  search,
}: {
  baseUrl: string;
  offset: number;
  limit: number;
  totalCount: number;
  search?: string;
}) => {
  const queryString = (offset: number) =>
    `?offset=${offset}&limit=${limit}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }`;

  return {
    self: {
      href: `${baseUrl}${queryString(offset)}`,
    },
    next:
      offset + limit < totalCount
        ? {
            href: `${baseUrl}${queryString(offset + limit)}`,
          }
        : null,
    previous:
      offset > 0
        ? {
            href: `${baseUrl}${queryString(Math.max(0, offset - limit))}`,
          }
        : null,
    collection: {
      href: baseUrl,
    },
  };
};

export const generateHateoasLinksForSingleRecord = ({
  baseUrl,
  id,
}: {
  baseUrl: string;
  id: number;
}) => {
  return {
    self: {
      href: `${baseUrl}/${id}`,
    },

    collection: {
      href: baseUrl,
    },
  };
};
