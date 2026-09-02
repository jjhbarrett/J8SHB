import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wordmark text-fg">
            {SITE.name}
          </p>
          <p className="max-w-xs text-body text-muted">{SITE.line}</p>
          <p className="max-w-xs text-body text-muted">
            Physique, studio and boudoir shoots.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted">
          <Link to="/pricing" className="transition-opacity duration-200 hover:text-fg">
            Pricing
          </Link>
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
