import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: messages } = await supabase
    .from("messages")
    .select(
      `id, content, created_at, sender_id, recipient_id, read_at,
       sender:profiles!messages_sender_id_fkey ( id, username, avatar_url ),
       recipient:profiles!messages_recipient_id_fkey ( id, username, avatar_url )`
    )
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  type RawMessage = {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    read_at: string | null;
    sender: { id: string; username: string; avatar_url: string | null } | { id: string; username: string; avatar_url: string | null }[] | null;
    recipient: { id: string; username: string; avatar_url: string | null } | { id: string; username: string; avatar_url: string | null }[] | null;
  };

  const conversations = new Map<
    string,
    {
      username: string;
      avatarUrl: string | null;
      lastMessage: string;
      lastAt: string;
      unread: boolean;
    }
  >();

  ((messages ?? []) as unknown as RawMessage[]).forEach((m) => {
    const sender = Array.isArray(m.sender) ? m.sender[0] : m.sender;
    const recipient = Array.isArray(m.recipient) ? m.recipient[0] : m.recipient;
    const isMine = m.sender_id === user.id;
    const other = isMine ? recipient : sender;
    if (!other) return;

    if (!conversations.has(other.id)) {
      conversations.set(other.id, {
        username: other.username,
        avatarUrl: other.avatar_url,
        lastMessage: m.content,
        lastAt: m.created_at,
        unread: !isMine && !m.read_at,
      });
    }
  });

  const list = Array.from(conversations.values());

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-2xl italic">Mensagens</h1>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          Nenhuma conversa ainda. Vá no perfil de alguém e mande uma mensagem.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-border">
          {list.map((c) => (
            <li key={c.username}>
              <Link
                href={`/messages/${c.username}`}
                className="flex items-center gap-3 py-3"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-medium text-accent-foreground">
                  {c.avatarUrl ? (
                    <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="44px" />
                  ) : (
                    c.username.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.username}</span>
                    {c.unread && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                  <p className="truncate text-sm text-muted">{c.lastMessage}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
