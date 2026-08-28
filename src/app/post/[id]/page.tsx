import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard, { type PostCardData } from "@/components/PostCard";

export default async function SinglePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select(
      `id, image_url, caption, created_at,
       author:profiles!posts_author_id_fkey ( id, username ),
       likes ( user_id ),
       comments ( id, content, profiles ( username ) )`
    )
    .eq("id", id)
    .single();

  if (!post) notFound();

  type RawAuthor = { id: string; username: string } | { id: string; username: string }[] | null;
  const authorJoin = post.author as unknown as RawAuthor;
  const author = Array.isArray(authorJoin) ? authorJoin[0] : authorJoin;

  const item: PostCardData = {
    id: post.id,
    image_url: post.image_url,
    caption: post.caption,
    created_at: post.created_at,
    author: author ?? { id: "", username: "usuário" },
    likeCount: post.likes?.length ?? 0,
    likedByMe: !!user && (post.likes ?? []).some((l) => l.user_id === user.id),
    comments: (post.comments ?? []).map((c) => {
      const profileJoin = c.profiles as { username: string } | { username: string }[] | null;
      const commentAuthor = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin;
      return {
        id: c.id,
        content: c.content,
        author_username: commentAuthor?.username ?? "usuário",
      };
    }),
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <PostCard post={item} currentUserId={user?.id ?? null} />
    </div>
  );
}
