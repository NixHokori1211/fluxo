"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type PollData = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  myVoteOptionId: string | null;
};

export default function PollBlock({
  poll,
  userId,
}: {
  poll: PollData;
  userId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [options, setOptions] = useState(poll.options);
  const [myVote, setMyVote] = useState(poll.myVoteOptionId);
  const [busy, setBusy] = useState(false);

  const total = options.reduce((sum, o) => sum + o.votes, 0);
  const showResults = myVote !== null;

  async function vote(optionId: string) {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (busy || optionId === myVote) return;

    const previous = myVote;
    const previousOptions = options;

    // Atualização otimista: tira o voto da opção antiga e põe na nova.
    setBusy(true);
    setMyVote(optionId);
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id === optionId) return { ...o, votes: o.votes + 1 };
        if (o.id === previous) return { ...o, votes: Math.max(0, o.votes - 1) };
        return o;
      })
    );

    const { error } = await supabase
      .from("poll_votes")
      .upsert(
        { poll_id: poll.id, user_id: userId, option_id: optionId },
        { onConflict: "poll_id,user_id" }
      );

    setBusy(false);

    if (error) {
      setMyVote(previous);
      setOptions(previousOptions);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
      <p className="text-sm font-medium">{poll.question}</p>

      <ul className="flex flex-col gap-1.5">
        {options.map((o) => {
          const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
          const mine = myVote === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => vote(o.id)}
                disabled={busy}
                className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  mine ? "border-accent" : "border-border hover:border-foreground/30"
                }`}
              >
                {showResults && (
                  <motion.span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 ${mine ? "bg-accent/20" : "bg-foreground/5"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 28 }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    {mine && <Check size={14} className="text-accent" />}
                    {o.text}
                  </span>
                  {showResults && (
                    <span className="tabular-nums text-xs text-muted">{pct}%</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted">
        {total} {total === 1 ? "voto" : "votos"}
        {showResults && " · toque em outra opção pra mudar seu voto"}
      </p>
    </div>
  );
}
