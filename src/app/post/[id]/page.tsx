import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { POSTS_SELECT, transformPost } from "@/lib/posts";

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

  const [{ data: post }, { data: myProfile }] = await Promise.all([
    supabase.from("posts").select(POSTS_SELECT).eq("id", id).single(),
    user
      ? supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!post) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = transformPost(post as any, user?.id ?? null);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <PostCard
        post={item}
        currentUserId={user?.id ?? null}
        currentUserAvatarUrl={myProfile?.avatar_url ?? null}
      />
    </div>
  );
}
