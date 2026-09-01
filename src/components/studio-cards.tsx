import { Link } from "@tanstack/react-router";
import { formatPrice, type Studio, type StudioId } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PhotoFrame } from "./photo-frame";

type StudioCardsProps = {
  studios: Studio[];
  selectedId?: StudioId | null;
  onSelect?: (id: StudioId) => void;
  linkToBook?: boolean;
};

export function StudioCards({
  studios,
  selectedId,
  onSelect,
  linkToBook = false,
}: StudioCardsProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
      {studios.map((studio) => {
        const selected = selectedId === studio.id;
        const body = (
          <>
            <PhotoFrame
              src={studio.image}
              alt={`${studio.name}, ${studio.city}`}
              label="STUDIO"
              className="aspect-studio rounded-md"
              width={1000}
              height={750}
              sizes="(min-width: 768px) 33vw, 100vw"
            />
            <div className="px-3 pb-3 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-label uppercase tracking-label text-muted">
                  {studio.city}
                </p>
                <p className="font-display text-2xl text-fg">
                  {formatPrice(studio.price)}
                </p>
              </div>
              <h3 className="mt-2 font-display text-2xl text-fg">
                {studio.name}
              </h3>
              <p className="mt-2 text-body text-muted">{studio.vibe}</p>
              <p className="mt-3 text-label uppercase tracking-label text-muted">
                {studio.hours}
              </p>
            </div>
          </>
        );

        if (linkToBook) {
          return (
            <li key={studio.id}>
              <Link
                to="/book"
                search={{ studio: studio.id }}
                className="block rounded-xl bg-surface p-3 shadow-card transition-[box-shadow] duration-200 hover:shadow-card-hover"
              >
                {body}
              </Link>
            </li>
          );
        }

        return (
          <li key={studio.id}>
            <button
              type="button"
              onClick={() => onSelect?.(studio.id)}
              aria-pressed={selected}
              className={cn(
                "w-full rounded-xl bg-surface p-3 text-left shadow-card transition-[box-shadow] duration-200 hover:shadow-card-hover",
                selected && "shadow-card-hover ring-1 ring-fg",
              )}
            >
              {body}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
