"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/InlineSkeleton";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function AdminAnnouncementsPage() {
  const { data: history, loading, setData } = useCachedQuery(
    "/api/admin/announcements",
    () => api.adminAnnouncements(),
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const result = await api.createAnnouncement({ title, body });
      setMessage(`Announcement sent to ${result.recipient_count ?? "all"} employees.`);
      setTitle("");
      setBody("");
      setData(await api.adminAnnouncements());
    } catch (err: any) {
      setError(err.message || "Failed to send announcement");
    } finally {
      setSending(false);
    }
  }

  const rows = history ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Announcements"
        description="Broadcast a message to every employee. It appears in their notifications inbox and in Chat → Announcements."
      />

      <form onSubmit={send} className="card space-y-4 p-6">
        <h2 className="font-display text-lg">New announcement</h2>
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={255}
        />
        <textarea
          className="input min-h-32 w-full"
          placeholder="Message for all employees..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={5000}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-brand">{message}</p> : null}
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? "Sending..." : "Send to all employees"}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="font-display text-lg">Sent announcements</h2>
        {!history && loading ? <TableSkeleton rows={4} /> : null}
        {rows.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">No announcements sent yet.</p>
        ) : null}
        {rows.map((item) => (
          <div key={item.id} className="card border-l-4 border-l-amber-400 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-display text-lg">{item.title}</p>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Announcement
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p>
            <p className="mt-3 font-mono-custom text-[10px] text-muted-foreground">
              {item.created_by_name || "Admin"} · {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
