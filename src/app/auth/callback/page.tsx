"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const urlError = url.searchParams.get("error") || hashParams.get("error");
    const urlErrorDescription =
      url.searchParams.get("error_description") || hashParams.get("error_description");

    if (urlError) {
      setError(
        urlErrorDescription
          ? decodeURIComponent(urlErrorDescription.replace(/\+/g, " "))
          : "Esse link não é mais válido."
      );
      return;
    }

    function goToFeed() {
      router.replace("/feed");
      router.refresh();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        goToFeed();
      }
    });

    // Caso a sessão já tenha sido processada antes deste efeito rodar.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goToFeed();
    });

    const timeout = setTimeout(() => {
      setError("Não conseguimos confirmar automaticamente. Tente entrar normalmente.");
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, supabase]);

  if (error) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="font-display text-3xl italic">Ops</h1>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <Link href="/login" className="mt-6 inline-block text-accent hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-muted">
      Confirmando sua conta...
    </div>
  );
}
