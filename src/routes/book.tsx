import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { btnPrimary, fieldClass } from "@/lib/chrome";
import { packageMediaKey } from "@/lib/media-slots";
import { submitShootRequest } from "@/lib/request";
import { sendStudioMail } from "@/lib/form-mail";
import {
  formatLongDate,
  formatRequestWhen,
  formatPrice,
  makeReference,
  nextSixMonths,
  PACKAGES,
  packageById,
  packagePriceLabel,
  SITE,
  travelExcessLabel,
  upcomingStudioDays,
  VENUES,
  venueById,
  type DayKind,
  type PackageId,
  type ShootPackage,
  type StudioDay,
  type Venue,
} from "@/lib/site";
import { listVenues } from "@/lib/venues";
import { cn } from "@/lib/utils";

type BookSearch = {
  studio?: string;
  package?: string;
};

const STEP_CLASS = "scroll-mt-32 sm:scroll-mt-24";

function scrollToStep(id: string) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = () => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
    return true;
  };
  if (run()) return;
  requestAnimationFrame(() => {
    if (run()) return;
    window.setTimeout(() => {
      run();
    }, 80);
  });
}

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    studio: typeof search.studio === "string" ? search.studio : undefined,
    package: typeof search.package === "string" ? search.package : undefined,
  }),
  component: BookPage,
  head: () => ({
    meta: [{ title: "Book a shoot — J8 STUDIOS" }],
  }),
});

function BookPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const months = useMemo(() => nextSixMonths(), []);
  const [venues, setVenues] = useState<Venue[]>(VENUES);

  const initialPackage = packageById(search.package)?.id ?? null;
  const [packageId, setPackageId] = useState<PackageId | null>(initialPackage);
  const [studioId, setStudioId] = useState<string | null>(search.studio ?? null);
  const [day, setDay] = useState<DayKind | null>(
    packageById(initialPackage)?.exclusiveDates ? "exclusive" : null,
  );
  const [month, setMonth] = useState(months[0]?.value ?? "");
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    reference: string;
    packageId: PackageId;
    studioId: string;
    day: DayKind;
    month: string;
    date?: string;
    name: string;
    instagram: string;
    note?: string;
  } | null>(null);
  const landed = useRef(false);

  useEffect(() => {
    void listVenues().then(setVenues).catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = packageById(search.package)?.id ?? null;
    if (next) {
      setPackageId(next);
      setDay((prev) => {
        if (packageById(next)?.exclusiveDates) return "exclusive";
        return prev === "exclusive" ? null : prev;
      });
      if (!packageById(next)?.exclusiveDates) setSlotDate(null);
    }
  }, [search.package]);

  useEffect(() => {
    if (search.studio) setStudioId(search.studio);
  }, [search.studio]);

  useEffect(() => {
    if (landed.current) return;
    if (!packageById(search.package)) return;
    landed.current = true;
    const exclusive = packageById(search.package)?.exclusiveDates;
    const id = exclusive ? "book-when" : search.studio ? "book-when" : "book-studio";
    scrollToStep(id);
    const t = window.setTimeout(() => scrollToStep(id), 280);
    return () => window.clearTimeout(t);
  }, [search.package, search.studio]);

  const shoot = packageById(packageId);
  const studio = venueById(studioId, venues);
  const studioDays = useMemo(() => upcomingStudioDays(), []);
  const exclusive = Boolean(shoot?.exclusiveDates);
  const whenReady = exclusive ? Boolean(slotDate) : Boolean(day);
  const canRequest = Boolean(
    shoot && studio && whenReady && month && name.trim() && instagram.trim(),
  );

  function selectPackage(id: PackageId) {
    setPackageId(id);
    const nextExclusive = Boolean(packageById(id)?.exclusiveDates);
    setDay((prev) => {
      if (nextExclusive) return "exclusive";
      return prev === "exclusive" ? null : prev;
    });
    if (!nextExclusive) setSlotDate(null);
    void navigate({
      search: (prev) => ({ ...prev, package: id }),
      replace: true,
    });
    scrollToStep(nextExclusive || studioId ? "book-when" : "book-studio");
  }

  function selectStudio(id: string) {
    setStudioId(id);
    void navigate({
      search: (prev) => ({ ...prev, studio: id }),
      replace: true,
    });
    scrollToStep("book-when");
  }

  function selectStudioDay(slot: StudioDay) {
    setSlotDate(slot.date);
    setStudioId(slot.venueId);
    setDay("exclusive");
    setMonth(slot.date.slice(0, 7));
    void navigate({
      search: (prev) => ({ ...prev, studio: slot.venueId }),
      replace: true,
    });
    scrollToStep("book-who");
  }

  function selectDay(option: DayKind) {
    setDay(option);
    scrollToStep("book-who");
  }

  function selectMonth(value: string) {
    setMonth(value);
    if (day) scrollToStep("book-who");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!shoot || !studio || !day || !month) return;
    if (exclusive && !slotDate) return;
    setError(null);
    setPending(true);
    const handle = instagram.trim().replace(/^@/, "");
    const referenceGuess = makeReference();
    const when = formatRequestWhen({
      day,
      month,
      date: slotDate ?? undefined,
    });
    const mail = {
      subject: `J8 STUDIOS — ${shoot.name} request · ${referenceGuess}`,
      fields: {
        Reference: referenceGuess,
        Name: name.trim(),
        Instagram: `@${handle}`,
        Shoot: `${shoot.name} · ${packagePriceLabel(shoot)}`,
        Studio: `${studio.name}, ${studio.city}`,
        When: when,
        Note: note.trim() || "—",
      },
    };
    const payload = {
      packageId: shoot.id,
      studioId: studio.id,
      day,
      month,
      date: slotDate ?? undefined,
      name: name.trim(),
      instagram: instagram.trim(),
      note: note.trim() || undefined,
      company: company.trim() || undefined,
    };
    try {
      const [server, mailed] = await Promise.all([
        submitShootRequest({ data: payload })
          .then((result) => result)
          .catch(() => null),
        sendStudioMail(mail)
          .then(() => true)
          .catch(() => false),
      ]);
      if (!server && !mailed) {
        setError("Could not send the request. Try again, or write via Contact.");
        return;
      }
      setDone({
        reference: server?.reference ?? referenceGuess,
        packageId: shoot.id,
        studioId: studio.id,
        day,
        month,
        date: slotDate ?? undefined,
        name: name.trim(),
        instagram: handle,
        note: note.trim() || undefined,
      });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    const booked = venueById(done.studioId, venues);
    const bookedShoot = packageById(done.packageId);
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-20">
        <p className="text-sm font-medium text-muted">Request received</p>
        <h1 className="mt-4 text-display text-fg">Thank you</h1>
        <p className="mt-6 text-lead font-light text-fg">
          We’ll check the room and confirm within 24 hours. A {formatPrice(SITE.hold)} hold
          secures the date.
        </p>
        <dl className="mt-12 space-y-5 text-body">
          <Row label="Reference" value={done.reference} />
          <Row
            label="Shoot"
            value={
              bookedShoot
                ? `${bookedShoot.name} · ${packagePriceLabel(bookedShoot)}`
                : done.packageId
            }
          />
          <Row
            label="Studio"
            value={
              booked
                ? `${booked.name} · ${booked.city}${
                    travelExcessLabel(booked) ? ` · ${travelExcessLabel(booked)}` : ""
                  }`
                : done.studioId
            }
          />
          <Row
            label="When"
            value={formatRequestWhen({
              day: done.day,
              month: done.month,
              date: done.date,
            })}
          />
          <Row label="Name" value={done.name} />
          <Row label="Instagram" value={`@${done.instagram}`} />
          {done.note ? <Row label="Note" value={done.note} /> : null}
        </dl>
        <p className="mt-12 text-body text-muted">
          Screenshot this page. Confirmation comes by email or Instagram.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Book a shoot</p>
      <h1 className="mt-4 text-display text-fg">Request a date</h1>
      <p className="mt-4 max-w-xl text-body text-muted">
        Prices include the studio. Josh checks his diary and the room. This is a
        request, not a payment.
      </p>

      <form onSubmit={onSubmit} className="mt-16 space-y-16">
        <section id="book-shoot" className={STEP_CLASS}>
          <Step n="01" title="Choose the shoot" />
          <ul className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {PACKAGES.map((item) => (
              <li key={item.id}>
                <PackageChoice
                  item={item}
                  selected={packageId === item.id}
                  onSelect={() => selectPackage(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        {shoot && !exclusive ? (
          <section id="book-studio" className={cn("fade-in", STEP_CLASS)}>
            <Step n="02" title="Choose the studio" />
            <div className="mt-8">
              <StudioCards
                studios={venues}
                selectedId={studioId}
                onSelect={selectStudio}
              />
            </div>
          </section>
        ) : null}

        {shoot && (exclusive || studio) ? (
          <section id="book-when" className={cn("fade-in", STEP_CLASS)}>
            <Step n={exclusive ? "02" : "03"} title="When" />
            {exclusive ? (
              <div className="mt-8 max-w-xl">
                <p className="text-body text-muted">
                  Days Josh is already in the room. Pick one — the studio is on
                  the date.
                </p>
                {studioDays.length === 0 ? (
                  <p className="mt-8 text-body text-fg">
                    None posted yet.{" "}
                    <Link
                      to="/contact"
                      className="underline decoration-line underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      Write
                    </Link>{" "}
                    or request a 1–1 for your own date.
                  </p>
                ) : (
                  <ul className="mt-8 space-y-3">
                    {studioDays.map((slot) => {
                      const room = venueById(slot.venueId, venues);
                      const selected =
                        slotDate === slot.date && studioId === slot.venueId;
                      return (
                        <li key={`${slot.date}-${slot.venueId}`}>
                          <button
                            type="button"
                            onClick={() => selectStudioDay(slot)}
                            aria-pressed={selected}
                            className={cn(
                              "flex w-full flex-col gap-1 rounded-lg px-5 py-4 text-left transition-colors duration-200",
                              selected
                                ? "bg-fg text-bg"
                                : "text-fg ring-1 ring-line hover:ring-fg/45",
                            )}
                          >
                            <span className="text-base font-medium">
                              {formatLongDate(slot.date)}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                selected ? "text-bg/80" : "text-muted",
                              )}
                            >
                              {room
                                ? `${room.name}, ${room.city}`
                                : slot.venueId}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-12">
                <fieldset>
                  <legend className="text-sm text-muted">Day</legend>
                  <div className="mt-3 flex gap-3">
                    {(["weekday", "weekend"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectDay(option)}
                        aria-pressed={day === option}
                        className={cn(
                          "min-h-11 min-w-28 rounded-full px-4 text-sm font-medium capitalize transition-colors duration-200",
                          day === option
                            ? "bg-fg text-bg"
                            : "text-fg ring-1 ring-line hover:ring-fg/45",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="block min-w-56">
                  <span className="text-sm text-muted">Month</span>
                  <select
                    value={month}
                    onChange={(e) => selectMonth(e.target.value)}
                    className={cn(fieldClass, "appearance-none")}
                  >
                    {months.map((item) => (
                      <option key={item.value} value={item.value} className="bg-bg text-fg">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </section>
        ) : null}

        {shoot && studio && whenReady ? (
          <section id="book-who" className={cn("fade-in", STEP_CLASS)}>
            <Step n={exclusive ? "03" : "04"} title="Who" />
            <div className="mt-8 grid max-w-xl grid-cols-1 gap-6">
              <label className="block">
                <span className="text-sm text-muted">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Instagram</span>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={fieldClass}
                  placeholder="@handle"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-muted">Shoot</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={fieldClass}
                  placeholder="fitness / boudoir / dance"
                  maxLength={120}
                />
              </label>
              <label className="sr-only" aria-hidden="true">
                Company
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
          </section>
        ) : null}

        {shoot && studio && whenReady ? (
          <section id="book-request" className={cn("fade-in pb-8", STEP_CLASS)}>
            <Step n={exclusive ? "04" : "05"} title="Request" />
            <p className="mt-6 max-w-xl text-body text-muted">
              {shoot.name}, {packagePriceLabel(shoot)}. {studio.name}, {studio.city}
              {travelExcessLabel(studio) ? `. ${travelExcessLabel(studio)}` : ""}.{" "}
              {formatRequestWhen({
                day: day ?? "exclusive",
                month,
                date: slotDate ?? undefined,
              })}
              .
            </p>
            {error ? <p className="mt-4 text-body text-muted">{error}</p> : null}
            <button
              type="submit"
              disabled={!canRequest || pending}
              className={cn(btnPrimary, "mt-8 min-h-12 px-8")}
            >
              {pending ? "Sending" : "Request this studio"}
            </button>
          </section>
        ) : null}
      </form>
    </main>
  );
}

function PackageChoice({
  item,
  selected,
  onSelect,
}: {
  item: ShootPackage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className="w-full text-left">
      <PhotoFrame
        mediaKey={packageMediaKey(item.id)}
        alt={item.name}
        label="SHOOT"
        className={cn(
          "aspect-studio",
          selected && "ring-2 ring-fg ring-offset-4 ring-offset-bg",
        )}
        width={1200}
        height={900}
        sizes="(min-width: 640px) 50vw, 100vw"
      />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-normal tracking-display text-fg">{item.name}</h3>
        <p className="text-sm font-medium text-fg">{packagePriceLabel(item)}</p>
      </div>
      <p className="mt-2 text-sm text-muted">
        {item.exclusiveDates
          ? `Posted dates only · ${item.hours}`
          : item.hours}
      </p>
    </button>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-sm text-muted">{n}</span>
      <h2 className="text-3xl font-light tracking-display text-fg sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-8">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-fg sm:text-right">{value}</dd>
    </div>
  );
}
