import { useEffect } from "react";
import type { WorkStill } from "@/lib/site";
import { PhotoFrame } from "./photo-frame";

type LightboxProps = {
  stills: WorkStill[];
  activeId: string | null;
  onClose: () => void;
  onChange: (id: string) => void;
};

export function Lightbox({ stills, activeId, onClose, onChange }: LightboxProps) {
  const index = stills.findIndex((still) => still.id === activeId);
  const still = index >= 0 ? stills[index] : null;

  useEffect(() => {
    if (!still) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        const next = stills[(index + 1) % stills.length];
        if (next) onChange(next.id);
      }
      if (event.key === "ArrowLeft") {
        const prev = stills[(index - 1 + stills.length) % stills.length];
        if (prev) onChange(prev.id);
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [still, index, stills, onChange, onClose]);

  if (!still) return null;

  const prev = stills[(index - 1 + stills.length) % stills.length];
  const next = stills[(index + 1) % stills.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={still.alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg fade-in"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close"
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-10">
        <PhotoFrame
          src={still.src}
          alt={still.alt}
          label="PORTFOLIO"
          className="max-h-full max-w-full"
          imgClassName="max-h-[88svh] w-auto object-contain"
          priority
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
        <p className="text-label uppercase tracking-label text-muted">
          {String(index + 1).padStart(2, "0")} / {String(stills.length).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto min-h-11 text-label uppercase tracking-label text-fg"
        >
          Close
        </button>
      </div>
      {prev ? (
        <button
          type="button"
          onClick={() => onChange(prev.id)}
          className="absolute left-2 top-1/2 z-20 min-h-11 min-w-11 -translate-y-1/2 text-label uppercase tracking-label text-fg sm:left-5"
          aria-label="Previous"
        >
          Prev
        </button>
      ) : null}
      {next ? (
        <button
          type="button"
          onClick={() => onChange(next.id)}
          className="absolute right-2 top-1/2 z-20 min-h-11 min-w-11 -translate-y-1/2 text-label uppercase tracking-label text-fg sm:right-5"
          aria-label="Next"
        >
          Next
        </button>
      ) : null}
    </div>
  );
}
