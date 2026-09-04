import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { btnPrimary, btnQuiet, fieldClass } from "@/lib/chrome";
import {
  getGallery,
  submitGalleryPicks,
  type GalleryView,
} from "@/lib/galleries";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/g/$id")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: `Proofs — ${SITE.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function GalleryPage() {
  const { id } = Route.useParams();
  const [pin, setPin] = useState("");
  const [gallery, setGallery] = useState<GalleryView | null>(null);
  const [lockedName, setLockedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [picks, setPicks] = useState<number[]>([]);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void getGallery({ data: { id } })
      .then((result) => {
        if (!live) return;
        if (result.locked) {
          setLockedName(result.name);
          setGallery(null);
          return;
        }
        setGallery(result);
        setPicks(result.picks);
        setSent(result.status === "submitted" && result.picks.length > 0);
      })
      .catch(() => {
        if (live) setError("That gallery isn’t here.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id]);

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await getGallery({ data: { id, pin: pin.trim() } });
      if (result.locked) {
        setError("That code doesn’t match.");
        return;
      }
      setGallery(result);
      setPicks(result.picks);
      setSent(result.status === "submitted" && result.picks.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open that gallery.");
    } finally {
      setPending(false);
    }
  }

  function toggle(n: number) {
    setPicks((current) =>
      current.includes(n) ? current.filter((item) => item !== n) : [...current, n].sort((a, b) => a - b),
    );
    setSent(false);
  }

  async function onSend() {
    if (!gallery || picks.length === 0) return;
    setError(null);
    setPending(true);
    try {
      const result = await submitGalleryPicks({
        data: { id: gallery.id, pin: pin.trim() || undefined, picks },
      });
      setPicks(result.picks);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the picks.");
    } finally {
      setPending(false);
    }
  }

  const stills = gallery?.photos ?? [];
  const active = useMemo(
    () => stills.find((photo) => photo.n === open) ?? null,
    [open, stills],
  );

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <div className="h-8 w-40 rounded-full bg-surface" />
      </main>
    );
  }

  if (!gallery) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-12 sm:py-20">
        <p className="text-sm font-medium text-muted">Proofs</p>
        <h1 className="mt-4 text-display text-fg">
          {lockedName ? lockedName : "Private gallery"}
        </h1>
        <p className="mt-4 text-body text-muted">
          Enter the four-digit code from Josh.
        </p>
        <form onSubmit={onUnlock} className="mt-10 space-y-6">
          <label className="block">
            <span className="text-sm text-muted">Code</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={fieldClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              required
            />
          </label>
          {error ? <p className="text-body text-muted">{error}</p> : null}
          <button type="submit" disabled={pending || pin.length !== 4} className={btnPrimary}>
            {pending ? "Opening" : "Open gallery"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Proofs</p>
      <h1 className="mt-4 text-display text-fg">{gallery.name}</h1>
      <p className="mt-4 max-w-lg text-body text-muted">
        Full frames — nothing cropped. Tap Pick on the ones you want edited.
        Proofs first; finals follow in two to three weeks.
      </p>

      {stills.length === 0 ? (
        <p className="mt-16 text-body text-fg">Photos aren’t up yet.</p>
      ) : (
        <ul className="mt-10 space-y-8 pb-28">
          {stills.map((photo) => {
            const picked = picks.includes(photo.n);
            return (
              <li key={photo.n}>
                <button
                  type="button"
                  onClick={() => setOpen(photo.n)}
                  className="relative block w-full"
                  aria-label={`Open still ${photo.n}`}
                >
                  <img
                    src={photo.url}
                    alt={`Still ${String(photo.n).padStart(2, "0")}`}
                    className="h-auto w-full rounded-lg bg-surface object-contain"
                    decoding="async"
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                  />
                  <span aria-hidden className="absolute inset-0" />
                </button>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {String(photo.n).padStart(2, "0")}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggle(photo.n)}
                    aria-pressed={picked}
                    className={cn(
                      "min-h-11 min-w-24 rounded-full px-4 text-sm font-medium transition-colors duration-200",
                      picked
                        ? "bg-fg text-bg"
                        : "text-fg ring-1 ring-line hover:ring-fg/45",
                    )}
                  >
                    {picked ? "Picked" : "Pick"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {stills.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-5 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {picks.length} picked
              {sent ? " · sent" : ""}
            </p>
            <button
              type="button"
              disabled={pending || picks.length === 0}
              onClick={() => void onSend()}
              className={btnPrimary}
            >
              {pending ? "Sending" : sent ? "Update picks" : "Send picks"}
            </button>
          </div>
          {error ? <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">{error}</p> : null}
        </div>
      ) : null}

      {active ? (
        <Lightbox
          src={active.url}
          label={String(active.n).padStart(2, "0")}
          picked={picks.includes(active.n)}
          onToggle={() => toggle(active.n)}
          onClose={() => setOpen(null)}
          onPrev={() => {
            const index = stills.findIndex((photo) => photo.n === active.n);
            const prev = stills[(index - 1 + stills.length) % stills.length];
            if (prev) setOpen(prev.n);
          }}
          onNext={() => {
            const index = stills.findIndex((photo) => photo.n === active.n);
            const next = stills[(index + 1) % stills.length];
            if (next) setOpen(next.n);
          }}
        />
      ) : null}
    </main>
  );
}

function Lightbox({
  src,
  label,
  picked,
  onToggle,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  label: string;
  picked: boolean;
  onToggle: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 fade-in"
    >
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Close" />
      <div className="relative z-10 max-h-[82svh] max-w-[min(100%,42rem)] p-4">
        <img
          src={src}
          alt={label}
          className="max-h-[82svh] w-auto max-w-full object-contain"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
        <span aria-hidden className="absolute inset-4" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
        <p className="text-sm text-muted">{label}</p>
        <button
          type="button"
          onClick={onClose}
          className={cn(btnQuiet, "pointer-events-auto")}
        >
          Close
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-5 py-5">
        <button type="button" onClick={onPrev} className={cn(btnQuiet, "pointer-events-auto")}>
          Prev
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={cn(picked ? btnPrimary : btnQuiet, "pointer-events-auto")}
        >
          {picked ? "Picked" : "Pick"}
        </button>
        <button type="button" onClick={onNext} className={cn(btnQuiet, "pointer-events-auto")}>
          Next
        </button>
      </div>
    </div>
  );
}
