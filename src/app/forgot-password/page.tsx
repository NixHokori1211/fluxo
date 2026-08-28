"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function friendlyAuthError(message: string) {
    const msg = message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("security purposes"))
      return "Você pediu isso há pouco tempo. Espere um instante antes de tentar de novo.";
    if (msg.includes("user not found"))
      return "Não encontramos essa conta. Confira o e-mail digitado.";
    if (msg.includes("invalid") && msg.includes("email"))
      return "Esse e-mail não parece válido.";
    return message || "Algo deu errado. Tente novamente.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="font-display text-3xl italic">Link enviado</h1>
        <p className="mt-3 text-sm text-muted">
          Enviamos um link de redefinição para <b>{email}</b>. Abra o e-mail
          nesse mesmo navegador e clique no link. Confira também a caixa de spam.
        </p>
        <Link href="/login" className="mt-6 inline-block text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl italic">Esqueceu a senha?</h1>
        <p className="mt-2 text-sm text-muted">
          Digite seu e-mail e enviamos um link pra redefinir.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
