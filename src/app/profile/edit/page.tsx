"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cropToSquare } from "@/lib/image";
import { ImagePlus } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url")
        .eq("id", user.id)
        .single();

      setUserId(user.id);
      setUsername(profile?.username ?? "");
      setDisplayName(profile?.display_name ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarFile(file: File | null) {
    if (!file) {
      setNewAvatarFile(null);
      setAvatarPreview(null);
      return;
    }

    setProcessingAvatar(true);
    try {
      const cropped = await cropToSquare(file);
      setNewAvatarFile(cropped);
      setAvatarPreview(URL.createObjectURL(cropped));
    } catch {
      // Se o navegador não suportar o recorte, envia a imagem original mesmo.
      setNewAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } finally {
      setProcessingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setError(null);
    setSaving(true);

    let finalAvatarUrl = avatarUrl;

    if (newAvatarFile) {
      const ext = newAvatarFile.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, newAvatarFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setError("Falha ao enviar a foto. Tente novamente.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      // Evita cache de imagem antiga com o mesmo nome de arquivo
      finalAvatarUrl = `${publicUrl}?v=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: finalAvatarUrl,
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(
        updateError.message.includes("duplicate")
          ? "Esse nome de usuário já está em uso."
          : "Falha ao salvar. Tente novamente."
      );
      return;
    }

    router.push(`/profile/${username.trim()}`);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="font-display text-2xl italic">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-muted hover:border-accent">
            {processingAvatar ? (
              <span className="text-xs">Ajustando...</span>
            ) : avatarPreview || avatarUrl ? (
              <Image
                src={avatarPreview ?? avatarUrl!}
                alt="Foto de perfil"
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={!!avatarPreview}
              />
            ) : (
              <ImagePlus size={22} />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-sm text-muted">
            Toque no círculo pra trocar a foto — ela é recortada em quadrado automaticamente.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Nome de usuário
          <input
            type="text"
            required
            minLength={3}
            pattern="[a-z0-9_.]+"
            title="Apenas letras minúsculas, números, pontos e underscores"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Nome de exibição
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || processingAvatar}
            className="flex-1 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
