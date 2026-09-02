import { PACKAGE_IDS, type PackageId } from "@/lib/site";

export const MEDIA_KEYS = [
  "hero",
  "studio-hampshire",
  "studio-london",
  "studio-northampton",
  "package-studio-days",
  "package-signature",
  "package-duo",
  "package-group",
  "work-01",
  "work-02",
  "work-03",
  "work-04",
  "work-05",
  "work-06",
  "work-07",
  "work-08",
  "work-09",
  "work-10",
  "work-11",
  "work-12",
] as const;

export type StaticMediaKey = (typeof MEDIA_KEYS)[number];
export type MediaKey = string;

const MEDIA_KEY_PATTERN =
  /^(hero|work-\d{2}|studio-[a-z0-9]+(?:-[a-z0-9]+)*|package-[a-z0-9-]+)$/;

export type MediaSlot = {
  key: MediaKey;
  label: string;
  group: "Home" | "Shoots" | "Studios" | "Work";
  maxWidth: number;
};

export const MEDIA_SLOTS: MediaSlot[] = [
  { key: "hero", label: "Home hero", group: "Home", maxWidth: 1600 },
  { key: "package-studio-days", label: "Studio Days", group: "Shoots", maxWidth: 1400 },
  { key: "package-signature", label: "1–1 Private", group: "Shoots", maxWidth: 1400 },
  { key: "package-duo", label: "Duo Shoot", group: "Shoots", maxWidth: 1400 },
  { key: "package-group", label: "Group Shoot", group: "Shoots", maxWidth: 1400 },
  { key: "studio-northampton", label: "Northampton", group: "Studios", maxWidth: 1000 },
  { key: "studio-london", label: "London", group: "Studios", maxWidth: 1000 },
  { key: "studio-hampshire", label: "Andover, Hampshire", group: "Studios", maxWidth: 1000 },
  { key: "work-01", label: "Work 01", group: "Work", maxWidth: 800 },
  { key: "work-02", label: "Work 02", group: "Work", maxWidth: 800 },
  { key: "work-03", label: "Work 03", group: "Work", maxWidth: 800 },
  { key: "work-04", label: "Work 04", group: "Work", maxWidth: 800 },
  { key: "work-05", label: "Work 05", group: "Work", maxWidth: 800 },
  { key: "work-06", label: "Work 06", group: "Work", maxWidth: 800 },
  { key: "work-07", label: "Work 07", group: "Work", maxWidth: 800 },
  { key: "work-08", label: "Work 08", group: "Work", maxWidth: 800 },
  { key: "work-09", label: "Work 09", group: "Work", maxWidth: 800 },
  { key: "work-10", label: "Work 10", group: "Work", maxWidth: 800 },
  { key: "work-11", label: "Work 11", group: "Work", maxWidth: 800 },
  { key: "work-12", label: "Work 12", group: "Work", maxWidth: 800 },
];

export function isMediaKey(value: string): boolean {
  return value.length >= 4 && value.length <= 64 && MEDIA_KEY_PATTERN.test(value);
}

export function stillFileUrl(key: string, updatedAt?: string | number): string {
  const stamp = updatedAt ? `?t=${encodeURIComponent(String(updatedAt))}` : "";
  return `/media/${key}.jpg${stamp}`;
}

export function mediaUrl(key: string, updatedAt: string | number): string {
  return stillFileUrl(key, updatedAt);
}

export function studioMediaKey(id: string): MediaKey {
  return `studio-${id}`;
}

export function studioGalleryKey(id: string, index: number): MediaKey {
  return `studio-${id}-${index}`;
}

export function packageMediaKey(id: PackageId): MediaKey {
  return `package-${id}`;
}

export function workMediaKey(id: string): MediaKey {
  const key = `work-${id}`;
  return isMediaKey(key) ? key : "work-01";
}

export function isStudioCoverKey(key: string, venueId: string): boolean {
  return key === studioMediaKey(venueId);
}

export function isStudioGalleryKey(key: string, venueId: string): boolean {
  return key.startsWith(`studio-${venueId}-`) && isMediaKey(key);
}

export function nextStudioGalleryKey(venueId: string, keys: string[]): MediaKey {
  let max = 1;
  const prefix = `studio-${venueId}-`;
  for (const key of keys) {
    if (!key.startsWith(prefix)) continue;
    const n = Number(key.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return studioGalleryKey(venueId, max + 1);
}

export { PACKAGE_IDS };
