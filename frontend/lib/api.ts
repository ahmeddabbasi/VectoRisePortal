const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const DEFAULT_PERIOD = "last_month";

export { DEFAULT_PERIOD };
export type Filters = {
  period?: string;
  employee?: string;
  category?: string;
  stage?: string;
  search?: string;
};

function qs(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== "all") query.set(k, v);
  });
  const s = query.toString();
  return s ? `?${s}` : "";
}

const responseCache = new Map<string, { expires: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 20_000;

function getCached<T>(path: string): T | null {
  const cached = responseCache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  return null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const cached = responseCache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const pending = inflight.get(path);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fetch(`${API_URL}${path}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
      const data = await res.json();
      responseCache.set(path, { expires: Date.now() + CACHE_TTL_MS, data });
      return data;
    })
    .finally(() => {
      inflight.delete(path);
    });

  inflight.set(path, request);
  return request as Promise<T>;
}

function prefetch(path: string) {
  void fetchJson(path).catch(() => {});
}

export const paths = {
  categories: () => "/api/categories",
  overview: (filters: Filters = {}) =>
    `/api/dashboard/overview${qs({ period: filters.period, employee: filters.employee, category: filters.category })}`,
  activity: (filters: Filters = {}) =>
    `/api/dashboard/activity${qs({ period: filters.period, employee: filters.employee, category: filters.category })}`,
  pipeline: (filters: Filters = {}) =>
    `/api/dashboard/pipeline${qs({ employee: filters.employee, category: filters.category })}`,
  conversion: (filters: Filters = {}) =>
    `/api/dashboard/conversion${qs({ employee: filters.employee, category: filters.category })}`,
  summary: (filters: Filters = {}) =>
    `/api/reports/summary${qs({ period: filters.period, employee: filters.employee, category: filters.category })}`,
  leads: (filters: Filters = {}) =>
    `/api/leads${qs({ search: filters.search, employee: filters.employee, category: filters.category, stage: filters.stage })}`,
  sources: () => "/api/settings/sources",
  syncStatus: () => "/api/sync/status",
  targets: () => "/api/settings/targets",
  lead: (id: number) => `/api/leads/${id}`,
};

export const api = {
  getCached,
  paths,
  overview: (filters: Filters) => fetchJson<any>(paths.overview(filters)),
  activity: (filters: Filters) => fetchJson<{ series: any[] }>(paths.activity(filters)),
  pipeline: (filters: Filters) => fetchJson<any>(paths.pipeline(filters)),
  conversion: (filters: Filters) => fetchJson<any>(paths.conversion(filters)),
  employees: () => fetchJson<any[]>(`/api/employees`),
  employeePerformance: (period = DEFAULT_PERIOD) =>
    fetchJson<any>(paths.summary({ period })).then((r: any) => r.employees),
  summary: (filters: Filters = {}) => fetchJson<any>(paths.summary(filters)),
  categories: () => fetchJson<{ categories: string[] }>(paths.categories()),
  leads: (filters: Filters) => fetchJson<any[]>(paths.leads(filters)),
  lead: (id: number) => fetchJson<any>(paths.lead(id)),
  sources: () => fetchJson<any[]>(paths.sources()),
  syncStatus: () => fetchJson<any>(paths.syncStatus()),
  syncNow: () =>
    fetch(`${API_URL}/api/sync`, { method: "POST" }).then((r) => {
      responseCache.clear();
      return r.json();
    }),
  prefetchRoute(href: string) {
    const defaults: Filters = { period: DEFAULT_PERIOD, employee: "all", category: "all" };
    if (href === "/") {
      prefetch(paths.overview(defaults));
      prefetch(paths.activity(defaults));
      prefetch(paths.pipeline(defaults));
      prefetch(paths.summary(defaults));
      prefetch(paths.categories());
      return;
    }
    if (href === "/leads") {
      prefetch(paths.leads());
      prefetch(paths.categories());
      return;
    }
    if (href === "/employees") {
      prefetch(paths.summary(defaults));
      prefetch(paths.targets());
      prefetch(paths.categories());
      return;
    }
    if (href === "/pipeline") {
      prefetch(paths.pipeline(defaults));
      prefetch(paths.categories());
      return;
    }
    if (href === "/activity") {
      prefetch(paths.activity(defaults));
      prefetch(paths.categories());
      return;
    }
    if (href === "/analytics") {
      prefetch(paths.conversion(defaults));
      prefetch(paths.summary(defaults));
      prefetch(paths.categories());
      return;
    }
    if (href === "/settings") {
      prefetch(paths.sources());
      prefetch(paths.syncStatus());
    }
  },
  targets: () => fetchJson<any[]>(paths.targets()),
};
