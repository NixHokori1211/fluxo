import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import MessagesBell from "@/components/MessagesBell";
import { PlusSquare, Home } from "lucide-react";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let hasUnreadMessages = false;
  let hasUnreadNotifications = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;

    const [{ count: msgCount }, { count: notifCount }] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
    hasUnreadMessages = (msgCount ?? 0) > 0;
    hasUnreadNotifications = (notifCount ?? 0) > 0;
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/feed" className="font-display text-2xl tracking-tight">
          pulso
        </Link>

        {user ? (
          <nav className="flex items-center gap-4">
            <Link
              href="/feed"
              className="text-foreground/70 transition hover:text-foreground"
              aria-label="Feed"
            >
              <Home size={22} />
            </Link>
            <Link
              href="/post/new"
              className="text-foreground/70 transition hover:text-foreground"
              aria-label="Nova publicação"
            >
              <PlusSquare size={22} />
            </Link>
            <NotificationBell userId={user.id} initialUnread={hasUnreadNotifications} />
            <MessagesBell userId={user.id} initialUnread={hasUnreadMessages} />
            {username && (
              <Link
                href={`/profile/${username}`}
                className="relative h-8 w-8 overflow-hidden rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium"
                aria-label="Meu perfil"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="32px" />
                ) : (
                  username.slice(0, 1).toUpperCase()
                )}
              </Link>
            )}
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-foreground/70 hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent px-4 py-1.5 text-accent-foreground hover:opacity-90"
            >
              Criar conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
