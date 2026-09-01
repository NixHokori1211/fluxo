import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import MessagesBell from "@/components/MessagesBell";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";
import Mascot from "@/components/Mascot";

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
              <MessagesBell userId={user.id} initialUnread={hasUnreadMessages} />
              <ThemeToggle />
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
        <>
          <BottomNav
            userId={user.id}
            username={username}
            avatarUrl={avatarUrl}
            hasUnreadNotifications={hasUnreadNotifications}
          />
          <Mascot />
        </>
      )}
    </>
  );
}
