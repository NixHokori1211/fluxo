"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  content: string;
  author_username: string;
};

export default function CommentSection({
  postId,
  userId,
  initialComments,
}: {
  postId: string;
  userId: string | null;
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
        },
      ]);
      setText("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {comments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.author_username}</span>{" "}
              <span className="text-foreground/80">{c.content}</span>
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
