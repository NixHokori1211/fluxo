export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB, precisa bater com o limite do bucket no Supabase

/**
 * Confere tipo e tamanho de um arquivo de imagem antes de tentar o upload.
 * Retorna uma mensagem de erro em português, ou null se estiver tudo certo.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Escolha um arquivo de imagem (jpg, png, webp, etc).";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return `Essa imagem passou de ${mb} MB. Escolha uma menor.`;
  }
  return null;
}
