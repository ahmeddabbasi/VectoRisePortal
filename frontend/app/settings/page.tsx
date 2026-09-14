"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [sync, setSync] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.sources().then(setSources).catch(() => setSources([]));
    api.syncStatus().then(setSync).catch(() => setSync(null));
  }, []);

  async function syncNow() {
    setSyncing(true);
    try {
      const result = await api.syncNow();
      setSync(result);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Data sources, sync status, and operational notes."
        action={
          <button onClick={syncNow} disabled={syncing} className="btn-primary">
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        }
      />

      <div className="card p-4">
        <h3 className="chart-title mb-2">Sync Status</h3>
        <p>Status: {sync?.status || "unknown"}</p>
        <p className="text-sm text-[var(--muted)]">
          Last sync: {sync?.last_sync_at ? new Date(sync.last_sync_at).toLocaleString() : "Never"}
        </p>
        <p className="text-sm text-[var(--muted)]">{sync?.message}</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              {["Source", "Employee", "Category", "GID", "Type", "Last Sync", "Status"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="table-row">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.employee_name}</td>
                <td className="px-4 py-3">{s.category}</td>
                <td className="px-4 py-3">{s.sheet_gid}</td>
                <td className="px-4 py-3">{s.data_type}</td>
                <td className="px-4 py-3">{s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{s.last_sync_status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 text-sm text-[var(--muted)]">
        <p className="mt-2 font-medium text-[var(--text)]">Date entry policy</p>
        <p className="mt-2">
          Dates before 1 Sep 2026 were backfilled in Google Sheets for dashboard testing.
          Enter real dates for all new activity from 1 Sep 2026 onward.
        </p>
      </div>
    </div>
  );
}
