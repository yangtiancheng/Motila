import type {
  BaseRecord,
  CreateParams,
  CreateResponse,
  CrudFilter,
  DataProvider,
  DeleteOneParams,
  DeleteOneResponse,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  UpdateParams,
  UpdateResponse,
} from '@refinedev/core';

const API_BASE = '/api';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('motila_token');

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `请求失败: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function readFilter(filters: CrudFilter[] | undefined, field: string): string | undefined {
  if (!filters) return undefined;

  const found = filters.find(
    (filter): filter is Extract<CrudFilter, { field: string; value: unknown }> =>
      'field' in filter && filter.field === field,
  );

  if (!found || found.value == null) return undefined;
  return String(found.value);
}

export const motilaDataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ): Promise<GetListResponse<TData>> => {
    const query = new URLSearchParams();

    const page = params.pagination?.currentPage ?? 1;
    const pageSize = params.pagination?.pageSize ?? 10;
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));

    const keyword = readFilter(params.filters, 'keyword');
    const role = readFilter(params.filters, 'role');

    if (keyword) query.set('keyword', keyword);
    if (role) query.set('role', role);

    const response = await api<
      | { data: TData[]; total: number; page: number; pageSize: number }
      | TData[]
    >(`/${params.resource}?${query.toString()}`);

    if (Array.isArray(response)) {
      return { data: response, total: response.length };
    }

    return {
      data: response.data,
      total: response.total,
    };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams,
  ): Promise<GetOneResponse<TData>> => {
    const data = await api<TData>(`/${params.resource}/${params.id}`);
    return { data };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: CreateParams<TVariables>,
  ): Promise<CreateResponse<TData>> => {
    const data = await api<TData>(`/${params.resource}`, {
      method: 'POST',
      body: JSON.stringify(params.variables ?? {}),
    });
    return { data };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: UpdateParams<TVariables>,
  ): Promise<UpdateResponse<TData>> => {
    const data = await api<TData>(`/${params.resource}/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params.variables ?? {}),
    });
    return { data };
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>(
    params: DeleteOneParams<TVariables>,
  ): Promise<DeleteOneResponse<TData>> => {
    await api<{ success: boolean }>(`/${params.resource}/${params.id}`, {
      method: 'DELETE',
    });
    return { data: { id: params.id } as TData };
  },

  getApiUrl: () => API_BASE,
};
