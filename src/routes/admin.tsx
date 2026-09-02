import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { btnPrimary, btnQuiet, fieldClass } from "@/lib/chrome";
import { compressImage, formatBytes } from "@/lib/compress-image";
import { useMedia } from "@/lib/media-context";
import { clearMedia, saveMedia } from "@/lib/media";
import {
  isStudioGalleryKey,
  MEDIA_SLOTS,
  nextStudioGalleryKey,
  studioMediaKey,
  type MediaSlot,
} from "@/lib/media-slots";
import { SEED_VENUE_IDS, VENUES, type Venue } from "@/lib/site";
import {
  createVenue,
  deleteVenue,
  listVenues,
  setVenueRecommended,
} from "@/lib/venues";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Media — J8 STUDIOS" }],
  }),
});

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="mx-auto w-full max-w-7xl px-5 py-16">
        <div className="h-8 w-40 rounded-full bg-surface" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Admin</p>
          <h1 className="mt-4 text-display text-fg">Media</h1>
          <p className="mt-4 max-w-xl text-body text-muted">
            Pick a photo. It is compressed automatically, then it replaces that
            slot on the site.
          </p>
        </div>
        <UserButton />
      </div>

      <Group title="Home">
        {MEDIA_SLOTS.filter((slot) => slot.group === "Home").map((slot) => (
          <SlotCard key={slot.key} slot={slot} />
        ))}
      </Group>

      <Group title="Shoot covers">
        {MEDIA_SLOTS.filter((slot) => slot.group === "Shoots").map((slot) => (
          <SlotCard key={slot.key} slot={slot} emptyLabel="SHOOT" />
        ))}
      </Group>

      <StudioImages />

      <Group title="Work">
        {MEDIA_SLOTS.filter((slot) => slot.group === "Work").map((slot) => (
          <SlotCard key={slot.key} slot={slot} />
        ))}
      </Group>

      <p className="mt-16 text-sm text-muted">
        Home uses work 01–09. The live site is{" "}
        <Link to="/" className="text-fg">
          here
        </Link>
        .
      </p>
    </main>
  );
}

