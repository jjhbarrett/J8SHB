import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoFrame } from "@/components/photo-frame";
import { btnPrimary } from "@/lib/chrome";
import { useMedia } from "@/lib/media-context";
import {
  isStudioGalleryKey,
  packageMediaKey,
  studioMediaKey,
} from "@/lib/media-slots";
import {
  PACKAGES,
  packagePriceLabel,
  travelExcessLabel,
  VENUES,
  type ShootPackage,
  type Venue,
} from "@/lib/site";
import { listVenues } from "@/lib/venues";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [{ title: "Pricing — J8 STUDIOS" }],
  }),
});

function PricingPage() {
  const [venues, setVenues] = useState<Venue[]>(VENUES);

  useEffect(() => {
    void listVenues().then(setVenues).catch(() => undefined);
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Pricing</p>
      <h1 className="mt-4 text-display text-fg">The shoot</h1>
      <p className="mt-4 max-w-xl text-body text-muted">
        Room included. You don’t pay the studio on top. Studio days are exclusive
        dates Josh sets. Request a date — this is not a payment.
      </p>

      <ul className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-10">
        {PACKAGES.map((item) => (
          <li key={item.id}>
            <PackageCard item={item} />
          </li>
        ))}
      </ul>

      <section className="mt-24 sm:mt-32">
        <p className="text-sm font-medium text-muted">Venues</p>
        <h2 className="mt-4 text-3xl font-light tracking-display text-fg sm:text-4xl">
          Choose the room
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          {venues.map((venue) => (
            <li key={venue.id}>
              <VenueCard venue={venue} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-20 flex flex-col items-start gap-6 pb-8 sm:mt-28">
        <p className="max-w-md text-body text-muted">
          Josh checks his diary and the room. A £50 hold secures the date.
        </p>
        <Link to="/book" className={cn(btnPrimary, "min-h-12 px-8")}>
          Book a shoot
        </Link>
      </div>
    </main>
  );
}

function VenueCard({ venue }: { venue: Venue }) {
  const { versions } = useMedia();
  const extras = Object.keys(versions)
    .filter((key) => isStudioGalleryKey(key, venue.id))
    .sort();

  return (
    <>
      <PhotoFrame
        src={venue.image}
        mediaKey={studioMediaKey(venue.id)}
        alt={`${venue.name}, ${venue.city}`}
        label="STUDIO"
        className="aspect-studio"
        width={1000}
        height={750}
        sizes="(min-width: 768px) 33vw, 100vw"
      />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted">{venue.city}</p>
        {venue.recommended ? (
          <p className="text-sm font-medium text-fg">Recommended</p>
        ) : null}
      </div>
      <h3 className="mt-1 text-xl font-normal tracking-display text-fg">
        {venue.name}
      </h3>
      {venue.note ? (
        <p className="mt-2 text-body text-muted">{venue.note}</p>
      ) : null}
      {travelExcessLabel(venue) ? (
        <p className="mt-2 text-sm text-fg">{travelExcessLabel(venue)}</p>
      ) : null}
      {extras.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {extras.map((key) => (
            <li key={key}>
              <PhotoFrame
                mediaKey={key}
                alt={`${venue.name} studio`}
                label="STUDIO"
                className="aspect-studio"
                width={600}
                height={450}
                sizes="30vw"
                zoom={false}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function PackageCard({ item }: { item: ShootPackage }) {
  return (
    <article>
      <PhotoFrame
        mediaKey={packageMediaKey(item.id)}
        alt={`${item.name} cover`}
        label="SHOOT"
        className="aspect-studio"
        width={1400}
        height={1050}
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl font-light tracking-display text-fg sm:text-3xl">
          {item.name}
        </h2>
        <p className="text-lg font-medium text-fg">{packagePriceLabel(item)}</p>
      </div>
      {item.exclusiveDates ? (
        <p className="mt-3 text-sm font-medium text-fg">Exclusive dates only</p>
      ) : null}
      {item.blurb ? (
        <p className="mt-3 max-w-md text-body text-muted">{item.blurb}</p>
      ) : null}
      <ul className="mt-5 space-y-2 text-body text-muted">
        <li>{item.hours}</li>
        {item.includes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Link
        to="/book"
        search={{ package: item.id }}
        className={cn(btnPrimary, "mt-8")}
      >
        {item.id === "group" ? "Request a group shoot" : "Request this shoot"}
      </Link>
    </article>
  );
}
