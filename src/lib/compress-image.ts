export type CompressedImage = {
  base64: string;
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  originalBytes: number;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

async function encode(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress the image.");
  ctx.fillStyle = "#0c0b0a";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not compress the image.");
  return blob;
}

export async function compressImage(
  file: File,
  maxWidth: number,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));

  let quality = 0.7;
  let blob = await encode(bitmap, width, height, quality);
  if (blob.size > 480_000) {
    quality = 0.55;
    blob = await encode(bitmap, width, height, quality);
  }
  if (blob.size > 480_000) {
    quality = 0.42;
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
    blob = await encode(bitmap, width, height, quality);
  }
  if (blob.size > 480_000) {
    quality = 0.32;
    blob = await encode(bitmap, width, height, quality);
  }
  bitmap.close();

  const base64 = await blobToBase64(blob);
  return {
    base64,
    dataUrl: `data:image/jpeg;base64,${base64}`,
    bytes: blob.size,
    width,
    height,
    originalBytes: file.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
