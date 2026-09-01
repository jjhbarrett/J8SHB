import { useState } from "react";
import { cn } from "@/lib/utils";

type PhotoFrameProps = {
  src?: string;
  alt: string;
  label?: "STUDIO" | "PORTFOLIO";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  zoom?: boolean;
};

export function PhotoFrame({
  src,
  alt,
  label = "PORTFOLIO",
  className,
  imgClassName,
  priority = false,
  width,
  height,
  sizes,
  zoom = true,
}: PhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg bg-surface",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={cn(
            "h-full w-full object-cover",
            zoom &&
              "transition-transform duration-500 ease-out group-hover:scale-105",
            imgClassName,
          )}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-40 w-full items-center justify-center">
          <span className="text-sm text-muted">{label}</span>
        </div>
      )}
    </div>
  );
}
