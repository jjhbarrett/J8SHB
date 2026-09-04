import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { btnPrimary } from "@/lib/chrome";
import { workMediaKey } from "@/lib/media-slots";
import { HOME_WORK, SITE, VENUES, WORK, type Venue } from "@/lib/site";
import { listVenues } from "@/lib/venues";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [venues, setVenues] = useState<Venue[]>(VENUES);
  const pair = WORK[0];

  useEffect(() => {
    void listVenues().then(setVenues).catch(() => undefined);
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pt-2 sm:px-6">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
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
          {pair ? (
            <PhotoFrame
              src={pair.src}
              mediaKey={workMediaKey(pair.id)}
              alt={pair.alt}
              label="PORTFOLIO"
              className="hidden aspect-still w-full rounded-xl lg:block"
              imgClassName="h-full w-full object-cover object-center"
              width={1200}
              height={1500}
              sizes="50vw"
              priority
              zoom={false}
            />
          ) : null}
        </div>
        <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <p className="max-w-xl text-lg font-light tracking-display text-fg sm:text-2xl lg:text-3xl">
            {SITE.positioning}
          </p>
          <Link to="/book" className={cn(btnPrimary, "min-h-12 px-8")}>
            Book a shoot
          </Link>
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
