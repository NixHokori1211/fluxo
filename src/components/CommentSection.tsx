"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  content: string;
  author_username: string;
  author_avatar_url?: string | null;
};

export default function CommentSection({
  postId,
  userId,
  currentUserAvatarUrl,
  initialComments,
}: {
  postId: string;
  userId: string | null;
  currentUserAvatarUrl?: string | null;
  initialComments: Comment[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      router.push("/login");
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: userId, content: text.trim() })
      .select("id, content, profiles(username)")
      .single();

    setSubmitting(false);

    if (!error && data) {
      const profileJoin = data.profiles as { username: string } | { username: string }[] | null;
      const authorProfile = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin;

      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          author_username: authorProfile?.username ?? "você",
          author_avatar_url: currentUserAvatarUrl,
        },
      ]);
      setText("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                {c.author_avatar_url ? (
                  <Image src={c.author_avatar_url} alt="" fill className="object-cover" sizes="20px" />
                ) : (
                  c.author_username.slice(0, 1).toUpperCase()
                )}
              </div>
              <p>
                <span className="font-medium">{c.author_username}</span>{" "}
                <span className="text-foreground/80">{c.content}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border pt-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicione um comentário..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="text-sm font-medium text-accent disabled:opacity-40"
        >
          Publicar
        </button>
      </form>
    </div>
  );
}
