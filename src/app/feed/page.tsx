import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchPostsPage } from "@/lib/posts";
import FeedList from "@/components/FeedList";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Grupo pequeno de amigos: o feed mostra as publicações de todo mundo,
  // sem filtrar por quem você segue. Carrega em páginas de 20.
  const [{ items, nextCursor, error }, { data: myProfile }] = await Promise.all([
    fetchPostsPage(supabase, user?.id ?? null, { limit: 20 }),
    user
      ? supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      {!user && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
          Você está vendo as publicações do grupo.{" "}
          <Link href="/login" className="text-accent hover:underline">
            Entre
          </Link>{" "}
          para curtir e comentar.
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">Não foi possível carregar o feed.</p>
      )}

      {items.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
          Nenhuma publicação ainda.{" "}
          {user && (
            <Link href="/post/new" className="text-accent hover:underline">
              Crie a primeira
            </Link>
          )}
        </div>
      ) : (
        <FeedList
          initialItems={items}
          initialCursor={nextCursor}
          currentUserId={user?.id ?? null}
          currentUserAvatarUrl={myProfile?.avatar_url ?? null}
        />
      )}
    </div>
  );
}
