import { useEffect, useState } from "react";
import { useMedia } from "@/lib/media-context";
import { cn } from "@/lib/utils";

type PhotoFrameProps = {
  src?: string;
  mediaKey?: string;
  alt: string;
  label?: "STUDIO" | "PORTFOLIO" | "SHOOT";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  zoom?: boolean;
  fit?: "cover" | "contain";
};

export function PhotoFrame({
  src,
  mediaKey,
  alt,
  label = "PORTFOLIO",
  className,
  imgClassName,
  priority = false,
  width,
  height,
  sizes,
  zoom = true,
  fit = "cover",
}: PhotoFrameProps) {
  const { srcFor } = useMedia();
  const resolved = mediaKey ? srcFor(mediaKey) : src;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const showImage = Boolean(resolved) && !failed;
  const cover = fit === "cover";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg bg-surface",
        className,
      )}
    >
      {showImage ? (
        <>
          <img
            src={resolved}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className={cn(
              cover
                ? "h-full w-full object-cover"
                : "h-auto w-full object-contain",
              zoom &&
                cover &&
                "transition-transform duration-500 ease-out group-hover:scale-105",
              imgClassName,
            )}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "low"}
            decoding="async"
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
            onError={() => setFailed(true)}
          />
          <span
            aria-hidden
            className="absolute inset-0 z-10"
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
          />
        </>
      ) : (
        <div className="flex h-full min-h-40 w-full items-center justify-center">
          <span className="text-sm text-muted">{label}</span>
        </div>
      )}
    </div>
  );
}
