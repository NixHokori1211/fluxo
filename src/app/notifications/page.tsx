import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Heart, MessageSquare, UserPlus } from "lucide-react";

const ICONS = {
  like: Heart,
  comment: MessageSquare,
  follow: UserPlus,
};

const VERBS: Record<string, string> = {
  like: "curtiu sua publicação",
  comment: "comentou na sua publicação",
  follow: "começou a seguir você",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      `id, type, post_id, created_at, read_at,
       actor:profiles!notifications_actor_id_fkey ( username )`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Marca tudo como lido ao visitar a página.
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  type RawNotification = {
    id: string;
    type: "like" | "comment" | "follow";
    post_id: string | null;
    created_at: string;
    read_at: string | null;
    actor: { username: string } | { username: string }[] | null;
  };

  const items = ((notifications ?? []) as unknown as RawNotification[]).map((n) => {
    const actor = Array.isArray(n.actor) ? n.actor[0] : n.actor;
    return { ...n, actorUsername: actor?.username ?? "alguém" };
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl italic">Notificações</h1>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          Nada por aqui ainda. Quando alguém curtir, comentar ou seguir você, aparece nessa lista.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-border">
          {items.map((n) => {
            const Icon = ICONS[n.type];
            const href = n.type === "follow" ? `/profile/${n.actorUsername}` : `/post/${n.post_id}`;
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 py-3 ${!n.read_at ? "bg-accent/5" : ""}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon size={16} />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{n.actorUsername}</span>{" "}
                    <span className="text-foreground/80">{VERBS[n.type]}</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
