"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/upload";
import { ImagePlus, X } from "lucide-react";

const MAX_PHOTOS = 10;

type PickedFile = { file: File; preview: string };

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    const room = MAX_PHOTOS - files.length;

    if (incoming.length > room) {
      setError(`Você pode escolher no máximo ${MAX_PHOTOS} fotos por publicação.`);
    } else {
      setError(null);
    }

    const toAdd = incoming.slice(0, room);
    for (const f of toAdd) {
      const validationError = validateImageFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setFiles((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
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

    if (files.length === 0) {
      setError("Escolha pelo menos uma imagem para publicar.");
      return;
    }

    setLoading(true);

    // Sobe todas as fotos em paralelo
    const uploads = await Promise.all(
      files.map(async ({ file }) => {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("posts").upload(path, file);
        if (uploadError) return null;
        const {
          data: { publicUrl },
        } = supabase.storage.from("posts").getPublicUrl(path);
        return publicUrl;
      })
    );

    if (uploads.some((url) => url === null)) {
      setLoading(false);
      setError("Falha ao enviar uma das imagens. Tente novamente.");
      return;
    }

    const urls = uploads as string[];

    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        image_url: urls[0], // capa, usada na grade do perfil
        caption: caption.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !post) {
      setLoading(false);
      setError("Falha ao publicar. Tente novamente.");
      return;
    }

    const { error: imagesError } = await supabase.from("post_images").insert(
      urls.map((image_url, position) => ({
        post_id: post.id,
        image_url,
        position,
      }))
    );

    setLoading(false);

    if (imagesError) {
      setError("Publicação criada, mas houve um problema salvando as fotos extras.");
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl italic">Nova publicação</h1>
      <p className="mt-1 text-sm text-muted">
        Escolha até {MAX_PHOTOS} fotos — a primeira vira a capa do post.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {files.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {files.map((f, i) => (
              <div key={f.preview} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.preview}
                  alt={`Foto ${i + 1}`}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label="Remover foto"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface text-muted hover:border-accent">
            <ImagePlus size={32} />
            <span className="text-sm">
              {files.length === 0 ? "Escolher fotos" : "Adicionar mais fotos"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Escreva uma legenda..."
          rows={3}
          className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Publicando..." : "Publicar"}
        </button>
      </form>
    </div>
  );
}
