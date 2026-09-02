import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { btnPrimary, fieldClass } from "@/lib/chrome";
import { packageMediaKey } from "@/lib/media-slots";
import { submitShootRequest } from "@/lib/request";
import {
  formatDayKind,
  formatMonth,
  formatPrice,
  nextSixMonths,
  PACKAGES,
  packageById,
  packagePriceLabel,
  SITE,
  travelExcessLabel,
  VENUES,
  venueById,
  type DayKind,
  type PackageId,
  type ShootPackage,
  type Venue,
} from "@/lib/site";
import { listVenues } from "@/lib/venues";
import { cn } from "@/lib/utils";

type BookSearch = {
  studio?: string;
  package?: string;
};

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
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    reference: string;
    packageId: PackageId;
    studioId: string;
    day: DayKind;
    month: string;
    name: string;
    instagram: string;
    note?: string;
  } | null>(null);

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
    }
  }, [search.package]);

  useEffect(() => {
    if (search.studio) setStudioId(search.studio);
  }, [search.studio]);

  const shoot = packageById(packageId);
  const studio = venueById(studioId, venues);
  const canRequest = Boolean(
    shoot && studio && day && month && name.trim() && instagram.trim(),
  );

  function selectPackage(id: PackageId) {
    setPackageId(id);
    setDay((prev) => {
      if (packageById(id)?.exclusiveDates) return "exclusive";
      return prev === "exclusive" ? null : prev;
    });
    void navigate({
      search: (prev) => ({ ...prev, package: id }),
      replace: true,
    });
  }

  function selectStudio(id: string) {
    setStudioId(id);
    void navigate({
      search: (prev) => ({ ...prev, studio: id }),
      replace: true,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!shoot || !studio || !day || !month) return;
    setError(null);
    setPending(true);
    try {
      const result = await submitShootRequest({
        data: {
          packageId: shoot.id,
          studioId: studio.id,
          day,
          month,
          name: name.trim(),
          instagram: instagram.trim(),
          note: note.trim() || undefined,
        },
      });
      setDone({
        reference: result.reference,
        packageId: shoot.id,
        studioId: studio.id,
        day,
        month,
        name: name.trim(),
        instagram: instagram.trim().replace(/^@/, ""),
        note: note.trim() || undefined,
      });
    } catch {
      setError("Could not send the request. Try again, or write via Contact.");
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
            value={`${formatDayKind(done.day)} · ${formatMonth(done.month)}`}
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
        <section>
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

        {shoot ? (
          <section className="fade-in">
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

        {shoot && studio ? (
          <section className="fade-in">
            <Step n="03" title="When" />
            {shoot.exclusiveDates ? (
              <div className="mt-8 max-w-xl">
                <p className="text-body text-muted">
                  Exclusive dates only. Josh publishes the next studio days.
                  Tell us the month you can do.
                </p>
                <label className="mt-8 block min-w-56">
                  <span className="text-sm text-muted">Month</span>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
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
            ) : (
              <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-12">
                <fieldset>
                  <legend className="text-sm text-muted">Day</legend>
                  <div className="mt-3 flex gap-3">
                    {(["weekday", "weekend"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDay(option)}
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
                    onChange={(e) => setMonth(e.target.value)}
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

        {shoot && studio && day ? (
          <section className="fade-in">
            <Step n="04" title="Who" />
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
            </div>
          </section>
        ) : null}

        {shoot && studio && day ? (
          <section className="fade-in pb-8">
            <Step n="05" title="Request" />
            <p className="mt-6 max-w-xl text-body text-muted">
              {shoot.name}, {packagePriceLabel(shoot)}. {studio.name}, {studio.city}
              {travelExcessLabel(studio) ? `. ${travelExcessLabel(studio)}` : ""}.{" "}
              {formatDayKind(day)} {formatMonth(month)}.
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
          ? `Exclusive dates only · ${item.hours}`
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
