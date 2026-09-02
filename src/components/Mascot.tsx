"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { createAvatar } from "@/vendor/avatar-react";
import bipDefinition from "@/lib/bip-avatar.json";

const BUBBLE_TRANSITION = { type: "spring" as const, stiffness: 450, damping: 28, mass: 1 };

type ChatMessage = { role: "user" | "assistant"; content: string };
const BipAvatar = createAvatar(bipDefinition);
type BipAnimation = "idle" | "listening" | "thinking" | "happy" | "laughing";

export default function Mascot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animation, setAnimation] = useState<BipAnimation>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);
  const happyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setAnimation(open ? "listening" : "idle");
  }, [open]);

  useEffect(() => {
    return () => {
      if (happyTimeoutRef.current) clearTimeout(happyTimeoutRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setText("");
    setError(null);
    setLoading(true);
    setAnimation("thinking");

    try {
      const res = await fetch("/api/mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Algo deu errado.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setAnimation("happy");
      happyTimeoutRef.current = setTimeout(() => setAnimation("listening"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O Bip tá com soneca. Tenta de novo.");
      setAnimation("listening");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={BUBBLE_TRANSITION}
            className="fixed bottom-24 right-4 z-40 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:right-6"
            style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <BipAvatar animation={animation} size={40} ariaLabel="Bip" />
                <div>
                  <p className="text-sm font-medium">Bip</p>
                  <p className="text-xs text-muted">mascote do pulso</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="text-foreground/60 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-col gap-2">
                {messages.length === 0 && (
                  <div className="max-w-[85%] self-start rounded-2xl border border-border bg-background px-3.5 py-2 text-sm">
                    Oi! Eu sou o Bip 👋 Bora bater papo?
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={BUBBLE_TRANSITION}
                      className={`max-w-[85%] whitespace-pre-wrap px-3.5 py-2 text-sm ${
                        m.role === "user"
                          ? "self-end bg-accent text-accent-foreground"
                          : "self-start border border-border bg-background"
                      }`}
                      style={{
                        borderRadius:
                          m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      }}
                    >
                      {m.content}
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={BUBBLE_TRANSITION}
                      className="inline-flex items-center gap-1 self-start rounded-2xl border border-border bg-background px-3.5 py-3"
                      style={{ borderRadius: "18px 18px 18px 4px" }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted"
                          animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.18,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 border-t border-border px-3 py-2.5">
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Fala com o Bip..."
                  maxLength={500}
                  className="flex-1 rounded-full border border-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  aria-label="Enviar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar o Bip" : "Abrir o Bip"}
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-border sm:right-6"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.92 }}
      >
        <BipAvatar animation={animation} size={48} ariaLabel={open ? "Fechar o Bip" : "Abrir o Bip"} />
      </motion.button>
    </>
  );
}
