"use client";

import { useEffect, useState } from "react";
import { api, downloadAuthedFile } from "@/lib/api";

export function TaskDocuments({ taskId }: { taskId: number }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.taskDocuments(taskId).then(setDocs).catch(() => setDocs([]));
  }, [taskId]);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.uploadTaskDocument(taskId, file);
      setDocs((rows) => [saved, ...rows]);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2 border-t border-[#0f1c2e]/10 pt-4">
      <label className="block text-sm font-medium">
        Documents for review
        <input
          className="mt-2 block w-full text-sm"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,application/pdf"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
      </label>
      <p className="text-xs text-muted-foreground">PDF, Word, text, or an image. Reviewers and admins can open these files.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {docs.map((doc) => (
        <button
          key={doc.id}
          type="button"
          className="block text-sm text-brand"
          onClick={() => downloadAuthedFile(doc.download_path, doc.original_name).catch(() => setError("Could not open that file"))}
        >
          {doc.original_name}
        </button>
      ))}
    </div>
  );
}

export function DocumentList({ rows }: { rows: any[] }) {
  const [error, setError] = useState<string | null>(null);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.map((doc) => (
        <button
          key={doc.id}
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#0f1c2e]/10 px-4 py-3 text-left text-sm"
          onClick={() => downloadAuthedFile(doc.download_path, doc.original_name).catch(() => setError("Could not open that file"))}
        >
          <span>
            <span className="block font-medium">{doc.original_name}</span>
            <span className="text-muted-foreground">{doc.employee_name} · {doc.task_title}</span>
          </span>
          <span className="text-brand">Open</span>
        </button>
      ))}
    </div>
  );
}
