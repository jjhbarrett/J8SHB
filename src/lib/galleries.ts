import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/lib/admin-middleware";

const idSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]{6,12}$/);

const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/);

export type GallerySummary = {
  id: string;
  name: string;
  instagram: string | null;
  pin: string;
  status: string;
  picks: number[];
  createdAt: string;
  submittedAt: string | null;
  photoCount: number;
};

export type GalleryView = {
  locked: false;
  id: string;
  name: string;
  instagram: string | null;
  status: string;
  picks: number[];
  photos: { n: number; bytes: number; url: string }[];
  pin?: string;
};

export type GalleryLocked = {
  locked: true;
  id: string;
  name: string;
};

export function galleryPhotoUrl(id: string, n: number): string {
  return `/api/gallery?id=${encodeURIComponent(id)}&n=${n}`;
}

function makeId(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}

function makePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export const listGalleries = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const { listGalleryRows } = await import("@/lib/galleries.server");
    try {
      return await listGalleryRows();
    } catch {
      return [] as GallerySummary[];
    }
  });

export const createGallery = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      name: z.string().trim().min(1).max(80),
      instagram: z
        .string()
        .trim()
        .max(80)
        .transform((value) => value.replace(/^@/, ""))
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { insertGallery } = await import("@/lib/galleries.server");
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const id = makeId();
      const pin = makePin();
      try {
        await insertGallery({
          id,
          name: data.name,
          instagram: data.instagram || undefined,
          pin,
        });
        return { id, pin, name: data.name } as const;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Could not create.");
      }
    }
    throw lastError ?? new Error("Could not create that gallery.");
  });

export const addGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      id: idSchema,
      mime: z.literal("image/jpeg"),
      body: z.string().min(80).max(1_200_000),
      bytes: z.number().int().min(80).max(900_000),
    }),
  )
  .handler(async ({ data }) => {
    const { insertPhoto, loadGallery, nextPhotoN } = await import(
      "@/lib/galleries.server"
    );
    const gallery = await loadGallery(data.id);
    if (!gallery) throw new Error("That gallery isn’t here.");
    const n = await nextPhotoN(data.id);
    if (n > 60) throw new Error("That’s as many stills as this gallery can hold.");
    await insertPhoto({
      id: data.id,
      n,
      bytes: data.bytes,
      body: data.body,
    });
    return { n, url: galleryPhotoUrl(data.id, n), bytes: data.bytes };
  });

export const removeGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema, n: z.number().int().min(1).max(60) }))
  .handler(async ({ data }) => {
    const { deletePhoto } = await import("@/lib/galleries.server");
    await deletePhoto(data.id, data.n);
    return { ok: true as const };
  });

export const removeGallery = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: idSchema }))
  .handler(async ({ data }) => {
    const { deleteGalleryRow } = await import("@/lib/galleries.server");
    await deleteGalleryRow(data.id);
    return { ok: true as const };
  });

export const getGallery = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: idSchema,
      pin: pinSchema.optional(),
    }),
  )
  .handler(async ({ data }): Promise<GalleryView | GalleryLocked> => {
    const {
      canReadGallery,
      loadGallery,
      loadPhotoMeta,
      setGalleryCookie,
    } = await import("@/lib/galleries.server");
    const { isAdminRequest } = await import("@/lib/admin-gate.server");
    const row = await loadGallery(data.id);
    if (!row) throw new Error("That gallery isn’t here.");
    if (!canReadGallery(row, data.id, data.pin)) {
      return { locked: true, id: row.id, name: row.name };
    }
    if (data.pin) setGalleryCookie(data.id, data.pin);
    const photos = await loadPhotoMeta(data.id);
    const { parsePicks } = await import("@/lib/galleries.server");
    const admin = isAdminRequest();
    return {
      locked: false,
      id: row.id,
      name: row.name,
      instagram: row.instagram,
      status: row.status,
      picks: parsePicks(row.picks),
      photos: photos.map((photo) => ({
        n: photo.n,
        bytes: photo.bytes,
        url: galleryPhotoUrl(row.id, photo.n),
      })),
      pin: admin ? row.pin : undefined,
    };
  });

export const submitGalleryPicks = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: idSchema,
      pin: pinSchema.optional(),
      picks: z.array(z.number().int().min(1).max(60)).max(60),
    }),
  )
  .handler(async ({ data }) => {
    const {
      canReadGallery,
      loadGallery,
      loadPhotoMeta,
      savePicks,
    } = await import("@/lib/galleries.server");
    const row = await loadGallery(data.id);
    if (!row) throw new Error("That gallery isn’t here.");
    if (!canReadGallery(row, data.id, data.pin)) {
      throw new Error("That code doesn’t match.");
    }
    const photos = await loadPhotoMeta(data.id);
    const allowed = new Set(photos.map((photo) => photo.n));
    const picks = [...new Set(data.picks.filter((n) => allowed.has(n)))].sort(
      (a, b) => a - b,
    );
    if (picks.length === 0) throw new Error("Pick at least one still.");
    await savePicks(data.id, picks);
    const { recordEnquiry } = await import("@/lib/enquiries");
    const { sendEnquiryMail } = await import("@/lib/notify.server");
    const labels = picks.map((n) => String(n).padStart(2, "0")).join(", ");
    const subject = `Picks from ${row.name} · ${picks.length} of ${photos.length}`;
    const fields = {
      Gallery: row.name,
      Instagram: row.instagram ? `@${row.instagram}` : "-",
      Picks: labels,
      Link: `/g/${row.id}`,
    };
    await recordEnquiry({
      id: `P-${row.id}-${Date.now().toString(36)}`,
      kind: "picks",
      reference: row.id,
      name: row.name,
      instagram: row.instagram ?? undefined,
      subject,
      body: `Picks: ${labels}`,
    });
    await sendEnquiryMail({
      id: `P-${row.id}`,
      subject: `J8 STUDIOS · ${subject}`,
      fields,
    });
    return { ok: true as const, picks };
  });
