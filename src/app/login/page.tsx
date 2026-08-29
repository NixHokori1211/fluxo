"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DitherEffect2 from "@/components/effects/DitherEffect2";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="relative isolate min-h-[calc(100dvh-57px)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <DitherEffect2 background="#0b0a10" color="#9d7cf5" size={40} speed={32} scale={45} />
      </div>

      <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl italic text-white">pulso</h1>
          <p className="mt-2 text-sm text-white/60">Entre para ver as publicações de quem você segue.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
        >
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="-mt-1 text-right">
            <Link href="/forgot-password" className="text-xs text-white/50 hover:text-accent hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-white/60">
          Não tem conta?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
