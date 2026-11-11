"use client";

import { ArrowLeft, Megaphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

type View = "announcements" | "chat";

export function ChatPanel({ eyebrow }: { eyebrow: string }) {
  const [view, setView] = useState<View>("announcements");
  const [mobileContent, setMobileContent] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    setConversations(await api.chatConversations());
  }

  async function loadAnnouncements() {
    setAnnouncements(await api.chatAnnouncements());
  }

  useEffect(() => {
    Promise.all([api.chatConversations(), api.chatUsers(), api.chatAnnouncements()]).then(([convs, chatUsers, anns]) => {
      setConversations(convs);
      setUsers(chatUsers);
      setAnnouncements(anns);
    });
  }, []);

  useEffect(() => {
    if (view !== "chat" || !activeId) return;
    const refresh = () => {
      Promise.all([api.chatMessages(activeId), api.chatConversations()]).then(([msgs, convs]) => {
        setMessages(msgs);
        setConversations(convs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
    };
    refresh();
    const interval = setInterval(() => {
      if (document.hidden) return;
      refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeId, view]);

  async function startChat(userId: number) {
    const res = await api.startDirectChat({ user_id: userId });
    await loadConversations();
    setView("chat");
    setActiveId(res.id);
    setMobileContent(true);
  }

  async function send() {
    if (!activeId || !draft.trim()) return;
    setLoading(true);
    try {
      await api.sendChatMessage(activeId, draft.trim());
      setDraft("");
      setMessages(await api.chatMessages(activeId));
      await loadConversations();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } finally {
      setLoading(false);
    }
  }

  const active = conversations.find((c) => c.id === activeId);
  const showMobileList = !mobileContent;
  const showMobileContent = mobileContent;

  function openAnnouncements() {
    setView("announcements");
    setActiveId(null);
    setMobileContent(true);
  }

  function openChat(id: number) {
    setView("chat");
    setActiveId(id);
    setMobileContent(true);
  }

  function backToList() {
    setMobileContent(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title="Messages" description="Company announcements and direct messages." />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className={`card flex max-h-[min(70vh,32rem)] flex-col overflow-hidden lg:max-h-[70vh] ${showMobileList ? "flex" : "hidden lg:flex"}`}>
          <button
            type="button"
            onClick={openAnnouncements}
            className={`m-2 flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition ${view === "announcements" ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "hover:bg-ink/5"}`}
          >
            <Megaphone size={16} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Announcements</p>
              <p className="truncate text-xs opacity-70">Updates from admin</p>
            </div>
          </button>

          <div className="border-t border-ink/10 p-4">
            <p className="kpi-label mb-2">Direct messages</p>
            <select
              className="input w-full text-sm"
              defaultValue=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) startChat(id);
                e.target.value = "";
              }}
            >
              <option value="">Start conversation...</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openChat(c.id)}
                className={`mb-1 w-full rounded-xl px-3 py-3 text-left text-sm transition ${view === "chat" && activeId === c.id ? "bg-brand/10 text-brand" : "hover:bg-ink/5"}`}
              >
                <p className="font-medium">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">{c.last_message || "No messages yet"}</p>
                {c.unread_count ? <span className="mt-1 inline-block rounded-full bg-brand px-2 py-0.5 text-[10px] text-white">{c.unread_count}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={`card flex max-h-[min(70vh,32rem)] flex-col overflow-hidden lg:max-h-[70vh] ${showMobileContent ? "flex" : "hidden lg:flex"}`}>
          {view === "announcements" ? (
            <>
              <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3 font-medium">
                <button type="button" className="rounded-full p-2 hover:bg-ink/5 lg:hidden" onClick={backToList} aria-label="Back">
                  <ArrowLeft size={16} />
                </button>
                Announcements
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {announcements.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No announcements yet.</p>
                ) : (
                  announcements.map((a) => (
                    <article key={a.id} className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
                          Announcement
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-display text-lg text-ink">{a.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                      {a.created_by_name ? (
                        <p className="mt-3 text-xs text-muted-foreground">From {a.created_by_name}</p>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </>
          ) : activeId ? (
            <>
              <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3 font-medium">
                <button type="button" className="rounded-full p-2 hover:bg-ink/5 lg:hidden" onClick={backToList} aria-label="Back">
                  <ArrowLeft size={16} />
                </button>
                <span className="truncate">{active?.title || "Conversation"}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm sm:max-w-[80%] ${m.is_mine ? "bg-brand text-white" : "bg-ink/5"}`}>
                      {!m.is_mine ? <p className="mb-1 text-[10px] font-medium opacity-70">{m.sender_name}</p> : null}
                      <p className="break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${m.is_mine ? "text-white/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex flex-col gap-2 border-t border-ink/10 p-3 sm:flex-row sm:p-4">
                <input
                  className="input min-w-0 flex-1"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                />
                <button type="button" className="btn-primary w-full sm:w-auto" onClick={send} disabled={loading || !draft.trim()}>Send</button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Select a conversation or view announcements
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
