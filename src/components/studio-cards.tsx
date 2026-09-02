import { Link } from "@tanstack/react-router";
import { studioMediaKey } from "@/lib/media-slots";
import { travelExcessLabel, type Venue } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PhotoFrame } from "./photo-frame";

type StudioCardsProps = {
  studios: Venue[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  linkToBook?: boolean;
};

export function StudioCards({
  studios,
  selectedId,
  onSelect,
  linkToBook = false,
}: StudioCardsProps) {
  return (
    <ul className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
      {studios.map((studio) => {
        const selected = selectedId === studio.id;
        const body = (
          <>
            <PhotoFrame
              src={studio.image}
              mediaKey={studioMediaKey(studio.id)}
              alt={`${studio.name}, ${studio.city}`}
              label="STUDIO"
              className={cn(
                "aspect-studio rounded-lg",
                selected && "ring-2 ring-fg ring-offset-4 ring-offset-bg",
              )}
              width={1000}
              height={750}
              sizes="(min-width: 768px) 33vw, 100vw"
            />
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <p className="text-sm text-muted">{studio.city}</p>
              {studio.recommended ? (
                <p className="text-sm font-medium text-fg">Recommended</p>
              ) : null}
            </div>
            <h3 className="mt-1 text-xl font-normal tracking-display text-fg">
              {studio.name}
            </h3>
            {studio.note ? (
              <p className="mt-2 text-body text-muted">{studio.note}</p>
            ) : null}
            {travelExcessLabel(studio) ? (
              <p className="mt-2 text-sm text-fg">{travelExcessLabel(studio)}</p>
            ) : null}
          </>
        );

        if (linkToBook) {
          return (
            <li key={studio.id}>
              <Link to="/book" search={{ studio: studio.id }} className="block">
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
              className="w-full text-left"
            >
              {body}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
