"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DitherEffect2 from "@/components/effects/DitherEffect2";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="relative isolate min-h-[calc(100dvh-57px)] overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <DitherEffect2 background="#0b0a10" color="#9d7cf5" size={40} speed={32} scale={45} />
        </div>
        <div className="mx-auto max-w-sm px-4 py-16 text-center">
          <h1 className="font-display text-3xl italic text-white">Quase lá</h1>
          <p className="mt-3 text-sm text-white/60">
            Confirme seu e-mail para ativar a conta e depois faça login.
          </p>
          <Link href="/login" className="mt-6 inline-block text-accent hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[calc(100dvh-57px)] overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <DitherEffect2 background="#0b0a10" color="#9d7cf5" size={40} speed={32} scale={45} />
      </div>

      <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl italic text-white">pulso</h1>
          <p className="mt-2 text-sm text-white/60">Crie sua conta e comece a publicar.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
        >
          <input
            type="text"
            required
            minLength={3}
            pattern="[a-z0-9_.]+"
            title="Apenas letras minúsculas, números, pontos e underscores"
            placeholder="Nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />
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
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-accent"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-sm text-white/60">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
