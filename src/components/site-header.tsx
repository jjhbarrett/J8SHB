import { Link, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/work", label: "Work" },
  { to: "/book", label: "Book" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link
          to="/"
          className="shrink-0 font-display text-lg tracking-wordmark text-fg sm:text-xl"
          aria-label={`${SITE.name}, home`}
        >
          {SITE.name}
        </Link>

        <nav
          aria-label="Primary"
          className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-10"
        >
          <ul className="flex items-center gap-3 sm:gap-7">
            {NAV.map((item, index) => {
              const active = pathname === item.to;
              return (
                <li key={item.to} className="flex items-center gap-3 sm:gap-7">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="hidden text-muted sm:inline"
                    >
                      ·
                    </span>
                  ) : null}
                  <Link
                    to={item.to}
                    className={cn(
                      "inline-flex min-h-11 items-center text-label uppercase tracking-label transition-opacity duration-200",
                      active ? "text-fg" : "text-muted hover:text-fg",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            to="/book"
            className="inline-flex min-h-11 shrink-0 items-center border border-fg px-3 text-label uppercase tracking-label text-fg transition-opacity duration-200 hover:opacity-70 sm:px-4"
          >
            Book a shoot
          </Link>
        </nav>
      </div>
    </header>
  );
}
