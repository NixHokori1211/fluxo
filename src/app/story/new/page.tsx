"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/upload";
import { ImagePlus } from "lucide-react";

export default function NewStoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(f: File | null) {
    if (f) {
      const validationError = validateImageFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    if (!file) {
      setError("Escolha uma imagem pro seu story.");
      return;
    }

    setLoading(true);

    const path = `${user.id}/${crypto.randomUUID()}.webp`;

    const { error: uploadError } = await supabase.storage.from("stories").upload(path, file);

    if (uploadError) {
      setLoading(false);
      setError("Falha ao enviar a imagem. Tente novamente.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("stories").getPublicUrl(path);

    const { error: insertError } = await supabase.from("stories").insert({
      author_id: user.id,
      image_url: publicUrl,
    });

    setLoading(false);

    if (insertError) {
      setError("Falha ao publicar o story. Tente novamente.");
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl italic">Novo story</h1>
      <p className="mt-1 text-sm text-muted">Fica visível por 24 horas.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex aspect-[9/16] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface text-muted hover:border-accent">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pré-visualização" className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <>
              <ImagePlus size={32} />
              <span className="text-sm">Escolher imagem</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar story"}
        </button>
      </form>
    </div>
  );
}
