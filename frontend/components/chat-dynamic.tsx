"use client";

import dynamic from "next/dynamic";

function ChatPlaceholder() {
  return (
    <div className="flex min-h-[60vh] animate-pulse items-center justify-center rounded-2xl bg-black/[0.03]">
      <p className="text-sm text-muted-foreground">Loading chat...</p>
    </div>
  );
}

export const ChatPanel = dynamic(
  () => import("@/components/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false, loading: () => <ChatPlaceholder /> },
);
