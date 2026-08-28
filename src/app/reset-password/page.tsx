"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Se o link veio com erro (expirado, inválido), o Supabase manda como query/hash params.
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const urlError = url.searchParams.get("error") || hashParams.get("error");

    if (urlError) {
      setInvalidLink(true);
      setReady(true);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Caso a sessão de recovery já tenha sido processada antes deste efeito rodar.
    const timeout = setTimeout(() => setReady(true), 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  const okLen = newPass.length >= 8;
  const okUpper = /[A-Z]/.test(newPass);
  const okNum = /[0-9]/.test(newPass);
  const strong = okLen && okUpper && okNum;
  const match = confirmPass.length > 0 && confirmPass === newPass;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!strong || !match) return;

    setError(null);
    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password: newPass });

    setSaving(false);

    if (error) {
      setError(error.message || "Algo deu errado. Tente novamente.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="font-display text-3xl italic">Senha redefinida</h1>
        <p className="mt-3 text-sm text-muted">
          Sua senha foi atualizada. Já pode entrar normalmente com ela.
        </p>
        <Link href="/feed" className="mt-6 inline-block text-accent hover:underline">
          Ir para o feed
        </Link>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="font-display text-3xl italic">Link inválido ou expirado</h1>
        <p className="mt-3 text-sm text-muted">
          Esse link de redefinição não é mais válido. Solicite um novo.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-muted">
        Verificando o link...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl italic">Nova senha</h1>
        <p className="mt-2 text-sm text-muted">Escolha uma senha nova pra sua conta.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          required
          placeholder="Nova senha"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />

        <ul className="flex flex-col gap-1 text-xs text-muted">
          <li className={okLen ? "text-accent" : ""}>• pelo menos 8 caracteres</li>
          <li className={okUpper ? "text-accent" : ""}>• uma letra maiúscula</li>
          <li className={okNum ? "text-accent" : ""}>• um número</li>
        </ul>

        <input
          type="password"
          required
          placeholder="Confirmar nova senha"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        {confirmPass.length > 0 && !match && (
          <p className="-mt-2 text-xs text-danger">As senhas não coincidem.</p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={saving || !strong || !match}
          className="mt-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
