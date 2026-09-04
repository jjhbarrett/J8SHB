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
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5">
      {stills.map((still, index) => {
        const frame = (
          <PhotoFrame
            src={still.src}
            mediaKey={workMediaKey(still.id)}
            alt={still.alt}
            label="PORTFOLIO"
            className="w-full rounded-lg"
            imgClassName="h-auto w-full"
            width={1200}
            height={1800}
            sizes="(min-width: 768px) 33vw, 100vw"
            priority={index < 2}
            fit="contain"
            zoom={false}
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
