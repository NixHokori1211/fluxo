import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard, { type PostCardData } from "@/components/PostCard";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Grupo pequeno de amigos: o feed mostra as publicações de todo mundo,
  // sem filtrar por quem você segue.
  const [{ data: posts, error }, { data: myProfile }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `id, image_url, caption, created_at,
         author:profiles!posts_author_id_fkey ( id, username, avatar_url ),
         likes ( user_id ),
         comments ( id, content, profiles ( username, avatar_url ) )`
      )
      .order("created_at", { ascending: false })
      .limit(30),
    user
      ? supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  type RawPost = {
    id: string;
    image_url: string;
    caption: string | null;
    created_at: string;
    author:
      | { id: string; username: string; avatar_url: string | null }
      | { id: string; username: string; avatar_url: string | null }[]
      | null;
    likes: { user_id: string }[] | null;
    comments:
      | {
          id: string;
          content: string;
          profiles:
            | { username: string; avatar_url: string | null }
            | { username: string; avatar_url: string | null }[]
            | null;
        }[]
      | null;
  };

  const items: PostCardData[] = ((posts ?? []) as unknown as RawPost[]).map((p) => {
    const author = Array.isArray(p.author) ? p.author[0] : p.author;

    return {
      id: p.id,
      image_url: p.image_url,
      caption: p.caption,
      created_at: p.created_at,
      author: author ?? { id: "", username: "usuário", avatar_url: null },
      likeCount: p.likes?.length ?? 0,
      likedByMe: !!user && (p.likes ?? []).some((l) => l.user_id === user.id),
      comments: (p.comments ?? []).map((c) => {
        const commentAuthor = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return {
          id: c.id,
          content: c.content,
          author_username: commentAuthor?.username ?? "usuário",
          author_avatar_url: commentAuthor?.avatar_url ?? null,
        };
      }),
    };
  });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      {!user && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Você está vendo as publicações do grupo.{" "}
          <Link href="/login" className="text-accent hover:underline">
            Entre
          </Link>{" "}
          para curtir e comentar.
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">Não foi possível carregar o feed.</p>
      )}

      {items.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
          Nenhuma publicação ainda.{" "}
          {user && (
            <Link href="/post/new" className="text-accent hover:underline">
              Crie a primeira
            </Link>
          )}
        </div>
      ) : (
        items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id ?? null}
            currentUserAvatarUrl={myProfile?.avatar_url ?? null}
          />
        ))
      )}
    </div>
  );
}
