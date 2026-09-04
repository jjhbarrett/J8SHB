import { Buffer } from "node:buffer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gallery")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = (url.searchParams.get("id") ?? "").trim();
        const n = Number(url.searchParams.get("n"));
        if (!/^[a-z0-9]{6,12}$/.test(id) || !Number.isInteger(n) || n < 1) {
          return new Response("Not found", { status: 404 });
        }
        const { canReadGallery, loadGallery, loadPhotoBody } = await import(
          "@/lib/galleries.server"
        );
        const row = await loadGallery(id);
        if (!row) return new Response("Not found", { status: 404 });
        if (!canReadGallery(row, id, url.searchParams.get("pin") ?? undefined)) {
          return new Response("Not found", { status: 404 });
        }
        const photo = await loadPhotoBody(id, n);
        if (!photo) return new Response("Not found", { status: 404 });
        return new Response(Buffer.from(photo.body, "base64"), {
          headers: {
            "content-type": "image/jpeg",
            "cache-control": "private, max-age=3600",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
