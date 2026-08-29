import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostCardData } from "@/components/PostCard";

export const POSTS_SELECT = `id, image_url, caption, created_at,
   author:profiles!posts_author_id_fkey ( id, username, avatar_url ),
   likes ( user_id ),
   comments ( id, content, profiles ( username, avatar_url ) )`;

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

export function transformPost(p: RawPost, currentUserId: string | null): PostCardData {
  const author = Array.isArray(p.author) ? p.author[0] : p.author;

  return {
    id: p.id,
    image_url: p.image_url,
    caption: p.caption,
    created_at: p.created_at,
    author: author ?? { id: "", username: "usuário", avatar_url: null },
    likeCount: p.likes?.length ?? 0,
    likedByMe: !!currentUserId && (p.likes ?? []).some((l) => l.user_id === currentUserId),
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
}

/**
 * Busca uma página de posts, mais recentes primeiro. Passe `before` (um
 * created_at) pra pegar a página seguinte. Funciona com o client do
 * servidor ou do navegador — ambos implementam a mesma interface.
 */
export async function fetchPostsPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  currentUserId: string | null,
  { before, limit = 20 }: { before?: string; limit?: number } = {}
): Promise<{ items: PostCardData[]; nextCursor: string | null; error: boolean }> {
  let query = supabase
    .from("posts")
    .select(POSTS_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  const raw = (data ?? []) as unknown as RawPost[];
  const items = raw.map((p) => transformPost(p, currentUserId));
  const nextCursor = raw.length === limit ? raw[raw.length - 1].created_at : null;

  return { items, nextCursor, error: !!error };
}
