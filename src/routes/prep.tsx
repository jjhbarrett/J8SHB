import { createFileRoute } from "@tanstack/react-router";
import { SITE, VENUES, venueMapsUrl } from "@/lib/site";

export const Route = createFileRoute("/prep")({
  component: PrepPage,
  head: () => ({
    meta: [{ title: "Your shoot · J8 STUDIOS" }],
  }),
});

function PrepPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Your shoot</p>
      <h1 className="mt-4 text-display text-fg">Before you arrive</h1>
      <p className="mt-4 text-body text-muted">
        Here’s what to do before you get here, and how the day works.
      </p>

      <section className="mt-16">
        <h2 className="text-3xl font-light tracking-display text-fg">Prep</h2>
        <ul className="mt-6 space-y-4 text-body text-fg">
          <li>
            If you’re getting a spray tan, book it for 48 hours before the
            shoot. Don’t have one in the 24 hours before. It won’t have
            settled.
          </li>
          <li>Do hair and makeup before you get here, not in the room.</li>
          <li>Bring whatever you need for touch-ups through the shoot.</li>
          <li>
            Skip tight socks, waistbands and straps that morning so you don’t
            have marks on the skin.
          </li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-light tracking-display text-fg">When you get here</h2>
        <ul className="mt-6 space-y-4 text-body text-fg">
          <li>
            Arrive 10 minutes early so we’re ready to walk in on the slot. We
            can’t go in early. There may be another shoot still in the room.
            I’ll meet you at the door.
          </li>
          <li>
            You’re welcome to bring someone. They can wait with you, but they
            can’t come into the shoot unless you’ve booked them in.
          </li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-light tracking-display text-fg">Bring</h2>
        <ul className="mt-6 space-y-4 text-body text-fg">
          <li>
            Bring a diverse wardrobe with different looks, based on the inspo
            you’ve picked. Even if we don’t use everything, the options are
            there.
          </li>
          <li>Shoes that go with the looks.</li>
          <li>A bottle of water.</li>
        </ul>
        <p className="mt-6 text-body text-muted">
          I’ll have olive oil spray for a bit of shine on the skin. You don’t
          need to know how to pose. I’ll direct the whole time.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-light tracking-display text-fg">After</h2>
        <ul className="mt-6 space-y-4 text-body text-fg">
          <li>Proofs within 48 hours, on a private gallery link.</li>
          <li>You pick your favourites.</li>
          <li>Final edits take up to two to three weeks.</li>
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-light tracking-display text-fg">Studios</h2>
        <p className="mt-4 text-body text-muted">
          I’ll confirm which room when the date is locked. Parking is free on
          site at Northampton.
        </p>
        <ul className="mt-8 space-y-8">
          {VENUES.map((venue) => (
            <li key={venue.id}>
              <p className="text-lg font-medium text-fg">{venue.name}</p>
              <p className="mt-1 text-body text-muted">{venue.address}</p>
              <a
                href={venueMapsUrl(venue)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-fg underline decoration-line underline-offset-4 transition-opacity hover:opacity-70"
              >
                Open in Google Maps
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-20 pb-8 text-body text-muted">
        Anything else, write or DM @{SITE.instagramHandle}.
      </p>
    </main>
  );
}
