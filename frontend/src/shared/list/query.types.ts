export type QueryFieldType = 'input' | 'select';

export type QueryOption = {
  label: string;
  value: string;
};

export type QueryField<TValues extends Record<string, unknown>> = {
  name: keyof TValues;
  label?: string;
  type: QueryFieldType;
  placeholder?: string;
  options?: QueryOption[];
  width?: number;
};

export type PaginationState = {
  page: number;
  pageSize: number;
};

export function buildListQuery(
  pagination: PaginationState,
  filters: Record<string, unknown>,
): string {
  const params = new URLSearchParams();
  params.set('page', String(pagination.page));
  params.set('pageSize', String(pagination.pageSize));

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    params.set(key, String(value));
  });

  return params.toString();
}