function StudioImages() {
  const { versions } = useMedia();
  const [venues, setVenues] = useState<Venue[]>(VENUES);
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setVenues(await listVenues());
    } catch {
      /* keep */
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createVenue({
        data: {
          city: city.trim(),
          name: name.trim(),
          note: note.trim() || undefined,
          recommended,
        },
      });
      setCity("");
      setName("");
      setNote("");
      setRecommended(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that studio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14">
      <h2 className="text-sm font-medium text-muted">Studio images</h2>
      <p className="mt-3 max-w-xl text-body text-muted">
        Cover stills for Pricing and Book. Add extra photos of the room, or add
        another studio.
      </p>

      <div className="mt-8 space-y-16">
        {venues.map((venue) => {
          const extras = Object.keys(versions)
            .filter((key) => isStudioGalleryKey(key, venue.id))
            .sort();
          const seed = (SEED_VENUE_IDS as readonly string[]).includes(venue.id);
          return (
            <div key={venue.id}>
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-xl font-normal tracking-display text-fg">
                    {venue.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">{venue.city}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {venue.recommended ? (
                    <span className="text-sm text-fg">Recommended</span>
                  ) : (
                    <button
                      type="button"
                      className={cn(btnQuiet, "min-h-10 px-4")}
                      onClick={() =>
                        void setVenueRecommended({ data: { id: venue.id } }).then(
                          reload,
                        )
                      }
                    >
                      Make recommended
                    </button>
                  )}
                  {seed ? null : (
                    <button
                      type="button"
                      className={cn(btnQuiet, "min-h-10 px-4")}
                      onClick={() =>
                        void deleteVenue({ data: { id: venue.id } }).then(reload)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <SlotCard
                  slot={{
                    key: studioMediaKey(venue.id),
                    label: "Cover",
                    group: "Studios",
                    fallback: venue.image,
                    maxWidth: 1000,
                  }}
                  emptyLabel="STUDIO"
                />
                {extras.map((key, index) => (
                  <SlotCard
                    key={key}
                    slot={{
                      key,
                      label: `Photo ${index + 2}`,
                      group: "Studios",
                      maxWidth: 1000,
                    }}
                    emptyLabel="STUDIO"
                  />
                ))}
                <AddPhotoCard
                  venueId={venue.id}
                  existingKeys={[studioMediaKey(venue.id), ...extras]}
                />
              </ul>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={onAdd}
        className="mt-12 max-w-xl space-y-5 rounded-lg bg-surface p-5 sm:p-6"
      >
        <p className="text-sm font-medium text-fg">Add a studio</p>
        <label className="block">
          <span className="text-sm text-muted">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Studio name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Note</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
            maxLength={160}
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-fg">
          <input
            type="checkbox"
            checked={recommended}
            onChange={(e) => setRecommended(e.target.checked)}
          />
          Recommended
        </label>
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Adding" : "Add studio"}
        </button>
      </form>
    </section>
  );
}

function AddPhotoCard({
  venueId,
  existingKeys,
}: {
  venueId: string;
  existingKeys: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { patch } = useMedia();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const key = nextStudioGalleryKey(venueId, existingKeys);
      const compressed = await compressImage(file, 1000);
      const saved = await saveMedia({
        data: {
          key,
          mime: "image/jpeg",
          body: compressed.base64,
          bytes: compressed.bytes,
        },
      });
      patch(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that still.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <li className="overflow-hidden rounded-lg bg-surface">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex aspect-studio w-full items-center justify-center"
      >
        <span className="text-sm text-muted">
          {busy ? "Compressing" : "Add photo"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
      {error ? <p className="p-4 text-sm text-muted">{error}</p> : null}
    </li>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </ul>
    </section>
  );
}

function SlotCard({
  slot,
  emptyLabel = "PORTFOLIO",
}: {
  slot: MediaSlot;
  emptyLabel?: "STUDIO" | "PORTFOLIO" | "SHOOT";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { srcFor, versions, patch } = useMedia();
  const [busy, setBusy] = useState<"compress" | "save" | "clear" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const version = versions[slot.key];
  const src = srcFor(slot.key, slot.fallback);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setNote(null);
    setBusy("compress");
    try {
      const compressed = await compressImage(file, slot.maxWidth);
      setBusy("save");
      const saved = await saveMedia({
        data: {
          key: slot.key,
          mime: "image/jpeg",
          body: compressed.base64,
          bytes: compressed.bytes,
        },
      });
      patch(saved);
      setNote(
        `${formatBytes(compressed.originalBytes)} → ${formatBytes(compressed.bytes)} · ${compressed.width}×${compressed.height}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that still.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function restore() {
    setError(null);
    setBusy("clear");
    try {
      await clearMedia({ data: { key: slot.key } });
      patch({ key: slot.key, clear: true });
      setNote(slot.fallback ? "Original restored." : "Removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="overflow-hidden rounded-lg bg-surface">
      <div className="aspect-studio overflow-hidden bg-line">
        {src ? (
          <img src={src} alt={slot.label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-40 items-center justify-center">
            <span className="text-sm text-muted">{emptyLabel}</span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-fg">{slot.label}</p>
          <p className="text-sm text-muted">
            {version ? formatBytes(version.bytes) : slot.fallback ? "Original" : "Empty"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => inputRef.current?.click()}
            className={cn(btnPrimary, "min-h-10 px-4")}
          >
            {busy === "compress"
              ? "Compressing"
              : busy === "save"
                ? "Saving"
                : "Replace"}
          </button>
          {version ? (
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void restore()}
              className={cn(btnQuiet, "min-h-10 px-4")}
            >
              {busy === "clear" ? "Restoring" : slot.fallback ? "Restore" : "Remove"}
            </button>
          ) : null}
        </div>
        {note ? <p className="text-sm text-muted">{note}</p> : null}
        {error ? <p className="text-sm text-muted">{error}</p> : null}
      </div>
    </li>
  );
}
