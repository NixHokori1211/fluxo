import type { SupabaseClient } from "@supabase/supabase-js";

export type StoryItem = { id: string; image_url: string; created_at: string };

export type StoryGroup = {
  authorId: string;
  username: string;
  avatarUrl: string | null;
  stories: StoryItem[];
  allViewed: boolean;
};

type RawStory = {
  id: string;
  image_url: string;
  created_at: string;
  author_id: string;
  author:
    | { username: string; avatar_url: string | null }
    | { username: string; avatar_url: string | null }[]
    | null;
};

export async function fetchActiveStoryGroups(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  currentUserId: string | null
): Promise<StoryGroup[]> {
  const { data: stories } = await supabase
    .from("stories")
    .select(
      "id, image_url, created_at, author_id, author:profiles!stories_author_id_fkey ( username, avatar_url )"
    )
    .order("created_at", { ascending: true });

  const raw = (stories ?? []) as unknown as RawStory[];
  if (raw.length === 0) return [];

  let viewedIds = new Set<string>();
  if (currentUserId) {
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", currentUserId)
      .in(
        "story_id",
        raw.map((s) => s.id)
      );
    viewedIds = new Set((views ?? []).map((v) => v.story_id));
  }

  const map = new Map<string, StoryGroup>();
  for (const s of raw) {
    const author = Array.isArray(s.author) ? s.author[0] : s.author;
    if (!map.has(s.author_id)) {
      map.set(s.author_id, {
        authorId: s.author_id,
        username: author?.username ?? "usuário",
        avatarUrl: author?.avatar_url ?? null,
        stories: [],
        allViewed: true,
      });
    }
    const group = map.get(s.author_id)!;
    group.stories.push({ id: s.id, image_url: s.image_url, created_at: s.created_at });
    if (!viewedIds.has(s.id)) group.allViewed = false;
  }

  const groups = Array.from(map.values());

  // Você primeiro, depois quem tem story não visto, depois o resto.
  groups.sort((a, b) => {
    if (currentUserId) {
      if (a.authorId === currentUserId) return -1;
      if (b.authorId === currentUserId) return 1;
    }
    if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1;
    return 0;
  });

  return groups;
}
