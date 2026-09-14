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

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const api = {
  overview: (filters: Filters) =>
    fetchJson<any>(`/api/dashboard/overview${qs({ period: filters.period, employee: filters.employee, category: filters.category })}`),
  activity: (filters: Filters) =>
    fetchJson<{ series: any[] }>(`/api/dashboard/activity${qs({ period: filters.period, employee: filters.employee, category: filters.category })}`),
  pipeline: (filters: Filters) =>
    fetchJson<any>(`/api/dashboard/pipeline${qs({ employee: filters.employee, category: filters.category })}`),
  conversion: (filters: Filters) =>
    fetchJson<any>(`/api/dashboard/conversion${qs({ employee: filters.employee, category: filters.category })}`),
  employees: () => fetchJson<any[]>(`/api/employees`),
  employeePerformance: (period = DEFAULT_PERIOD) =>
    fetchJson<any[]>(`/api/reports/summary${qs({ period })}`).then((r: any) => r.employees),
  categories: () => fetchJson<{ categories: string[] }>(`/api/categories`),
  leads: (filters: Filters) =>
    fetchJson<any[]>(
      `/api/leads${qs({ search: filters.search, employee: filters.employee, category: filters.category, stage: filters.stage })}`
    ),
  lead: (id: number) => fetchJson<any>(`/api/leads/${id}`),
  sources: () => fetchJson<any[]>(`/api/settings/sources`),
  syncStatus: () => fetchJson<any>(`/api/sync/status`),
  syncNow: () =>
    fetch(`${API_URL}/api/sync`, { method: "POST" }).then((r) => r.json()),
  targets: () => fetchJson<any[]>(`/api/settings/targets`),
};
