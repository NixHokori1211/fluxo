import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FollowButton from "@/components/FollowButton";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [{ count: postCount }, { count: followerCount }, { count: followingCount }, { data: posts }] =
    await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", profile.id),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
      supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabase
        .from("posts")
        .select("id, image_url")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

  let isFollowing = false;
  if (user) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!data;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-6">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-medium text-accent-foreground">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" sizes="80px" />
          ) : (
            profile.username.slice(0, 1).toUpperCase()
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium">
              {profile.display_name || profile.username}
            </h1>
            {user?.id === profile.id ? (
              <Link
                href="/profile/edit"
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-black/5"
              >
                Editar perfil
              </Link>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                currentUserId={user?.id ?? null}
                initiallyFollowing={isFollowing}
              />
            )}
          </div>
          <p className="text-sm text-muted">@{profile.username}</p>

          <div className="mt-3 flex gap-6 text-sm">
            <span><strong>{postCount ?? 0}</strong> publicações</span>
            <span><strong>{followerCount ?? 0}</strong> seguidores</span>
            <span><strong>{followingCount ?? 0}</strong> seguindo</span>
          </div>

          {profile.bio && <p className="mt-2 text-sm text-muted">{profile.bio}</p>}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-1">
        {(posts ?? []).map((post) => (
          <div key={post.id} className="relative aspect-square bg-black/5">
            <Image
              src={post.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 200px"
            />
          </div>
        ))}
      </div>

      {(posts ?? []).length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">Nenhuma publicação ainda.</p>
      )}
    </div>
  );
}
