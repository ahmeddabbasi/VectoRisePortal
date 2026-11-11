export type AuthUser = {
  email: string;
  role: "admin" | "employee";
  employee_id: number | null;
  name: string | null;
  token: string;
  sales_access: boolean;
  can_review_tasks: boolean;
};

const STORAGE_KEY = "vectorise_auth";

export function getStoredAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuth(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getToken(): string | null {
  return getStoredAuth()?.token ?? null;
}

export function getHomeRoute(role: string) {
  return role === "admin" ? "/admin/dashboard" : "/employee/dashboard";
}
