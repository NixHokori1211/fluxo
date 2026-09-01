"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({
  userId,
  initialUnread,
  icon: Icon = Bell,
  size = 22,
  className = "relative text-foreground/70 transition hover:text-foreground",
}: {
  userId: string;
  initialUnread: boolean;
  icon?: LucideIcon;
  size?: number;
  className?: string;
}) {
  const supabase = createClient();
  const [hasUnread, setHasUnread] = useState(initialUnread);

  useEffect(() => {
    async function refresh() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      setHasUnread((count ?? 0) > 0);
    }

    const channel = supabase
      .channel(`notifications-badge-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <Link href="/notifications" className={className} aria-label="Notificações">
      <Icon size={size} />
      {hasUnread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />}
    </Link>
  );
}
