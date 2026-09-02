import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/lib/admin-middleware";
import { getSql } from "@/lib/db";
import { isMediaKey } from "@/lib/media-slots";

export type MediaVersion = {
  key: string;
  bytes: number;
  updatedAt: string;
};

export const listMedia = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<{
    key: string;
    bytes: number;
    updated_at: string;
  }>`select key, bytes, updated_at from media`;
  const out: MediaVersion[] = [];
  for (const row of rows) {
    if (!isMediaKey(row.key)) continue;
    out.push({
      key: row.key,
      bytes: row.bytes,
      updatedAt: String(row.updated_at),
    });
  }
  return out;
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
    const sql = await getSql();
    await sql`
      insert into media (key, mime, body, bytes, updated_at)
      values (${data.key}, ${data.mime}, ${data.body}, ${data.bytes}, now())
      on conflict (key) do update set
        mime = excluded.mime,
        body = excluded.body,
        bytes = excluded.bytes,
        updated_at = now()
    `;
    const rows = await sql<{ updated_at: string }>`
      select updated_at from media where key = ${data.key}
    `;
    return {
      key: data.key,
      bytes: data.bytes,
      updatedAt: rows[0]?.updated_at ?? new Date().toISOString(),
    } satisfies MediaVersion;
  });

export const clearMedia = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ key: mediaKeySchema }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from media where key = ${data.key}`;
    return { ok: true as const, key: data.key };
  });
