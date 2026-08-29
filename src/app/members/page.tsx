import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/FollowButton";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: myFollows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, created_at")
      .order("created_at", { ascending: true }),
    user
      ? supabase.from("follows").select("following_id").eq("follower_id", user.id)
      : Promise.resolve({ data: [] as { following_id: string }[] | null }),
  ]);

  const followingIds = new Set((myFollows ?? []).map((f) => f.following_id));

  const members = (profiles ?? []).filter((p) => p.id !== user?.id);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl italic">Membros</h1>
      <p className="mt-1 text-sm text-muted">
        {members.length + (user ? 1 : 0)} {members.length + (user ? 1 : 0) === 1 ? "pessoa" : "pessoas"} no grupo
      </p>

      <ul className="mt-6 flex flex-col divide-y divide-border">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-3">
            <Link href={`/profile/${m.username}`} className="flex flex-1 items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {m.avatar_url ? (
                  <Image src={m.avatar_url} alt="" fill className="object-cover" sizes="44px" />
                ) : (
                  m.username.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.display_name || m.username}</p>
                <p className="truncate text-xs text-muted">@{m.username}</p>
              </div>
            </Link>

            {user && (
              <FollowButton
                targetUserId={m.id}
                currentUserId={user.id}
                initiallyFollowing={followingIds.has(m.id)}
              />
            )}
          </li>
        ))}
      </ul>

      {members.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">Você é a única pessoa por aqui até agora.</p>
      )}
    </div>
  );
}
