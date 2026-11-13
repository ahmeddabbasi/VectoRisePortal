import { getStoredAuth, getToken, storeAuth } from "@/lib/auth";
import { ApiError, type ViolationDetail } from "@/lib/violations";

export { ApiError };
export type { ViolationDetail };

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return null;
  return `${API_URL}${path}`;
}

const PROFILE_FILE = /^\d+_[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$/i;

export async function fetchAuthedMedia(path: string | null | undefined): Promise<string | null> {
  if (!path || path.startsWith("http")) return null;
  const name = path.split("/").pop()?.split("?")[0] || "";
  if (!PROFILE_FILE.test(name)) return null;
  const res = await fetch(`${API_URL}/api/media/profile/${name}`, { headers: authHeaders() });
  if (!res.ok) return null;
  return URL.createObjectURL(await res.blob());
}

export async function downloadAuthedFile(path: string, filename: string) {
  if (!path.startsWith("/api/media/tasks/")) return;
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not open that file");
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "document";
  link.click();
  URL.revokeObjectURL(url);
}

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

const STATIC_PATHS = ["/api/admin/departments", "/api/categories"];
const DASHBOARD_PATHS = ["/api/admin/dashboard", "/api/employee/dashboard"];
const LIVE_PATHS = ["/api/leads", "/api/sync"];

function cacheTtl(path: string): number {
  if (LIVE_PATHS.some((p) => path.startsWith(p))) return 5_000;
  if (STATIC_PATHS.some((p) => path.startsWith(p))) return 120_000;
  if (DASHBOARD_PATHS.some((p) => path.startsWith(p))) return 15_000;
  return 30_000;
}

type FetchOptions = {
  fresh?: boolean;
  timeoutMs?: number;
};

const INVALIDATION_MAP: Record<string, string[]> = {
  "/api/admin/employees": ["/api/admin/employees", "/api/admin/dashboard", "/api/hrm"],
  "/api/admin/departments": ["/api/admin/departments", "/api/admin/employees"],
  "/api/admin/settings": ["/api/admin/settings"],
  "/api/admin/evaluations": ["/api/admin/evaluations", "/api/admin/performance"],
  "/api/admin/announcements": ["/api/admin/announcements", "/api/chat/announcements", "/api/notifications"],
  "/api/hrm/tasks": ["/api/hrm/tasks", "/api/admin/dashboard", "/api/employee/tasks", "/api/hrm/reports"],
  "/api/hrm/attendance": ["/api/hrm/attendance", "/api/admin/dashboard"],
  "/api/hrm/exceptions": ["/api/hrm/exceptions", "/api/employee/exceptions"],
  "/api/hrm/schedules": ["/api/hrm/schedules", "/api/employee/schedule"],
  "/api/employee/attendance": ["/api/employee/attendance", "/api/employee/dashboard", "/api/hrm/attendance"],
  "/api/employee/profile": ["/api/employee/profile"],
  "/api/employee/tasks": ["/api/employee/tasks", "/api/hrm/tasks", "/api/employee/dashboard"],
  "/api/chat": ["/api/chat"],
  "/api/notifications": ["/api/notifications"],
  "/api/sync": [
    "/api/sync",
    "/api/leads",
    "/api/dashboard",
    "/api/categories",
    "/api/settings/sources",
    "/api/reports",
    "/api/admin/dashboard",
    "/api/employees",
  ],
};

function invalidateCache(path: string) {
  const prefixes = new Set<string>();
  for (const [key, targets] of Object.entries(INVALIDATION_MAP)) {
    if (path.startsWith(key)) targets.forEach((t) => prefixes.add(t));
  }
  if (!prefixes.size) prefixes.add(path.split("?")[0]);
  for (const key of [...responseCache.keys()]) {
    if ([...prefixes].some((p) => key.includes(p))) responseCache.delete(key);
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
  fetchOptions: FetchOptions = {},
): Promise<T> {
  const cacheKey = `${options.method || "GET"}:${path}`;
  if (!fetchOptions.fresh && (!options.method || options.method === "GET")) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.data as T;
    const pending = inflight.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const controller = new AbortController();
  const timeoutMs = fetchOptions.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const request = fetch(`${API_URL}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {}),
      ...options.headers,
    },
  })
    .then(async (res) => {
      clearTimeout(timeout);
      if (res.status === 401 && auth) {
        onUnauthorized?.();
        throw new Error("Session expired. Please sign in again.");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail;
        if (detail && typeof detail === "object" && !Array.isArray(detail) && "code" in detail) {
          const violation = detail as ViolationDetail;
          throw new ApiError(violation.message || violation.title, violation);
        }
        const message = typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
            : `API error ${res.status}: ${path}`;
        throw new Error(message || `API error ${res.status}: ${path}`);
      }
      if (res.status === 204) return {} as T;
      return res.json();
    })
    .then((data) => {
      if (!options.method || options.method === "GET") {
        responseCache.set(cacheKey, { expires: Date.now() + cacheTtl(path), data });
      }
      return data;
    })
    .catch((err) => {
      clearTimeout(timeout);
      if (err?.name === "AbortError") {
        throw new Error(`Cannot reach API at ${API_URL}. Is the backend running?`);
      }
      throw err;
    })
    .finally(() => inflight.delete(cacheKey));

  if (!options.method || options.method === "GET") inflight.set(cacheKey, request);
  return request as Promise<T>;
}

function post<T>(path: string, body?: unknown, timeoutMs?: number) {
  invalidateCache(path);
  return fetchJson<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, true, { timeoutMs });
}

function put<T>(path: string, body: unknown) {
  invalidateCache(path);
  return fetchJson<T>(path, { method: "PUT", body: JSON.stringify(body) });
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
  getCached<T>(path: string): T | null {
    const cached = responseCache.get(`GET:${path}`);
    if (cached && cached.expires > Date.now()) return cached.data as T;
    return null;
  },
  clearCache() {
    responseCache.clear();
  },
  paths,
  login: (email: string, password: string) =>
    fetchJson<{
      access_token: string;
      role: string;
      employee_id: number | null;
      name: string | null;
      email: string;
      sales_access?: boolean;
      can_review_tasks?: boolean;
    }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    ),
  changePassword: async (current_password: string, new_password: string) => {
    const result = await post<{ status: string; access_token: string }>("/api/auth/change-password", {
      current_password,
      new_password,
    });
    const auth = getStoredAuth();
    if (auth && result.access_token) storeAuth({ ...auth, token: result.access_token });
    return result;
  },
  me: () =>
    fetchJson<{
      id: number;
      email: string;
      role: string;
      employee_id: number | null;
      name: string | null;
      is_active: boolean;
      sales_access?: boolean;
      can_review_tasks?: boolean;
    }>("/api/auth/me"),

  adminDashboard: () => fetchJson<any>("/api/admin/dashboard"),
  adminEmployees: () => fetchJson<any[]>("/api/admin/employees"),
  createEmployee: (data: Record<string, unknown>) => post<any>("/api/admin/employees", data, 60_000),
  updateEmployee: (id: number, data: Record<string, unknown>) => put<any>(`/api/admin/employees/${id}`, data),
  deleteEmployee: (id: number) => {
    invalidateCache("/api/admin/employees");
    invalidateCache("/api/employees");
    invalidateCache("/api/hrm/tasks");
    invalidateCache("/api/leads");
    return fetchJson<{ status: string }>(`/api/admin/employees/${id}`, { method: "DELETE" });
  },
  adminDepartments: () => fetchJson<any[]>("/api/admin/departments"),
  createDepartment: (data: { name: string; description?: string }) => post<any>("/api/admin/departments", data),
  updateDepartment: (id: number, data: { name?: string; description?: string }) => put<any>(`/api/admin/departments/${id}`, data),
  deleteDepartment: (id: number) => {
    invalidateCache("/api/admin/departments");
    return fetchJson<any>(`/api/admin/departments/${id}`, { method: "DELETE" });
  },
  adminSettings: () => fetchJson<Record<string, string>>("/api/admin/settings"),
  updateSettings: (settings: Record<string, string>) => put<Record<string, string>>("/api/admin/settings", { settings }),
  auditLogs: () => fetchJson<any[]>("/api/admin/audit-logs"),
  adminAnnouncements: () => fetchJson<any[]>("/api/admin/announcements"),
  createAnnouncement: (data: { title: string; body: string }) => post<any>("/api/admin/announcements", data),
  createEvaluation: (data: Record<string, unknown>) => post<any>("/api/admin/evaluations", data),
  listEvaluations: () => fetchJson<any[]>("/api/admin/evaluations"),
  performanceScores: () => fetchJson<any[]>("/api/admin/performance/scores"),
  calculatePerformance: (employeeId: number) => post<any>(`/api/admin/performance/${employeeId}/calculate`),

  hrmAttendance: () => fetchJson<any>("/api/hrm/attendance/summary"),
  hrmAttendanceList: (params: Record<string, string> = {}) =>
    fetchJson<any[]>(`/api/hrm/attendance${qs(params)}`),
  correctAttendance: (id: number, data: Record<string, unknown>) => put<any>(`/api/hrm/attendance/${id}/correct`, data),
  hrmExceptions: (status?: string) => fetchJson<any[]>(`/api/hrm/exceptions${status ? `?status=${status}` : ""}`),
  resolveException: (id: number, data: { status: string; admin_response?: string }) =>
    post<any>(`/api/hrm/exceptions/${id}/resolve`, data),
  hrmTasks: () => fetchJson<any[]>("/api/hrm/tasks"),
  createTask: (data: Record<string, unknown>) => post<any>("/api/hrm/tasks", data),
  approveTask: (id: number) => post<any>(`/api/hrm/tasks/${id}/approve`),
  rejectTask: (id: number, reason?: string) => post<any>(`/api/hrm/tasks/${id}/reject`, { reason }),
  updateTask: (id: number, data: Record<string, unknown>) => put<any>(`/api/hrm/tasks/${id}`, data),
  hrmSchedules: (params: Record<string, string> = {}) => fetchJson<any[]>(`/api/hrm/schedules${qs(params)}`),
  lockSchedules: () => post<{ locked_count: number }>("/api/hrm/schedules/lock"),
  scheduleChanges: (status?: string) =>
    fetchJson<any[]>(`/api/hrm/schedule-changes${status ? `?status=${status}` : ""}`),
  reviewScheduleChange: (id: number, data: { status: string; admin_response?: string }) =>
    post<any>(`/api/hrm/schedule-changes/${id}/review`, data),
  hrmReports: () => fetchJson<any>("/api/hrm/reports"),
  runDailyJobs: () => post<any>("/api/hrm/jobs/daily"),

  employeeDashboard: () => fetchJson<any>("/api/employee/dashboard"),
  employeeProfile: () => fetchJson<any>("/api/employee/profile"),
  updateProfile: (data: Record<string, unknown>) => put<any>("/api/employee/profile", data),
  uploadProfilePhoto: async (file: File) => {
    invalidateCache("/api/employee/profile");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/employee/profile/photo`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (res.status === 401) {
      onUnauthorized?.();
      throw new Error("Session expired. Please sign in again.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json() as Promise<{ profile_photo_url: string }>;
  },
  employeeTasks: () => fetchJson<any[]>("/api/employee/tasks"),
  taskDocuments: (taskId: number) => fetchJson<any[]>(`/api/employee/tasks/${taskId}/documents`),
  uploadTaskDocument: async (taskId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/api/employee/tasks/${taskId}/documents`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (res.status === 401) {
      onUnauthorized?.();
      throw new Error("Session expired. Please sign in again.");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.detail === "string" ? err.detail : "Upload failed");
    }
    return res.json();
  },
  reviewDocuments: () => fetchJson<any[]>("/api/employee/reviews/documents"),
  adminTaskDocuments: () => fetchJson<any[]>("/api/admin/task-documents"),
  adminErrors: () => fetchJson<any[]>("/api/admin/errors"),
  createEmployeeTask: (data: Record<string, unknown>) => post<any>("/api/employee/tasks", data),
  updateEmployeeTask: (id: number, data: Record<string, unknown>) => put<any>(`/api/employee/tasks/${id}`, data),
  toggleChecklist: (taskId: number, itemId: number, completed: boolean) =>
    post<any>(`/api/employee/tasks/${taskId}/checklist/${itemId}/toggle?completed=${completed}`),
  startTimer: (taskId: number) => post<any>(`/api/employee/tasks/${taskId}/timer/start`),
  stopTimer: (logId: number) => post<any>(`/api/employee/tasks/timer/${logId}/stop`),
  employeeAttendance: () => fetchJson<any[]>("/api/employee/attendance"),
  checkIn: () => post<any>("/api/employee/attendance/check-in"),
  checkOut: () => post<any>("/api/employee/attendance/check-out"),
  getSchedule: (week_start: string) => fetchJson<any[]>(`/api/employee/schedule?week_start=${week_start}`),
  submitSchedule: (data: Record<string, unknown>) => post<any>("/api/employee/schedule/submit", data),
  requestScheduleChange: (data: Record<string, unknown>) => post<any>("/api/employee/schedule/change-request", data),
  employeeExceptions: () => fetchJson<any[]>("/api/employee/exceptions"),
  explainException: (id: number, explanation: string) =>
    post<any>(`/api/employee/exceptions/${id}/explain`, { explanation }),
  notifications: () => fetchJson<any[]>("/api/notifications?days=3"),
  notificationUnreadCount: () => fetchJson<{ count: number }>("/api/notifications/unread-count?days=3"),
  markNotificationRead: (id: number) => post<any>(`/api/notifications/${id}/read`),
  employeeNotifications: () => fetchJson<any[]>("/api/notifications?days=3"),
  employeePerformance: () => fetchJson<any>("/api/employee/performance"),

  chatUnreadCount: () => fetchJson<{ count: number }>("/api/chat/unread-count"),
  chatAnnouncements: () => fetchJson<any[]>("/api/chat/announcements"),
  chatConversations: () => fetchJson<any[]>("/api/chat/conversations"),
  chatUsers: () => fetchJson<any[]>("/api/chat/users"),
  startDirectChat: (data: { employee_id?: number; user_id?: number }) => post<{ id: number }>("/api/chat/conversations/direct", data),
  chatMessages: (conversationId: number) => fetchJson<any[]>(`/api/chat/conversations/${conversationId}/messages`),
  sendChatMessage: (conversationId: number, body: string) =>
    post<{ id: number; created_at: string }>(`/api/chat/conversations/${conversationId}/messages`, { body }),

  overview: (filters: Filters) => fetchJson<any>(paths.overview(filters)),
  activity: (filters: Filters) => fetchJson<{ series: any[] }>(paths.activity(filters)),
  pipeline: (filters: Filters) => fetchJson<any>(paths.pipeline(filters)),
  conversion: (filters: Filters) => fetchJson<any>(paths.conversion(filters)),
  employees: () => fetchJson<any[]>("/api/employees"),
  summary: (filters: Filters = {}) => fetchJson<any>(paths.summary(filters)),
  categories: () => fetchJson<{ categories: string[] }>(paths.categories()),
  leads: (filters: Filters, fresh = false) => fetchJson<any[]>(paths.leads(filters), {}, true, { fresh }),
  leadsCount: () => fetchJson<{ count: number }>("/api/leads/count", {}, true, { fresh: true }),
  lead: (id: number) => fetchJson<any>(paths.lead(id)),
  sources: () => fetchJson<any[]>(paths.sources()),
  previewSheet: (data: { spreadsheet_url: string; data_type: string; sheet_gid?: number }) =>
    post<any>("/api/settings/sources/preview", data),
  createSource: (data: Record<string, unknown>) => post<any>("/api/settings/sources", data),
  syncStatus: () => fetchJson<any>(paths.syncStatus()),
  syncNow: () => post<any>("/api/sync"),
  waitForSync: async (timeoutMs = 180000) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const status = await fetchJson<any>(paths.syncStatus(), {}, true, { fresh: true });
      if (!["running", "started", "queued"].includes(status.status)) return status;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Sync is taking longer than expected. Check Sync Settings for status.");
  },
  targets: () => fetchJson<any[]>(paths.targets()),
  prefetchRoute(href: string) {
    const routes: Record<string, string[]> = {
      "/admin/sales/leads": [paths.leads({}), paths.categories()],
      "/admin/sales/settings": [paths.sources(), paths.syncStatus()],
      "/admin/sales/pipeline": [paths.pipeline({})],
      "/admin/sales/activity": [paths.activity({ period: DEFAULT_PERIOD })],
      "/admin/sales/analytics": [paths.conversion({}), paths.summary({ period: DEFAULT_PERIOD })],
      "/admin/sales": [paths.overview({ period: DEFAULT_PERIOD })],
      "/admin/dashboard": ["/api/admin/dashboard"],
      "/admin/employees": ["/api/admin/employees", "/api/admin/departments"],
      "/admin/departments": ["/api/admin/departments"],
      "/admin/attendance": ["/api/hrm/attendance/summary", "/api/hrm/attendance"],
      "/admin/schedules": ["/api/hrm/schedule-changes", "/api/hrm/schedules"],
      "/admin/tasks": ["/api/hrm/tasks", "/api/admin/employees"],
      "/admin/exceptions": ["/api/hrm/exceptions"],
      "/admin/reports": ["/api/hrm/reports", "/api/admin/performance/scores"],
      "/admin/evaluations": ["/api/admin/evaluations", "/api/admin/performance/scores"],
      "/admin/announcements": ["/api/admin/announcements"],
      "/admin/settings": ["/api/admin/settings"],
      "/admin/audit": ["/api/admin/audit-logs"],
      "/admin/notifications": ["/api/notifications?days=3"],
      "/admin/chat": ["/api/chat/conversations", "/api/chat/users", "/api/chat/announcements"],
      "/employee/dashboard": ["/api/employee/dashboard"],
      "/employee/attendance": ["/api/employee/attendance"],
      "/employee/schedule": ["/api/employee/schedule"],
      "/employee/tasks": ["/api/employee/tasks"],
      "/employee/performance": ["/api/employee/performance"],
      "/employee/exceptions": ["/api/employee/exceptions"],
      "/employee/notifications": ["/api/notifications?days=3"],
      "/employee/profile": ["/api/employee/profile"],
      "/employee/chat": ["/api/chat/conversations", "/api/chat/users", "/api/chat/announcements"],
    };
    const match = Object.entries(routes)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([prefix]) => href === prefix || href.startsWith(`${prefix}/`));
    match?.[1].forEach(prefetch);
  },
};
