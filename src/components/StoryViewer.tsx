"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StoryGroup } from "@/lib/stories";

const DURATION_MS = 5000;
const TICK_MS = 50;

export default function StoryViewer({
  groups,
  startGroupIndex,
  currentUserId,
  onClose,
}: {
  groups: StoryGroup[];
  startGroupIndex: number;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];

  function goToNext() {
    if (!group) return;
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setStoryIndex(0);
      return;
    }
    onClose();
  }

  function goToPrev() {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      return;
    }
    if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setStoryIndex(Math.max(0, prevGroup.stories.length - 1));
    }
  }

  // Barra de progresso automática
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        goToNext();
      }
    }, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  // Marca como visualizado
  useEffect(() => {
    if (!currentUserId || !story) return;
    supabase
      .from("story_views")
      .upsert(
        { story_id: story.id, viewer_id: currentUserId },
        { onConflict: "story_id,viewer_id", ignoreDuplicates: true }
      )
      .then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, currentUserId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                  transition: i === storyIndex ? `width ${TICK_MS}ms linear` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-3 right-3 top-8 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full bg-accent">
              {group.avatarUrl && (
                <Image src={group.avatarUrl} alt="" fill className="object-cover" sizes="28px" />
              )}
            </div>
            <span className="text-sm font-medium text-white">{group.username}</span>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-white">
            <X size={22} />
          </button>
        </div>

        <div className="relative flex-1 bg-black">
          <Image src={story.image_url} alt="" fill className="object-contain" sizes="100vw" />
          <button onClick={goToPrev} aria-label="Story anterior" className="absolute left-0 top-0 h-full w-1/3" />
          <button onClick={goToNext} aria-label="Próximo story" className="absolute right-0 top-0 h-full w-1/3" />
        </div>
      </div>
    </div>
  );
}
