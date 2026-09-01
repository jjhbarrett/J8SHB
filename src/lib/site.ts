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

export const STUDIO_IDS = ["hampshire", "london", "northampton"] as const;
export type StudioId = (typeof STUDIO_IDS)[number];

export type Studio = {
  id: StudioId;
  city: string;
  name: string;
  vibe: string;
  hours: string;
  price: number;
  image: string;
};

export const STUDIOS: Studio[] = [
  {
    id: "hampshire",
    city: "Hampshire",
    name: "The Andover Studio",
    vibe: "Close, large, natural light. The local room, not the premium one.",
    hours: "2 hours",
    price: 265,
    image: "/images/studios/hampshire.jpg",
  },
  {
    id: "london",
    city: "London",
    name: "Flash Studios, E16",
    vibe: "Clean white studio.",
    hours: "2 hours",
    price: 350,
    image: "/images/studios/london.jpg",
  },
  {
    id: "northampton",
    city: "Northampton",
    name: "Lite Studios, Weedon Bec",
    vibe: "Rustic, premium. The room people wait for.",
    hours: "2 hours",
    price: 380,
    image: "/images/studios/northampton.jpg",
  },
];

export function studioById(id: string | undefined | null): Studio | undefined {
  if (!id) return undefined;
  return STUDIOS.find((s) => s.id === id);
}

export function formatPrice(gbp: number): string {
  return `£${gbp}`;
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
