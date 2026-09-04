import { timingSafeEqual } from "node:crypto";
import { getCookie, getRequestProtocol, setCookie } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-gate.server";

const PIN_MAX_AGE = 60 * 60 * 24 * 14;

export type GalleryRow = {
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

export type GalleryPhotoMeta = {
  n: number;
  bytes: number;
};

function isHttps(): boolean {
  try {
    return getRequestProtocol() === "https";
  } catch {
    return true;
  }
}

function cookieName(id: string): string {
  return isHttps() ? `__Host-j8g-${id}` : `j8g-${id}`;
}

function pinsEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parsePicks(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(/[,\s]+/)
        .map((part) => Number(part))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].sort((a, b) => a - b);
}

function serializePicks(picks: number[]): string {
  return parsePicks(picks.join(",")).join(",");
}

export function setGalleryCookie(id: string, pin: string): void {
  setCookie(cookieName(id), pin, {
    httpOnly: true,
    secure: isHttps(),
    sameSite: "lax",
    path: "/",
    maxAge: PIN_MAX_AGE,
  });
}

export function galleryCookiePin(id: string): string | null {
  const value = getCookie(cookieName(id))?.trim();
  return value || null;
}

export function canReadGallery(row: { pin: string }, id: string, pin?: string): boolean {
  if (isAdminRequest()) return true;
  const offered = pin?.trim() || galleryCookiePin(id);
  if (!offered) return false;
  return pinsEqual(offered, row.pin);
}

export async function loadGallery(id: string): Promise<{
  id: string;
  name: string;
  instagram: string | null;
  pin: string;
  status: string;
  picks: string;
  created_at: string;
  submitted_at: string | null;
} | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    instagram: string | null;
    pin: string;
    status: string;
    picks: string;
    created_at: string;
    submitted_at: string | null;
  }>`
    select id, name, instagram, pin, status, picks, created_at, submitted_at
    from galleries
    where id = ${id}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function loadPhotoMeta(id: string): Promise<GalleryPhotoMeta[]> {
  const sql = await getSql();
  const rows = await sql<{ n: number; bytes: number }>`
    select n, bytes from gallery_photos
    where gallery_id = ${id}
    order by n asc
  `;
  return rows.map((row) => ({ n: Number(row.n), bytes: Number(row.bytes) }));
}

export async function loadPhotoBody(
  id: string,
  n: number,
): Promise<{ body: string; bytes: number } | null> {
  const sql = await getSql();
  const rows = await sql<{ body: string; bytes: number }>`
    select body, bytes from gallery_photos
    where gallery_id = ${id} and n = ${n}
    limit 1
  `;
  const row = rows[0];
  if (!row?.body || row.body.length < 80) return null;
  return { body: row.body, bytes: Number(row.bytes) };
}

export async function listGalleryRows(): Promise<GalleryRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    instagram: string | null;
    pin: string;
    status: string;
    picks: string;
    created_at: string;
    submitted_at: string | null;
    photo_count: number;
  }>`
    select
      g.id,
      g.name,
      g.instagram,
      g.pin,
      g.status,
      g.picks,
      g.created_at,
      g.submitted_at,
      (select count(*) from gallery_photos p where p.gallery_id = g.id) as photo_count
    from galleries g
    order by g.created_at desc
    limit 40
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    instagram: row.instagram,
    pin: row.pin,
    status: row.status,
    picks: parsePicks(row.picks),
    createdAt: String(row.created_at),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    photoCount: Number(row.photo_count),
  }));
}

export async function insertGallery(row: {
  id: string;
  name: string;
  instagram?: string;
  pin: string;
}): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into galleries (id, name, instagram, pin)
    values (
      ${row.id},
      ${row.name},
      ${row.instagram ?? null},
      ${row.pin}
    )
  `;
}

export async function nextPhotoN(id: string): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ max: number | null }>`
    select max(n) as max from gallery_photos where gallery_id = ${id}
  `;
  return (rows[0]?.max ?? 0) + 1;
}

export async function insertPhoto(row: {
  id: string;
  n: number;
  bytes: number;
  body: string;
}): Promise<void> {
  const sql = await getSql();
  await sql`
    insert into gallery_photos (gallery_id, n, bytes, body)
    values (${row.id}, ${row.n}, ${row.bytes}, ${row.body})
  `;
}

export async function deletePhoto(id: string, n: number): Promise<void> {
  const sql = await getSql();
  await sql`delete from gallery_photos where gallery_id = ${id} and n = ${n}`;
  const rows = await sql<{ picks: string }>`
    select picks from galleries where id = ${id} limit 1
  `;
  const next = parsePicks(rows[0]?.picks).filter((value) => value !== n);
  await sql`update galleries set picks = ${serializePicks(next)} where id = ${id}`;
}

export async function deleteGalleryRow(id: string): Promise<void> {
  const sql = await getSql();
  await sql`delete from gallery_photos where gallery_id = ${id}`;
  await sql`delete from galleries where id = ${id}`;
}

export async function savePicks(id: string, picks: number[]): Promise<void> {
  const sql = await getSql();
  const clean = serializePicks(picks);
  await sql`
    update galleries
    set picks = ${clean}, status = 'submitted', submitted_at = now()
    where id = ${id}
  `;
}

export { parsePicks, serializePicks };
