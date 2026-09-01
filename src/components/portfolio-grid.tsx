import { Link } from "@tanstack/react-router";
import type { WorkStill } from "@/lib/site";
import { PhotoFrame } from "./photo-frame";

type PortfolioGridProps = {
  stills: WorkStill[];
  onOpen?: (id: string) => void;
  linkToWork?: boolean;
};

export function PortfolioGrid({
  stills,
  onOpen,
  linkToWork = false,
}: PortfolioGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4">
      {stills.map((still) => {
        const frame = (
          <PhotoFrame
            src={still.src}
            alt={still.alt}
            label="PORTFOLIO"
            className="aspect-still"
          />
        );

        if (linkToWork) {
          return (
            <li key={still.id}>
              <Link
                to="/work"
                search={{ i: still.id }}
                className="block transition-opacity duration-200 hover:opacity-80"
              >
                {frame}
              </Link>
            </li>
          );
        }

        return (
          <li key={still.id}>
            <button
              type="button"
              onClick={() => onOpen?.(still.id)}
              className="block w-full transition-opacity duration-200 hover:opacity-80"
              aria-label={`Open ${still.alt}`}
            >
              {frame}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
