import { useEffect, useRef, useState, type FormEvent } from "react";
import { compressImage, formatBytes } from "@/lib/compress-image";
import { btnPrimary, btnQuiet, fieldClass } from "@/lib/chrome";
import {
  addGalleryPhoto,
  createGallery,
  listGalleries,
  removeGallery,
  removeGalleryPhoto,
  type GallerySummary,
  type GalleryView,
  getGallery,
} from "@/lib/galleries";
import { cn } from "@/lib/utils";

let uploadChain: Promise<void> = Promise.resolve();
function queueUpload<T>(fn: () => Promise<T>): Promise<T> {
  const run = uploadChain.then(fn, fn);
  uploadChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function copyMessage(gallery: { id: string; pin: string; name: string }): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.j8shb.com";
  return `your proofs are up\n\n${origin}/g/${gallery.id}\ncode ${gallery.pin}\n\npick the ones you want — I’ll edit those`;
}

export function GalleriesAdmin() {
  const [rows, setRows] = useState<GallerySummary[] | null>(null);
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function reload() {
    try {
      setRows(await listGalleries());
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await createGallery({
        data: {
          name: name.trim(),
          instagram: instagram.trim() || undefined,
        },
      });
      setName("");
      setInstagram("");
      setOpenId(created.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create that gallery.");
    } finally {
      setBusy(false);
    }
  }

  async function onCopy(row: GallerySummary) {
    const text = copyMessage(row);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(row.id);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy. Select the message instead.");
    }
  }

  return (
    <section className="mt-14">
      <h2 className="text-sm font-medium text-muted">Galleries</h2>
      <p className="mt-3 max-w-xl text-body text-muted">
        Private proofing. They get a link and a code, pick stills, you get a
        note.
      </p>

      <form onSubmit={onCreate} className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="text-sm text-muted">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-sm text-muted">Instagram</span>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={fieldClass}
            placeholder="@handle"
          />
        </label>
        {error ? <p className="text-sm text-muted sm:col-span-2">{error}</p> : null}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Creating" : "New gallery"}
          </button>
        </div>
      </form>

      {rows === null ? (
        <div className="mt-8 h-16 rounded-lg bg-surface" />
      ) : rows.length === 0 ? (
        <p className="mt-8 text-body text-fg">None yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg bg-surface px-5 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-base font-medium text-fg">{row.name}</p>
                <p className="text-sm text-muted">
                  {row.photoCount} stills
                  {row.picks.length ? ` · ${row.picks.length} picked` : ""}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">
                Code {row.pin}
                {row.instagram ? ` · @${row.instagram}` : ""}
                {row.status === "submitted" ? " · picks in" : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId((current) => (current === row.id ? null : row.id))}
                  className={cn(btnQuiet, "min-h-10 px-4")}
                >
                  {openId === row.id ? "Close" : "Open"}
                </button>
                <button
                  type="button"
                  onClick={() => void onCopy(row)}
                  className={cn(btnQuiet, "min-h-10 px-4")}
                >
                  {copied === row.id ? "Copied" : "Copy message"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Remove ${row.name}?`)) return;
                    void removeGallery({ data: { id: row.id } })
                      .then(reload)
                      .catch(() => undefined);
                  }}
                  className={cn(btnQuiet, "min-h-10 px-4")}
                >
                  Remove
                </button>
              </div>
              {openId === row.id ? <GalleryEditor id={row.id} pin={row.pin} /> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GalleryEditor({ id, pin }: { id: string; pin: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<GalleryView | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const result = await getGallery({ data: { id, pin } });
    if (!result.locked) setView(result);
  }

  useEffect(() => {
    void reload().catch(() => undefined);
  }, [id, pin]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setBusy(true);
    let count = 0;
    try {
      for (const file of Array.from(list)) {
        const compressed = await compressImage(file, 1600);
        await queueUpload(() =>
          addGalleryPhoto({
            data: {
              id,
              mime: "image/jpeg",
              body: compressed.base64,
              bytes: compressed.bytes,
            },
          }),
        );
        count += 1;
        setNote(`${count} saved`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add that still.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!view) {
    return <p className="mt-4 text-sm text-muted">Loading stills.</p>;
  }

  return (
    <div className="mt-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void onFiles(event.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(btnPrimary, "min-h-10 px-4")}
      >
        {busy ? "Saving" : "Add photos"}
      </button>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
      {error ? <p className="mt-3 text-sm text-muted">{error}</p> : null}
      {view.picks.length ? (
        <p className="mt-4 text-sm text-fg">
          Picked {view.picks.map((n) => String(n).padStart(2, "0")).join(", ")}
        </p>
      ) : null}
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {view.photos.map((photo) => {
          const picked = view.picks.includes(photo.n);
          return (
            <li key={photo.n} className="overflow-hidden rounded-lg bg-bg">
              <img
                src={photo.url}
                alt={`Still ${photo.n}`}
                className="h-auto w-full object-contain"
              />
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="text-sm text-muted">
                  {String(photo.n).padStart(2, "0")}
                  {picked ? " · picked" : ""}
                  {photo.bytes ? ` · ${formatBytes(photo.bytes)}` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void removeGalleryPhoto({ data: { id, n: photo.n } })
                      .then(reload)
                      .catch(() => undefined);
                  }}
                  className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
