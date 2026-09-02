import Link from "next/link";
import Image from "next/image";
import LikeButton from "@/components/LikeButton";
import ReactionBar from "@/components/ReactionBar";
import CommentSection from "@/components/CommentSection";
import VerifiedBadge from "@/components/VerifiedBadge";

export type PostCardData = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author: { id: string; username: string; avatar_url?: string | null; verified?: boolean };
  likeCount: number;
  likedByMe: boolean;
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  comments: {
    id: string;
    content: string;
    author_username: string;
    author_avatar_url?: string | null;
  }[];
};

export default function PostCard({
  post,
  currentUserId,
  currentUserAvatarUrl,
}: {
  post: PostCardData;
  currentUserId: string | null;
  currentUserAvatarUrl?: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-accent-foreground">
          {post.author.avatar_url ? (
            <Image src={post.author.avatar_url} alt="" fill className="object-cover" sizes="32px" />
          ) : (
            post.author.username.slice(0, 1).toUpperCase()
          )}
        </div>
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-1 text-sm font-medium">
          {post.author.username}
          {post.author.verified && <VerifiedBadge />}
        </Link>
      </div>

      <div className="relative aspect-square w-full bg-black/5">
        <Image
          src={post.image_url}
          alt={post.caption ?? `Publicação de ${post.author.username}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
        />
      </div>

      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <LikeButton
            postId={post.id}
            userId={currentUserId}
            initiallyLiked={post.likedByMe}
            initialCount={post.likeCount}
          />
          <ReactionBar
            postId={post.id}
            userId={currentUserId}
            initialCounts={post.reactionCounts}
            initialMyReaction={post.myReaction}
          />
        </div>

        {post.caption && (
          <p className="text-sm">
            <span className="font-medium">{post.author.username}</span>{" "}
            {post.caption}
          </p>
        )}

        <CommentSection
          postId={post.id}
          userId={currentUserId}
          currentUserAvatarUrl={currentUserAvatarUrl}
          initialComments={post.comments}
        />

        <Link
          href={`/post/${post.id}`}
          className="text-xs uppercase tracking-wide text-muted hover:text-accent"
        >
          Ver publicação
        </Link>
      </div>
    </article>
  );
}
