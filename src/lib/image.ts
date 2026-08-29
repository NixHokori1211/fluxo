/**
 * Recorta uma imagem no centro em formato quadrado e redimensiona,
 * devolvendo um novo File pronto pra upload (menor e sempre 1:1).
 */
export async function cropToSquare(file: File, size = 512): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, size, size);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85)
  );

  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}
