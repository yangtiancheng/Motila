import { useState } from 'react';

export function useListState<TFilters extends Record<string, unknown>>(initialFilters: TFilters) {
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const applyFilters = (nextFilters: TFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  return {
    filters,
    page,
    pageSize,
    setPage,
    setPageSize,
    applyFilters,
  };
}
