import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto max-w-7xl px-5 pb-10">
        <div className="flex flex-col gap-8 rounded-xl bg-surface px-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <div className="space-y-3">
            <p className="font-display text-2xl tracking-wordmark text-fg">
              {SITE.name}
            </p>
            <p className="max-w-xs text-body text-muted">{SITE.line}</p>
            <p className="max-w-xs text-body text-muted">
              Physique, studio and boudoir shoots.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-label uppercase tracking-label text-muted">
            <a
              href={SITE.instagramUrl}
              className="transition-opacity duration-200 hover:text-fg"
            >
              Instagram
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="transition-opacity duration-200 hover:text-fg"
            >
              {SITE.email}
            </a>
            <p>© {SITE.name}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
