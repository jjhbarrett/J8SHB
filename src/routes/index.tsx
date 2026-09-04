import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PhotoFrame } from "@/components/photo-frame";
import { StudioCards } from "@/components/studio-cards";
import { HOME_WORK, SITE, VENUES, type Venue } from "@/lib/site";
import { listVenues } from "@/lib/venues";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [venues, setVenues] = useState<Venue[]>(VENUES);

  useEffect(() => {
    void listVenues().then(setVenues).catch(() => undefined);
  }, []);

  return (
    <main>
      <section className="px-4 pt-2 sm:px-6">
        <div className="relative mx-auto aspect-[3/4] max-w-7xl overflow-hidden rounded-xl sm:aspect-auto sm:min-h-[78svh]">
          <PhotoFrame
            mediaKey="hero"
            alt="Editorial physique photograph, studio"
            label="PORTFOLIO"
            className="absolute inset-0 h-full w-full rounded-xl"
            imgClassName="h-full w-full object-cover object-[center_18%]"
            width={1600}
            height={2000}
            sizes="100vw"
            priority
            zoom={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-bg/85 to-transparent">
            <p className="mx-auto max-w-7xl px-6 py-8 text-lg font-light tracking-display text-fg sm:px-10 sm:py-10 sm:text-2xl">
              {SITE.positioning}
            </p>
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
