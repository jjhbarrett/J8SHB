import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/lib/admin-middleware";
import { getSql } from "@/lib/db";
import {
  SEED_VENUE_IDS,
  slugify,
  VENUE_IMAGES,
  VENUES,
  type Venue,
} from "@/lib/site";

type VenueRow = {
  id: string;
  city: string;
  name: string;
  note: string;
  recommended: boolean | number | string;
  sort: number;
};

function toVenue(row: VenueRow): Venue {
  const seed = VENUES.find((item) => item.id === row.id);
  return {
    id: row.id,
    city: row.city,
    name: row.name,
    note: row.note ?? "",
    recommended: Boolean(row.recommended),
    image: VENUE_IMAGES[row.id] ?? seed?.image,
    travelExcess: seed?.travelExcess,
  };
}

function sortVenues(list: Venue[]): Venue[] {
  return [...list].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return a.city.localeCompare(b.city);
  });
}

export const listVenues = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<VenueRow>`
      select id, city, name, note, recommended, sort
      from venues
      order by recommended desc, sort asc, city asc
    `;
    if (rows.length) return sortVenues(rows.map(toVenue));
  } catch {
    /* table not ready */
  }
  return VENUES;
});

export const createVenue = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      city: z.string().trim().min(2).max(60),
      name: z.string().trim().min(2).max(80),
      note: z.string().trim().max(160).optional(),
      recommended: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const existing = await sql<{ id: string }>`select id from venues`;
    const ids = new Set(existing.map((row) => row.id));
    let id = slugify(data.city);
    if (ids.has(id)) id = slugify(`${data.city}-${data.name}`);
    let n = 2;
    while (ids.has(id)) {
      id = `${slugify(data.city)}-${n}`;
      n += 1;
    }
    const sortRows = await sql<{ max: number | null }>`
      select max(sort) as max from venues
    `;
    const sort = Number(sortRows[0]?.max ?? 0) + 1;
    if (data.recommended) {
      await sql`update venues set recommended = false`;
    }
    await sql`
      insert into venues (id, city, name, note, recommended, sort)
      values (
        ${id},
        ${data.city},
        ${data.name},
        ${data.note ?? ""},
        ${Boolean(data.recommended)},
        ${sort}
      )
    `;
    return {
      id,
      city: data.city,
      name: data.name,
      note: data.note ?? "",
      recommended: Boolean(data.recommended),
    } satisfies Venue;
  });

export const setVenueRecommended = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.string().min(2).max(40) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update venues set recommended = false`;
    await sql`update venues set recommended = true where id = ${data.id}`;
    return { ok: true as const };
  });

export const deleteVenue = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.string().min(2).max(40) }))
  .handler(async ({ data }) => {
    if ((SEED_VENUE_IDS as readonly string[]).includes(data.id)) {
      throw new Error("The three core rooms stay on the list.");
    }
    const sql = await getSql();
    await sql`delete from venues where id = ${data.id}`;
    return { ok: true as const, id: data.id };
  });
