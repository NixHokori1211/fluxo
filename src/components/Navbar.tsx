import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import MessagesBell from "@/components/MessagesBell";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";
import { PlusSquare, Home, Users } from "lucide-react";

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
    <>
      <header
        className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/feed" className="font-display text-2xl tracking-tight">
            pulso
          </Link>

          {user ? (
            <nav className="flex items-center gap-4">
              <Link
                href="/feed"
                className="hidden text-foreground/70 transition hover:text-foreground sm:inline-flex"
                aria-label="Feed"
              >
                <Home size={22} />
              </Link>
              <Link
                href="/post/new"
                className="hidden text-foreground/70 transition hover:text-foreground sm:inline-flex"
                aria-label="Nova publicação"
              >
                <PlusSquare size={22} />
              </Link>
              <Link
                href="/members"
                className="hidden text-foreground/70 transition hover:text-foreground sm:inline-flex"
                aria-label="Membros"
              >
                <Users size={22} />
              </Link>
              <span className="hidden sm:inline-flex">
                <NotificationBell userId={user.id} initialUnread={hasUnreadNotifications} />
              </span>
              <MessagesBell userId={user.id} initialUnread={hasUnreadMessages} />
              <ThemeToggle />
              {username && (
                <Link
                  href={`/profile/${username}`}
                  className="relative hidden h-8 w-8 overflow-hidden rounded-full bg-accent text-accent-foreground sm:flex items-center justify-center text-sm font-medium"
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
              <ThemeToggle />
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

      {user && (
        <BottomNav
          userId={user.id}
          username={username}
          avatarUrl={avatarUrl}
          hasUnreadNotifications={hasUnreadNotifications}
        />
      )}
    </>
  );
}
