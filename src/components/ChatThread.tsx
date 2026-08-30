"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

const BUBBLE_TRANSITION = { type: "spring" as const, stiffness: 450, damping: 28, mass: 1 };
const TYPING_TIMEOUT_MS = 2500;
const TYPING_BROADCAST_INTERVAL_MS = 1500;

function TypingDots({ mine }: { mine: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-3.5 py-3 ${
        mine ? "self-end bg-accent" : "self-start border border-border bg-surface"
      }`}
      style={{ borderRadius: mine ? "20px 20px 4px 20px" : "20px 20px 20px 4px" }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${mine ? "bg-accent-foreground/85" : "bg-muted"}`}
          animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export default function ChatThread({
  currentUserId,
  otherUserId,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  initialMessages: Message[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherIsTyping]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${[currentUserId, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Message & { recipient_id: string };
          const belongsHere =
            (m.sender_id === currentUserId && m.recipient_id === otherUserId) ||
            (m.sender_id === otherUserId && m.recipient_id === currentUserId);
          if (!belongsHere) return;

          if (m.sender_id === otherUserId) setOtherIsTyping(false);
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        }
      )
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId !== otherUserId) return;
        setOtherIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), TYPING_TIMEOUT_MS);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId, otherUserId]);

  function handleTextChange(value: string) {
    setText(value);
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_BROADCAST_INTERVAL_MS) {
      lastTypingSentRef.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId },
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    setText("");

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id: currentUserId, recipient_id: otherUserId, content })
        .select("id, content, created_at, sender_id")
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
      }
    } catch (err) {
      setText(content);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar. Tente novamente."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={BUBBLE_TRANSITION}
                  className={`max-w-[75%] px-3.5 py-2 text-sm ${
                    mine
                      ? "self-end bg-accent text-accent-foreground"
                      : "self-start border border-border bg-surface"
                  }`}
                  style={{ borderRadius: mine ? "20px 20px 4px 20px" : "20px 20px 20px 4px" }}
                >
                  {m.content}
                </motion.div>
              );
            })}
            {otherIsTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                transition={BUBBLE_TRANSITION}
                className="flex"
              >
                <TypingDots mine={false} />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-1.5 border-t border-border px-4 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
