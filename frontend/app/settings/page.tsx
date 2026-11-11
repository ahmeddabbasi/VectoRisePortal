"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [sync, setSync] = useState<any>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [listName, setListName] = useState("");
  const [owner, setOwner] = useState("");
  const [category, setCategory] = useState("");
  const [dataType, setDataType] = useState("lead_pipeline");
  const [preview, setPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [savingList, setSavingList] = useState(false);

  async function refresh() {
    const [sourceRows, status, count] = await Promise.all([
      api.sources(),
      api.syncStatus(),
      api.leadsCount().catch(() => ({ count: 0 })),
    ]);
    setSources(sourceRows);
    setSync(status);
    setLeadCount(count.count);
  }

  useEffect(() => {
    refresh().catch(() => {});
    api.employees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  async function loadColumns(sheetGid?: number) {
    setListMessage(null);
    const result = await api.previewSheet({
      spreadsheet_url: sheetUrl,
      data_type: dataType,
      ...(sheetGid ? { sheet_gid: sheetGid } : {}),
    });
    setPreview(result);
    const next: Record<string, string> = {};
    for (const row of result.suggestions || []) {
      if (row.suggested_header) next[row.field] = row.suggested_header;
    }
    setMapping(next);
    if (!listName) setListName(result.title || "");
  }

  async function saveList(event: React.FormEvent) {
    event.preventDefault();
    if (!preview) return;
    setSavingList(true);
    setListMessage(null);
    try {
      await api.createSource({
        name: listName,
        employee_name: owner,
        category,
        data_type: dataType,
        spreadsheet_id: preview.spreadsheet_id,
        sheet_gid: preview.sheet_gid,
        column_map: mapping,
      });
      setPreview(null);
      setMapping({});
      setSheetUrl("");
      setListName("");
      setListMessage("Sales list added. Run Sync now to pull it into the pipeline.");
      await refresh();
    } catch (err: any) {
      setListMessage(err.message || "Could not add that list");
    } finally {
      setSavingList(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setError(null);
    try {
      await api.syncNow();
      const finalStatus = await api.waitForSync();
      setSync(finalStatus);
      api.clearCache();
      await refresh();
      if (finalStatus.status === "failed") {
        setError(finalStatus.message || "Sync failed");
      }
    } catch (err: any) {
      setError(err.message || "Sync failed");
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="07 / Sources"
        title="Operational"
        accent="settings."
        description="Data sources, sync status, and operational notes."
        action={
          <button onClick={syncNow} disabled={syncing} className="btn-primary sheen">
            {syncing ? "Syncing in background..." : "Sync now"}
            <ArrowUpRight size={14} />
          </button>
        }
      />

      <div className="card p-5">
        <p className="chart-subtitle mb-1">Sync</p>
        <h3 className="chart-title mb-2">Status</h3>
        <p>Status: {sync?.status || "unknown"}</p>
        <p className="text-sm text-muted-foreground">
          Last sync: {sync?.last_sync_at ? new Date(sync.last_sync_at).toLocaleString() : "Never"}
        </p>
        <p className="text-sm text-muted-foreground">{sync?.message}</p>
        {typeof sync?.leads_upserted === "number" ? (
          <p className="text-sm text-muted-foreground">Leads imported this run: {sync.leads_upserted}</p>
        ) : null}
        {leadCount !== null ? (
          <p className="mt-2 text-sm font-medium text-ink">Leads currently in database: {leadCount}</p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {syncing ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Sync runs in the background so you can keep navigating. This page will update when it finishes.
          </p>
        ) : null}
      </div>

      <form onSubmit={saveList} className="card space-y-4 p-5">
        <div>
          <p className="chart-subtitle mb-1">Sales lists</p>
          <h3 className="chart-title">Add a sheet to the pipeline</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste the Google Sheet link. The system reads the header row and suggests which column matches each pipeline field. Accept the suggestion, pick another column, or leave a field unmapped.
          </p>
        </div>
        <input className="input" placeholder="Google Sheets link" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} required />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="List name" value={listName} onChange={(e) => setListName(e.target.value)} required />
          <input className="input" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
          <select className="input" value={owner} onChange={(e) => setOwner(e.target.value)} required>
            <option value="">Assigned employee</option>
            {employees.map((person) => <option key={person.id} value={person.name}>{person.name}</option>)}
          </select>
          <select className="input" value={dataType} onChange={(e) => { setDataType(e.target.value); setPreview(null); }}>
            <option value="lead_pipeline">Lead pipeline</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
        <button type="button" className="btn-secondary" onClick={() => loadColumns().catch((err) => setListMessage(err.message))}>Load columns</button>
        {preview ? (
          <div className="space-y-3">
            <label className="block text-sm">
              Sheet tab
              <select className="input mt-1" value={preview.sheet_gid} onChange={(e) => loadColumns(Number(e.target.value)).catch((err) => setListMessage(err.message))}>
                {(preview.tabs || []).map((tab: any) => <option key={tab.gid} value={tab.gid}>{tab.title}</option>)}
              </select>
            </label>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="px-3 py-2">System field</th>
                    <th className="px-3 py-2">Sheet column</th>
                    <th className="px-3 py-2">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.suggestions || []).map((row: any) => {
                    const chosen = mapping[row.field] || "";
                    const suggested = Boolean(chosen) && chosen === row.suggested_header && row.confidence !== "none";
                    const mark = !chosen ? "Needs a column" : suggested ? "Suggested" : "Set manually";
                    return (
                      <tr key={row.field} className="table-row">
                        <td className="px-3 py-2">
                          {row.label}
                          {row.required ? " *" : ""}
                          <span className="mt-1 block text-xs text-muted-foreground">Pipeline uses “{row.canonical}”</span>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="input"
                            value={chosen}
                            onChange={(e) => setMapping({ ...mapping, [row.field]: e.target.value })}
                          >
                            <option value="">Do not map</option>
                            {(preview.headers || []).map((header: string) => <option key={header} value={header}>{header}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <span className={mark === "Needs a column" && row.required ? "text-red-600" : "text-muted-foreground"}>{mark}</span>
                          {row.suggested_header ? <span className="mt-1 block text-xs text-muted-foreground">{row.suggested_header} maps to {row.label}</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Mapped stage and activity columns are what the pipeline uses after the next sync.</p>
            <button className="btn-primary" disabled={savingList} type="submit">{savingList ? "Saving..." : "Add sales list"}</button>
          </div>
        ) : null}
        {listMessage ? <p className="text-sm text-brand">{listMessage}</p> : null}
      </form>

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
    </div>
  );
}
