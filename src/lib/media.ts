import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/lib/admin-middleware";
import { getSql } from "@/lib/db";
import { isMediaKey, mediaUrl } from "@/lib/media-slots";

export type MediaVersion = {
  key: string;
  bytes: number;
  updatedAt: string;
  url?: string;
};

export const listMedia = createServerFn({ method: "GET" }).handler(async () => {
  const { listPersistedMedia } = await import("@/lib/media-github.server");
  const persisted = await listPersistedMedia();
  const byKey = new Map<string, MediaVersion>();
  for (const row of persisted) byKey.set(row.key, row);
  try {
    const sql = await getSql();
    const rows = await sql<{
      key: string;
      bytes: number;
      updated_at: string;
      body: string;
    }>`select key, bytes, updated_at, body from media`;
    for (const row of rows) {
      if (!isMediaKey(row.key)) continue;
      if (byKey.has(row.key)) continue;
      if (!row.body || row.body.length < 80) continue;
      byKey.set(row.key, {
        key: row.key,
        bytes: row.bytes,
        updatedAt: String(row.updated_at),
        url: mediaUrl(row.key, row.updated_at),
      });
    }
  } catch {
    /* github index is enough */
  }
  return [...byKey.values()];
});

const mediaKeySchema = z.string().min(4).max(64).refine(isMediaKey, {
  message: "Unknown media slot.",
});

export const saveMedia = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      key: mediaKeySchema,
      mime: z.literal("image/jpeg"),
      body: z.string().min(80).max(1_200_000),
      bytes: z.number().int().min(80).max(900_000),
    }),
  )
  .handler(async ({ data }) => {
    const { persistMediaJpeg } = await import("@/lib/media-github.server");
    return persistMediaJpeg(data.key, data.body, data.bytes);
  });

export const clearMedia = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ key: mediaKeySchema }))
  .handler(async ({ data }) => {
    const { removePersistedMedia } = await import("@/lib/media-github.server");
    await removePersistedMedia(data.key);
    try {
      const sql = await getSql();
      await sql`delete from media where key = ${data.key}`;
    } catch {
      /* github is source of truth */
    }
    return { ok: true as const, key: data.key };
  });
