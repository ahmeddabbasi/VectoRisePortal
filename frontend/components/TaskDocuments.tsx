"use client";

import { useEffect, useState } from "react";
import { api, downloadAuthedFile, fetchAuthedBlob } from "@/lib/api";

type Preview = { url: string; name: string; type: string };

function canPreview(type: string, name: string) {
  const lower = name.toLowerCase();
  return type.startsWith("image/") || type === "application/pdf" || lower.endsWith(".pdf") || /\.(png|jpe?g|gif|webp)$/.test(lower);
}

export function TaskDocuments({ taskId, canUpload = true }: { taskId: number; canUpload?: boolean }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    api.taskDocuments(taskId).then(setDocs).catch(() => setDocs([]));
  }, [taskId]);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

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

  async function openPreview(doc: any) {
    setError(null);
    try {
      const blob = await fetchAuthedBlob(doc.download_path);
      const type = blob.type || doc.content_type || "";
      if (!canPreview(type, doc.original_name)) {
        setError("Preview is available for images and PDFs. Use download for this file.");
        return;
      }
      const url = URL.createObjectURL(blob);
      setPreview({ url, name: doc.original_name, type });
    } catch (err: any) {
      setError(err.message || "Could not open that file");
    }
  }

  const showPreview = preview && canPreview(preview.type, preview.name);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Documents</p>
      {canUpload ? (
        <>
          <label className="block text-sm">
            Add a file
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
          <p className="text-xs text-muted-foreground">PDF, Word, text, or an image. An admin is notified and can download it for 4 days. It is then removed.</p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Files stay available for 4 days, then they are removed.</p>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded yet.</p> : null}
      {docs.map((doc) => (
        <div key={doc.id} className="rounded-xl border border-[#0f1c2e]/10 px-3 py-2 text-sm">
          <p className="font-medium">{doc.original_name}</p>
          {doc.expires_at ? <p className="text-xs text-muted-foreground">Available until {new Date(doc.expires_at).toLocaleString()}</p> : null}
          <div className="mt-2 flex gap-3">
            <button type="button" className="text-brand" onClick={() => openPreview(doc)}>Preview</button>
            <button
              type="button"
              className="text-brand"
              onClick={() => downloadAuthedFile(doc.download_path, doc.original_name).catch(() => setError("Could not download that file"))}
            >
              Download
            </button>
          </div>
        </div>
      ))}
      {showPreview ? (
        <div className="overflow-hidden rounded-xl border border-[#0f1c2e]/10">
          {preview.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(preview.name) ? (
            <img src={preview.url} alt={preview.name} className="max-h-80 w-full object-contain" />
          ) : (
            <iframe title={preview.name} src={preview.url} className="h-80 w-full" />
          )}
        </div>
      ) : null}
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
          onClick={() => downloadAuthedFile(doc.download_path, doc.original_name).catch(() => setError("Could not download that file"))}
        >
          <span>
            <span className="block font-medium">{doc.original_name}</span>
            <span className="text-muted-foreground">{doc.employee_name} · {doc.task_title}</span>
            {doc.expires_at ? <span className="block text-xs text-muted-foreground">Deleted from the database on {new Date(doc.expires_at).toLocaleString()}</span> : null}
          </span>
          <span className="text-brand">Download</span>
        </button>
      ))}
    </div>
  );
}
