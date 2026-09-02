import { useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  RedirectToSignIn,
  UserButton,
} from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { btnPrimary, btnQuiet } from "@/lib/chrome";
import { compressImage, formatBytes } from "@/lib/compress-image";
import { useMedia } from "@/lib/media-context";
import { clearMedia, saveMedia } from "@/lib/media";
import { MEDIA_SLOTS, type MediaSlot } from "@/lib/media-slots";
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
      <Group title="Studios">
        {MEDIA_SLOTS.filter((slot) => slot.group === "Studios").map((slot) => (
          <SlotCard key={slot.key} slot={slot} />
        ))}
      </Group>
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

function SlotCard({ slot }: { slot: MediaSlot }) {
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
      setNote("Original restored.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="overflow-hidden rounded-lg bg-surface">
      <div className="aspect-studio overflow-hidden bg-line">
        <img
          src={src}
          alt={slot.label}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-fg">{slot.label}</p>
          <p className="text-sm text-muted">
            {version ? formatBytes(version.bytes) : "Original"}
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
              {busy === "clear" ? "Restoring" : "Restore"}
            </button>
          ) : null}
        </div>
        {note ? <p className="text-sm text-muted">{note}</p> : null}
        {error ? <p className="text-sm text-muted">{error}</p> : null}
      </div>
    </li>
  );
}
