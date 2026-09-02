"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["🔥", "😂", "😮", "👏"] as const;

export default function ReactionBar({
  postId,
  userId,
  initialCounts,
  initialMyReaction,
}: {
  postId: string;
  userId: string | null;
  initialCounts: Record<string, number>;
  initialMyReaction: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [counts, setCounts] = useState(initialCounts);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [, startTransition] = useTransition();

  function bump(emoji: string, delta: number) {
    setCounts((prev) => {
      const next = { ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 0) + delta) };
      if (next[emoji] === 0) delete next[emoji];
      return next;
    });
  }

  async function handleClick(emoji: string) {
    if (!userId) {
      router.push("/login");
      return;
    }

    const previous = myReaction;

    if (previous === emoji) {
      // Clicar de novo no mesmo emoji remove a reação.
      setMyReaction(null);
      bump(emoji, -1);
      startTransition(async () => {
        const { error } = await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) {
          setMyReaction(previous);
          bump(emoji, 1);
        }
      });
      return;
    }

    setMyReaction(emoji);
    bump(emoji, 1);
    if (previous) bump(previous, -1);

    startTransition(async () => {
      const { error } = await supabase
        .from("reactions")
        .upsert({ post_id: postId, user_id: userId, emoji }, { onConflict: "post_id,user_id" });
      if (error) {
        setMyReaction(previous);
        bump(emoji, -1);
        if (previous) bump(previous, 1);
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const mine = myReaction === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleClick(emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              mine
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-foreground/30"
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
