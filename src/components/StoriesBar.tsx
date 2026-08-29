"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { StoryGroup } from "@/lib/stories";
import StoryViewer from "@/components/StoryViewer";

export default function StoriesBar({
  groups,
  currentUserId,
}: {
  groups: StoryGroup[];
  currentUserId: string | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (groups.length === 0 && !currentUserId) return null;

  const myGroup = groups.find((g) => g.authorId === currentUserId);
  const others = groups.filter((g) => g.authorId !== currentUserId);

  return (
    <>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 py-3">
        {currentUserId && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (myGroup) setOpenIndex(groups.findIndex((g) => g.authorId === currentUserId));
                }}
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ring-offset-2 ring-offset-background ${
                  myGroup ? (myGroup.allViewed ? "ring-2 ring-border" : "ring-2 ring-accent") : "ring-2 ring-border"
                }`}
                aria-label="Ver seu story"
              >
                {myGroup?.avatarUrl ? (
                  <Image src={myGroup.avatarUrl} alt="" fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent text-lg font-medium text-accent-foreground">
                    {(myGroup?.username ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
              <Link
                href="/story/new"
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground"
                aria-label="Adicionar story"
              >
                <Plus size={12} />
              </Link>
            </div>
            <span className="text-xs text-muted">Você</span>
          </div>
        )}

        {others.map((g) => {
          const idx = groups.findIndex((x) => x.authorId === g.authorId);
          return (
            <button
              key={g.authorId}
              type="button"
              onClick={() => setOpenIndex(idx)}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <div
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full ring-offset-2 ring-offset-background ${
                  g.allViewed ? "ring-2 ring-border" : "ring-2 ring-accent"
                }`}
              >
                {g.avatarUrl ? (
                  <Image src={g.avatarUrl} alt="" fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent text-lg font-medium text-accent-foreground">
                    {g.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="max-w-[64px] truncate text-xs text-muted">{g.username}</span>
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <StoryViewer
          groups={groups}
          startGroupIndex={openIndex}
          currentUserId={currentUserId}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
