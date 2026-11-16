export function percent(rate: number | null | undefined) {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return "N/A";
  return `${(rate * 100).toFixed(1)}%`;
}

export function days(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)} days`;
}

export function rating(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return value.toFixed(1);
}

export function when(iso: string | null | undefined) {
  if (!iso) return { label: "No activity yet", exact: "" };
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return { label: "No activity yet", exact: "" };
  const abs = Math.abs(Math.round((Date.now() - date.getTime()) / 1000));
  const label = abs < 60 ? "just now" : abs < 3600 ? `${Math.round(abs / 60)} minutes ago` : abs < 86400 ? `${Math.round(abs / 3600)} hours ago` : `${Math.round(abs / 86400)} days ago`;
  return { label, exact: `${date.toISOString().replace("T", " ").slice(0, 16)} UTC` };
}

export function queryString(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}
