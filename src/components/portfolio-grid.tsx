import { Link } from "@tanstack/react-router";
import { workMediaKey } from "@/lib/media-slots";
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
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
      {stills.map((still, index) => {
        const frame = (
          <PhotoFrame
            src={still.src}
            mediaKey={workMediaKey(still.id)}
            alt={still.alt}
            label="PORTFOLIO"
            className="aspect-still rounded-lg"
            width={800}
            height={1200}
            sizes="(min-width: 768px) 33vw, 50vw"
            priority={index < 2}
          />
        );

        if (linkToWork) {
          return (
            <li key={still.id}>
              <Link to="/work" search={{ i: still.id }} className="block">
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
              className="block w-full"
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
