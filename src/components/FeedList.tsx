"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostCard, { type PostCardData } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/client";
import { fetchPostsPage } from "@/lib/posts";

export default function FeedList({
  initialItems,
  initialCursor,
  currentUserId,
  currentUserAvatarUrl,
}: {
  initialItems: PostCardData[];
  initialCursor: string | null;
  currentUserId: string | null;
  currentUserAvatarUrl: string | null;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);

    const { items: more, nextCursor } = await fetchPostsPage(supabase, currentUserId, {
      before: cursor,
      limit: 20,
    });

    setItems((prev) => [...prev, ...more]);
    setCursor(nextCursor);
    setLoading(false);
  }, [supabase, cursor, loading, currentUserId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      {items.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserAvatarUrl={currentUserAvatarUrl}
        />
      ))}

      {cursor && <div ref={sentinelRef} className="h-1" />}

      {loading && (
        <p className="py-4 text-center text-sm text-muted">Carregando mais...</p>
      )}

      {!cursor && items.length > 0 && (
        <p className="py-4 text-center text-xs text-muted">Você chegou ao fim.</p>
      )}
    </>
  );
}
