export const SITE = {
  name: "J8 STUDIOS",
  city: "Winchester",
  line: "Editorial fitness photography. Winchester.",
  positioning: "Editorial fitness photography. Studio, physique, boudoir.",
  email: "studio@j8studios.com",
  instagramHandle: "j8studios",
  instagramUrl: "https://instagram.com/j8studios",
  hold: 50,
} as const;

export const PACKAGE_IDS = [
  "studio-days",
  "signature",
  "duo",
  "group",
] as const;
export type PackageId = (typeof PACKAGE_IDS)[number];

export type ShootPackage = {
  id: PackageId;
  name: string;
  blurb?: string;
  price: number | null;
  each?: number;
  hours: string;
  includes: string[];
};

export const PACKAGES: ShootPackage[] = [
  {
    id: "studio-days",
    name: "Studio Days",
    blurb:
      "Your own private 1.5 hour slot. Reduced rate — Josh is in the studio all day.",
    price: 250,
    hours: "1.5 hours",
    includes: [
      "10 edited images, chosen by you",
      "Studio cost included",
    ],
  },
  {
    id: "signature",
    name: "Signature Private Shoot",
    price: 350,
    hours: "2 hours",
    includes: [
      "15 edited images, chosen by you",
      "Studio cost included",
      "BTS footage included",
    ],
  },
  {
    id: "duo",
    name: "Duo Shoot",
    price: 450,
    each: 250,
    hours: "3 hours",
    includes: [
      "10 edited images each, chosen by you",
      "Studio cost included",
      "BTS footage included",
    ],
  },
  {
    id: "group",
    name: "Group Shoots",
    price: null,
    hours: "4–6 hours",
    includes: ["Custom pricing"],
  },
];

export const SEED_VENUE_IDS = ["northampton", "london", "hampshire"] as const;

export type Venue = {
  id: string;
  city: string;
  name: string;
  note: string;
  recommended: boolean;
  image?: string;
};

export const VENUE_IMAGES: Record<string, string> = {
  hampshire: "/images/studios/hampshire.jpg",
  london: "/images/studios/london.jpg",
  northampton: "/images/studios/northampton.jpg",
};

export const VENUES: Venue[] = [
  {
    id: "northampton",
    city: "Northampton",
    name: "Lite Studios, Weedon Bec",
    note: "The room people wait for.",
    recommended: true,
    image: VENUE_IMAGES.northampton,
  },
  {
    id: "london",
    city: "London",
    name: "Flash Studios, E16",
    note: "Clean white studio.",
    recommended: false,
    image: VENUE_IMAGES.london,
  },
  {
    id: "hampshire",
    city: "Andover, Hampshire",
    name: "The Andover Studio",
    note: "Close, large, natural light.",
    recommended: false,
    image: VENUE_IMAGES.hampshire,
  },
];

/** @deprecated use VENUES — kept for older call sites */
export const STUDIOS = VENUES;
export const STUDIO_IDS = SEED_VENUE_IDS;
export type StudioId = (typeof SEED_VENUE_IDS)[number];
export type Studio = Venue;

export function packageById(id: string | undefined | null): ShootPackage | undefined {
  if (!id) return undefined;
  return PACKAGES.find((item) => item.id === id);
}

export function venueById(
  id: string | undefined | null,
  list: Venue[] = VENUES,
): Venue | undefined {
  if (!id) return undefined;
  return list.find((item) => item.id === id);
}

export function studioById(id: string | undefined | null): Venue | undefined {
  return venueById(id);
}

export function formatPrice(gbp: number): string {
  return `£${gbp}`;
}

export function packagePriceLabel(item: ShootPackage): string {
  if (item.price == null) return "Custom";
  if (item.each) return `${formatPrice(item.price)} · ${formatPrice(item.each)} each`;
  return formatPrice(item.price);
}

export type WorkStill = {
  id: string;
  src: string;
  alt: string;
  kind: "physique" | "dance" | "boudoir" | "portrait";
};

export const WORK: WorkStill[] = [
  {
    id: "01",
    src: "/images/work/01.jpg",
    alt: "Fitness physique, studio",
    kind: "physique",
  },
  {
    id: "02",
    src: "/images/work/02.jpg",
    alt: "Contemporary dance, studio",
    kind: "dance",
  },
  {
    id: "03",
    src: "/images/work/03.jpg",
    alt: "Bodybuilding portrait, studio",
    kind: "physique",
  },
  {
    id: "04",
    src: "/images/work/04.jpg",
    alt: "Fitness portrait, studio",
    kind: "portrait",
  },
  {
    id: "05",
    src: "/images/work/05.jpg",
    alt: "Physique, back and shoulders",
    kind: "physique",
  },
  {
    id: "06",
    src: "/images/work/06.jpg",
    alt: "Dance still, studio",
    kind: "dance",
  },
  {
    id: "07",
    src: "/images/work/07.jpg",
    alt: "Studio boudoir, silk robe",
    kind: "boudoir",
  },
  {
    id: "08",
    src: "/images/work/08.jpg",
    alt: "Physique in profile, studio",
    kind: "physique",
  },
  {
    id: "09",
    src: "/images/work/09.jpg",
    alt: "Physique portrait, studio",
    kind: "portrait",
  },
  {
    id: "10",
    src: "/images/work/10.jpg",
    alt: "Dance still, studio",
    kind: "dance",
  },
  {
    id: "11",
    src: "/images/work/11.jpg",
    alt: "Close crop, studio portrait",
    kind: "portrait",
  },
  {
    id: "12",
    src: "/images/work/12.jpg",
    alt: "Physique, full figure in studio",
    kind: "physique",
  },
];

export const HOME_WORK = WORK.slice(0, 9);

export type DayKind = "weekday" | "weekend";

export function nextSixMonths(from = new Date()): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-GB", { month: "long", year: "numeric" }),
    });
  }
  return months;
}

export function formatMonth(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export function makeReference(): string {
  const now = Date.now().toString(36).toUpperCase();
  return `J8-${now.slice(-6)}`;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return slug || "studio";
}
