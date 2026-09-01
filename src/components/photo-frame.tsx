import { useState } from "react";
import { cn } from "@/lib/utils";

type PhotoFrameProps = {
  src?: string;
  alt: string;
  label?: "STUDIO" | "PORTFOLIO";
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

export function PhotoFrame({
  src,
  alt,
  label = "PORTFOLIO",
  className,
  imgClassName,
  priority = false,
}: PhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-40 w-full items-center justify-center">
          <span className="font-sans text-label uppercase tracking-label text-muted">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
