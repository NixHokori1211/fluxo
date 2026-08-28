import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Fluxo implícito: o link de e-mail (confirmação/reset) funciona mesmo
        // sendo aberto em outro navegador/app diferente de onde a ação começou.
        flowType: "implicit",
      },
    }
  );
}
