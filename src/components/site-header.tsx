import { Link, useRouterState } from "@tanstack/react-router";
import { btnPrimary } from "@/lib/chrome";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/work", label: "Work" },
  { to: "/pricing", label: "Pricing" },
  { to: "/book", label: "Book" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 bg-bg">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="shrink-0 text-sm font-medium uppercase tracking-wordmark text-fg sm:text-base"
            aria-label={`${SITE.name}, home`}
          >
            {SITE.name}
          </Link>
          <Cta className="sm:hidden" />
        </div>

        <nav
          aria-label="Primary"
          className="flex items-center justify-between sm:justify-end sm:gap-8"
        >
          <ul className="flex flex-wrap items-center gap-4 sm:gap-8">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "inline-flex min-h-11 items-center text-sm font-medium tracking-label transition-opacity duration-200",
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
          <Cta className="hidden sm:inline-flex" />
        </nav>
      </div>
    </header>
  );
}

function Cta({ className }: { className?: string }) {
  return (
    <Link to="/book" className={cn(btnPrimary, className)}>
      Book a shoot
    </Link>
  );
}
