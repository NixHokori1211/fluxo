import Link from "next/link";
import Image from "next/image";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";

export type PostCardData = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author: { id: string; username: string };
  likeCount: number;
  likedByMe: boolean;
  comments: { id: string; content: string; author_username: string }[];
};

export default function PostCard({
  post,
  currentUserId,
}: {
  post: PostCardData;
  currentUserId: string | null;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
          {post.author.username.slice(0, 1).toUpperCase()}
        </div>
        <Link href={`/profile/${post.author.username}`} className="text-sm font-medium">
          {post.author.username}
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
        <LikeButton
          postId={post.id}
          userId={currentUserId}
          initiallyLiked={post.likedByMe}
          initialCount={post.likeCount}
        />

        {post.caption && (
          <p className="text-sm">
            <span className="font-medium">{post.author.username}</span>{" "}
            {post.caption}
          </p>
        )}

        <CommentSection
          postId={post.id}
          userId={currentUserId}
          initialComments={post.comments}
        />
      </div>
    </article>
  );
}
