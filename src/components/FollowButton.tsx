"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  targetUserId,
  currentUserId,
  initiallyFollowing,
}: {
  targetUserId: string;
  currentUserId: string | null;
  initiallyFollowing: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [, startTransition] = useTransition();

  if (currentUserId === targetUserId) return null;

  async function toggleFollow() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const next = !following;
    setFollowing(next);

    startTransition(async () => {
      if (next) {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        if (error) setFollowing(false);
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        if (error) setFollowing(true);
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggleFollow}
      className={
        following
          ? "rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-black/5"
          : "rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90"
      }
    >
      {following ? "Seguindo" : "Seguir"}
    </button>
  );
}
