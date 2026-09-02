import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { isMediaKey } from "@/lib/media-slots";

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") ?? "";
        if (!isMediaKey(key)) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const sql = await getSql();
          const rows = await sql<{ mime: string; body: string }>`
            select mime, body from media where key = ${key} limit 1
          `;
          const row = rows[0];
          if (row?.body && row.body.length >= 80 && !row.body.startsWith("gh:")) {
            return new Response(Buffer.from(row.body, "base64"), {
              headers: {
                "content-type": row.mime || "image/jpeg",
                "cache-control": "public, max-age=31536000, immutable",
              },
            });
          }
        } catch {
          /* fall through to github */
        }
        const { listPersistedMedia } = await import("@/lib/media-github.server");
        const match = (await listPersistedMedia()).find((row) => row.key === key);
        if (match?.url) {
          return Response.redirect(match.url, 302);
        }
        return new Response("Not found", { status: 404 });
      },
    },
  },
});
