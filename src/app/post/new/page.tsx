"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/upload";
import { BarChart3, ImagePlus, Plus, X } from "lucide-react";

const MAX_PHOTOS = 10;
const MAX_POLL_OPTIONS = 4;

type PickedFile = { file: File; preview: string };

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  function updatePollOption(index: number, value: string) {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

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

    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (pollEnabled) {
      if (!pollQuestion.trim()) {
        setError("Escreva a pergunta da enquete.");
        return;
      }
      if (cleanOptions.length < 2) {
        setError("A enquete precisa de pelo menos 2 opções preenchidas.");
        return;
      }
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

    if (imagesError) {
      setLoading(false);
      setError("Publicação criada, mas houve um problema salvando as fotos extras.");
      return;
    }

    if (pollEnabled) {
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({ post_id: post.id, question: pollQuestion.trim() })
        .select("id")
        .single();

      if (pollError || !poll) {
        setLoading(false);
        setError("Publicação criada, mas não foi possível criar a enquete.");
        return;
      }

      const { error: optionsError } = await supabase.from("poll_options").insert(
        cleanOptions.map((text, position) => ({ poll_id: poll.id, text, position }))
      );

      if (optionsError) {
        setLoading(false);
        setError("Publicação criada, mas houve um problema salvando as opções da enquete.");
        return;
      }
    }

    setLoading(false);

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

        {!pollEnabled ? (
          <button
            type="button"
            onClick={() => setPollEnabled(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted hover:border-accent hover:text-accent"
          >
            <BarChart3 size={16} />
            Adicionar enquete
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BarChart3 size={16} /> Enquete
              </span>
              <button
                type="button"
                onClick={() => {
                  setPollEnabled(false);
                  setPollQuestion("");
                  setPollOptions(["", ""]);
                }}
                aria-label="Remover enquete"
                className="text-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              maxLength={140}
              placeholder="Qual é a pergunta?"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />

            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={(e) => updatePollOption(i, e.target.value)}
                maxLength={80}
                placeholder={`Opção ${i + 1}`}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            ))}

            {pollOptions.length < MAX_POLL_OPTIONS && (
              <button
                type="button"
                onClick={() => setPollOptions((prev) => [...prev, ""])}
                className="flex items-center gap-1 self-start text-xs text-accent hover:underline"
              >
                <Plus size={12} /> Adicionar opção
              </button>
            )}
          </div>
        )}

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
