import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { HOME_WORK, SITE, STUDIOS } from "@/lib/site";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <section className="px-5 pt-2 sm:px-6 sm:pt-3">
        <div className="relative mx-auto min-h-[78svh] max-w-7xl overflow-hidden rounded-xl">
          <PhotoFrame
            src="/images/hero.jpg"
            alt="Editorial physique photograph, studio"
            label="PORTFOLIO"
            className="absolute inset-0 h-full w-full rounded-xl"
            imgClassName="h-full w-full object-cover"
            width={1600}
            height={900}
            sizes="100vw"
            priority
            zoom={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-bg/80 to-transparent">
            <p className="mx-auto max-w-7xl px-6 py-8 font-display text-lead text-fg sm:px-10 sm:py-10 sm:text-2xl">
              {SITE.positioning}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-label uppercase tracking-label text-muted">Work</h2>
          <Link
            to="/work"
            className="text-label uppercase tracking-label text-fg transition-opacity duration-200 hover:opacity-70"
          >
            All stills
          </Link>
        </div>
        <PortfolioGrid stills={HOME_WORK} linkToWork />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:pb-32">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-label uppercase tracking-label text-muted">
            Studios
          </h2>
          <p className="text-label uppercase tracking-label text-muted">
            Two hours. Prices include the room.
          </p>
        </div>
        <StudioCards studios={STUDIOS} linkToBook />
      </section>
    </main>
  );
}
