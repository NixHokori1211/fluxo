"use client";

import { forwardRef, useImperativeHandle, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";

export type LikeButtonHandle = {
  like: () => void;
};

const LikeButton = forwardRef<
  LikeButtonHandle,
  {
    postId: string;
    userId: string | null;
    initiallyLiked: boolean;
    initialCount: number;
  }
>(function LikeButton({ postId, userId, initiallyLiked, initialCount }, ref) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  async function setLikedState(nextLiked: boolean) {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (nextLiked === liked) return;

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

  useImperativeHandle(ref, () => ({
    like: () => setLikedState(true),
  }));

  return (
    <button
      onClick={() => setLikedState(!liked)}
      className="flex items-center gap-1.5 text-sm"
      aria-pressed={liked}
      aria-label={liked ? "Descurtir" : "Curtir"}
    >
      <motion.span
        key={liked ? "liked" : "unliked"}
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="inline-flex"
      >
        <Heart
          size={20}
          className={liked ? "fill-danger text-danger" : "text-foreground/70"}
        />
      </motion.span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="inline-block tabular-nums text-foreground/70"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </button>
  );
});

export default LikeButton;
