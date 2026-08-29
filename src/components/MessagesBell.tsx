"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MessagesBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: boolean;
}) {
  const supabase = createClient();
  const [hasUnread, setHasUnread] = useState(initialUnread);

  useEffect(() => {
    async function refresh() {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .is("read_at", null);
      setHasUnread((count ?? 0) > 0);
    }

    const channel = supabase
      .channel(`messages-badge-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <Link
      href="/messages"
      className="relative text-foreground/70 transition hover:text-foreground"
      aria-label="Mensagens"
    >
      <MessageCircle size={22} />
      {hasUnread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />}
    </Link>
  );
}
