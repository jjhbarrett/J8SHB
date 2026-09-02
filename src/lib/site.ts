export const SITE = {
  name: "J8 STUDIOS",
  city: "Winchester",
  line: "Editorial fitness photography. Winchester.",
  positioning: "Editorial fitness photography. Studio, physique, boudoir.",
  email: "j8shb@icloud.com",
  instagramHandle: "j8shb",
  instagramUrl: "https://instagram.com/j8shb",
  hold: 50,
} as const;

export const PACKAGE_IDS = [
  "signature",
  "duo",
  "studio-days",
  "group",
] as const;
export type PackageId = (typeof PACKAGE_IDS)[number];

export type ShootPackage = {
  id: PackageId;
  name: string;
  blurb?: string;
  price: number | null;
  each?: number;
  minPeople?: number;
  hours: string;
  includes: string[];
  exclusiveDates?: boolean;
};

export const PACKAGES: ShootPackage[] = [
  {
    id: "signature",
    name: "1–1 Private",
    blurb: "Your date. The room is yours.",
    price: 299,
    hours: "2 hours",
    includes: [
      "15 edited images, chosen by you",
      "Studio cost included",
    ],
  },
  {
    id: "duo",
    name: "Duo Shoot",
    price: 390,
    each: 195,
    hours: "2.5 hours",
    includes: [
      "15 edited images each, chosen by you",
      "Studio cost included",
    ],
  },
  {
    id: "studio-days",
    name: "Studio Days",
    blurb:
      "A private 1.5 hour slot on a day Josh is already in the studio.",
    price: 200,
    hours: "1.5 hours",
    exclusiveDates: true,
    includes: [
      "10 edited images, chosen by you",
      "Studio cost included",
    ],
  },
  {
    id: "group",
    name: "Group Shoot",
    price: null,
    hours: "From 3 hours",
    includes: [
      "Min. 3 people",
      "10 edited images each, chosen by you",
      "Studio cost included",
    ],
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
  travelExcess?: number;
};

export const VENUE_IMAGES: Record<string, string> = {
  hampshire: "/media/studio-hampshire.jpg",
  london: "/media/studio-london.jpg",
  northampton: "/media/studio-northampton.jpg",
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
  if (item.each) {
    return item.minPeople
      ? `${formatPrice(item.each)} each · min. ${item.minPeople}`
      : `${formatPrice(item.each)} each`;
  }
  if (item.price == null) return "Contact for quote";
  return formatPrice(item.price);
}

export type DayKind = "weekday" | "weekend" | "exclusive";

export function formatDayKind(day: DayKind): string {
  if (day === "exclusive") return "Exclusive date";
  return day === "weekend" ? "Weekend" : "Weekday";
}

export function travelExcessLabel(venue: Venue): string | null {
  if (!venue.travelExcess) return null;
  return `Travel excess ${formatPrice(venue.travelExcess)}`;
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
    src: "/media/work-01.jpg",
    alt: "Fitness physique, studio",
    kind: "physique",
  },
  {
    id: "02",
    src: "/media/work-02.jpg",
    alt: "Contemporary dance, studio",
    kind: "dance",
  },
  {
    id: "03",
    src: "/media/work-03.jpg",
    alt: "Bodybuilding portrait, studio",
    kind: "physique",
  },
  {
    id: "04",
    src: "/media/work-04.jpg",
    alt: "Fitness portrait, studio",
    kind: "portrait",
  },
  {
    id: "05",
    src: "/media/work-05.jpg",
    alt: "Physique, back and shoulders",
    kind: "physique",
  },
  {
    id: "06",
    src: "/media/work-06.jpg",
    alt: "Dance still, studio",
    kind: "dance",
  },
  {
    id: "07",
    src: "/media/work-07.jpg",
    alt: "Studio boudoir, silk robe",
    kind: "boudoir",
  },
  {
    id: "08",
    src: "/media/work-08.jpg",
    alt: "Physique in profile, studio",
    kind: "physique",
  },
  {
    id: "09",
    src: "/media/work-09.jpg",
    alt: "Physique portrait, studio",
    kind: "portrait",
  },
  {
    id: "10",
    src: "/media/work-10.jpg",
    alt: "Dance still, studio",
    kind: "dance",
  },
  {
    id: "11",
    src: "/media/work-11.jpg",
    alt: "Close crop, studio portrait",
    kind: "portrait",
  },
  {
    id: "12",
    src: "/media/work-12.jpg",
    alt: "Physique, full figure in studio",
    kind: "physique",
  },
];

export const HOME_WORK = WORK.slice(0, 9);

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
