"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";

export default function LikeButton({
  postId,
  userId,
  initiallyLiked,
  initialCount,
}: {
  postId: string;
  userId: string | null;
  initiallyLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  async function toggleLike() {
    if (!userId) {
      router.push("/login");
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : c - 1));

    startTransition(async () => {
      if (nextLiked) {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) {
          setLiked(false);
          setCount((c) => c - 1);
        }
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) {
          setLiked(true);
          setCount((c) => c + 1);
        }
      }
    });
  }

  return (
    <button
      onClick={toggleLike}
      className="flex items-center gap-1.5 text-sm"
      aria-pressed={liked}
      aria-label={liked ? "Descurtir" : "Curtir"}
    >
      <Heart
        size={20}
        className={liked ? "fill-danger text-danger" : "text-foreground/70"}
      />
      <span className="tabular-nums text-foreground/70">{count}</span>
    </button>
  );
}
