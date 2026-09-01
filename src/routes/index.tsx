import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { HOME_WORK, SITE, STUDIOS } from "@/lib/site";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <section className="relative min-h-[80svh]">
        <PhotoFrame
          src="/images/hero.jpg"
          alt="Editorial physique photograph, studio"
          label="PORTFOLIO"
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full object-cover"
          width={1600}
          height={900}
          sizes="100vw"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-bg/55">
          <p className="mx-auto max-w-7xl px-5 py-6 font-display text-lead text-fg sm:py-8 sm:text-2xl">
            {SITE.positioning}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-label uppercase tracking-label text-muted">Work</h2>
          <Link
            to="/work"
            className="text-label uppercase tracking-label text-fg hover:opacity-70"
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
