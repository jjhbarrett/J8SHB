import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StudioCards } from "@/components/studio-cards";
import { submitShootRequest } from "@/lib/request";
import {
  formatMonth,
  formatPrice,
  nextSixMonths,
  SITE,
  studioById,
  STUDIOS,
  type DayKind,
  type StudioId,
} from "@/lib/site";
import { cn } from "@/lib/utils";

type BookSearch = {
  studio?: string;
};

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    studio: typeof search.studio === "string" ? search.studio : undefined,
  }),
  component: BookPage,
  head: () => ({
    meta: [{ title: "Book a shoot — J8 STUDIOS" }],
  }),
});

const fieldClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-body text-fg outline-none transition-[border-color] duration-200 placeholder:text-muted focus:border-fg";

function BookPage() {
  const { studio: studioParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const months = useMemo(() => nextSixMonths(), []);

  const initialStudio = studioById(studioParam)?.id ?? null;
  const [studioId, setStudioId] = useState<StudioId | null>(initialStudio);
  const [day, setDay] = useState<DayKind | null>(null);
  const [month, setMonth] = useState(months[0]?.value ?? "");
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    reference: string;
    studioId: StudioId;
    day: DayKind;
    month: string;
    name: string;
    instagram: string;
    note?: string;
  } | null>(null);

  useEffect(() => {
    const next = studioById(studioParam)?.id ?? null;
    if (next) setStudioId(next);
  }, [studioParam]);

  const studio = studioById(studioId ?? undefined);
  const canRequest = Boolean(
    studio && day && month && name.trim() && instagram.trim(),
  );

  function selectStudio(id: StudioId) {
    setStudioId(id);
    void navigate({ search: { studio: id }, replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!studio || !day || !month) return;
    setError(null);
    setPending(true);
    try {
      const result = await submitShootRequest({
        data: {
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
    const booked = studioById(done.studioId);
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-20">
        <p className="text-label uppercase tracking-label text-muted">
          Request received
        </p>
        <h1 className="mt-4 font-display text-display text-fg">Thank you</h1>
        <p className="mt-6 text-lead text-fg">
          We’ll check the room and confirm within 24 hours. A {formatPrice(SITE.hold)} hold
          secures the date.
        </p>
        <dl className="mt-12 space-y-5 border-t border-line pt-8 text-body">
          <Row label="Reference" value={done.reference} />
          <Row
            label="Studio"
            value={
              booked
                ? `${booked.name} · ${booked.city} · ${formatPrice(booked.price)}`
                : done.studioId
            }
          />
          <Row
            label="When"
            value={`${done.day === "weekend" ? "Weekend" : "Weekday"} · ${formatMonth(done.month)}`}
          />
          <Row label="Name" value={done.name} />
          <Row label="Instagram" value={`@${done.instagram}`} />
          {done.note ? <Row label="Shoot" value={done.note} /> : null}
        </dl>
        <p className="mt-12 text-body text-muted">
          Screenshot this page. Confirmation comes by email or Instagram.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-label uppercase tracking-label text-muted">Book a shoot</p>
      <h1 className="mt-4 font-display text-display text-fg">Request a studio</h1>
      <p className="mt-4 max-w-xl text-body text-muted">
        Two hours. Josh checks his diary and the room. This is a request, not a
        payment.
      </p>

      <form onSubmit={onSubmit} className="mt-16 space-y-20">
        <section>
          <Step n="01" title="Choose the studio" />
          <div className="mt-8">
            <StudioCards
              studios={STUDIOS}
              selectedId={studioId}
              onSelect={selectStudio}
            />
          </div>
          <p className="mt-8 text-body text-muted">
            Prices include the studio. You don’t pay the room on top.
          </p>
        </section>

        {studio ? (
          <section className="fade-in">
            <Step n="02" title="When" />
            <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-12">
              <fieldset>
                <legend className="text-label uppercase tracking-label text-muted">
                  Day
                </legend>
                <div className="mt-3 flex gap-3">
                  {(["weekday", "weekend"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDay(option)}
                      aria-pressed={day === option}
                      className={cn(
                        "min-h-11 min-w-28 border px-4 text-label uppercase tracking-label transition-colors duration-200",
                        day === option
                          ? "border-fg bg-fg text-bg"
                          : "border-line text-fg hover:border-fg",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block min-w-56">
                <span className="text-label uppercase tracking-label text-muted">
                  Month
                </span>
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
          </section>
        ) : null}

        {studio && day ? (
          <section className="fade-in">
            <Step n="03" title="Who" />
            <div className="mt-8 grid max-w-xl grid-cols-1 gap-8">
              <label className="block">
                <span className="text-label uppercase tracking-label text-muted">
                  Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-label uppercase tracking-label text-muted">
                  Instagram
                </span>
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
                <span className="text-label uppercase tracking-label text-muted">
                  Shoot
                </span>
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

        {studio && day ? (
          <section className="fade-in pb-12">
            <Step n="04" title="Request" />
            <p className="mt-6 max-w-xl text-body text-muted">
              {studio.name}, {studio.city}. {day === "weekend" ? "Weekend" : "Weekday"}{" "}
              {formatMonth(month)}. {formatPrice(studio.price)}, including the room.
            </p>
            {error ? <p className="mt-4 text-body text-muted">{error}</p> : null}
            <button
              type="submit"
              disabled={!canRequest || pending}
              className="mt-8 min-h-12 border border-fg px-8 text-label uppercase tracking-label text-fg disabled:opacity-40"
            >
              {pending ? "Sending" : "Request this studio"}
            </button>
          </section>
        ) : null}
      </form>
    </main>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-label uppercase tracking-label text-muted">{n}</span>
      <h2 className="font-display text-3xl text-fg sm:text-4xl">{title}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-8">
      <dt className="text-label uppercase tracking-label text-muted">{label}</dt>
      <dd className="text-fg sm:text-right">{value}</dd>
    </div>
  );
}
