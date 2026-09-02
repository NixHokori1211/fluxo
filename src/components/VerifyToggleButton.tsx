"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VerifyToggleButton({
  targetUserId,
  initiallyVerified,
}: {
  targetUserId: string;
  initiallyVerified: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [verified, setVerified] = useState(initiallyVerified);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !verified;

    const { error } = await supabase.rpc("set_verified", {
      target_id: targetUserId,
      new_verified: next,
    });

    setLoading(false);

    if (!error) {
      setVerified(next);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-black/5 disabled:opacity-50"
    >
      {verified ? "Remover selo" : "Conceder selo ✓"}
    </button>
  );
}
