import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatThread from "@/components/ChatThread";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!otherProfile) notFound();
  if (otherProfile.id === user.id) redirect("/messages");

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  // Marca como lidas as mensagens que a outra pessoa me enviou
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherProfile.id)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  return (
    <div className="mx-auto max-w-xl">
      <div className="sticky top-[57px] z-10 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <span className="text-sm font-medium">{otherProfile.username}</span>
      </div>

      <ChatThread
        currentUserId={user.id}
        otherUserId={otherProfile.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
