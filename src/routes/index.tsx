import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { btnPrimary, btnQuiet } from "@/lib/chrome";
import { HOME_WORK, SITE, VENUES, type Venue } from "@/lib/site";
import { listVenues } from "@/lib/venues";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [venues, setVenues] = useState<Venue[]>(VENUES);

  useEffect(() => {
    void listVenues().then(setVenues).catch(() => undefined);
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pt-2 sm:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          <PhotoFrame
            mediaKey="hero"
            alt="Editorial physique photograph, studio"
            label="PORTFOLIO"
            className="aspect-still w-full rounded-xl"
            imgClassName="h-full w-full object-cover object-center"
            width={1200}
            height={1500}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            zoom={false}
          />
          <div className="flex flex-col justify-between gap-8 py-1 lg:py-4">
            <p className="text-2xl font-light tracking-display text-fg sm:text-3xl lg:text-4xl lg:leading-snug">
              {SITE.positioning}
            </p>
            <p className="max-w-md text-body text-muted">
              Private studio time. Josh directs the whole shoot. You pick the
              frames. Finals come back in two to three weeks.
            </p>
            <p className="max-w-md text-body text-muted">
              Northampton, London and Hampshire. The room is included. Request a
              date. Nothing is taken on the site.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/book" className={cn(btnPrimary, "min-h-12 px-8")}>
                Book a shoot
              </Link>
              <Link to="/pricing" className={cn(btnQuiet, "min-h-12 px-8")}>
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-sm font-medium text-muted">Work</h2>
          <Link
            to="/work"
            className="text-sm font-medium text-fg transition-opacity duration-200 hover:opacity-70"
          >
            All stills
          </Link>
        </div>
        <PortfolioGrid stills={HOME_WORK} linkToWork />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:pb-32">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-sm font-medium text-muted">Studios</h2>
          <Link
            to="/pricing"
            className="text-sm font-medium text-fg transition-opacity duration-200 hover:opacity-70"
          >
            Pricing
          </Link>
        </div>
        <StudioCards studios={venues} linkToBook />
      </section>
    </main>
  );
}
