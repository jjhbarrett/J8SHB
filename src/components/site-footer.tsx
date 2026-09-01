import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="font-display text-xl tracking-wordmark text-fg">
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
    </footer>
  );
}
